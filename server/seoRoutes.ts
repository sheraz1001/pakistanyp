import type { Express } from "express";
import { seoService, type CategorySEOInput, type ProvinceSEOInput, type LocalitySEOInput } from "./seoService";
import { storage } from "./storage";
import { z } from "zod";

const categoryRequestSchema = z.object({
  categoryId: z.number(),
  level: z.number().min(1).max(3).optional(),
});

const provinceRequestSchema = z.object({
  provinceId: z.number(),
});

const localityRequestSchema = z.object({
  localityId: z.number(),
});

export function registerSEORoutes(app: Express) {
  
  /**
   * Generate dynamic SEO content for category pages
   */
  app.post("/api/seo/category", async (req, res) => {
    try {
      const { categoryId, level = 1 } = categoryRequestSchema.parse(req.body);
      
      // Get category data from storage
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Get provinces data
      const provinces = await storage.getProvinces();
      
      // Get subcategories if applicable
      const subCategories = await storage.getCategoriesByParent(categoryId);
      
      // Get business count for this category
      const businessCount = await storage.getBusinessCountByCategory(categoryId);
      
      // Generate primary and secondary keywords
      const primaryKeyword = `${category.name.toLowerCase()} in Pakistan`;
      const secondaryKeywords = [
        `best ${category.name.toLowerCase()} Karachi`,
        `${category.name.toLowerCase()} Lahore`,
        `${category.name.toLowerCase()} services Pakistan`,
        `top ${category.name.toLowerCase()} companies`
      ];

      // Prepare input for SEO service
      const seoInput: CategorySEOInput = {
        categoryName: category.name,
        primaryKeyword,
        secondaryKeywords,
        level: level as 1 | 2 | 3,
        parentCategory: category.parentId ? (await storage.getCategoryById(category.parentId))?.name : undefined,
        subCategories: subCategories.map(sub => sub.name),
        provinces: provinces.map(e => e.name),
        businessCount,
        relatedCategories: []
      };

      // Generate SEO content
      const seoContent = await seoService.generateCategorySEO(seoInput);
      
      // Update category with SEO content in database
      await storage.updateCategorySEO(categoryId, {
        metaTitle: seoContent.metaTitle,
        metaDescription: seoContent.metaDescription,
        keywords: seoContent.keywords.join(", "),
        schemaMarkup: seoContent.schemaMarkup
      });

      res.json({
        success: true,
        category: category.name,
        seoContent
      });
      
    } catch (error) {
      console.error("Category SEO generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate category SEO content",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Generate dynamic SEO content for province pages
   */
  app.post("/api/seo/province", async (req, res) => {
    try {
      const { provinceId } = provinceRequestSchema.parse(req.body);
      
      // Get province data
      const province = await storage.getProvinceById(provinceId);
      if (!province) {
        return res.status(404).json({ error: "Province not found" });
      }

      // Get localities in this province
      const localities = await storage.getLocalitiesByProvince(provinceId);
      
      // Get top categories with businesses in this province
      const topCategories = await storage.getTopCategoriesForProvince(provinceId);
      
      // Get total business count for this province
      const businessCount = await storage.getBusinessCountByProvince(provinceId);

      // Generate keywords
      const primaryKeyword = `businesses in ${province.name}`;
      const secondaryKeywords = [
        `${province.name} companies`,
        `services in ${province.name}`,
        `${province.name} business directory`,
        `${province.name} local businesses`
      ];

      // Prepare input for SEO service
      const seoInput: ProvinceSEOInput = {
        provinceName: province.name,
        primaryKeyword,
        secondaryKeywords,
        localities: localities.map(l => l.name),
        topCategories: topCategories.map(c => c.name),
        businessCount,
        population: province.population || undefined,
        keyFacts: province.keyFacts as string[] || undefined
      };

      // Generate SEO content
      const seoContent = await seoService.generateProvinceSEO(seoInput);
      
      // Update province with SEO content
      await storage.updateProvinceSEO(provinceId, {
        metaTitle: seoContent.metaTitle,
        metaDescription: seoContent.metaDescription,
        keywords: seoContent.keywords.join(", "),
        schemaMarkup: seoContent.schemaMarkup
      });

      res.json({
        success: true,
        province: province.name,
        seoContent
      });
      
    } catch (error) {
      console.error("Province SEO generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate province SEO content",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Generate dynamic SEO content for locality pages
   */
  app.post("/api/seo/locality", async (req, res) => {
    try {
      const { localityId } = localityRequestSchema.parse(req.body);
      
      // Get locality data
      const locality = await storage.getLocalityById(localityId);
      if (!locality) {
        return res.status(404).json({ error: "Locality not found" });
      }

      // Get province data
      const province = await storage.getProvinceById(locality.provinceId);
      if (!province) {
        return res.status(404).json({ error: "Province not found" });
      }

      // Get nearby localities
      const nearbyLocalities = await storage.getNearbyLocalities(localityId);
      
      // Get top categories with businesses in this locality
      const topCategories = await storage.getTopCategoriesForLocality(localityId);
      
      // Get business count for this locality
      const businessCount = await storage.getBusinessCountByLocality(localityId);

      // Generate keywords
      const primaryKeyword = `businesses in ${locality.name}`;
      const secondaryKeywords = [
        `${locality.name} ${province.name} services`,
        `${locality.name} companies`,
        `local businesses ${locality.name}`,
        `${locality.name} directory`
      ];

      // Prepare input for SEO service
      const seoInput: LocalitySEOInput = {
        localityName: locality.name,
        provinceName: province.name,
        primaryKeyword,
        secondaryKeywords,
        topCategories: topCategories.map(c => c.name),
        businessCount,
        nearbyLocalities: nearbyLocalities.map(l => l.name)
      };

      // Generate SEO content
      const seoContent = await seoService.generateLocalitySEO(seoInput);
      
      // Update locality with SEO content
      await storage.updateLocalitySEO(localityId, {
        metaTitle: seoContent.metaTitle,
        metaDescription: seoContent.metaDescription,
        keywords: seoContent.keywords.join(", "),
        schemaMarkup: seoContent.schemaMarkup
      });

      res.json({
        success: true,
        locality: locality.name,
        province: province.name,
        seoContent
      });
      
    } catch (error) {
      console.error("Locality SEO generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate locality SEO content",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Bulk generate SEO content for all categories
   */
  app.post("/api/seo/bulk-categories", async (req, res) => {
    try {
      const categories = await storage.getCategoriesForSEO();
      const provinces = await storage.getProvinces();
      const results = [];
      
      for (const category of categories) {
        try {
          // Get subcategories
          const subCategories = await storage.getCategoriesByParent(category.id);
          const businessCount = await storage.getBusinessCountByCategory(category.id);
          
          const seoInput: CategorySEOInput = {
            categoryName: category.name,
            primaryKeyword: `${category.name.toLowerCase()} in Pakistan`,
            secondaryKeywords: [
              `best ${category.name.toLowerCase()} Karachi`,
              `${category.name.toLowerCase()} services Pakistan`
            ],
            level: category.level as 1 | 2 | 3 || 1,
            subCategories: subCategories.map(sub => sub.name),
            provinces: provinces.map(e => e.name),
            businessCount
          };

          const seoContent = await seoService.generateCategorySEO(seoInput);
          
          await storage.updateCategorySEO(category.id, {
            metaTitle: seoContent.metaTitle,
            metaDescription: seoContent.metaDescription,
            keywords: seoContent.keywords.join(", "),
            schemaMarkup: seoContent.schemaMarkup
          });

          results.push({
            categoryId: category.id,
            categoryName: category.name,
            success: true
          });
          
        } catch (error) {
          results.push({
            categoryId: category.id,
            categoryName: category.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      res.json({
        success: true,
        message: `Processed ${results.length} categories`,
        results
      });
      
    } catch (error) {
      console.error("Bulk category SEO generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate bulk category SEO content",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * Get SEO content for a specific page type and ID
   */
  app.get("/api/seo/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      let seoData = null;

      switch (type) {
        case 'category':
          seoData = await storage.getCategorySEO(parseInt(id));
          break;
        case 'province':
          seoData = await storage.getProvinceSEO(parseInt(id));
          break;
        case 'locality':
          seoData = await storage.getLocalitySEO(parseInt(id));
          break;
        default:
          return res.status(400).json({ error: "Invalid SEO type" });
      }

      if (!seoData) {
        return res.status(404).json({ error: "SEO data not found" });
      }

      res.json({
        success: true,
        seoData
      });
      
    } catch (error) {
      console.error("Get SEO data error:", error);
      res.status(500).json({ 
        error: "Failed to get SEO data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}