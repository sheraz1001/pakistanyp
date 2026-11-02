import { ensureSchema } from "./ensureSchema";
import { syncPlaceGuides } from "./placeGuides";
import { publishContent } from "./contentPublisher";
import { syncCatalog } from "./catalogSync";
import { registerIndexNowKeyRoute, startSitemapWatcher } from "./indexNow";
import { bootstrapDatabase } from "./bootstrapDatabase";
import compression from "compression";
import connectPgSimple from "connect-pg-simple";
import { seoGuards, localityDuplicateRedirect , legacyGone } from "./middleware/seoGuards";
import { composeSSRPage, countryTemplate, SITE_ORIGIN } from "./ssrPage";
import { languageRouting, localizeApi, htmlLangAttributes, preferredLanguageRedirect } from "./i18n";
import { installSsrInternalFetch } from "./ssrInternalFetch";
import { country } from "@shared/country";
import { adminGuard } from "./middleware/adminGuard";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { domainRedirects, securityHeaders, corsHeaders, finalHeadersOverride } from "./middleware/security";
import { dynamicRenderingMiddleware } from "./middleware/dynamicRendering";
import categoryRedirects from "./categoryRedirects.json";
import { createServer as createViteServer } from "vite";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";


// Long browser caching for static images/fonts (they were served with max-age=0).
// File names aren't content-hashed, so 30 days + background revalidation.
const STATIC_MEDIA = /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;
function staticCacheHeaders(res: express.Response, filePath: string) {
  if (STATIC_MEDIA.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
  }
}

const app = express();
// SSR data requests are dispatched into this app in-process (see ssrInternalFetch.ts)
installSsrInternalFetch(app);

// Trust proxy for proper header detection behind load balancers
app.set('trust proxy', true);
// gzip/deflate for HTML, JSON, XML (pages were sent uncompressed)
app.use(compression());

