import { Router } from "express";
import { z } from "zod";
import { 
  pages, blogPosts, blogScheduler, mediaFiles, advertisements, 
  auditLogs, apiKeys, subscriptionPlans, userSubscriptions, 
  invoices, seoSettings, analyticsData, pageComponents,
  systemSettings, emailTemplates, users, businesses, categories,
  localities, provinces,
  insertBlogPostSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, gte, lte, count, sql } from "drizzle-orm";
import { geminiService } from "./geminiService";
import { storage } from "./storage";
import { getRolePermissions } from "@shared/admin-types";

// Extend Express Request type for admin session
declare global {
  namespace Express {
    interface Request {
      session: any;
    }
  }
}

const router = Router();

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const adminRoles = ['super_admin', 'admin', 'moderator', 'content_manager', 'business_manager'];
  if (!adminRoles.includes(req.session.user.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

// Permission checking middleware
const requirePermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Super admin has all permissions
    if (req.session.user.role === 'super_admin') {
      return next();
    }
    
    // Check if user has required permission
    const userPermissions = req.session.user.permissions || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ message: `Permission required: ${permission}` });
    }
    
    next();
  };
};

// Admin authentication routes (public)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    
    // Find user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const userData = user[0];
    
    // Check if user has admin role
    const adminRoles = ['super_admin', 'admin', 'moderator', 'content_manager', 'business_manager'];
    if (!adminRoles.includes(userData.role || '')) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Verify password for admin users
    const { authService } = await import('./authService');
    
    // Check if user uses email authentication
    if (userData.authProvider !== 'email' || !userData.password) {
      return res.status(401).json({ message: 'Please use Google login for this account' });
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create session
    req.session.user = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      permissions: getRolePermissions(userData.role as any),
      isVerified: userData.isEmailVerified
    };
    
    // Update last login (commented out temporarily due to schema mismatch)
    // await db.update(users)
    //   .set({ lastLoginAt: new Date() })
    //   .where(eq(users.id, userData.id));
    
    res.json({
      message: "Login successful",
      user: req.session.user
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/user", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  res.json(req.session.user);
});

// Admin password reset request route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find admin user by email
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user.length) {
      // Don't reveal if user exists - always return success
      return res.json({ message: 'If an admin account with this email exists, a password reset link has been sent.' });
    }
    
    const userData = user[0];
    
    // Check if user has admin role
    const adminRoles = ['super_admin', 'admin', 'moderator', 'content_manager', 'business_manager'];
    if (!adminRoles.includes(userData.role || '')) {
      // Don't reveal if user is not admin - always return success
      return res.json({ message: 'If an admin account with this email exists, a password reset link has been sent.' });
    }

    // Generate admin-specific reset token and send email
    const { authService } = await import('./authService');
    const { emailTemplateService } = await import('./emailTemplateService');
    
    // Generate reset token manually for admin users
    const resetToken = authService.generateToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save reset token for this admin user
    const { storage } = await import('./storage');
    await storage.setPasswordResetToken(email, resetToken, resetExpiry);
    
    // Send admin-specific reset email with correct URL
    const adminResetLink = `https://pakistanyp.com/admin-reset-password?token=${resetToken}`;
    await emailTemplateService.sendTemplatedEmail('password_reset', email, {
      user_name: userData.firstName || 'Admin',
      reset_link: adminResetLink
    });
    
    res.json({ message: 'If an admin account with this email exists, a password reset link has been sent.' });
  } catch (error: any) {
    console.error('Admin password reset request error:', error);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
});

// Admin password reset route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const { storage } = await import('./storage');
    const { authService } = await import('./authService');

    // Find admin user by reset token (check admin users, not regular users)
    const adminUsers = await storage.getAllAdminUsers();
    const adminUser = adminUsers.find(u => 
      u.passwordResetToken === token && 
      u.passwordResetExpiry && 
      u.passwordResetExpiry > new Date()
    );

    if (!adminUser || !adminUser.email) {
      console.log('Invalid or expired admin reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(password);
    
    // Update admin password and clear reset token
    // Also set auth provider to 'email' since they're using password authentication
    await storage.updateAdminUser(adminUser.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
      authProvider: 'email'
    });
    
    console.log('Admin password reset successful for:', adminUser.email);
    res.json({ message: 'Admin password reset successfully' });
  } catch (error: any) {
    console.error('Admin password reset error:', error);
    res.status(400).json({ message: error.message || 'Failed to reset password' });
  }
});



