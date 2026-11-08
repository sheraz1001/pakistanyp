import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTPS only (browsers ignore this header on plain-HTTP responses)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http:",
    "connect-src 'self' https://api.stripe.com https://api.openweathermap.org https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://www.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  next();
}

export function domainRedirects(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const requestUrl = `${protocol}://${host}${req.originalUrl}`;
  
  // Log for debugging
  console.log(`Incoming request: ${requestUrl}`);
  
  // Handle specific domain redirects for PakistanYP (fix typo) - only in production
  if (host && (host === 'www.pakistanype.com' || host === 'pakistanype.com') && process.env.NODE_ENV === 'production') {
    console.log(`Redirecting typo domain: ${host} -> pakistanyp.com`);
    return res.redirect(301, `https://pakistanyp.com${req.originalUrl}`);
  }
  
  // Force HTTPS in production only for specific production domains
  if (protocol === 'http' && process.env.NODE_ENV === 'production' && host && host.includes('pakistanyp.com')) {
    console.log(`Redirecting HTTP to HTTPS for production domain: ${host}`);
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  
  // Redirect www to non-www for production domains only
  if (host && host.startsWith('www.') && process.env.NODE_ENV === 'production' && host.includes('pakistanyp.com')) {
    const nonWwwHost = host.substring(4);
    console.log(`Redirecting www to non-www: ${host} -> ${nonWwwHost}`);
    return res.redirect(301, `https://${nonWwwHost}${req.originalUrl}`);
  }
  
  next();
}

/** Kept as a no-op hook for the middleware chain (the Replit preview overrides are gone). */
export function finalHeadersOverride(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function corsHeaders(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('origin');
  const host = req.get('host');
  const allowedOrigins = [
    'https://pakistanyp.com',
    'https://www.pakistanyp.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ];
  
  // Allow any origin in development mode for testing
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}