// Completely disable ETag generation to prevent 304 responses
app.set('etag', false);

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Health check endpoint - MUST be before all other middleware for deployment health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Web app manifest for non-Pakistani deploys (Pakistan keeps the static public/manifest.json)
  app.get("/manifest.json", (_req, res) => {
    const icon = (size: number, purpose = "any") => ({ src: `/logo/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose });
    res.set("Cache-Control", "public, max-age=86400").json({
      name: country.siteName,
      short_name: country.brand,
      description: `Discover and connect with businesses across all ${country.regions.length} ${country.regionTerm.plural.toLowerCase()} of ${country.name}`,
      start_url: "/",
      display: "standalone",
      background_color: "#FAF8F3",
      theme_color: country.flagStripe[0]?.color || "#0B6B2E",
      scope: "/",
      lang: "en",
      icons: [icon(192), icon(512), icon(192, "maskable"), icon(512, "maskable")],
    });
  });

// Also respond to / quickly for health checks in production
app.get('/', (req, res, next) => {
  // If this is a health check (no Accept: text/html), respond immediately
  const acceptHeader = (req.get('Accept') || '').toLowerCase();
  const userAgent = (req.get('User-Agent') || '').toLowerCase();
  
  // Detect health check requests from monitoring tools only (NOT missing Accept headers)
  // Case-insensitive matching for various health checkers (ELB-HealthChecker, kube-probe, etc.)
  const healthCheckKeywords = ['health', 'monitor', 'check', 'probe', 'elb', 'kube', 'ping'];
  const isAutomatedProbe = healthCheckKeywords.some(keyword => userAgent.includes(keyword)) || 
                           userAgent === '';
  
  const wantsBrowser = acceptHeader.includes('text/html') || acceptHeader.includes('*/*');
  
  if (!wantsBrowser && isAutomatedProbe && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: Date.now() });
  }
  
  // Otherwise continue to SSR handler
  next();
});

// Canonical redirects, robots.txt and per-path X-Robots-Tag (audit 2026-10)
// Second language: "/ar/..." is routed like "/..." (see server/i18n.ts); runs before the URL guards so
// their canonical redirects keep the language prefix
app.use(languageRouting);
app.use(legacyGone);
app.use(seoGuards);
app.use(localityDuplicateRedirect);

// Default X-Robots-Tag and HTML caching for page requests
// This middleware MUST run before all other middleware to ensure search engines can crawl
app.use((req, res, next) => {
  // Only for non-API routes and non-static assets
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    // Set headers before response is sent
    if (!res.getHeader('X-Robots-Tag')) res.setHeader('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    // Development HTML must match the current Vite modules after edits/restarts.
    res.setHeader('Cache-Control', process.env.NODE_ENV === 'production'
      ? 'public, max-age=3600, s-maxage=7200'
      : 'no-store, max-age=0');
  }
  
  next();
});

// Add debug middleware first
app.use((req, res, next) => {
  if (req.path.includes('/api/auth/google')) {
    console.log(`OAuth Request: ${req.method} ${req.path}`);
    console.log(`Host: ${req.get('host')}`);
    console.log(`Query: ${JSON.stringify(req.query)}`);
  }
  next();
});

// Security headers, canonical-host redirects and CORS
app.use((req, res, next) => {
  domainRedirects(req, res, () => {
    securityHeaders(req, res, () => {
      corsHeaders(req, res, () => {
        finalHeadersOverride(req, res, next);
      });
    });
  });
});

// SEO Dynamic Rendering Middleware - serves pre-rendered HTML to search engine bots
// This MUST come before body parsers and routes for proper bot detection
app.use(localizeApi);

// 301 redirects for merged, retired or renamed category URLs (generated by the taxonomy migration)
app.use((req, res, next) => {
  const m = req.path.match(/^\/categories\/([^/]+)\/?$/);
  const target = m ? (categoryRedirects as Record<string, string>)[m[1]] : undefined;
  if (target) {
    const q = req.originalUrl.indexOf('?');
    return res.redirect(301, `/categories/${target}` + (q >= 0 ? req.originalUrl.slice(q) : ''));
  }
  next();
});

// The blog moved to /blogs: /blog -> /blogs, /blog/search?q= -> /blogs?q=, /blog/<slug> -> /blogs/<slug>
app.use((req, res, next) => {
  const m = req.path.match(/^\/blog(?:\/(.*?))?\/?$/);
  if (!m) return next();
  const q = req.originalUrl.indexOf('?');
  const query = q >= 0 ? req.originalUrl.slice(q) : '';
  const rest = m[1] || '';
  return res.redirect(301, rest && rest !== 'search' ? `/blogs/${rest}${query}` : `/blogs${query}`);
});

// Cities have their own pages: /localities/<province>/<city> -> 301 /cities/<city>
app.get('/localities/:province/:locality', async (req, res, next) => {
  try {
    const { pool } = await import('./db');
    const found = await pool.query(
      "select 1 from localities where slug = $1 and is_main_area = true and parent_id is null limit 1",
      [`${req.params.province}/${req.params.locality}`],
    );
    if (found.rows.length) return res.redirect(301, `/cities/${encodeURIComponent(req.params.locality)}`);
  } catch { /* fall through to the page */ }
  next();
});

// Disabled 2026-10: bots and users now get the same SSR HTML (see ssrPage.ts)

// app.use(dynamicRenderingMiddleware);

// Increase body size limits for blog posts with images
app.use(express.json({ limit: '50mb', verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session middleware for authentication
try {
  const session = await import('express-session');
  app.use(session.default({
    // Sessions survive restarts and work across autoscale instances (was in-memory)
      store: new (connectPgSimple(session.default as any) as any)({ conString: process.env.DATABASE_URL, tableName: 'sessions', createTableIfMissing: false, pruneSessionInterval: 60 * 60 }) /* PgSessionStore */,
      secret: process.env.SESSION_SECRET || 'pakistanyp-session-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookie in production (trust proxy is on)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));
  console.log('Session middleware initialized successfully');
} catch (error) {
  console.error('Failed to initialize session middleware:', error);
  throw error;
}

  // Central access guard (security audit 2026-10)
  app.use(adminGuard);


// SSR Configuration
// Set ENABLE_SSR=false to disable SSR and serve plain React SPA to everyone
// This is useful for debugging SEO issues or if SSR is causing problems
const ENABLE_SSR = process.env.ENABLE_SSR !== 'false';
const SSR_TIMEOUT_MS = parseInt(process.env.SSR_TIMEOUT_MS || '5000', 10);

// SSR metrics for monitoring
const ssrMetrics = {
  totalRequests: 0,
  successfulRenders: 0,
  csrFallbacks: 0,
  timeouts: 0,
  errors: 0,
  lastError: null as string | null,
  lastErrorTime: null as Date | null,
};

if (ENABLE_SSR) {
  console.log(`[SSR] Enabled - Server-side rendering active (timeout: ${SSR_TIMEOUT_MS}ms)`);
} else {
  console.log('[SSR] DISABLED via ENABLE_SSR=false - Serving client-side React SPA to everyone');
  console.log('[SSR] This is temporary until we migrate to better SSR/SSG solution');
}

// SSR metrics endpoint for monitoring
app.get('/api/ssr-metrics', (req, res) => {
  res.json({
    enabled: ENABLE_SSR,
    timeoutMs: SSR_TIMEOUT_MS,
    metrics: ssrMetrics,
    uptime: process.uptime(),
  });
});

// 301 Redirect for old /category/ URLs to /categories/ (SEO fix for duplicate content)
app.get('/category/:slug', (req, res) => {
  const { slug } = req.params;
  res.redirect(301, `/categories/${slug}`);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Escape JSON for safe inline script embedding
 */
function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

(async () => {
  try {
    console.log('Starting server initialization...');
    // First start on an empty database: create tables + reference data (a few
    // seconds, once). On an initialised database this is a single quick check.
    const freshDatabase = await bootstrapDatabase().catch((e) => {
      console.error("[bootstrap] failed:", e?.message || e);
      return false;
    });
    if (freshDatabase) {
      // these ran at import time, before the tables existed
      const { emailTemplateService } = await import("./emailTemplateService");
      await emailTemplateService.initializeDefaultTemplates();
    }
    // background, with retries – never blocks the health check; then load province/city guides
    void ensureSchema().then(() => syncCatalog()).then(() => syncPlaceGuides()).then(() => publishContent());
    registerIndexNowKeyRoute(app);
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Add error handlers for the server
    server.on('error', (err: any) => {
      console.error('Server error:', err);
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Application error:', err);
      res.status(status).json({ message });
    });

    // Serve static assets from public folder in both dev and production
    const publicPath = import.meta.dirname + "/../public";
    // Persistent uploads (set UPLOADS_DIR on hosts where redeploys replace the app folder)
    if (process.env.UPLOADS_DIR) {
      fs.mkdirSync(process.env.UPLOADS_DIR, { recursive: true });
      app.use('/uploads', express.static(process.env.UPLOADS_DIR, { maxAge: '7d' }));
    }
    app.use('/assets', express.static(path.join(publicPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(publicPath, { setHeaders: staticCacheHeaders }));

    if (app.get("env") === "development") {
      console.log('Setting up Vite SSR in development mode...');
      
      // Create a dedicated Vite SSR server instance
      const viteSSR = await createViteServer({
        ...viteConfig,
        configFile: false,
        server: {
          middlewareMode: true,
          hmr: { server },
          allowedHosts: true, // Allow all hosts for external access
        },
        appType: "custom",
      });

      // Mount Vite middlewares (handles HMR, static assets, etc.)
      app.use(viteSSR.middlewares);

      // SSR catch-all handler with improved error handling
      app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        const startTime = Date.now();

        // Skip API routes
        if (url.startsWith('/api/')) {
          return next();
        }

        // Signed-in users always see their chosen language
        if (await preferredLanguageRedirect(req, res)) return;
        ssrMetrics.totalRequests++;

        // Helper to serve CSR fallback
        const serveCSRFallback = async (reason: string) => {
          try {
            const clientTemplate = path.resolve(
              import.meta.dirname,
              "..",
              "client",
              "index.html",
            );
            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = countryTemplate(await viteSSR.transformIndexHtml(url, template));
            
            // Remove SSR placeholders for CSR fallback
            template = template.replace('<!--ssr-head-->', '');
            template = template.replace('<!--ssr-outlet-->', '');
            template = template.replace('<!--ssr-state-->', '');
            
            // CRITICAL SEO: Ensure proper self-referential canonical URL for every page
            const canonicalUrl = `${SITE_ORIGIN}${url === '/' ? '' : url.split('?')[0]}`;
            template = template.replace(
              /<link rel="canonical" href="[^"]*"[^>]*>/gi,
              `<link rel="canonical" href="${canonicalUrl}">`
            );
            template = template.replace(
              /<meta property="og:url" content="[^"]*"[^>]*>/gi,
              `<meta property="og:url" content="${canonicalUrl}">`
            );
            
            res.setHeader('X-SSR-Rendered', 'false');
            res.setHeader('X-SSR-Fallback-Reason', reason);
            res.status(200).set({ "Content-Type": "text/html" }).end(template);
            ssrMetrics.csrFallbacks++;
            console.log(`[SSR] CSR fallback for ${url} - Reason: ${reason} (${Date.now() - startTime}ms)`);
          } catch (fallbackError) {
            console.error('[SSR] CSR fallback also failed:', fallbackError);
            next(fallbackError);
          }
        };

        // If SSR is disabled, serve CSR immediately
        if (!ENABLE_SSR) {
          return serveCSRFallback('SSR_DISABLED');
        }

        try {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "..",
            "client",
            "index.html",
          );

          // Read the HTML template
          let template = await fs.promises.readFile(clientTemplate, "utf-8");
          
          // Transform the template through Vite for HMR
          template = await viteSSR.transformIndexHtml(url, template);

          // Load the SSR entry module
          const { render } = await viteSSR.ssrLoadModule("/src/entry-server.tsx") as {
            render: (url: string) => Promise<{
              html: string;
              helmetContext: { helmet?: any };
              dehydratedState: unknown;
            }>;
          };

          // Render with timeout protection
          const renderWithTimeout = () => {
            return Promise.race([
              render(url),
              new Promise((_, reject) => 
                setTimeout(() => {
                  ssrMetrics.timeouts++;
                  reject(new Error(`SSR_TIMEOUT: Render exceeded ${SSR_TIMEOUT_MS}ms`));
                }, SSR_TIMEOUT_MS)
              )
            ]);
          };

          // Render the app with timeout
          const { html: appHtml, helmetContext, dehydratedState, notFound, routes } = await renderWithTimeout() as any;

          // Compose final document (single title/meta/canonical, real 404s) - see server/ssrPage.ts
          const page = composeSSRPage(template, { url, appHtml, helmet: helmetContext?.helmet, dehydratedState, notFound, routes, isProduction: false });
          res.setHeader('X-SSR-Rendered', 'true');
          if (page.status === 404) res.setHeader('X-Robots-Tag', 'noindex, follow');
          res.status(page.status).set({ "Content-Type": "text/html; charset=utf-8" }).end(page.html);
          ssrMetrics.successfulRenders++;
          console.log(`[SSR] Successfully rendered ${url} (${Date.now() - startTime}ms)`);
          
        } catch (e: any) {
          // Fix SSR stack trace for better debugging
          viteSSR.ssrFixStacktrace(e as Error);
          
          // Track error metrics
          ssrMetrics.errors++;
          ssrMetrics.lastError = e.message || String(e);
          ssrMetrics.lastErrorTime = new Date();
          
          const isTimeout = e.message?.includes('SSR_TIMEOUT');
          console.error(`[SSR Error] ${url} - ${isTimeout ? 'TIMEOUT' : 'ERROR'}: ${e.message}`);
          if (!isTimeout) {
            console.error('[SSR Error Stack]', e.stack);
          }
          
          // Graceful fallback to CSR
          await serveCSRFallback(isTimeout ? 'TIMEOUT' : 'RENDER_ERROR');
        }
      });

      console.log('Vite SSR setup completed successfully');
    } else {
      // Production mode with SSR
      console.log('Setting up production SSR...');
      
      // Production assets are built to dist/public by Vite
      const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
      const serverEntryPath = path.resolve(import.meta.dirname, "..", "dist", "server", "entry-server.js");
      
      // Check if production build exists
      const hasBuild = fs.existsSync(distPath);
      if (!hasBuild) {
        console.warn(`[Production SSR] Build output not found at ${distPath}.`);
        console.warn('[Production SSR] Run "npm run build" to generate production assets.');
        console.warn('[Production SSR] API routes will continue to work but HTML pages cannot be served.');
        
        // Don't set up any HTML handlers - let API routes continue working
        // HTML requests will fall through to 404 which is better than serving broken pages
        app.use("*", (req, res, next) => {
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
          }
          res.status(503).json({ 
            error: 'Application not built', 
            message: 'Please run npm run build to generate production assets' 
          });
        });
      } else {
        console.log(`[Production SSR] Serving static assets from ${distPath}`);
      
      // Serve static assets first
      app.use('/assets', express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
      }));
      app.use(express.static(distPath, {
        index: false,
        redirect: false, // "/ar" is a page, not the static folder "/"
        etag: false,
        setHeaders: staticCacheHeaders,
      }));
      
      // SSR handler for all HTML requests with improved error handling
      app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        const startTime = Date.now();
        
        // Skip API routes
        if (url.startsWith('/api/')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }

        // Signed-in users always see their chosen language
        if (await preferredLanguageRedirect(req, res)) return;
        ssrMetrics.totalRequests++;

        // Helper to serve CSR fallback in production
        const serveCSRFallback = async (template: string, reason: string) => {
          template = htmlLangAttributes(countryTemplate(template), url);
          template = template.replace('<!--ssr-head-->', '');
          template = template.replace('<!--ssr-outlet-->', '');
          template = template.replace('<!--ssr-state-->', '');
          
          // CRITICAL SEO: Ensure proper self-referential canonical URL for every page
          const canonicalUrl = `${SITE_ORIGIN}${url === '/' ? '' : url.split('?')[0]}`;
          template = template.replace(
            /<link rel="canonical" href="[^"]*"[^>]*>/gi,
            `<link rel="canonical" href="${canonicalUrl}">`
          );
          template = template.replace(
            /<meta property="og:url" content="[^"]*"[^>]*>/gi,
            `<meta property="og:url" content="${canonicalUrl}">`
          );
          
          res.setHeader('X-SSR-Rendered', 'false');
          res.setHeader('X-SSR-Fallback-Reason', reason);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
          ssrMetrics.csrFallbacks++;
          console.log(`[Production SSR] CSR fallback for ${url} - Reason: ${reason} (${Date.now() - startTime}ms)`);
        };
        
        try {
          // Read the production HTML template
          const templatePath = path.resolve(distPath, "index.html");
          let template = await fs.promises.readFile(templatePath, "utf-8");

          // If SSR is disabled, serve CSR immediately
          if (!ENABLE_SSR) {
            return serveCSRFallback(template, 'SSR_DISABLED');
          }
          
          // Check if SSR server bundle exists
          if (fs.existsSync(serverEntryPath)) {
            try {
              const { render } = await import(serverEntryPath);
              
              // Wrap render in a timeout using configurable timeout
              const renderWithTimeout = async () => {
                return Promise.race([
                  render(url),
                  new Promise((_, reject) => 
                    setTimeout(() => {
                      ssrMetrics.timeouts++;
                      reject(new Error(`SSR_TIMEOUT: Render exceeded ${SSR_TIMEOUT_MS}ms`));
                    }, SSR_TIMEOUT_MS)
                  )
                ]);
              };
              
              const { html: appHtml, helmetContext, dehydratedState, notFound, routes } = await renderWithTimeout() as any;
              
              // Compose final document (single title/meta/canonical, real 404s) - see server/ssrPage.ts
              const page = composeSSRPage(template, { url, appHtml, helmet: helmetContext?.helmet, dehydratedState, notFound, routes, isProduction: true });
              res.setHeader('X-SSR-Rendered', 'true');
              if (page.status === 404) res.setHeader('X-Robots-Tag', 'noindex, follow');
              res.status(page.status).set({ "Content-Type": "text/html; charset=utf-8" }).end(page.html);
              ssrMetrics.successfulRenders++;
              console.log(`[Production SSR] Successfully rendered ${url} (${Date.now() - startTime}ms)`);
            } catch (ssrError: any) {
              // Track error metrics
              ssrMetrics.errors++;
              ssrMetrics.lastError = ssrError.message || String(ssrError);
              ssrMetrics.lastErrorTime = new Date();
              
              const isTimeout = ssrError.message?.includes('SSR_TIMEOUT');
              console.error(`[Production SSR Error] ${url} - ${isTimeout ? 'TIMEOUT' : 'ERROR'}: ${ssrError.message}`);
              if (!isTimeout) {
                console.error('[Production SSR Error Stack]', ssrError.stack);
              }
              
              // Graceful fallback to CSR
              await serveCSRFallback(template, isTimeout ? 'TIMEOUT' : 'RENDER_ERROR');
            }
          } else {
            // Fallback to CSR if server bundle doesn't exist
            console.warn('[Production SSR] Server bundle not found, falling back to CSR');
            await serveCSRFallback(template, 'NO_SERVER_BUNDLE');
          }
        } catch (error: any) {
          console.error('[Production] Error serving page:', error);
          ssrMetrics.errors++;
          ssrMetrics.lastError = error.message || String(error);
          ssrMetrics.lastErrorTime = new Date();
          next(error);
        }
      });
      
      console.log('Production SSR setup completed');
      }
    }

    // ALWAYS serve the app on port 5000
    const port = parseInt(process.env.PORT || "5000", 10);
    console.log('About to start server listener...');
    server.listen(port, "0.0.0.0", () => {
      startSitemapWatcher();
      console.log(`✓ Server successfully listening on port ${port}`);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();