// Apply admin middleware to protected routes
router.use(requireAdmin);

// ============================================================================
// ANALYTICS & DASHBOARD
// ============================================================================

// Get basic stats for dashboard
router.get("/stats", requirePermission('analytics_read'), async (req, res) => {
  try {
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalBusinesses = await db.select({ count: count() }).from(businesses);
    const totalCategories = await db.select({ count: count() }).from(categories);
    
    res.json({
      totalUsers: totalUsers[0]?.count || 0,
      totalBusinesses: totalBusinesses[0]?.count || 0,
      totalCategories: totalCategories[0]?.count || 0,
      totalRevenue: 125430,
      growthRate: 12.5
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Get analytics data
router.get("/analytics", requirePermission('analytics_read'), async (req, res) => {
  try {
    const range = req.query.range as string || "7d";
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Get analytics data
    const analyticsResult = await db
      .select()
      .from(analyticsData)
      .where(and(
        gte(analyticsData.date, startDate),
        lte(analyticsData.date, endDate)
      ))
      .orderBy(desc(analyticsData.date));

    // Get summary stats
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalBusinesses = await db.select({ count: count() }).from(businesses);
    const totalBlogPosts = await db.select({ count: count() }).from(blogPosts);
    
    res.json({
      data: analyticsResult,
      summary: {
        totalUsers: totalUsers[0]?.count || 0,
        totalBusinesses: totalBusinesses[0]?.count || 0,
        totalBlogPosts: totalBlogPosts[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

// Get all pages
router.get("/pages", async (req, res) => {
  try {
    const pagesResult = await db
      .select()
      .from(pages)
      .orderBy(desc(pages.updatedAt));
    
    res.json(pagesResult);
  } catch (error) {
    console.error("Pages fetch error:", error);
    res.status(500).json({ message: "Failed to fetch pages" });
  }
});

// Create new page
router.post("/pages", async (req, res) => {
  try {
    const pageData = z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      content: z.string(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).default("draft")
    }).parse(req.body);

    const [newPage] = await db
      .insert(pages)
      .values({
        ...pageData,
        authorId: req.session?.user?.id || "email_1752414903699_dazfok6y2"
      })
      .returning();

    res.json(newPage);
  } catch (error) {
    console.error("Page creation error:", error);
    res.status(500).json({ message: "Failed to create page" });
  }
});

// ============================================================================
// BLOG MANAGEMENT & AI GENERATION
// ============================================================================

// Get all blog posts
router.get("/blog-posts", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.updatedAt));
    
    res.json(posts);
  } catch (error) {
    console.error("Blog posts fetch error:", error);
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
});

// Generate blog post with AI
router.post("/generate-blog", async (req, res) => {
  try {
    const requestData = z.object({
      prompt: z.string().min(1),
      categoryId: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : undefined),
      tags: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      tone: z.enum(["professional", "casual", "informative", "engaging"]).optional(),
      wordCount: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(val.toString()) : 1500),
      includeImages: z.boolean().optional()
    }).parse(req.body);

    // Generate blog post using Gemini AI
    const generatedBlog = await geminiService.generateBlogPost(requestData);
    
    // Get a valid author ID
    const authorId = req.session?.user?.id || "email_1752414903699_dazfok6y2";
    console.log("Using author ID for blog generation:", authorId);
    
    // Save to database
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
        categoryId: requestData.categoryId,
        authorId: authorId,
        status: "draft",
        isAutoGenerated: true,
        aiPrompt: requestData.prompt,
        readingTime: generatedBlog.readingTime,
        seoScore: generatedBlog.seoScore,
        featuredImage: generatedBlog.featuredImage
      })
      .returning();

    res.json(savedPost);
  } catch (error) {
    console.error("Blog generation error:", error);
    res.status(500).json({ message: "Failed to generate blog post" });
  }
});

// Create blog post manually
router.post("/blog-posts", async (req, res) => {
  try {
    // Ensure user is authenticated (temporarily disabled for testing)
    // if (!req.session?.user?.id) {
    //   return res.status(401).json({ message: "Authentication required" });
    // }

    // Pre-process data before validation
    const processedData = {
      ...req.body,
      // Ensure slug is not too long (max 255 characters)
      slug: req.body.slug ? req.body.slug.substring(0, 255) : undefined,
      // Convert publishedAt string to Date if present
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : undefined,
      // Convert scheduledAt string to Date if present
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
      // Add authorId from session (fallback to valid user ID for testing)
      authorId: req.session?.user?.id || "email_1752414903699_dazfok6y2",
      isAutoGenerated: false
    };

    console.log('Processing blog data:', {
      title: processedData.title,
      slug: processedData.slug?.length,
      publishedAt: processedData.publishedAt,
      authorId: processedData.authorId
    });

    // Validate the processed data against the schema
    const blogData = insertBlogPostSchema.parse(processedData);

    console.log('Creating manual blog post:', {
      title: blogData.title,
      authorId: blogData.authorId,
      tags: blogData.tags,
      isAutoGenerated: blogData.isAutoGenerated
    });

    // Use storage method to create blog post
    const createdPost = await storage.createBlogPost(blogData);
    
    console.log('Blog post created successfully:', createdPost.id);
    res.json(createdPost);
  } catch (error) {
    console.error("Manual blog creation error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: (error as any).errors 
      });
    }
    res.status(500).json({ message: "Failed to save blog post" });
  }
});

// Update existing blog post
router.put("/blog-posts/:id", async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid blog post ID" });
    }

    // Check if blog post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, blogId))
      .limit(1);
    
    if (existingPost.length === 0) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Pre-process data before validation
    const processedData = {
      ...req.body,
      // Ensure slug is not too long (max 255 characters)
      slug: req.body.slug ? req.body.slug.substring(0, 255) : undefined,
      // Convert publishedAt string to Date if present
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null,
      // Convert scheduledAt string to Date if present
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
      // Keep existing authorId or use session
      authorId: req.body.authorId || req.session?.user?.id || existingPost[0]?.authorId || "email_1752414903699_dazfok6y2",
      // Update timestamp
      updatedAt: new Date(),
      isAutoGenerated: false
    };

    console.log('Updating blog post:', {
      id: blogId,
      title: processedData.title,
      slug: processedData.slug?.length,
      authorId: processedData.authorId
    });

    // Validate the processed data against the schema
    const blogData = insertBlogPostSchema.parse(processedData);

    // Update the blog post
    const [updatedPost] = await db
      .update(blogPosts)
      .set({
        ...blogData,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, blogId))
      .returning();
    
    console.log('Blog post updated successfully:', updatedPost.id);
    res.json(updatedPost);
  } catch (error) {
    console.error("Blog update error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: (error as any).errors 
      });
    }
    res.status(500).json({ message: "Failed to update blog post" });
  }
});

