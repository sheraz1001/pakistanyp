/**
 * Bot Detection Service
 * Identifies search engine crawlers and social media bots
 */

// COMPREHENSIVE list of bot user agents (2025) - ALL Search Engines & AI Platforms
const BOT_USER_AGENTS = [
  // === MAJOR SEARCH ENGINES ===
  'googlebot',              // Google Search
  'google-extended',        // Google Gemini/Bard AI training
  'google-cloudvertexbot',  // Google Cloud Vertex AI
  'google-notebooklm',      // Google NotebookLM
  'gemini-deep-research',   // Gemini Deep Research
  'bingbot',                // Microsoft Bing + Copilot
  'slurp',                  // Yahoo
  'duckduckbot',            // DuckDuckGo
  'duckassistbot',          // DuckDuckGo AI Assistant
  'baiduspider',            // Baidu (China's #1 search engine)
  'yandexbot',              // Yandex (Russia's #1 search engine)
  'yeti',                   // Naver (South Korea's #1 search engine)
  
  // === AI CHATBOTS & ASSISTANTS (OpenAI) ===
  'gptbot',                 // ChatGPT model training
  'oai-searchbot',          // ChatGPT Search indexing
  'chatgpt-user',           // ChatGPT on-demand fetching
  
  // === AI CHATBOTS & ASSISTANTS (Anthropic) ===
  'claudebot',              // Claude AI training
  'claude-web',             // Claude web crawling
  'anthropic-ai',           // Anthropic general crawler
  
  // === AI CHATBOTS & ASSISTANTS (Others) ===
  'perplexitybot',          // Perplexity AI search
  'perplexity-user',        // Perplexity user-triggered
  'meta-externalagent',     // Meta AI (Facebook/Instagram/Llama)
  'meta-webindexer',        // Meta web indexing
  'applebot',               // Apple Search
  'applebot-extended',      // Apple Intelligence/Siri training
  'amazonbot',              // Amazon Alexa/AWS AI
  'xai-bot',                // xAI Grok (Elon Musk)
  'mistralai-user',         // Mistral AI Le Chat
  'cohere-ai',              // Cohere AI models
  'cohere-command',         // Cohere Command
  'deepseekbot',            // Deepseek AI
  'bytespider',             // ByteDance/TikTok AI (very aggressive)
  'youbot',                 // You.com AI search
  'huggingface-bot',        // Hugging Face model training
  'ccbot',                  // Common Crawl (used by many AI trainers)
  'diffbot',                // Diffbot knowledge graph
  'character-ai',           // Character.AI training
  'replicate-bot',          // Replicate cloud AI
  'together-bot',           // Together.ai
  'groq-bot',               // Groq AI inference
  'brightbot',              // Brightbot AI
  'kangaroo bot',           // Kangaroo AI search
  'andibot',                // Andi search engine
  'ai2bot',                 // Allen Institute AI research
  
  // === SOCIAL MEDIA CRAWLERS ===
  'facebookexternalhit',    // Facebook link previews
  'facebookbot',            // Facebook general crawler
  'facebot',                // Facebook bot
  'twitterbot',             // Twitter/X link previews
  'linkedinbot',            // LinkedIn link previews
  'whatsapp',               // WhatsApp link previews
  'telegrambot',            // Telegram link previews
  'slackbot',               // Slack link previews
  'discordbot',             // Discord link previews
  'pinterestbot',           // Pinterest crawler
  'redditbot',              // Reddit crawler
  'instagrambot',           // Instagram crawler
  'snapchatbot',            // Snapchat crawler
  'tiktokbot',              // TikTok crawler
  
  // === SEO & ANALYTICS BOTS ===
  'rogerbot',               // Moz SEO crawler
  'semrushbot',             // SEMrush SEO tool
  'ahrefsbot',              // Ahrefs SEO tool
  'dotbot',                 // Moz DotBot
  'screaming frog',         // Screaming Frog SEO Spider
  
  // === OTHER IMPORTANT BOTS ===
  'embedly',                // Embedly link previews
  'quora link preview',     // Quora
  'showyoubot',             // ShowYou
  'outbrain',               // Outbrain content discovery
  'vkshare',                // VKontakte (Russian social network)
  'w3c_validator',          // W3C HTML Validator
  'feedfetcher',            // RSS feed crawlers
  
  // === GENERIC PATTERNS (keep last to avoid false positives) ===
  'bot',
  'crawler',
  'spider',
  'scraper'
];

