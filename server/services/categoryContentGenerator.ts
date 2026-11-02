import OpenAI from 'openai';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  parentName?: string;
  currentDescription?: string;
}

interface GeneratedCategoryContent {
  description: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  pageContent: string; // Additional unique paragraphs for the page
  status: 'success' | 'failed';
  error?: string;
}

const PK_FACTS = [
  "Pakistan is one of the world's most populous countries, with a large and young consumer market",
  "Karachi is Pakistan's largest city and financial centre",
  "Textiles are Pakistan's largest export industry",
  "Pakistan has one of the world's largest communities of freelancers",
  "Businesses register for tax with the Federal Board of Revenue (FBR)",
  "Companies in Pakistan are incorporated with the SECP",
  "Lahore is a major hub for trade, education and culture",
  "Islamabad and Rawalpindi together form a growing business region"
];

const CATEGORY_TIPS = {
  professional: [
    "Request detailed proposals before engaging services",
    "Verify professional certifications and licenses",
    "Check client testimonials and case studies",
    "Compare pricing across multiple providers",
    "Ensure clear communication channels"
  ],
  retail: [
    "Compare prices across multiple vendors",
    "Check warranty and return policies",
    "Verify authenticity of products",
    "Look for after-sales service support",
    "Read customer reviews and ratings"
  ],
  food: [
    "Check hygiene ratings and certifications",
    "Verify delivery options and timing",
    "Look for menu variety and dietary options",
    "Check customer reviews for quality",
    "Confirm reservation policies"
  ],
  technology: [
    "Verify technical certifications",
    "Check ongoing support packages",
    "Compare service level agreements",
    "Assess scalability options",
    "Review implementation timelines"
  ]
};

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export class CategoryContentGenerator {
  private openai: OpenAI;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateCategoryContent(category: CategoryData): Promise<GeneratedCategoryContent> {
    try {
      console.log(`🤖 Generating content for category: ${category.name}`);
      
      const prompt = this.buildPrompt(category);
      const response = await this.callOpenAIWithRetry(prompt);
      const content = this.parseResponse(response, category);
      
      console.log(`✅ Content generated for: ${category.name}`);
      return content;
      
    } catch (error) {
      console.error(`❌ Failed to generate content for ${category.name}:`, error);
      return this.generateFallbackContent(category, error as Error);
    }
  }

  private buildPrompt(category: CategoryData): string {
    const parentContext = category.parentName 
      ? `This is a subcategory under "${category.parentName}".` 
      : 'This is a top-level category.';
    
    const randomFact = PK_FACTS[Math.floor(Math.random() * PK_FACTS.length)];
    
    return `You are an expert SEO content writer for Pakistani business directories. Generate unique, valuable content for a business category page.

Category Information:
- Category Name: ${category.name}
- URL Slug: ${category.slug}
- ${parentContext}
- Target Market: Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan)

Pakistani Context Fact: ${randomFact}

Generate the following content (ALL fields must be UNIQUE and SPECIFIC to this category):

1. **description** (180-250 characters): A unique, engaging description of this category in Pakistan market. Mention specific services/products offered and Pakistan business landscape.

2. **metaTitle** (50-60 characters): SEO-optimized title in format: "${category.name} in Pakistan | PakistanYP" or similar. Must be unique.

3. **metaDescription** (150-160 characters): Compelling meta description that will encourage clicks from search results. Mention Pakistan, category benefits, and a call to action.

4. **ogTitle** (50-70 characters): Social media title that's engaging and shareable.

5. **ogDescription** (100-150 characters): Social media description that drives engagement.

6. **pageContent** (400-600 characters): 2-3 unique paragraphs of valuable content about this category in Pakistan. Include:
   - Industry trends in Pakistan
   - Tips for choosing the right ${category.name} provider
   - Why this category matters in Pakistan economy
   - Specific mention of relevant provinces where applicable
   Make this content genuinely useful and educational, NOT generic filler.

Return ONLY valid JSON:
{
  "description": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "ogTitle": "...",
  "ogDescription": "...",
  "pageContent": "..."
}

CRITICAL RULES:
- Every field must be COMPLETELY UNIQUE to "${category.name}"
- NO generic phrases like "Find businesses" or "Browse listings"
- Include specific services, products, or use cases for this exact category
- Write as if you're an industry expert in ${category.name}
- Use natural language, not keyword stuffing`;
  }

  private async callOpenAIWithRetry(prompt: string, attempt = 1): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (attempt < this.maxRetries && (error.status === 429 || error.status >= 500)) {
        console.log(`Retry attempt ${attempt + 1} for OpenAI call...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.callOpenAIWithRetry(prompt, attempt + 1);
      }
      throw error;
    }
  }

  private parseResponse(response: string, category: CategoryData): GeneratedCategoryContent {
    try {
      const parsed = JSON.parse(response);
      
      return {
        description: this.validateLength(parsed.description, 180, 280) || this.getFallbackDescription(category),
        metaTitle: this.validateLength(parsed.metaTitle, 40, 70) || `${category.name} in Pakistan | PakistanYP`,
        metaDescription: this.validateLength(parsed.metaDescription, 130, 170) || this.getFallbackMetaDescription(category),
        ogTitle: this.validateLength(parsed.ogTitle, 40, 80) || `${category.name} - Pakistani Business Directory`,
        ogDescription: this.validateLength(parsed.ogDescription, 80, 180) || this.getFallbackDescription(category),
        pageContent: this.validateLength(parsed.pageContent, 300, 700) || this.getFallbackPageContent(category),
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }

  private validateLength(text: string | undefined, min: number, max: number): string | null {
    if (!text) return null;
    const trimmed = text.trim();
    if (trimmed.length < min || trimmed.length > max) {
      // Allow some flexibility
      if (trimmed.length > max) {
        return trimmed.substring(0, max - 3) + '...';
      }
      return trimmed;
    }
    return trimmed;
  }

  private getFallbackDescription(category: CategoryData): string {
    return `Explore top-rated ${category.name.toLowerCase()} providers across Pakistan. From Karachi to Lahore, find verified ${category.name.toLowerCase()} specialists with detailed profiles, customer reviews, and direct contact information.`;
  }

  private getFallbackMetaDescription(category: CategoryData): string {
    return `Find verified ${category.name.toLowerCase()} in Pakistan. Compare top providers in Karachi, Lahore & all provinces and territories. Read reviews, get quotes.`;
  }

  private getFallbackPageContent(category: CategoryData): string {
    const tips = this.getCategoryTips(category.name);
    return `The ${category.name.toLowerCase()} sector in Pakistan continues to evolve with the nation's rapid economic development. Whether you're in Karachi, Lahore, or any of provinces and territories, finding the right ${category.name.toLowerCase()} provider is essential for success.\n\n${tips}\n\nOur directory connects you with verified ${category.name.toLowerCase()} providers who meet the highest standards of service and professionalism in Pakistan market.`;
  }

  private getCategoryTips(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();
    let tips: string[];
    
    if (lowerName.includes('food') || lowerName.includes('restaurant') || lowerName.includes('catering')) {
      tips = CATEGORY_TIPS.food;
    } else if (lowerName.includes('tech') || lowerName.includes('it') || lowerName.includes('software')) {
      tips = CATEGORY_TIPS.technology;
    } else if (lowerName.includes('retail') || lowerName.includes('shop') || lowerName.includes('store')) {
      tips = CATEGORY_TIPS.retail;
    } else {
      tips = CATEGORY_TIPS.professional;
    }
    
    const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `When selecting a ${categoryName.toLowerCase()} provider, consider: ${randomTips.join('. ')}.`;
  }

  private generateFallbackContent(category: CategoryData, error: Error): GeneratedCategoryContent {
    return {
      description: this.getFallbackDescription(category),
      metaTitle: `${category.name} in Pakistan | PakistanYP`,
      metaDescription: this.getFallbackMetaDescription(category),
      ogTitle: `${category.name} - Pakistani Business Directory`,
      ogDescription: this.getFallbackDescription(category),
      pageContent: this.getFallbackPageContent(category),
      status: 'failed',
      error: error.message
    };
  }
}

export const categoryContentGenerator = new CategoryContentGenerator();