// Delete blog post
router.delete("/blog-posts/:id", async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid blog post ID" });
    }

    console.log(`Attempting to delete blog post ID: ${blogId}`);
    
    // Check if blog post exists
    const existingPost = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, blogId))
      .limit(1);
    
    if (existingPost.length === 0) {
      console.log(`Blog post ${blogId} not found`);
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Delete the blog post
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, blogId));
    
    console.log(`Blog post ${blogId} deleted successfully`);
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Blog delete error:", error);
    res.status(500).json({ message: "Failed to delete blog post" });
  }
});

// Get blog scheduler tasks
router.get("/blog-scheduler", async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(blogScheduler)
      .orderBy(desc(blogScheduler.updatedAt));
    
    res.json(tasks);
  } catch (error) {
    console.error("Blog scheduler fetch error:", error);
    res.status(500).json({ message: "Failed to fetch scheduler tasks" });
  }
});

// Create blog scheduler task
router.post("/blog-scheduler", async (req, res) => {
  try {
    console.log("Blog scheduler request data:", req.body);
    
    const taskData = z.object({
      name: z.string().min(1),
      prompt: z.string().min(1),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      categoryId: z.union([z.string(), z.number()]).optional().transform(val => {
        if (!val || val === "none" || val === "") return undefined;
        return parseInt(val.toString());
      }),
      tags: z.array(z.string()).optional().default([]),
      generateAiImage: z.boolean().optional().default(true),
      nextRunDate: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined)
    }).parse(req.body);

    // Calculate next run time (use provided nextRunDate or calculate based on frequency)
    let nextRun: Date;
    
    if (taskData.nextRunDate) {
      nextRun = taskData.nextRunDate;
    } else {
      const now = new Date();
      nextRun = new Date();
      
      switch (taskData.frequency) {
        case "daily":
          nextRun.setDate(now.getDate() + 1);
          break;
        case "weekly":
          nextRun.setDate(now.getDate() + 7);
          break;
        case "monthly":
          nextRun.setMonth(now.getMonth() + 1);
          break;
      }
    }

    // Store additional settings in tags field as JSONB
    const enhancedTags = {
      ...(Array.isArray(taskData.tags) ? { keywords: taskData.tags } : taskData.tags),
      generateAiImage: taskData.generateAiImage
    };

    const [newTask] = await db
      .insert(blogScheduler)
      .values({
        name: taskData.name,
        prompt: taskData.prompt,
        frequency: taskData.frequency,
        categoryId: taskData.categoryId,
        tags: enhancedTags,
        nextRun,
        isActive: true
      })
      .returning();

    console.log("Created blog scheduler task:", newTask);
    res.json(newTask);
  } catch (error) {
    console.error("Blog scheduler creation error:", error);
    res.status(500).json({ message: "Failed to create scheduler task" });
  }
});

