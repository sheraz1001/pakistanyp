/**
 * SSR Handler
 * Handles server-side rendering for all users
 */

import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import type { ViteDevServer } from "vite";

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

export interface SSRRenderResult {
  html: string;
  helmetContext: { helmet?: any };
  dehydratedState: unknown;
}

export type SSRRenderFunction = (url: string) => Promise<SSRRenderResult>;

/**
 * Create SSR middleware for development (with Vite)
 */
export function createDevSSRMiddleware(vite: ViteDevServer) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;

    // Skip API routes and static assets
    if (
      url.startsWith('/api/') ||
      url.startsWith('/assets/') ||
      url.startsWith('/uploads/') ||
      url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt|map)(\?.*)?$/)
    ) {
      return next();
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
      template = await vite.transformIndexHtml(url, template);

      // Load the SSR entry module
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx") as {
        render: SSRRenderFunction;
      };

      // Render the app
      const { html: appHtml, helmetContext, dehydratedState } = await render(url);

      // Extract helmet data for SEO meta tags
      const helmet = helmetContext.helmet;
      let headTags = '';
      if (helmet) {
        headTags = [
          helmet.title?.toString() || '',
          helmet.meta?.toString() || '',
          helmet.link?.toString() || '',
          helmet.script?.toString() || '',
        ].filter(Boolean).join('\n');
      }

      // Build the dehydrated state script
      const stateScript = `
<script>
  window.__SSR_RENDERED__ = true;
  window.__REACT_QUERY_STATE__ = ${escapeJsonForScript(JSON.stringify(dehydratedState))};
</script>`;

      // Inject the SSR content
      let finalHtml = template;
      
      // Replace placeholders
      finalHtml = finalHtml.replace('<!--ssr-head-->', headTags);
      finalHtml = finalHtml.replace('<!--ssr-outlet-->', appHtml);
      finalHtml = finalHtml.replace('<!--ssr-state-->', stateScript);

      // Set SSR headers
      res.setHeader('X-SSR-Rendered', 'true');
      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
      
    } catch (e) {
      // Fix SSR stack trace for better debugging
      vite.ssrFixStacktrace(e as Error);
      console.error('[SSR Error]', e);
      
      // Fallback to client-side rendering on error
      next();
    }
  };
}

/**
 * Create SSR middleware for production
 */
export function createProdSSRMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    const distPath = path.resolve(import.meta.dirname, "public");
    
    try {
      // Read the production HTML template
      const templatePath = path.resolve(distPath, "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");

      // Load the production SSR module
      const serverEntryPath = path.resolve(import.meta.dirname, "..", "dist", "server", "entry-server.js");
      
      if (fs.existsSync(serverEntryPath)) {
        const { render } = await import(serverEntryPath);
        const { html: appHtml, helmetContext, dehydratedState } = await render(url);

        // Extract helmet data
        const helmet = helmetContext.helmet;
        let headTags = '';
        if (helmet) {
          headTags = [
            helmet.title?.toString() || '',
            helmet.meta?.toString() || '',
            helmet.link?.toString() || '',
            helmet.script?.toString() || '',
          ].filter(Boolean).join('\n');
        }

        // Build state script
        const stateScript = `
<script>
  window.__SSR_RENDERED__ = true;
  window.__REACT_QUERY_STATE__ = ${escapeJsonForScript(JSON.stringify(dehydratedState))};
</script>`;

        // Inject SSR content
        template = template.replace('<!--ssr-head-->', headTags);
        template = template.replace('<!--ssr-outlet-->', appHtml);
        template = template.replace('<!--ssr-state-->', stateScript);

        res.setHeader('X-SSR-Rendered', 'true');
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } else {
        // Fallback to CSR if server bundle doesn't exist
        console.warn('[SSR] Server bundle not found, falling back to CSR');
        next();
      }
    } catch (error) {
      console.error('[SSR Error]', error);
      next();
    }
  };
}
