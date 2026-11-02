import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { blogPosts, blogScheduler } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BlogGenerationRequest {
  prompt: string;
  categoryId?: number;
  tags?: string[];
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'informative' | 'engaging';
  wordCount?: number;
  includeImages?: boolean;
}

export interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  readingTime: number;
  seoScore: number;
  featuredImage?: string;
}

export interface SEOAnalysis {
  score: number;
  recommendations: string[];
  keywordDensity: Record<string, number>;
  readabilityScore: number;
}

export interface ContentTrend {
  topic: string;
  relevanceScore: number;
  seasonality: 'high' | 'medium' | 'low';
  suggestedTiming: string;
  relatedKeywords: string[];
}

export interface PKBusinessContext {
  currentEvents: string[];
  seasonalOpportunities: string[];
  industryTrends: string[];
  marketInsights: string[];
}

export interface SmartTopicSuggestion {
  title: string;
  description: string;
  relevanceScore: number;
  category: string;
  keywords: string[];
  estimatedEngagement: 'high' | 'medium' | 'low';
  seasonalTiming?: string;
}

class GeminiService {
  
  async generateBlogPost(request: BlogGenerationRequest): Promise<GeneratedBlog> {
    try {
      const systemPrompt = `You are an expert content writer specializing in Pakistan business directory content. 
      Create high-quality, SEO-optimized blog posts that are engaging and informative.
      
      Content Requirements:
      - Write for Pakistani business directory audience
      - Include relevant Pakistani business insights
      - Optimize for search engines
      - Use ${request.tone || 'professional'} tone
      - Target word count: ${request.wordCount || 1500} words (minimum 1500, maximum 6000)
      - Include actionable insights and tips
      
      Response Format: Return ONLY a valid JSON object with these exact fields:
      {
        "title": "Compelling blog post title",
        "slug": "url-friendly-slug",
        "excerpt": "Brief compelling summary (150-160 chars)",
        "content": "Full HTML formatted blog content with proper headings, paragraphs, and structure",
        "metaTitle": "SEO optimized title (50-60 chars)",
        "metaDescription": "SEO meta description (150-160 chars)",
        "tags": ["array", "of", "relevant", "tags"],
        "readingTime": 5,
        "seoScore": 85
      }`;

      const userPrompt = `Create a blog post about: ${request.prompt}
      
      ${request.categoryId ? `Category context: Business category ID ${request.categoryId}` : ''}
      ${request.tags?.length ? `Suggested tags: ${request.tags.join(', ')}` : ''}
      ${request.targetAudience ? `Target audience: ${request.targetAudience}` : ''}
      
      Make it specific to Pakistan business environment and include practical insights.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              metaTitle: { type: "string" },
              metaDescription: { type: "string" },
              tags: { 
                type: "array",
                items: { type: "string" }
              },
              readingTime: { type: "number" },
              seoScore: { type: "number" }
            },
            required: ["title", "slug", "excerpt", "content", "metaTitle", "metaDescription", "tags", "readingTime", "seoScore"]
          }
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from Gemini");
      }

      const generatedBlog: GeneratedBlog = JSON.parse(rawJson);
      
      // Validate and enhance the response
      generatedBlog.slug = this.generateSlug(generatedBlog.title);
      generatedBlog.readingTime = this.calculateReadingTime(generatedBlog.content);
      
      return generatedBlog;
      
    } catch (error) {
      console.error('Blog generation error:', error);
      throw new Error(`Failed to generate blog post: ${error}`);
    }
  }

  async generateMultipleBlogPosts(requests: BlogGenerationRequest[]): Promise<GeneratedBlog[]> {
    const results: GeneratedBlog[] = [];
    
    for (const request of requests) {
      try {
        const blog = await this.generateBlogPost(request);
        results.push(blog);
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate blog for prompt: ${request.prompt}`, error);
      }
    }
    
    return results;
  }

  async optimizeSEO(content: string, title: string): Promise<SEOAnalysis> {
    try {
      const systemPrompt = `You are an SEO expert. Analyze the provided content and return SEO recommendations.
      
      Analyze for:
      - SEO score (0-100)
      - Specific improvement recommendations
      - Keyword density analysis
      - Readability score
      
      Return ONLY valid JSON with this structure:
      {
        "score": 85,
        "recommendations": ["array of specific SEO improvements"],
        "keywordDensity": {"keyword1": 2.5, "keyword2": 1.8},
        "readabilityScore": 75
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              score: { type: "number" },
              recommendations: {
                type: "array",
                items: { type: "string" }
              },
              keywordDensity: { type: "object" },
              readabilityScore: { type: "number" }
            },
            required: ["score", "recommendations", "keywordDensity", "readabilityScore"]
          }
        },
        contents: `Title: ${title}\n\nContent: ${content}`,
      });

      const analysis: SEOAnalysis = JSON.parse(response.text || '{}');
      return analysis;
      
    } catch (error) {
      console.error('SEO analysis error:', error);
      return {
        score: 50,
        recommendations: ["Unable to analyze SEO at this time"],
        keywordDensity: {},
        readabilityScore: 50
      };
    }
  }

  async generateContentIdeas(topic: string, count: number = 10): Promise<string[]> {
    try {
      const systemPrompt = `Generate creative and engaging blog post ideas for a Pakistani business directory.
      
      Return ONLY a JSON array of strings, each being a blog post title/idea:
      ["Blog post idea 1", "Blog post idea 2", ...]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        },
        contents: `Generate ${count} blog post ideas about: ${topic}. Focus on Pakistani business environment, entrepreneurship, and business growth.`,
      });

      const ideas: string[] = JSON.parse(response.text || '[]');
      return ideas.slice(0, count);
      
    } catch (error) {
      console.error('Content ideas generation error:', error);
      return [`How to ${topic} in Pakistan Business Environment`];
    }
  }

  async discoverTrendingTopics(): Promise<ContentTrend[]> {
    try {
      const systemPrompt = `You are a Pakistani business intelligence analyst. Analyze current trending topics for Pakistani business content.
      
      Consider:
      - Current Pakistani business events and economic news
      - Seasonal business opportunities (Ramadan, summer, National Day, GITEX, Karachi Business Forum)
      - Industry-specific trends in Pakistan market
      - Emerging business sectors and opportunities
      
      Return ONLY a JSON array of trending topics:
      [
        {
          "topic": "Topic title",
          "relevanceScore": 95,
          "seasonality": "high",
          "suggestedTiming": "Optimal posting time description",
          "relatedKeywords": ["keyword1", "keyword2"]
        }
      ]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                relevanceScore: { type: "number" },
                seasonality: { type: "string", enum: ["high", "medium", "low"] },
                suggestedTiming: { type: "string" },
                relatedKeywords: { type: "array", items: { type: "string" } }
              },
              required: ["topic", "relevanceScore", "seasonality", "suggestedTiming", "relatedKeywords"]
            }
          }
        },
        contents: `Analyze current trending topics for Pakistani business content. Consider current date: ${new Date().toLocaleDateString()} and upcoming events.`,
      });

      const trends: ContentTrend[] = JSON.parse(response.text || '[]');
      return trends.slice(0, 10);
      
    } catch (error) {
      console.error('Trending topics discovery error:', error);
      return this.getFallbackTrends();
    }
  }

  async getPKBusinessContext(): Promise<PKBusinessContext> {
    try {
      const systemPrompt = `You are a Pakistani business intelligence expert. Provide current Pakistani business context including:
      - Recent major business events or announcements
      - Seasonal opportunities (consider current month and upcoming events)
      - Key industry trends in Pakistan market
      - Market insights relevant to Pakistan businesses
      
      Return ONLY valid JSON:
      {
        "currentEvents": ["event1", "event2"],
        "seasonalOpportunities": ["opportunity1", "opportunity2"],
        "industryTrends": ["trend1", "trend2"],
        "marketInsights": ["insight1", "insight2"]
      }`;

      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              currentEvents: { type: "array", items: { type: "string" } },
              seasonalOpportunities: { type: "array", items: { type: "string" } },
              industryTrends: { type: "array", items: { type: "string" } },
              marketInsights: { type: "array", items: { type: "string" } }
            },
            required: ["currentEvents", "seasonalOpportunities", "industryTrends", "marketInsights"]
          }
        },
        contents: `Provide Pakistani business context for ${month} ${currentDate.getFullYear()}. Focus on actionable insights for business directory content.`,
      });

      return JSON.parse(response.text || '{}');
      
    } catch (error) {
      console.error('Pakistani business context error:', error);
      return this.getFallbackContext();
    }
  }

  async generateSmartTopics(count: number = 10): Promise<SmartTopicSuggestion[]> {
    try {
      const context = await this.getPKBusinessContext();
      const trends = await this.discoverTrendingTopics();
      
      const systemPrompt = `You are an AI content strategist for a Pakistani business directory. Generate smart, data-driven blog topic suggestions.
      
      Consider:
      - Current Pakistani business context and events
      - Trending topics and seasonal opportunities
      - SEO value and engagement potential
      - Category diversity for balanced content mix
      
      Return ONLY a JSON array:
      [
        {
          "title": "Compelling blog post title",
          "description": "Brief description of what the post will cover",
          "relevanceScore": 95,
          "category": "Business Growth",
          "keywords": ["keyword1", "keyword2"],
          "estimatedEngagement": "high",
          "seasonalTiming": "Best time to publish (optional)"
        }
      ]`;

      const contextPrompt = `Current Pakistani Business Context:
      Events: ${context.currentEvents.join(', ')}
      Seasonal: ${context.seasonalOpportunities.join(', ')}
      Trends: ${context.industryTrends.join(', ')}
      
      Trending Topics: ${trends.map(t => t.topic).join(', ')}
      
      Generate ${count} smart blog topic suggestions that align with current Pakistani business landscape.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                relevanceScore: { type: "number" },
                category: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                estimatedEngagement: { type: "string", enum: ["high", "medium", "low"] },
                seasonalTiming: { type: "string" }
              },
              required: ["title", "description", "relevanceScore", "category", "keywords", "estimatedEngagement"]
            }
          }
        },
        contents: contextPrompt,
      });

      const suggestions: SmartTopicSuggestion[] = JSON.parse(response.text || '[]');
      return suggestions.slice(0, count);
      
    } catch (error) {
      console.error('Smart topics generation error:', error);
      return this.getFallbackTopics();
    }
  }

  async analyzeContentPerformance(postId: number): Promise<{
    qualityScore: number;
    engagementPrediction: number;
    improvements: string[];
    competitorComparison: string;
  }> {
    try {
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!post) {
        throw new Error('Post not found');
      }

      const systemPrompt = `You are a content performance analyst. Analyze this blog post and predict its performance.
      
      Evaluate:
      - Content quality and depth
      - SEO optimization level
      - Engagement potential
      - Areas for improvement
      
      Return ONLY valid JSON:
      {
        "qualityScore": 85,
        "engagementPrediction": 78,
        "improvements": ["specific improvement 1", "specific improvement 2"],
        "competitorComparison": "How this compares to competitor content"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              qualityScore: { type: "number" },
              engagementPrediction: { type: "number" },
              improvements: { type: "array", items: { type: "string" } },
              competitorComparison: { type: "string" }
            },
            required: ["qualityScore", "engagementPrediction", "improvements", "competitorComparison"]
          }
        },
        contents: `Title: ${post.title}\nExcerpt: ${post.excerpt}\nContent: ${post.content.substring(0, 2000)}...`,
      });

      return JSON.parse(response.text || '{}');
      
    } catch (error) {
      console.error('Content performance analysis error:', error);
      return {
        qualityScore: 50,
        engagementPrediction: 50,
        improvements: ["Unable to analyze at this time"],
        competitorComparison: "Analysis unavailable"
      };
    }
  }

  private getFallbackTrends(): ContentTrend[] {
    const month = new Date().getMonth();
    const trends: ContentTrend[] = [
      {
        topic: "Digital Transformation for Pakistani SMEs",
        relevanceScore: 90,
        seasonality: 'high',
        suggestedTiming: "Evergreen content, publish anytime",
        relatedKeywords: ["digital transformation", "Pakistani SME", "business technology"]
      },
      {
        topic: "Registering a Company with the SECP",
        relevanceScore: 88,
        seasonality: 'medium',
        suggestedTiming: "High interest in Q1 and Q3",
        relatedKeywords: ["SECP registration", "company formation", "business setup"]
      }
    ];

    if (month >= 2 && month <= 4) {
      trends.push({
        topic: "Ramadan Marketing Strategies for Pakistani Businesses",
        relevanceScore: 95,
        seasonality: 'high',
        suggestedTiming: "Publish 2-3 weeks before Ramadan",
        relatedKeywords: ["Ramadan marketing", "Pakistani business", "seasonal strategy"]
      });
    }

    return trends;
  }

  private getFallbackContext(): PKBusinessContext {
    return {
      currentEvents: [
        "Pakistani economic diversification initiatives",
        "Growing startup ecosystem in Karachi and Lahore",
        "Expansion of free trade zones"
      ],
      seasonalOpportunities: [
        "Year-end business planning and review",
        "New year business goal setting",
        "Tax planning and compliance updates"
      ],
      industryTrends: [
        "AI and automation adoption in Pakistan businesses",
        "Sustainable business practices growth",
        "E-commerce expansion across provinces"
      ],
      marketInsights: [
        "Strong demand for business consulting services",
        "Increasing focus on digital marketing",
        "Growing interest in business networking events"
      ]
    };
  }

  private getFallbackTopics(): SmartTopicSuggestion[] {
    return [
      {
        title: "Complete Guide to Starting a Business in Pakistan 2025",
        description: "Step-by-step guide covering licenses, registration, and best practices",
        relevanceScore: 92,
        category: "Business Setup",
        keywords: ["Pakistani business setup", "company formation", "trade license"],
        estimatedEngagement: 'high'
      },
      {
        title: "Top 10 Marketing Strategies for Karachi Restaurants",
        description: "Proven marketing tactics specifically for Pakistani F&B industry",
        relevanceScore: 88,
        category: "Marketing",
        keywords: ["restaurant marketing", "Karachi F&B", "digital marketing"],
        estimatedEngagement: 'high'
      },
      {
        title: "How to Get Your Business Verified on PakistanYP Directory",
        description: "Benefits and process of business verification",
        relevanceScore: 85,
        category: "Platform Guide",
        keywords: ["business verification", "PakistanYP", "online presence"],
        estimatedEngagement: 'medium'
      }
    ];
  }

  async runScheduledBlogging(): Promise<void> {
    try {
      // Get all active scheduled blog tasks that are due
      const dueTasks = await db
        .select()
        .from(blogScheduler)
        .where(and(
          eq(blogScheduler.isActive, true),
          lt(blogScheduler.nextRun, new Date())
        ));

      for (const task of dueTasks) {
        try {
          // Generate blog post using the task prompt
          const generatedBlog = await this.generateBlogPost({
            prompt: task.prompt,
            categoryId: task.categoryId || undefined,
            tags: (task.tags as string[]) || [],
            tone: 'professional',
            wordCount: 1500 // Default to 1500 words minimum as requested
          });

          // Save the generated blog post
          const [savedPost] = await db
            .insert(blogPosts)
            .values({
              title: generatedBlog.title,
              slug: generatedBlog.slug,
              excerpt: generatedBlog.excerpt,
              content: generatedBlog.content,
              metaTitle: generatedBlog.metaTitle,
              metaDescription: generatedBlog.metaDescription,
              tags: generatedBlog.tags,
              categoryId: task.categoryId,
              status: 'published',
              isAutoGenerated: true,
              aiPrompt: task.prompt,
              publishedAt: new Date(),
              readingTime: generatedBlog.readingTime,
              seoScore: generatedBlog.seoScore
            })
            .returning();

          // Update scheduler task
          const nextRun = this.calculateNextRun(task.frequency);
          const totalPostsNum = Number(task.totalPosts || 0);
          const successRateNum = Number(task.successRate || 0);
          const newSuccessRate = (((totalPostsNum * (successRateNum / 100) + 1) / (totalPostsNum + 1)) * 100).toFixed(2);
          
          await db
            .update(blogScheduler)
            .set({
              lastRun: new Date(),
              nextRun: nextRun,
              totalPosts: totalPostsNum + 1,
              successRate: newSuccessRate
            })
            .where(eq(blogScheduler.id, task.id));

          console.log(`Generated blog post: ${generatedBlog.title} for task: ${task.name}`);
          
        } catch (error) {
          console.error(`Failed to generate blog for task ${task.name}:`, error);
          
          // Update error rate
          const totalPostsNum = Number(task.totalPosts || 0);
          const successRateNum = Number(task.successRate || 0);
          const newFailureRate = (((totalPostsNum * (successRateNum / 100)) / (totalPostsNum + 1)) * 100).toFixed(2);
          
          await db
            .update(blogScheduler)
            .set({
              lastRun: new Date(),
              nextRun: this.calculateNextRun(task.frequency),
              successRate: newFailureRate
            })
            .where(eq(blogScheduler.id, task.id));
        }
      }
      
    } catch (error) {
      console.error('Scheduled blogging error:', error);
    }
  }

  async enhanceExistingContent(postId: number): Promise<GeneratedBlog | null> {
    try {
      // Get existing post
      const [existingPost] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, postId));

      if (!existingPost) {
        return null;
      }

      const systemPrompt = `You are a content editor. Enhance the existing blog post to improve its quality, SEO, and engagement.
      
      Keep the core message but:
      - Improve readability and flow
      - Enhance SEO optimization
      - Add more value and insights
      - Update for current Pakistani business environment
      
      Return the enhanced version in the same JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        },
        contents: `Original Post:
        Title: ${existingPost.title}
        Content: ${existingPost.content}
        
        Enhance this content while keeping the core message intact.`,
      });

      const enhancedBlog: GeneratedBlog = JSON.parse(response.text || '{}');
      enhancedBlog.readingTime = this.calculateReadingTime(enhancedBlog.content);
      
      return enhancedBlog;
      
    } catch (error) {
      console.error('Content enhancement error:', error);
      return null;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 100);
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

export const geminiService = new GeminiService();

// Auto-blogging scheduler (to be called by cron job or interval)
export async function startAutoBlogging() {
  console.log('Starting auto-blogging scheduler...');
  
  // Run immediately on start
  await geminiService.runScheduledBlogging();
  
  // Set up interval to check every hour
  setInterval(async () => {
    await geminiService.runScheduledBlogging();
  }, 60 * 60 * 1000); // 1 hour
}