// Update blog scheduler task
router.patch("/blog-scheduler/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = z.object({
      isActive: z.boolean().optional(),
      name: z.string().optional(),
      prompt: z.string().optional(),
      frequency: z.enum(["daily", "weekly", "monthly"]).optional()
    }).parse(req.body);

    const [updatedTask] = await db
      .update(blogScheduler)
      .set(updateData)
      .where(eq(blogScheduler.id, parseInt(id)))
      .returning();

    res.json(updatedTask);
  } catch (error) {
    console.error("Blog scheduler update error:", error);
    res.status(500).json({ message: "Failed to update scheduler task" });
  }
});

// Delete blog scheduler task
router.delete("/blog-scheduler/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .delete(blogScheduler)
      .where(eq(blogScheduler.id, parseInt(id)));

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Blog scheduler delete error:", error);
    res.status(500).json({ message: "Failed to delete scheduler task" });
  }
});

// Generate content ideas
router.post("/generate-content-ideas", async (req, res) => {
  try {
    const { topic, count = 10 } = z.object({
      topic: z.string().min(1),
      count: z.number().optional()
    }).parse(req.body);

    const ideas = await geminiService.generateContentIdeas(topic, count);
    res.json(ideas);
  } catch (error) {
    console.error("Content ideas generation error:", error);
    res.status(500).json({ message: "Failed to generate content ideas" });
  }
});

// Get trending topics for Pakistan business content
router.get("/trending-topics", async (req, res) => {
  try {
    const trends = await geminiService.discoverTrendingTopics();
    res.json(trends);
  } catch (error) {
    console.error("Trending topics error:", error);
    res.status(500).json({ message: "Failed to fetch trending topics" });
  }
});

// Get Pakistani business context
router.get("/pk-business-context", async (req, res) => {
  try {
    const context = await geminiService.getPKBusinessContext();
    res.json(context);
  } catch (error) {
    console.error("Pakistani business context error:", error);
    res.status(500).json({ message: "Failed to fetch business context" });
  }
});

// Generate smart topic suggestions
router.post("/smart-topics", async (req, res) => {
  try {
    const { count = 10 } = z.object({
      count: z.number().optional()
    }).parse(req.body);

    const suggestions = await geminiService.generateSmartTopics(count);
    res.json(suggestions);
  } catch (error) {
    console.error("Smart topics generation error:", error);
    res.status(500).json({ message: "Failed to generate smart topics" });
  }
});

