import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "not-configured" // optional: app must start without it
});

export interface SEOContent {
  metaTitle: string;
  metaDescription: string;
  h1Heading: string;
  h2Headings: string[];
  h3Headings: string[];
  introContent: string;
  mainContent: string;
  conclusionContent: string;
  internalLinks: Array<{
    text: string;
    url: string;
    description: string;
  }>;
  keywords: string[];
  schemaMarkup?: any;
}

export interface CategorySEOInput {
  categoryName: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  level: 1 | 2 | 3; // Category level (1=main, 2=sub-L1, 3=sub-L2)
  parentCategory?: string;
  subCategories?: string[];
  provinces: string[];
  businessCount: number;
  relatedCategories?: string[];
}

export interface ProvinceSEOInput {
  provinceName: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  localities: string[];
  topCategories: string[];
  businessCount: number;
  population?: number;
  keyFacts?: string[];
}

export interface LocalitySEOInput {
  localityName: string;
  provinceName: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  topCategories: string[];
  businessCount: number;
  nearbyLocalities: string[];
}

export class SEOService {
  
  /**
   * Generate SEO content for category pages
   */
  async generateCategorySEO(input: CategorySEOInput): Promise<SEOContent> {
    const { categoryName, primaryKeyword, secondaryKeywords, level, parentCategory, subCategories, provinces, businessCount } = input;
    
    let prompt = "";
    let titleFormat = "";
    let descriptionFormat = "";
    
    // Define prompts based on category level
    if (level === 1) {
      titleFormat = `${categoryName} in Pakistan | Directory & Reviews | pakistanyp.com`;
      descriptionFormat = `Find the top ${primaryKeyword} across all provinces and territories. Explore local businesses, services, and reviews. Browse detailed listings on pakistanyp.com.`;
      
      prompt = `Create comprehensive SEO content for a top-level category page about "${categoryName}" in Pakistan.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}
Available provinces: ${provinces.join(", ")}
Sub-categories: ${subCategories?.join(", ") || "None"}
Total businesses: ${businessCount}

Content requirements:
- H1: "Explore ${categoryName} in Pakistan"
- H2 headings for browsing by type and province sections
- H3 headings for each province with local examples
- 300-500 words of comprehensive, informative content
- Strategic internal linking to sub-categories and province pages
- Professional, authoritative tone demonstrating expertise
- Focus on user intent (finding local services/businesses)
- Include Pakistani business culture and market insights`;
      
    } else if (level === 2) {
      titleFormat = `${categoryName} in Pakistan | Find & Book Now | pakistanyp.com`;
      descriptionFormat = `Discover the most authentic ${primaryKeyword} across Pakistan. Browse menus, read reviews, and find your next favorite spot.`;
      
      prompt = `Create SEO content for a Level 1 sub-category page about "${categoryName}" under "${parentCategory}" in Pakistan.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}
Parent category: "${parentCategory}"
Sub-categories (Level 2): ${subCategories?.join(", ") || "None"}
Available provinces: ${provinces.join(", ")}
Total businesses: ${businessCount}

Content requirements:
- H1: "Find the Best ${categoryName} in Pakistan"
- H2 headings for browsing by type and location
- H3 headings for each province with specific examples
- 200-400 words of targeted, engaging content
- Links to Level 2 sub-categories and province-specific pages
- Focus on local expertise and authentic recommendations`;
      
    } else {
      titleFormat = `${categoryName} in Pakistan | Delivery & Dining | pakistanyp.com`;
      descriptionFormat = `Find the best ${primaryKeyword} places in Karachi, Lahore, and all provinces and territories. Read reviews and find offers.`;
      
      prompt = `Create SEO content for a Level 2 sub-category page about "${categoryName}" under "${parentCategory}" in Pakistan.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}
Parent category: "${parentCategory}"
Available provinces: ${provinces.join(", ")}
Total businesses: ${businessCount}

Content requirements:
- H1: "Top ${categoryName} Places in Pakistan"
- H2 heading for best options by province
- H3 headings for each province with specific business examples
- 200-300 words of concise, actionable content
- Direct links to local province pages and specific businesses`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert SEO content writer specializing in local business directories in Pakistan. Create engaging, informative content that demonstrates expertise and authority while naturally incorporating keywords. Always respond in JSON format with structured content."
          },
          {
            role: "user",
            content: `${prompt}

Return a JSON object with:
- h1Heading: The main H1 heading
- h2Headings: Array of H2 headings (2-3 headings)
- h3Headings: Array of H3 headings (4-6 headings)
- introContent: Opening paragraph (2-3 sentences)
- mainContent: Main content body (200-400 words)
- conclusionContent: Closing paragraph (1-2 sentences)
- internalLinks: Array of {text, url, description} for strategic internal linking
- keywords: Array of relevant keywords naturally found in content`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiContent = JSON.parse(response.choices[0].message.content || '{}');
      
      // Generate meta title and description with length limits
      const metaTitle = titleFormat.length > 60 
        ? titleFormat.substring(0, 57) + "..."
        : titleFormat;
      
      const metaDescription = descriptionFormat.length > 160
        ? descriptionFormat.substring(0, 157) + "..."
        : descriptionFormat;

      return {
        metaTitle,
        metaDescription,
        h1Heading: aiContent.h1Heading || `Explore ${categoryName} in Pakistan`,
        h2Headings: aiContent.h2Headings || [`Browse by Type`, `${categoryName} in Each Province`],
        h3Headings: aiContent.h3Headings || provinces,
        introContent: aiContent.introContent || `Discover the best ${categoryName.toLowerCase()} options across Pakistan.`,
        mainContent: aiContent.mainContent || `Our comprehensive directory features ${businessCount} ${categoryName.toLowerCase()} businesses across all provinces and territories.`,
        conclusionContent: aiContent.conclusionContent || `Find your perfect ${categoryName.toLowerCase()} match in Pakistan today.`,
        internalLinks: aiContent.internalLinks || [],
        keywords: aiContent.keywords || [primaryKeyword, ...secondaryKeywords],
        schemaMarkup: this.generateCategorySchema(categoryName, provinces, businessCount)
      };
      
    } catch (error) {
      console.error('SEO content generation failed:', error);
      
      // Fallback content if OpenAI fails
      return this.generateFallbackCategorySEO(input);
    }
  }

