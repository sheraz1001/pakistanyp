// This component generates robots.txt content for SEO
export const robotsTxtContent = `User-agent: *
Allow: /

# Allow all major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /login/
Disallow: /register/
Disallow: /logout/
Disallow: /settings/
Disallow: /profile/

# Allow important directories
Allow: /categories/
Allow: /businesses/
Allow: /provinces/
Allow: /localities/
Allow: /news/
Allow: /blog/
Allow: /help-center/
Allow: /contact-us/
Allow: /pages/

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${window.location.origin}/sitemap.xml
Sitemap: ${window.location.origin}/sitemap-businesses.xml
Sitemap: ${window.location.origin}/sitemap-categories.xml
Sitemap: ${window.location.origin}/sitemap-provinces.xml`;

export default function RobotsTxt() {
  return null; // This component doesn't render anything
}