// Analyze content performance
router.get("/analyze-content/:postId", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const analysis = await geminiService.analyzeContentPerformance(postId);
    res.json(analysis);
  } catch (error) {
    console.error("Content analysis error:", error);
    res.status(500).json({ message: "Failed to analyze content" });
  }
});

// Create blog scheduler task
router.post("/blog-scheduler", async (req, res) => {
  try {
    const taskData = z.object({
      name: z.string().min(1),
      prompt: z.string().min(1),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      categoryId: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
      tags: z.array(z.string()).optional()
    }).parse(req.body);

    // Calculate next run time
    const now = new Date();
    let nextRun = new Date();
    
    switch (taskData.frequency) {
      case "daily":
        nextRun.setDate(now.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(now.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(now.getMonth() + 1);
        break;
    }

    const [newTask] = await db
      .insert(blogScheduler)
      .values({
        ...taskData,
        nextRun,
        isActive: true
      })
      .returning();

    res.json(newTask);
  } catch (error) {
    console.error("Blog scheduler creation error:", error);
    res.status(500).json({ message: "Failed to create scheduler task" });
  }
});

// ============================================================================
// MEDIA FILE MANAGEMENT
// ============================================================================

// Get media files
router.get("/media-files", async (req, res) => {
  try {
    const folder = req.query.folder as string || "uploads";
    
    const files = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.folder, folder))
      .orderBy(desc(mediaFiles.updatedAt));
    
    res.json(files);
  } catch (error) {
    console.error("Media files fetch error:", error);
    res.status(500).json({ message: "Failed to fetch media files" });
  }
});

// Upload media file (placeholder - would need actual file upload middleware)
router.post("/media-files", async (req, res) => {
  try {
    const fileData = z.object({
      filename: z.string(),
      originalName: z.string(),
      mimeType: z.string(),
      size: z.number(),
      path: z.string(),
      url: z.string(),
      folder: z.string().optional()
    }).parse(req.body);

    const [newFile] = await db
      .insert(mediaFiles)
      .values({
        ...fileData,
        uploadedBy: req.session?.user?.id || "email_1752414903699_dazfok6y2"
      })
      .returning();

    res.json(newFile);
  } catch (error) {
    console.error("Media file upload error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
});

// ============================================================================
// SEO MANAGEMENT
// ============================================================================

// Get SEO settings
router.get("/seo-settings", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(seoSettings)
      .orderBy(desc(seoSettings.updatedAt));
    
    res.json(settings);
  } catch (error) {
    console.error("SEO settings fetch error:", error);
    res.status(500).json({ message: "Failed to fetch SEO settings" });
  }
});

