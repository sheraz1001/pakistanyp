import OpenAI from 'openai';

// Prompt templates and configuration
const PROMPT_CONFIG = {
  style: 'professional and corporate',
  tone: 'confident, trustworthy, and informative',
  lengths: {
    description: { min: 650, max: 800, target: 725 },
    metaDescription: { min: 150, max: 160, target: 155 },
    socialPreview: { min: 200, max: 250, target: 225 },
    tagline: { min: 50, max: 100, target: 75 }
  },
  version: '1.0.0' // For tracking prompt versions
};

interface BusinessData {
  name: string;
  category: string;
  province: string;
  locality: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  specialties?: string[];
  description?: string;
}

interface GeneratedContent {
  description: string;
  metaDescription: string;
  socialPreview: string;
  tagline: string;
  status: 'success' | 'partial' | 'failed' | 'fallback';
  error?: string;
}

/**
 * Generates professional AI content for a business listing
 * Uses OpenAI GPT-4o for high-quality, unique content generation
 */
export class AIContentGenerator {
  private openai: OpenAI;
  private maxRetries = 3;
  private retryDelay = 1000; // milliseconds

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Main function: Generates all 4 types of content in a single OpenAI call
   * for tone consistency and token efficiency
   */
  async generateBusinessContent(businessData: BusinessData): Promise<GeneratedContent> {
    try {
      console.log(`🤖 Generating AI content for: ${businessData.name}`);
      
      // Build the prompt with business context
      const prompt = this.buildPrompt(businessData);
      
      // Call OpenAI with retry logic
      const response = await this.callOpenAIWithRetry(prompt);
      
      // Parse and validate the response
      const content = this.parseAndValidate(response, businessData);
      
      console.log(`✅ AI content generated successfully for: ${businessData.name}`);
      return content;
      
    } catch (error) {
      console.error(`❌ AI content generation failed for ${businessData.name}:`, error);
      
      // Fallback to deterministic content
      return this.generateFallbackContent(businessData, error as Error);
    }
  }

  /**
   * Builds a structured prompt for OpenAI
   */
  private buildPrompt(business: BusinessData): string {
    const servicesText = business.services?.length 
      ? `\nServices: ${business.services.join(', ')}`
      : '';
    
    const specialtiesText = business.specialties?.length
      ? `\nSpecialties: ${business.specialties.join(', ')}`
      : '';

    return `You are a professional business content writer for Pakistan businesses. Generate unique, compelling, SEO-optimized content for the following business listing.

Business Information:
- Name: ${business.name}
- Category: ${business.category}
- Location: ${business.locality}, ${business.province}, Pakistan
- Phone: ${business.phone || 'N/A'}
- Email: ${business.email || 'N/A'}
- Website: ${business.website || 'N/A'}${servicesText}${specialtiesText}

Content Requirements:
1. **Description (${PROMPT_CONFIG.lengths.description.min}-${PROMPT_CONFIG.lengths.description.max} characters)**:
   - Write a ${PROMPT_CONFIG.style} "About" section
   - Structure: Opening hook → Main services/offerings → Value proposition → Call to action
   - Include 2-3 short paragraphs (NOT one long paragraph)
   - Naturally mention location, category, and key services
   - End with contact information if available
   - Tone: ${PROMPT_CONFIG.tone}

2. **Meta Description (${PROMPT_CONFIG.lengths.metaDescription.min}-${PROMPT_CONFIG.lengths.metaDescription.max} characters)**:
   - SEO-focused summary for search engines
   - Include: business name, key service, location
   - Must be engaging and click-worthy
   - Single paragraph, no line breaks

3. **Social Media Preview (${PROMPT_CONFIG.lengths.socialPreview.min}-${PROMPT_CONFIG.lengths.socialPreview.max} characters)**:
   - Engaging text for social media sharing
   - More conversational than meta description
   - Highlight unique selling points
   - Single paragraph, shareable tone

4. **Tagline (${PROMPT_CONFIG.lengths.tagline.min}-${PROMPT_CONFIG.lengths.tagline.max} characters)**:
   - Catchy, memorable one-liner
   - Summarize the business essence
   - Professional but creative

Return ONLY a valid JSON object with these exact keys:
{
  "description": "...",
  "metaDescription": "...",
  "socialPreview": "...",
  "tagline": "..."
}

Important Rules:
- Write completely unique content, not generic templates
- DO NOT use placeholder text or brackets like [business name]
- Use actual business name and location throughout
- Keep within character limits
- NO markdown formatting in the JSON values
- Return ONLY the JSON object, no other text`;
  }