  /**
   * Generate SEO content for province pages
   */
  async generateProvinceSEO(input: ProvinceSEOInput): Promise<SEOContent> {
    const { provinceName, primaryKeyword, secondaryKeywords, localities, topCategories, businessCount, population, keyFacts } = input;
    
    const titleFormat = `${provinceName} Business Directory | Top Companies & Services | pakistanyp.com`;
    const descriptionFormat = `Discover top-rated businesses and services in ${provinceName}. From restaurants to real estate, find everything you need with our comprehensive local directory.`;
    
    const prompt = `Create comprehensive SEO content for the ${provinceName} province business directory page.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}
Main localities: ${localities.slice(0, 8).join(", ")}
Popular categories: ${topCategories.join(", ")}
Total businesses: ${businessCount}
Population: ${population || 'Not specified'}
Key facts: ${keyFacts?.join(", ") || 'None provided'}

Content requirements:
- H1: "Find Businesses and Services in ${provinceName}"
- H2 headings for popular categories and localities exploration
- H3 headings for top categories and key localities
- 300-500 words showcasing local business expertise
- Internal links to category pages and locality pages
- Include local business culture and economic insights
- Demonstrate authority about ${provinceName}'s business landscape`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Pakistani business directory expert with deep knowledge of local markets, business culture, and economic landscapes across all provinces and territories. Create authoritative, informative content."
          },
          {
            role: "user",
            content: `${prompt}

Return JSON with h1Heading, h2Headings, h3Headings, introContent, mainContent, conclusionContent, internalLinks, and keywords.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiContent = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        metaTitle: titleFormat.length > 60 ? titleFormat.substring(0, 57) + "..." : titleFormat,
        metaDescription: descriptionFormat.length > 160 ? descriptionFormat.substring(0, 157) + "..." : descriptionFormat,
        h1Heading: aiContent.h1Heading || `Find Businesses and Services in ${provinceName}`,
        h2Headings: aiContent.h2Headings || [`Popular Categories in ${provinceName}`, `Explore ${provinceName}'s Localities`],
        h3Headings: aiContent.h3Headings || [...topCategories.slice(0, 3), ...localities.slice(0, 3)],
        introContent: aiContent.introContent || `Welcome to ${provinceName}'s comprehensive business directory.`,
        mainContent: aiContent.mainContent || `${provinceName} hosts ${businessCount} diverse businesses across ${localities.length} localities.`,
        conclusionContent: aiContent.conclusionContent || `Discover the best of ${provinceName}'s business community today.`,
        internalLinks: aiContent.internalLinks || [],
        keywords: aiContent.keywords || [primaryKeyword, ...secondaryKeywords],
        schemaMarkup: this.generateProvinceSchema(provinceName, localities, businessCount)
      };
      
    } catch (error) {
      console.error('Province SEO content generation failed:', error);
      return this.generateFallbackProvinceSEO(input);
    }
  }

  /**
   * Generate SEO content for locality pages
   */
  async generateLocalitySEO(input: LocalitySEOInput): Promise<SEOContent> {
    const { localityName, provinceName, primaryKeyword, secondaryKeywords, topCategories, businessCount, nearbyLocalities } = input;
    
    const titleFormat = `${localityName}, ${provinceName} Business Directory | Companies & Services | pakistanyp.com`;
    const descriptionFormat = `Find top-rated businesses and services in ${localityName}, ${provinceName}. From local cafes to professional services, our directory connects you with the best.`;
    
    const prompt = `Create targeted SEO content for ${localityName} locality in ${provinceName}, Pakistan.

Primary keyword: "${primaryKeyword}"
Secondary keywords: ${secondaryKeywords.join(", ")}
Top categories: ${topCategories.join(", ")}
Total businesses: ${businessCount}
Nearby localities: ${nearbyLocalities.join(", ")}

Content requirements:
- H1: "Businesses & Services in ${localityName}, ${provinceName}"
- H2 headings for popular categories and nearby areas
- H3 headings for specific categories and examples
- 200-400 words of location-specific content
- Links to category pages and nearby localities
- Local neighborhood insights and business landscape`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Pakistani local business expert with detailed knowledge of neighborhoods, localities, and community business ecosystems across all provinces."
          },
          {
            role: "user", 
            content: `${prompt}

Return JSON with h1Heading, h2Headings, h3Headings, introContent, mainContent, conclusionContent, internalLinks, and keywords.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1200
      });

      const aiContent = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        metaTitle: titleFormat.length > 60 ? titleFormat.substring(0, 57) + "..." : titleFormat,
        metaDescription: descriptionFormat.length > 160 ? descriptionFormat.substring(0, 157) + "..." : descriptionFormat,
        h1Heading: aiContent.h1Heading || `Businesses & Services in ${localityName}, ${provinceName}`,
        h2Headings: aiContent.h2Headings || [`Popular Categories in ${localityName}`, `More Localities in ${provinceName}`],
        h3Headings: aiContent.h3Headings || topCategories.slice(0, 4),
        introContent: aiContent.introContent || `Discover local businesses and services in ${localityName}, ${provinceName}.`,
        mainContent: aiContent.mainContent || `${localityName} features ${businessCount} businesses across ${topCategories.length} main categories.`,
        conclusionContent: aiContent.conclusionContent || `Connect with the best businesses in ${localityName} today.`,
        internalLinks: aiContent.internalLinks || [],
        keywords: aiContent.keywords || [primaryKeyword, ...secondaryKeywords],
        schemaMarkup: this.generateLocalitySchema(localityName, provinceName, businessCount)
      };
      
    } catch (error) {
      console.error('Locality SEO content generation failed:', error);
      return this.generateFallbackLocalitySEO(input);
    }
  }

  /**
   * Generate fallback category content when OpenAI fails
   */
  private generateFallbackCategorySEO(input: CategorySEOInput): SEOContent {
    const { categoryName, primaryKeyword, secondaryKeywords, provinces, businessCount } = input;
    
    return {
      metaTitle: `${categoryName} in Pakistan | Directory & Reviews | pakistanyp.com`,
      metaDescription: `Find the top ${primaryKeyword} across all provinces and territories. Explore local businesses, services, and reviews on pakistanyp.com.`,
      h1Heading: `Explore ${categoryName} in Pakistan`,
      h2Headings: [`Browse by Type`, `${categoryName} in Each Province`],
      h3Headings: provinces,
      introContent: `Discover comprehensive ${categoryName.toLowerCase()} options across Pakistan with our extensive business directory.`,
      mainContent: `Our platform features ${businessCount} verified ${categoryName.toLowerCase()} businesses across all provinces and territories. Whether you're looking for premium services in Karachi, traditional options in Lahore, or local favorites in the Northern Provinces, we connect you with the right businesses. Each listing includes verified contact information, customer reviews, and detailed service descriptions to help you make informed decisions.`,
      conclusionContent: `Start exploring ${categoryName.toLowerCase()} options in your preferred province today.`,
      internalLinks: provinces.map(province => ({
        text: `${categoryName} in ${province}`,
        url: `/localities/${province.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Find ${categoryName.toLowerCase()} businesses in ${province}`
      })),
      keywords: [primaryKeyword, ...secondaryKeywords],
      schemaMarkup: this.generateCategorySchema(categoryName, provinces, businessCount)
    };
  }

  /**
   * Generate fallback province content when OpenAI fails
   */
  private generateFallbackProvinceSEO(input: ProvinceSEOInput): SEOContent {
    const { provinceName, primaryKeyword, localities, topCategories, businessCount } = input;
    
    return {
      metaTitle: `${provinceName} Business Directory | Top Companies & Services | pakistanyp.com`,
      metaDescription: `Discover top-rated businesses and services in ${provinceName}. From restaurants to real estate, find everything you need with our comprehensive local directory.`,
      h1Heading: `Find Businesses and Services in ${provinceName}`,
      h2Headings: [`Popular Categories in ${provinceName}`, `Explore ${provinceName}'s Localities`],
      h3Headings: [...topCategories.slice(0, 3), ...localities.slice(0, 3)],
      introContent: `${provinceName} is home to a diverse business ecosystem with ${businessCount} companies across multiple sectors.`,
      mainContent: `From bustling commercial districts to local neighborhood services, ${provinceName} offers comprehensive business solutions. Our directory covers ${localities.length} localities, featuring everything from traditional markets to modern commercial centers. Whether you need professional services, dining options, or retail solutions, ${provinceName}'s business community has you covered with quality services and competitive pricing.`,
      conclusionContent: `Explore ${provinceName}'s business opportunities and find your next trusted service provider.`,
      internalLinks: topCategories.slice(0, 5).map(category => ({
        text: category,
        url: `/categories/${category.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Find ${category.toLowerCase()} in ${provinceName}`
      })),
      keywords: [primaryKeyword, `businesses in ${provinceName}`, `services ${provinceName}`],
      schemaMarkup: this.generateProvinceSchema(provinceName, localities, businessCount)
    };
  }

  /**
   * Generate fallback locality content when OpenAI fails
   */
  private generateFallbackLocalitySEO(input: LocalitySEOInput): SEOContent {
    const { localityName, provinceName, primaryKeyword, topCategories, businessCount, nearbyLocalities } = input;
    
    return {
      metaTitle: `${localityName}, ${provinceName} Business Directory | pakistanyp.com`,
      metaDescription: `Find top-rated businesses and services in ${localityName}, ${provinceName}. Our directory connects you with local companies and service providers.`,
      h1Heading: `Businesses & Services in ${localityName}, ${provinceName}`,
      h2Headings: [`Popular Categories in ${localityName}`, `More Localities in ${provinceName}`],
      h3Headings: topCategories.slice(0, 4),
      introContent: `${localityName} is a vibrant area in ${provinceName} with ${businessCount} local businesses serving the community.`,
      mainContent: `This locality offers diverse business options across ${topCategories.length} main categories. From essential services to specialized providers, ${localityName} maintains a strong local business ecosystem. Residents and visitors can easily access quality services while supporting the local economy.`,
      conclusionContent: `Discover trusted businesses in ${localityName} and connect with your local community.`,
      internalLinks: nearbyLocalities.slice(0, 4).map(locality => ({
        text: `${locality}, ${provinceName}`,
        url: `/localities/${provinceName.toLowerCase().replace(/\s+/g, '-')}/${locality.toLowerCase().replace(/\s+/g, '-')}`,
        description: `Explore businesses in ${locality}`
      })),
      keywords: [primaryKeyword, `businesses in ${localityName}`, `${localityName} services`],
      schemaMarkup: this.generateLocalitySchema(localityName, provinceName, businessCount)
    };
  }

  /**
   * Generate schema markup for category pages
   */
  private generateCategorySchema(categoryName: string, provinces: string[], businessCount: number) {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${categoryName} in Pakistan`,
      "description": `Directory of ${categoryName.toLowerCase()} businesses across Pakistan`,
      "url": `https://pakistanyp.com/categories/${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": businessCount,
        "itemListElement": provinces.map((province, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": `${categoryName} in ${province}`,
          "url": `https://pakistanyp.com/localities/${province.toLowerCase().replace(/\s+/g, '-')}`
        }))
      }
    };
  }

  /**
   * Generate schema markup for province pages
   */
  private generateProvinceSchema(provinceName: string, localities: string[], businessCount: number) {
    return {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": provinceName,
      "description": `Business directory for ${provinceName}, Pakistan`,
      "url": `https://pakistanyp.com/localities/${provinceName.toLowerCase().replace(/\s+/g, '-')}`,
      "containsPlace": localities.slice(0, 10).map(locality => ({
        "@type": "Place",
        "name": locality,
        "containedInPlace": {
          "@type": "Place",
          "name": provinceName
        }
      }))
    };
  }

  /**
   * Generate schema markup for locality pages
   */
  private generateLocalitySchema(localityName: string, provinceName: string, businessCount: number) {
    return {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": localityName,
      "description": `Local business directory for ${localityName}, ${provinceName}`,
      "url": `https://pakistanyp.com/localities/${provinceName.toLowerCase().replace(/\s+/g, '-')}/${localityName.toLowerCase().replace(/\s+/g, '-')}`,
      "containedInPlace": {
        "@type": "Place",
        "name": provinceName,
        "addressCountry": "AE"
      }
    };
  }
}

export const seoService = new SEOService();