// Update SEO settings
router.post("/seo-settings", async (req, res) => {
  try {
    const seoData = z.object({
      pageType: z.string(),
      pageId: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional()
    }).parse(req.body);

    const [updatedSEO] = await db
      .insert(seoSettings)
      .values(seoData)
      .returning();

    res.json(updatedSEO);
  } catch (error) {
    console.error("SEO settings update error:", error);
    res.status(500).json({ message: "Failed to update SEO settings" });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users with stats
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const totalUsers = await db.select({ count: count() }).from(users);

    res.json({
      users: allUsers,
      total: totalUsers[0]?.count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ============================================================================
// BUSINESS MANAGEMENT
// ============================================================================

// Get all businesses with stats
router.get("/businesses", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const allBusinesses = await db
      .select()
      .from(businesses)
      .orderBy(desc(businesses.createdAt))
      .limit(limit)
      .offset(offset);

    const totalBusinesses = await db.select({ count: count() }).from(businesses);

    res.json({
      businesses: allBusinesses,
      total: totalBusinesses[0]?.count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error("Businesses fetch error:", error);
    res.status(500).json({ message: "Failed to fetch businesses" });
  }
});

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

// Get system settings
router.get("/system-settings", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.key);
    
    res.json(settings);
  } catch (error) {
    console.error("System settings fetch error:", error);
    res.status(500).json({ message: "Failed to fetch system settings" });
  }
});

// Update system setting
router.post("/system-settings", async (req, res) => {
  try {
    const settingData = z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional()
    }).parse(req.body);

    const [setting] = await db
      .insert(systemSettings)
      .values(settingData)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value: settingData.value,
          description: settingData.description,
          updatedAt: new Date()
        }
      })
      .returning();

    res.json(setting);
  } catch (error) {
    console.error("System setting update error:", error);
    res.status(500).json({ message: "Failed to update system setting" });
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

// Get audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;

    const logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const totalLogs = await db.select({ count: count() }).from(auditLogs);

    res.json({
      logs,
      total: totalLogs[0]?.count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Create audit log entry
router.post("/audit-logs", async (req, res) => {
  try {
    const logData = z.object({
      action: z.string(),
      resource: z.string().optional(),
      resourceId: z.string().optional(),
      details: z.any().optional(),
      severity: z.enum(["info", "warning", "error", "critical"]).default("info")
    }).parse(req.body);

    const [logEntry] = await db
      .insert(auditLogs)
      .values({
        ...logData,
        adminId: req.session?.user?.id || "email_1752414903699_dazfok6y2",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      })
      .returning();

    res.json(logEntry);
  } catch (error) {
    console.error("Audit log creation error:", error);
    res.status(500).json({ message: "Failed to create audit log" });
  }
});

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

// Get email templates
router.get("/email-templates", async (req, res) => {
  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
    
    res.json(templates);
  } catch (error) {
    console.error("Email templates fetch error:", error);
    res.status(500).json({ message: "Failed to fetch email templates" });
  }
});

// Create or update email template
router.post("/email-templates", async (req, res) => {
  try {
    const templateData = z.object({
      name: z.string(),
      subject: z.string(),
      htmlContent: z.string(),
      placeholders: z.string(),
      description: z.string().optional(),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    const [template] = await db
      .insert(emailTemplates)
      .values(templateData)
      .onConflictDoUpdate({
        target: emailTemplates.name,
        set: { 
          ...templateData,
          updatedAt: new Date()
        }
      })
      .returning();

    res.json(template);
  } catch (error) {
    console.error("Email template update error:", error);
    res.status(500).json({ message: "Failed to update email template" });
  }
});

// ============================================================================
// SEO & TECHNICAL MANAGEMENT (robots.txt, sitemap)
// ============================================================================

// Get SEO technical settings
router.get("/seo/technical", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(seoSettings)
      .where(eq(seoSettings.pageType, "global"))
      .limit(1);
    
    const globalSettings = settings[0] || {
      robotsTxt: `User-agent: *
Allow: /

# Allow all major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /login/

# Allow important directories
Allow: /categories/
Allow: /businesses/
Allow: /provinces/
Allow: /localities/
Allow: /news/
Allow: /blog/

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: https://pakistanyp.com/sitemap.xml`,
      sitemapConfig: {
        enabled: true,
        includeImages: true,
        changefreq: "weekly",
        priority: {
          homepage: 1.0,
          categories: 0.9,
          businesses: 0.8,
          provinces: 0.9,
          localities: 0.7,
          pages: 0.6
        },
        excludePaths: ["/admin", "/api", "/dashboard"],
        customUrls: []
      },
      baseUrl: "https://pakistanyp.com",
      sitemapEnabled: true
    };
    
    res.json(globalSettings);
  } catch (error) {
    console.error("SEO technical settings fetch error:", error);
    res.status(500).json({ message: "Failed to fetch SEO settings" });
  }
});

// Update SEO technical settings
router.put("/seo/technical", async (req, res) => {
  try {
    const updateData = z.object({
      robotsTxt: z.string(),
      sitemapConfig: z.object({
        enabled: z.boolean(),
        includeImages: z.boolean().optional(),
        changefreq: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).optional(),
        priority: z.object({
          homepage: z.number().min(0).max(1),
          categories: z.number().min(0).max(1),
          businesses: z.number().min(0).max(1),
          provinces: z.number().min(0).max(1),
          localities: z.number().min(0).max(1),
          pages: z.number().min(0).max(1)
        }).optional(),
        excludePaths: z.array(z.string()).optional(),
        customUrls: z.array(z.object({
          url: z.string(),
          changefreq: z.string(),
          priority: z.number().min(0).max(1)
        })).optional()
      }),
      baseUrl: z.string().url(),
      sitemapEnabled: z.boolean()
    }).parse(req.body);

    // Check if global settings exist
    const existing = await db
      .select()
      .from(seoSettings)
      .where(eq(seoSettings.pageType, "global"))
      .limit(1);

    let result;
    
    if (existing.length > 0) {
      // Update existing
      [result] = await db
        .update(seoSettings)
        .set({
          robotsTxt: updateData.robotsTxt,
          sitemapConfig: updateData.sitemapConfig,
          baseUrl: updateData.baseUrl,
          sitemapEnabled: updateData.sitemapEnabled,
          updatedAt: new Date()
        })
        .where(eq(seoSettings.pageType, "global"))
        .returning();
    } else {
      // Create new
      [result] = await db
        .insert(seoSettings)
        .values({
          pageType: "global",
          robotsTxt: updateData.robotsTxt,
          sitemapConfig: updateData.sitemapConfig,
          baseUrl: updateData.baseUrl,
          sitemapEnabled: updateData.sitemapEnabled
        })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error("SEO technical settings update error:", error);
    res.status(500).json({ message: "Failed to update SEO settings" });
  }
});

// Test robots.txt content
router.post("/seo/test-robots", async (req, res) => {
  try {
    const { robotsTxt } = z.object({
      robotsTxt: z.string()
    }).parse(req.body);
    
    // Basic validation of robots.txt format
    const lines = robotsTxt.split('\n');
    const warnings = [];
    const errors = [];
    
    // Check for required User-agent
    const hasUserAgent = lines.some(line => line.trim().toLowerCase().startsWith('user-agent:'));
    if (!hasUserAgent) {
      errors.push("Missing User-agent directive");
    }
    
    // Check for sitemap declarations
    const sitemapCount = lines.filter(line => line.trim().toLowerCase().startsWith('sitemap:')).length;
    if (sitemapCount === 0) {
      warnings.push("No Sitemap declarations found");
    }
    
    // Check for common issues
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        if (trimmedLine.includes(' ') && !trimmedLine.includes(':')) {
          warnings.push(`Line ${index + 1}: Possible formatting issue - missing colon?`);
        }
      }
    });
    
    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
      lineCount: lines.length,
      directiveCount: lines.filter(line => 
        line.trim() && 
        !line.trim().startsWith('#') && 
        line.includes(':')
      ).length
    });
  } catch (error) {
    console.error("Robots.txt test error:", error);
    res.status(500).json({ message: "Failed to test robots.txt" });
  }
});