  /**
   * Calls OpenAI API with exponential backoff retry logic
   */
  private async callOpenAIWithRetry(prompt: string, attempt = 1): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business content writer specializing in Pakistan businesses. You create professional, SEO-optimized, unique content that converts visitors into customers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' } // Ensures valid JSON response
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      return response;

    } catch (error: any) {
      console.error(`OpenAI API error (attempt ${attempt}/${this.maxRetries}):`, error.message);

      // Retry on transient errors
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.callOpenAIWithRetry(prompt, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Checks if an error is retryable (network issues, rate limits, etc.)
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'rate_limit_exceeded'];
    return retryableCodes.some(code => 
      error.code === code || 
      error.message?.includes(code) ||
      error.status === 429 || // Rate limit
      error.status === 500 || // Server error
      error.status === 503    // Service unavailable
    );
  }

  /**
   * Parses OpenAI response and validates content lengths
   */
  private parseAndValidate(response: string, business: BusinessData): GeneratedContent {
    try {
      const parsed = JSON.parse(response);
      
      // Validate all required fields exist
      const requiredFields = ['description', 'metaDescription', 'socialPreview', 'tagline'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        console.warn(`⚠️ Missing fields in AI response: ${missingFields.join(', ')}`);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate lengths and trim if necessary
      const validated: GeneratedContent = {
        description: this.validateAndTrim(parsed.description, 'description', business),
        metaDescription: this.validateAndTrim(parsed.metaDescription, 'metaDescription', business),
        socialPreview: this.validateAndTrim(parsed.socialPreview, 'socialPreview', business),
        tagline: this.validateAndTrim(parsed.tagline, 'tagline', business),
        status: 'success'
      };

      // Log warnings if content was trimmed
      if (parsed.description.length > PROMPT_CONFIG.lengths.description.max) {
        console.warn(`⚠️ Description was trimmed for ${business.name}`);
      }

      return validated;

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error(`Invalid AI response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates content length and trims if necessary
   */
  private validateAndTrim(
    content: string, 
    type: keyof typeof PROMPT_CONFIG.lengths,
    business: BusinessData
  ): string {
    const config = PROMPT_CONFIG.lengths[type];
    const trimmed = content.trim();

    // If content is too short, add fallback
    if (trimmed.length < config.min) {
      console.warn(`⚠️ ${type} too short (${trimmed.length} chars), using fallback`);
      return this.getFallbackText(type, business);
    }

    // If content is too long, trim intelligently
    if (trimmed.length > config.max) {
      // Try to trim at sentence boundary
      const sentences = trimmed.split('. ');
      let result = '';
      for (const sentence of sentences) {
        if ((result + sentence).length <= config.max - 3) {
          result += (result ? '. ' : '') + sentence;
        } else {
          break;
        }
      }
      return result + (result.endsWith('.') ? '' : '...');
    }

    return trimmed;
  }

  /**
   * Generates fallback content when AI fails
   * Uses deterministic templates to ensure import never breaks
   */
  private generateFallbackContent(business: BusinessData, error: Error): GeneratedContent {
    console.log(`📝 Using fallback content for: ${business.name}`);

    return {
      description: this.getFallbackText('description', business),
      metaDescription: this.getFallbackText('metaDescription', business),
      socialPreview: this.getFallbackText('socialPreview', business),
      tagline: this.getFallbackText('tagline', business),
      status: 'fallback',
      error: error.message
    };
  }

  /**
   * Gets fallback text for a specific content type
   */
  private getFallbackText(type: keyof typeof PROMPT_CONFIG.lengths, business: BusinessData): string {
    const templates = {
      description: `${business.name} is a trusted ${business.category.toLowerCase()} provider based in ${business.locality}, ${business.province}, Pakistan. We are committed to delivering exceptional service and solutions tailored to meet our clients' unique needs.\n\nOur team brings extensive industry expertise and local market knowledge to every project. Whether you're seeking ${business.category.toLowerCase()} services or expert consultation, we provide reliable, professional solutions you can count on.\n\nLocated in the heart of ${business.locality}, we serve clients across ${business.province} and throughout Pakistan. ${business.phone ? `Contact us at ${business.phone}` : 'Contact us today'} to learn how we can help your business succeed.`,
      
      metaDescription: `${business.name} - Professional ${business.category.toLowerCase()} services in ${business.locality}, ${business.province}, Pakistan. Trusted expertise and quality service. Contact us today.`,
      
      socialPreview: `Discover ${business.name} in ${business.locality}, ${business.province}. Your trusted partner for ${business.category.toLowerCase()} services across Pakistan. Professional, reliable, and committed to your success.`,
      
      tagline: `${business.category} Excellence in ${business.province}, Pakistan`
    };

    return templates[type];
  }

  /**
   * Utility: Sleep function for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper method: Generate only description (for future use if needed)
   */
  async generateDescriptionOnly(business: BusinessData): Promise<string> {
    const fullContent = await this.generateBusinessContent(business);
    return fullContent.description;
  }
}

// Singleton instance
let generatorInstance: AIContentGenerator | null = null;

/**
 * Gets or creates the AI Content Generator instance
 */
export function getAIContentGenerator(): AIContentGenerator {
  if (!generatorInstance) {
    generatorInstance = new AIContentGenerator();
  }
  return generatorInstance;
}

/**
 * Convenience function: Generate content for a business
 */
export async function generateBusinessContent(business: BusinessData): Promise<GeneratedContent> {
  const generator = getAIContentGenerator();
  return generator.generateBusinessContent(business);
}
