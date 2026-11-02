import OpenAI from "openai";

// AI features are optional: without OPENAI_API_KEY the app still starts and
// AI calls fail individually (previously a missing key crashed the server).
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set - AI features are disabled until it is configured.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "not-configured",
});

interface MetaGenerationInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  focusKeyword?: string;
}

interface GeneratedMeta {
  metaTitle: string;
  metaDescription: string;
  suggestions: string[];
  score: number;
}

export async function generateMetaTags(input: MetaGenerationInput): Promise<GeneratedMeta> {
  try {
    // Clean content for analysis
    const cleanContent = input.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const contentWords = cleanContent.split(' ').length;
    const contentPreview = cleanContent.substring(0, 500);

    const prompt = `
You are an expert SEO specialist creating meta tags for a Pakistani business directory blog post. Generate an optimized meta title and description based on the following:

**Article Details:**
- Title: "${input.title}"
- Category: ${input.category || 'General Business'}
- Focus Keyword: ${input.focusKeyword || 'Not specified'}
- Tags: ${input.tags?.join(', ') || 'None'}
- Content Length: ${contentWords} words
- Content Preview: "${contentPreview}..."

**SEO Requirements:**
1. Meta Title: 50-60 characters, include focus keyword, compelling and clickable
2. Meta Description: 150-160 characters, include focus keyword, call-to-action
3. Target audience: Pakistani business owners, entrepreneurs, and professionals
4. Include location relevance (Pakistan, Karachi, etc.) when appropriate
5. Make it engaging and benefit-focused

**Output Format (JSON):**
{
  "metaTitle": "Optimized title here",
  "metaDescription": "Optimized description here",
  "suggestions": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ]
}

Generate meta tags that will rank well on Google and attract clicks from Pakistan business professionals.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert SEO specialist focused on Pakistani business content. Generate compelling, SEO-optimized meta tags that drive clicks and rankings. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Calculate SEO score
    const score = calculateSEOScore(result.metaTitle, result.metaDescription, input.focusKeyword);

    return {
      metaTitle: result.metaTitle || input.title,
      metaDescription: result.metaDescription || `Read about ${input.title} on PakistanYP Business Directory blog.`,
      suggestions: result.suggestions || [],
      score
    };

  } catch (error) {
    console.error('Error generating meta tags:', error);
    throw new Error('Failed to generate meta tags using AI');
  }
}

function calculateSEOScore(metaTitle: string, metaDescription: string, focusKeyword?: string): number {
  let score = 0;
  
  // Title length (optimal: 50-60 characters)
  if (metaTitle.length >= 50 && metaTitle.length <= 60) score += 25;
  else if (metaTitle.length >= 40 && metaTitle.length <= 70) score += 15;
  else if (metaTitle.length >= 30) score += 10;
  
  // Description length (optimal: 150-160 characters)
  if (metaDescription.length >= 150 && metaDescription.length <= 160) score += 25;
  else if (metaDescription.length >= 130 && metaDescription.length <= 170) score += 15;
  else if (metaDescription.length >= 100) score += 10;
  
  // Contains focus keyword
  if (focusKeyword) {
    if (metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())) score += 20;
    if (metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
  }
  
  // Call-to-action in description
  const ctaWords = ['discover', 'learn', 'find', 'explore', 'get', 'read', 'see', 'download', 'start', 'join', 'grow'];
  if (ctaWords.some(word => metaDescription.toLowerCase().includes(word))) score += 15;
  
  return Math.min(score, 100);
}

// SEO Content Analysis
export async function analyzeSEOContent(content: string, focusKeyword?: string): Promise<{
  score: number;
  wordCount: number;
  keywordDensity: number;
  readabilityScore: number;
  suggestions: string[];
  warnings: string[];
  passed: string[];
}> {
  // Clean content
  const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const words = cleanContent.split(' ').filter(word => word.length > 0);
  const wordCount = words.length;

  let score = 0;
  const suggestions: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];

  // Word count analysis
  if (wordCount >= 300) {
    score += 20;
    passed.push("Content length is sufficient (300+ words)");
  } else {
    warnings.push("Content is too short (less than 300 words)");
    suggestions.push("Add more content to reach at least 300 words for better SEO");
  }

  // Keyword density
  let keywordDensity = 0;
  if (focusKeyword) {
    const keywordOccurrences = cleanContent.toLowerCase().split(focusKeyword.toLowerCase()).length - 1;
    keywordDensity = (keywordOccurrences / wordCount) * 100;
    
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      score += 20;
      passed.push(`Keyword density is optimal (${keywordDensity.toFixed(1)}%)`);
    } else if (keywordDensity > 3) {
      warnings.push(`Keyword density is too high (${keywordDensity.toFixed(1)}%)`);
      suggestions.push("Reduce keyword usage to avoid keyword stuffing");
    } else {
      suggestions.push("Include the focus keyword more naturally in your content");
    }
  }

  // Readability (simplified Flesch score)
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const averageWordsPerSentence = wordCount / sentences.length;
  const averageSyllablesPerWord = words.reduce((acc, word) => acc + countSyllables(word), 0) / wordCount;
  
  const fleschScore = 206.835 - (1.015 * averageWordsPerSentence) - (84.6 * averageSyllablesPerWord);
  
  if (fleschScore >= 60) {
    score += 15;
    passed.push("Content readability is good");
  } else {
    suggestions.push("Improve readability by using shorter sentences and simpler words");
  }

  // Heading structure
  const headingMatches = content.match(/<h[1-6][^>]*>/gi);
  if (headingMatches && headingMatches.length >= 2) {
    score += 15;
    passed.push("Good heading structure found");
  } else {
    suggestions.push("Add more headings (H2, H3) to improve content structure");
  }

  // Image alt text
  const imageMatches = content.match(/<img[^>]*alt=["'][^"']*["'][^>]*>/gi);
  const totalImages = (content.match(/<img[^>]*>/gi) || []).length;
  
  if (totalImages > 0 && imageMatches && imageMatches.length === totalImages) {
    score += 10;
    passed.push("All images have alt text");
  } else if (totalImages > 0) {
    suggestions.push("Add alt text to all images");
  }

  // Internal/external links
  const linkMatches = content.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi);
  if (linkMatches && linkMatches.length >= 1) {
    score += 10;
    passed.push("Content includes links");
  } else {
    suggestions.push("Add relevant internal and external links");
  }

  // Pakistani/local relevance
  const pkTerms = ['pakistan', 'karachi', 'lahore', 'islamabad', 'provinces', 'business'];
  const hasPKRelevance = pkTerms.some(term => 
    cleanContent.toLowerCase().includes(term)
  );
  
  if (hasPKRelevance) {
    score += 10;
    passed.push("Content has Pakistani/local relevance");
  } else {
    suggestions.push("Include Pakistani-specific terms and local relevance");
  }

  return {
    score: Math.min(score, 100),
    wordCount,
    keywordDensity,
    readabilityScore: Math.round(fleschScore),
    suggestions,
    warnings,
    passed
  };
}

// Helper function to count syllables
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let syllables = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }
  
  // Handle silent e
  if (word.endsWith('e')) {
    syllables--;
  }
  
  return Math.max(1, syllables);
}