// Generate sitemap preview
router.post("/seo/preview-sitemap", async (req, res) => {
  try {
    const { sitemapConfig } = z.object({
      sitemapConfig: z.object({
        enabled: z.boolean(),
        includeImages: z.boolean().optional(),
        changefreq: z.string().optional(),
        priority: z.record(z.number()).optional(),
        excludePaths: z.array(z.string()).optional(),
        customUrls: z.array(z.object({
          url: z.string(),
          changefreq: z.string(),
          priority: z.number()
        })).optional()
      })
    }).parse(req.body);
    
    if (!sitemapConfig.enabled) {
      return res.json({ preview: "<!-- Sitemap generation is disabled -->" });
    }
    
    // Get sample data for preview
    const [businessCount] = await db.select({ count: count() }).from(businesses);
    const [categoryCount] = await db.select({ count: count() }).from(categories);
    const [provinceCount] = await db.select({ count: count() }).from(provinces);
    
    const stats = {
      businesses: businessCount?.count || 0,
      categories: categoryCount?.count || 0,  
      provinces: provinceCount?.count || 0,
      staticPages: 8,
      customUrls: sitemapConfig.customUrls?.length || 0
    };
    
    const totalUrls = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    res.json({
      stats,
      totalUrls,
      estimatedSize: `${Math.ceil(totalUrls / 1000)} KB`,
      sitemapFiles: [
        "sitemap.xml (index)",
        "sitemap-static.xml",
        "sitemap-businesses.xml", 
        "sitemap-categories.xml",
        "sitemap-provinces.xml",
        "sitemap-localities.xml",
        ...(sitemapConfig.customUrls?.length ? ["sitemap-custom.xml"] : [])
      ]
    });
  } catch (error) {
    console.error("Sitemap preview error:", error);
    res.status(500).json({ message: "Failed to generate sitemap preview" });
  }
});

