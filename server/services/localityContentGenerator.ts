import { REGION_FACTS } from "@shared/countries/locale";
import OpenAI from 'openai';

interface LocalityData {
  id: number;
  name: string;
  slug: string;
  provinceId: number;
  provinceName: string;
  currentDescription?: string;
}

interface GeneratedLocalityContent {
  description: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  pageContent: string;
  status: 'success' | 'failed';
  error?: string;
}


// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export class LocalityContentGenerator {
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

  async generateLocalityContent(locality: LocalityData): Promise<GeneratedLocalityContent> {
    try {
      console.log(`🤖 Generating content for locality: ${locality.name}, ${locality.provinceName}`);
      
      const prompt = this.buildPrompt(locality);
      const response = await this.callOpenAIWithRetry(prompt);
      const content = this.parseResponse(response, locality);
      
      console.log(`✅ Content generated for: ${locality.name}`);
      return content;
      
    } catch (error) {
      console.error(`❌ Failed to generate content for ${locality.name}:`, error);
      return this.generateFallbackContent(locality, error as Error);
    }
  }

  private buildPrompt(locality: LocalityData): string {
    const provinceFacts = REGION_FACTS[locality.provinceName] || Object.values(REGION_FACTS)[0] || [];
    const randomFact = provinceFacts[Math.floor(Math.random() * provinceFacts.length)];
    
    return `You are an expert local guide and SEO content writer for Pakistani localities. Generate unique, valuable content for a locality/area business directory page.

Locality Information:
- Locality Name: ${locality.name}
- Province: ${locality.provinceName}
- URL: /localities/${locality.slug}
- Target Audience: People searching for businesses in ${locality.name}

Province Fact: ${randomFact}

Generate the following content (ALL must be UNIQUE and SPECIFIC to ${locality.name}):

1. **description** (180-280 characters): A unique description of ${locality.name} as a business and residential area. Mention its character, notable features, and what makes it special in ${locality.provinceName}.

2. **metaTitle** (50-60 characters): SEO title like "${locality.name} Businesses | ${locality.provinceName} | PakistanYP"

3. **metaDescription** (150-160 characters): Compelling meta description mentioning ${locality.name}, types of businesses found here, and why visitors should explore.

4. **ogTitle** (50-70 characters): Engaging social media title for ${locality.name}.

5. **ogDescription** (100-150 characters): Social description highlighting ${locality.name}'s business community.

6. **pageContent** (400-600 characters): 2-3 unique paragraphs about:
   - What ${locality.name} is known for (residential, commercial, mixed-use)
   - Types of businesses and services available
   - Transportation, landmarks, or notable features
   - Why businesses choose to operate in ${locality.name}
   Make this genuinely informative about the actual area.

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
- Every field must be UNIQUE to "${locality.name}, ${locality.provinceName}"
- NO generic phrases like "Discover businesses" or "Find services"
- Write as if you know ${locality.name} personally
- Mention specific area characteristics (business district, residential area, etc.)
- Include natural language, avoid keyword stuffing`;
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

  private parseResponse(response: string, locality: LocalityData): GeneratedLocalityContent {
    try {
      const parsed = JSON.parse(response);
      
      return {
        description: this.validateLength(parsed.description, 150, 320) || this.getFallbackDescription(locality),
        metaTitle: this.validateLength(parsed.metaTitle, 40, 70) || `${locality.name} Businesses | ${locality.provinceName} | PakistanYP`,
        metaDescription: this.validateLength(parsed.metaDescription, 130, 170) || this.getFallbackMetaDescription(locality),
        ogTitle: this.validateLength(parsed.ogTitle, 40, 80) || `${locality.name} - ${locality.provinceName} Business Directory`,
        ogDescription: this.validateLength(parsed.ogDescription, 80, 180) || this.getFallbackDescription(locality),
        pageContent: this.validateLength(parsed.pageContent, 300, 700) || this.getFallbackPageContent(locality),
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }

  private validateLength(text: string | undefined, min: number, max: number): string | null {
    if (!text) return null;
    const trimmed = text.trim();
    if (trimmed.length > max) {
      return trimmed.substring(0, max - 3) + '...';
    }
    return trimmed;
  }

  private getFallbackDescription(locality: LocalityData): string {
    return `${locality.name} is a dynamic locality in ${locality.provinceName}, Pakistan, offering diverse business opportunities and services. From professional services to retail outlets, discover what ${locality.name} has to offer.`;
  }

  private getFallbackMetaDescription(locality: LocalityData): string {
    return `Find businesses in ${locality.name}, ${locality.provinceName}. Browse local services, shops, and professionals with reviews and contact details.`;
  }

  private getFallbackPageContent(locality: LocalityData): string {
    return `${locality.name} represents one of ${locality.provinceName}'s vibrant communities where residents and businesses thrive together. This area offers a unique blend of commercial and residential spaces, making it an attractive destination for entrepreneurs and service providers.\n\nWhether you're looking for professional services, retail outlets, or specialty providers, ${locality.name} has options to meet diverse needs. Our directory helps you connect with verified businesses operating in this area, complete with reviews and contact information.`;
  }

  private generateFallbackContent(locality: LocalityData, error: Error): GeneratedLocalityContent {
    return {
      description: this.getFallbackDescription(locality),
      metaTitle: `${locality.name} Businesses | ${locality.provinceName} | PakistanYP`,
      metaDescription: this.getFallbackMetaDescription(locality),
      ogTitle: `${locality.name} - ${locality.provinceName} Business Directory`,
      ogDescription: this.getFallbackDescription(locality),
      pageContent: this.getFallbackPageContent(locality),
      status: 'failed',
      error: error.message
    };
  }
}

export const localityContentGenerator = new LocalityContentGenerator();
