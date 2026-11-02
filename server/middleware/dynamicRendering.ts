/**
 * Dynamic Rendering Middleware
 * Serves server-rendered HTML to search engine bots, SPA to regular users
 */

import { Request, Response, NextFunction } from 'express';
import { isBot, getBotType, shouldPrerender, logBotVisit } from '../services/botDetector';
import { 
  renderCategoriesSnapshot,
  renderBusinessesSnapshot,
  renderProvincesSnapshot,
  renderLocalitiesSnapshot,
  renderCategoryDetailSnapshot,
  renderBusinessDetailSnapshot,
  renderProvinceDetailSnapshot,
  renderLocalityDetailSnapshot,
  renderHomepageSnapshot,
  renderBlogListSnapshot,
  renderBlogDetailSnapshot,
  renderNewsListSnapshot,
  renderNewsDetailSnapshot
} from '../services/seoSnapshotRenderer';

// Concurrency control for snapshot rendering
let activeRenders = 0;
const MAX_CONCURRENT_RENDERS = 5;

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // Max requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    // New window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_WINDOW
    });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Dynamic rendering middleware
 * Detects bots and serves appropriate content
 */
export async function dynamicRenderingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userAgent = req.headers['user-agent'];
  
  // DEBUG: Log ALL requests reaching this middleware
  console.log(`[Dynamic Rendering] Incoming request: ${req.url}`);
  console.log(`[Dynamic Rendering] User-Agent: ${userAgent}`);
  
  // Check for prerender bypass header (from Puppeteer internal requests)
  if (req.get('x-prerender-bypass') === '1') {
    console.log('[Dynamic Rendering] Bypass header detected - skipping dynamic rendering');
    return next();
  }
  
  // Skip for API routes and static assets
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/uploads/') ||
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt)$/)
  ) {
    console.log(`[Dynamic Rendering] Skipping ${req.path} - API or static asset`);
    return next();
  }
  
  // Check if this is a bot
  const botCheck = isBot(userAgent);
  console.log(`[Dynamic Rendering] Is bot? ${botCheck}`);
  
  if (!botCheck) {
    // Regular user - continue to normal SPA serving
    return next();
  }
  
  // Check if we should prerender for this bot
  if (!shouldPrerender(userAgent)) {
    // Don't prerender for monitoring bots
    return next();
  }
  
  // Rate limiting
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    console.warn(`[Dynamic Rendering] Rate limit exceeded for IP: ${clientIp}`);
    return next(); // Fallback to SPA
  }
  
  // Concurrency control
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    console.warn(`[Dynamic Rendering] Max concurrent renders reached (${MAX_CONCURRENT_RENDERS})`);
    return next(); // Fallback to SPA
  }
  
  // Bot detected - serve server-rendered HTML
  const botType = getBotType(userAgent);
  logBotVisit(userAgent || 'unknown', req.url, botType);
  
  activeRenders++;
  
  try {
    const path = req.path;
    let html: string | null = null;
    
    console.log(`[SEO Rendering] Serving snapshot for ${path} to ${botType}...`);
    
    // Route to appropriate snapshot renderer
    if (path === '/' || path === '') {
      html = await renderHomepageSnapshot();
    } else if (path === '/categories') {
      html = await renderCategoriesSnapshot();
    } else if (path === '/businesses') {
      html = await renderBusinessesSnapshot();
    } else if (path === '/provinces') {
      html = await renderProvincesSnapshot();
    } else if (path === '/localities') {
      html = await renderLocalitiesSnapshot();
    } else if (path.startsWith('/categories/')) {
      const slug = path.replace('/categories/', '');
      html = await renderCategoryDetailSnapshot(slug);
    } else if (path.startsWith('/business/')) {
      const slug = path.replace('/business/', '');
      html = await renderBusinessDetailSnapshot(slug);
    } else if (path.startsWith('/provinces/')) {
      const code = path.replace('/provinces/', '');
      html = await renderProvinceDetailSnapshot(code);
    } else if (path.startsWith('/localities/') && path !== '/localities') {
      // Handle both simple slugs (/localities/clifton) and compound slugs (/localities/sindh/clifton-karachi)
      const slug = path.replace('/localities/', '');
      html = await renderLocalityDetailSnapshot(slug);
    } else if (['/karachi', '/lahore', '/islamabad', '/rawalpindi', '/faisalabad', '/peshawar', '/multan'].includes(path)) {
      // Handle individual province routes (used in sitemap)
      const provinceMap: { [key: string]: string } = {
        '/karachi': 'karachi',
        '/lahore': 'lahore',
        '/islamabad': 'islamabad',
        '/rawalpindi': 'rawalpindi',
        '/faisalabad': 'faisalabad',
        '/peshawar': 'peshawar',
        '/multan': 'multan'
      };
      const code = provinceMap[path];
      if (code) {
        html = await renderProvinceDetailSnapshot(code);
      }
    } else if (path === '/blog') {
      // Blog listing page
      html = await renderBlogListSnapshot();
    } else if (path.startsWith('/blog/') && path !== '/blog/search') {
      // Individual blog post
      const slug = path.replace('/blog/', '');
      html = await renderBlogDetailSnapshot(slug);
    } else if (path === '/news') {
      // News listing page
      html = await renderNewsListSnapshot();
    } else if (path.startsWith('/news/')) {
      // Individual news article
      const slug = path.replace('/news/', '');
      html = await renderNewsDetailSnapshot(slug);
    }
    
    if (html) {
      // Add headers to indicate this is server-rendered
      res.setHeader('X-Rendered', 'server');
      res.setHeader('X-Bot-Type', botType || 'unknown');
      
      // Cache for 24 hours
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      // Send the server-rendered HTML
      res.status(200).send(html);
      
      console.log(`[SEO Rendering] Successfully served snapshot to ${botType}`);
    } else {
      // Check if this is a detail page that should return 404 for missing resources
      const isDetailPage = 
        path.startsWith('/categories/') ||
        path.startsWith('/business/') ||
        path.startsWith('/provinces/') ||
        path.startsWith('/localities/') ||
        path.startsWith('/blog/') ||
        path.startsWith('/news/');
      
      if (isDetailPage) {
        // Return proper 404 for non-existent resources (prevents duplicate content)
        console.log(`[SEO Rendering] Resource not found for ${path}, returning 404`);
        res.setHeader('X-Rendered', 'server');
        res.setHeader('X-Bot-Type', botType || 'unknown');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        
        const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found | PakistanYP</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="The requested page could not be found.">
</head>
<body>
  <h1>Page Not Found</h1>
  <p>The resource you are looking for does not exist.</p>
  <p><a href="/">Return to Homepage</a></p>
  <p><a href="/categories">Browse Categories</a></p>
  <p><a href="/businesses">Browse Businesses</a></p>
</body>
</html>`;
        
        res.status(404).send(notFoundHtml);
      } else {
        // No snapshot available for this route, fallback to SPA
        console.log(`[SEO Rendering] No snapshot for ${path}, falling back to SPA`);
        next();
      }
    }
    
  } catch (error) {
    console.error('[SEO Rendering] Error:', error);
    
    // Fallback to normal SPA if rendering fails
    console.log('[SEO Rendering] Falling back to SPA serving');
    next();
  } finally {
    activeRenders--;
  }
}