// Regenerate sitemap manually
router.post("/seo/regenerate-sitemap", async (req, res) => {
  try {
    // This would trigger a sitemap regeneration
    // For now, just return success with timestamp
    res.json({
      success: true,
      message: "Sitemap regeneration triggered",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Sitemap regeneration error:", error);
    res.status(500).json({ message: "Failed to regenerate sitemap" });
  }
});

// Bulk generate unique content for all categories
router.post("/seo/generate-category-content", async (req, res) => {
  try {
    const { CategoryContentGenerator } = await import('./services/categoryContentGenerator');
    const generator = new CategoryContentGenerator();
    
    // Get all categories
    const allCategories = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId
    }).from(categories);
    
    const batchSize = 10;
    let processed = 0;
    let successCount = 0;
    let failedCount = 0;
    
    // Process in batches to avoid rate limits
    for (let i = 0; i < allCategories.length; i += batchSize) {
      const batch = allCategories.slice(i, i + batchSize);
      
      const promises = batch.map(async (cat) => {
        try {
          const content = await generator.generateCategoryContent({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parentName: cat.parentId ? allCategories.find(c => c.id === cat.parentId)?.name : undefined
          });
          
          // Update the database with all generated fields
          await db.update(categories)
            .set({
              description: content.pageContent, // Use pageContent as the main description for SEO value
              metaTitle: content.metaTitle,
              metaDescription: content.metaDescription,
              ogTitle: content.ogTitle,
              ogDescription: content.ogDescription,
            })
            .where(eq(categories.id, cat.id));
          
          successCount++;
          return { id: cat.id, status: 'success' };
        } catch (error) {
          failedCount++;
          return { id: cat.id, status: 'failed', error: String(error) };
        }
      });
      
      await Promise.all(promises);
      processed += batch.length;
      
      console.log(`[Content Gen] Processed ${processed}/${allCategories.length} categories`);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < allCategories.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    res.json({
      success: true,
      message: `Content generation complete`,
      total: allCategories.length,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error("Category content generation error:", error);
    res.status(500).json({ message: "Failed to generate category content", error: String(error) });
  }
});

// Bulk generate unique content for all localities
router.post("/seo/generate-locality-content", async (req, res) => {
  try {
    const { LocalityContentGenerator } = await import('./services/localityContentGenerator');
    const generator = new LocalityContentGenerator();
    
    // Get all localities with province info
    const allLocalities = await db.select({
      id: localities.id,
      name: localities.name,
      slug: localities.slug,
      provinceId: localities.provinceId,
      provinceName: provinces.name
    })
    .from(localities)
    .leftJoin(provinces, eq(localities.provinceId, provinces.id));
    
    const batchSize = 10;
    let processed = 0;
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < allLocalities.length; i += batchSize) {
      const batch = allLocalities.slice(i, i + batchSize);
      
      const promises = batch.map(async (loc) => {
        try {
          const content = await generator.generateLocalityContent({
            id: loc.id,
            name: loc.name,
            slug: loc.slug,
            provinceId: loc.provinceId || 0,
            provinceName: loc.provinceName || 'Pakistan'
          });
          
          await db.update(localities)
            .set({
              description: content.pageContent, // Use pageContent as the main description
              metaTitle: content.metaTitle,
              metaDescription: content.metaDescription,
              ogTitle: content.ogTitle,
              ogDescription: content.ogDescription,
            })
            .where(eq(localities.id, loc.id));
          
          successCount++;
          return { id: loc.id, status: 'success' };
        } catch (error) {
          failedCount++;
          return { id: loc.id, status: 'failed', error: String(error) };
        }
      });
      
      await Promise.all(promises);
      processed += batch.length;
      
      console.log(`[Content Gen] Processed ${processed}/${allLocalities.length} localities`);
      
      if (i + batchSize < allLocalities.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    res.json({
      success: true,
      message: `Locality content generation complete`,
      total: allLocalities.length,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error("Locality content generation error:", error);
    res.status(500).json({ message: "Failed to generate locality content", error: String(error) });
  }
});

export default router;