/**
 * Pre-rendering Service
 * Uses Puppeteer to render React SPA as static HTML for bots
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Simple in-memory cache
interface CacheEntry {
  html: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Browser instance pool
let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  
  console.log('[Prerenderer] Launching new browser instance...');
  
  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Required for some environments
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });
  
  console.log('[Prerenderer] Browser launched successfully');
  
  return browserInstance;
}

/**
 * Render a URL to static HTML
 */
export async function renderPage(url: string): Promise<string> {
  const cacheKey = url;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[Prerenderer] Cache hit for ${url}`);
    return cached.html;
  }
  
  console.log(`[Prerenderer] Rendering ${url}...`);
  const startTime = Date.now();
  
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Listen to console messages from the page for debugging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[Puppeteer Console ${type}]`, msg.text());
      }
    });
    
    // Listen to page errors
    page.on('pageerror', error => {
      console.error('[Puppeteer Page Error]', error.message);
    });
    
    // Listen to failed requests
    page.on('requestfailed', request => {
      console.error('[Puppeteer Request Failed]', request.url(), request.failure()?.errorText);
    });
    
    // Track ALL requests to debug React Query
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
        console.log('[Puppeteer API Request]', url);
      }
    });
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log('[Puppeteer API Response]', url, response.status());
      }
    });
    
    // Set bypass header to prevent recursive prerendering
    await page.setExtraHTTPHeaders({
      'x-prerender-bypass': '1'
    });
    
    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080
    });
    
    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0', // Wait until no network activity
      timeout: 30000 // 30 second timeout
    });
    
    // Add post-navigation wait for React hydration with data
    // This ensures React Query has time to fetch data AND re-render the component
    console.log('[Prerenderer] Waiting for React hydration with data...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wait for network to become idle again (after React Query fetches complete)
    try {
      await page.waitForNetworkIdle({ timeout: 10000, idleTime: 2000 });
      console.log('[Prerenderer] Network idle after data fetch');
    } catch (error) {
      console.log('[Prerenderer] Network still active, proceeding...');
    }
    
    // Determine expected link thresholds based on page type
    const isListingPage = url.includes('/categories') || url.includes('/businesses') || url.includes('/localities');
    const expectedMinLinks = isListingPage ? 50 : 5; // Listing pages should have many links
    
    // Wait for DOM elements to actually render
    try {
      console.log(`[Prerenderer] Waiting for DOM content (expecting at least ${expectedMinLinks} content links)...`);
      await page.waitForFunction(
        (minLinks) => {
          const categoryLinks = document.querySelectorAll('a[href^="/categories/"]');
          const businessLinks = document.querySelectorAll('a[href^="/business/"]');
          const blogLinks = document.querySelectorAll('a[href^="/blog/"]');
          const localityLinks = document.querySelectorAll('a[href^="/localities/"]');
          const totalLinks = categoryLinks.length + businessLinks.length + blogLinks.length + localityLinks.length;
          return totalLinks >= minLinks;
        },
        { timeout: 30000 },
        expectedMinLinks
      );
      console.log('[Prerenderer] Content DOM elements found - page fully hydrated');
    } catch (error) {
      console.log('[Prerenderer] Content threshold not met, checking actual count...');
      
      // Log DOM state for debugging
      const linkCounts = await page.evaluate(() => {
        const businessLinks = document.querySelectorAll('a[href^="/business/"]');
        const categoryLinks = document.querySelectorAll('a[href^="/categories/"]');
        const localityLinks = document.querySelectorAll('a[href^="/localities/"]');
        const allLinks = document.querySelectorAll('a[href]');
        return {
          business: businessLinks.length,
          category: categoryLinks.length,
          locality: localityLinks.length,
          total: allLinks.length
        };
      });
      console.log(`[Prerenderer] Current link counts: business=${linkCounts.business}, category=${linkCounts.category}, locality=${linkCounts.locality}, total=${linkCounts.total}`);
      
      // If we have SOME content links, it's partially successful
      if (linkCounts.business > 0 || linkCounts.category > 0 || linkCounts.locality > 0) {
        console.log('[Prerenderer] Some content links found, proceeding with partial content');
      } else {
        // Extended fallback wait for pages with no content links yet
        console.log('[Prerenderer] No content links, adding extended wait for React hydration...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check one more time
        const finalCounts = await page.evaluate(() => {
          const businessLinks = document.querySelectorAll('a[href^="/business/"]');
          const categoryLinks = document.querySelectorAll('a[href^="/categories/"]');
          const localityLinks = document.querySelectorAll('a[href^="/localities/"]');
          const allLinks = document.querySelectorAll('a[href]');
          return {
            business: businessLinks.length,
            category: categoryLinks.length,
            locality: localityLinks.length,
            total: allLinks.length
          };
        });
        console.log(`[Prerenderer] Final link counts after extended wait: business=${finalCounts.business}, category=${finalCounts.category}, locality=${finalCounts.locality}, total=${finalCounts.total}`);
      }
    }
    
    // Get the rendered HTML
    const html = await page.content();
    
    // Log API request summary
    console.log(`[Prerenderer] Total API requests made: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      console.log('[Prerenderer] API endpoints called:', [...new Set(apiRequests)].join(', '));
    } else {
      console.log('[Prerenderer] WARNING: NO API REQUESTS DETECTED - React Query may not be running!');
    }
    
    // Cache the result
    cache.set(cacheKey, {
      html,
      timestamp: Date.now()
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Prerenderer] Rendered ${url} in ${duration}ms`);
    
    return html;
    
  } catch (error) {
    console.error(`[Prerenderer] Error rendering ${url}:`, error);
    throw new Error(`Failed to render page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Clear the cache
 */
export function clearCache(url?: string) {
  if (url) {
    cache.delete(url);
    console.log(`[Prerenderer] Cleared cache for ${url}`);
  } else {
    cache.clear();
    console.log('[Prerenderer] Cleared all cache');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

/**
 * Clean up browser resources
 */
export async function shutdown() {
  if (browserInstance) {
    console.log('[Prerenderer] Closing browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
  cache.clear();
}

// Clean up on process exit
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