/**
 * Check if a user agent string belongs to a bot
 */
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  
  const ua = userAgent.toLowerCase();
  
  // Check against known bot patterns
  return BOT_USER_AGENTS.some(botPattern => ua.includes(botPattern));
}

/**
 * Identify the specific bot type for analytics
 */
export function getBotType(userAgent: string | undefined): string | null {
  if (!userAgent || !isBot(userAgent)) {
    return null;
  }
  
  const ua = userAgent.toLowerCase();
  
  // Search Engines
  if (ua.includes('googlebot')) return 'Google';
  if (ua.includes('google-extended') || ua.includes('gemini')) return 'Google Gemini AI';
  if (ua.includes('bingbot')) return 'Bing/Copilot';
  if (ua.includes('baiduspider')) return 'Baidu';
  if (ua.includes('yandexbot')) return 'Yandex';
  if (ua.includes('duckduckbot')) return 'DuckDuckGo';
  if (ua.includes('yeti')) return 'Naver';
  if (ua.includes('slurp')) return 'Yahoo';
  
  // AI Platforms
  if (ua.includes('gptbot') || ua.includes('oai-searchbot') || ua.includes('chatgpt')) return 'ChatGPT';
  if (ua.includes('claudebot') || ua.includes('anthropic')) return 'Claude AI';
  if (ua.includes('perplexitybot') || ua.includes('perplexity')) return 'Perplexity AI';
  if (ua.includes('meta-externalagent') || ua.includes('meta-webindexer')) return 'Meta AI';
  if (ua.includes('applebot')) return 'Apple Intelligence';
  if (ua.includes('amazonbot')) return 'Amazon Alexa';
  if (ua.includes('xai-bot')) return 'Grok (xAI)';
  if (ua.includes('mistralai')) return 'Mistral AI';
  if (ua.includes('cohere')) return 'Cohere AI';
  if (ua.includes('bytespider')) return 'ByteDance/TikTok AI';
  
  // Social Media
  if (ua.includes('facebookexternalhit') || ua.includes('facebot')) return 'Facebook';
  if (ua.includes('twitterbot')) return 'Twitter/X';
  if (ua.includes('linkedinbot')) return 'LinkedIn';
  if (ua.includes('whatsapp')) return 'WhatsApp';
  if (ua.includes('telegrambot')) return 'Telegram';
  if (ua.includes('slackbot')) return 'Slack';
  if (ua.includes('pinterestbot')) return 'Pinterest';
  
  // SEO Tools
  if (ua.includes('ahrefsbot')) return 'Ahrefs SEO';
  if (ua.includes('semrushbot')) return 'SEMrush SEO';
  if (ua.includes('rogerbot')) return 'Moz SEO';
  
  return 'Other Bot';
}

/**
 * Check if the bot should receive pre-rendered content
 * STRATEGY: Allow ALL search engines and AI platforms to access full content
 * This maximizes visibility across Google, Bing, AI chatbots, and international search
 */
export function shouldPrerender(userAgent: string | undefined): boolean {
  if (!userAgent || !isBot(userAgent)) {
    return false;
  }
  
  const ua = userAgent.toLowerCase();
  
  // Don't prerender for monitoring/uptime bots (they don't index content)
  const monitoringBots = ['pingdom', 'uptimerobot', 'statuspage', 'newrelic', 'datadog'];
  if (monitoringBots.some(bot => ua.includes(bot))) {
    return false;
  }
  
  // Don't prerender for malicious scrapers
  const maliciousBots = ['semrush', 'ahrefs', 'mj12bot', 'dotbot'];
  if (maliciousBots.some(bot => ua.includes(bot))) {
    return false;
  }
  
  // PRERENDER FOR EVERYONE ELSE - Maximum SEO & AI Visibility
  // This includes:
  // - All search engines (Google, Bing, Baidu, Yandex, DuckDuckGo, Naver, Yahoo)
  // - All AI platforms (ChatGPT, Claude, Gemini, Perplexity, Meta AI, etc.)
  // - All social media (Facebook, Twitter, LinkedIn, WhatsApp, etc.)
  // - SEO tools that help with visibility
  return true; // Prerender for all detected bots except monitoring/malicious
}

/**
 * Log bot visit for analytics
 */
export function logBotVisit(userAgent: string, url: string, botType: string | null) {
  console.log(`[Bot Visit] ${botType || 'unknown'} - ${url}`);
  console.log(`[User Agent] ${userAgent.substring(0, 100)}...`);
}
