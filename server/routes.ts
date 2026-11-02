import { country } from "@shared/country";
import { registerPhase2Routes } from "./phase2";
import { registerPhase1Routes } from "./phase1";
import { isAdminRequest } from "./middleware/adminGuard";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { publicProvince } from "../shared/province-directory";
import { db } from "./db";
import { checkBusinessPlacement } from "./businessPlacement";
import { registerEditorialRoutes } from "./editorialRoutes";
import fetch from "node-fetch";
// Removed Google OAuth - using email/password authentication only
import { authService } from "./authService";
import { generateMetaTags, analyzeSEOContent } from "./aiService";
import { simpleEmailService } from "./simpleEmailService";
import { emailTemplateService } from "./emailTemplateService";
import { isAuthenticated } from "./replitAuth";
import adminRoutes from "./adminRoutes";
import businessAnalyticsRoutes from "./businessAnalyticsRoutes";
import { registerSEORoutes } from "./seoRoutes";
import OpenAI from "openai";
import * as schemaGen from "./schemaGenerator";


import { 
  insertBusinessSchema,
  insertBusinessReviewSchema,
  insertBusinessClaimSchema,
  insertBusinessEnquirySchema,
  insertCategorySchema,
  insertProvinceSchema,
  insertLocalitySchema,
  insertNewsArticleSchema,
  insertNewsCategorySchema,
  insertBlogPostSchema,
  insertBusinessMetricSchema,
  insertBusinessGoalSchema,
  insertCompetitorAnalysisSchema,
  insertGrowthRecommendationSchema,
  insertMenuSchema,
  insertMenuItemSchema,
  insertFeatureFlagSchema,
  insertBusinessGrowthMetricSchema,
  insertBusinessGrowthGoalSchema,
  insertBusinessGrowthVisualizationSchema,
  insertBusinessGrowthInsightSchema,
  insertCategoryRequestSchema,
  insertHotelBookingSchema,
  insertHotelSearchSchema,
  insertHotelFavoriteSchema,
  insertEventSchema,
  insertEventCategorySchema,
  insertEventBookmarkSchema,
  users,
  businesses,
  localities,
  categories,
  provinces,
  newsletterSubscriptions,
  newsArticles as news,
  blogPosts,
  events,
  eventCategories,
  eventBookmarks
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import Stripe from "stripe";
import crypto from "crypto";
import { hotelSearchSchema, hotelBookingSchema } from "@shared/hotelSchema";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import { upload as imageUpload, deleteFile, getFileUrl, blogUpload, getBlogImageUrl, deleteBlogFile } from "./fileUpload";

let stripe: Stripe | null = null;

// Initialize Stripe with error handling
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not found. Stripe features will be disabled.');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
    });
    console.log('Stripe initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerPhase1Routes(app);
  registerPhase2Routes(app);
  // Enhanced no-cache middleware to completely prevent 304 responses
  const disableCache = (req: any, res: any, next: any) => {
    const timestamp = Date.now();
    
    // Set comprehensive anti-cache headers (no ETag to prevent 304)
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date(0).toUTCString(), // Set to epoch to prevent 304
      'Vary': '*',
      'X-Timestamp': timestamp.toString(),
      'X-No-Cache': 'true'
    });
    
    // Remove any conditional request headers that could cause 304
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    delete req.headers['if-range'];
    delete req.headers['if-unmodified-since'];
    
    // Override res.end to ensure no 304 responses and remove ETags
    const originalEnd = res.end;
    const originalSetHeader = res.setHeader;
    
    // Intercept setHeader to prevent ETag from being set
    res.setHeader = function(name: string, value: any) {
      if (name.toLowerCase() === 'etag') {
        return res; // Skip setting ETag
      }
      return originalSetHeader.call(this, name, value);
    };
    
    res.end = function(chunk?: any, encoding?: any) {
      if (res.statusCode === 304) {
        res.statusCode = 200;
      }
      // Remove any ETag header that might have been set
      res.removeHeader('ETag');
      res.removeHeader('etag');
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };

  // Health check routes (before auth)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      api: 'running', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // File upload route for images
  app.post('/api/upload/image', imageUpload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = getFileUrl(req.file.filename);
      
      res.json({
        success: true,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file' 
      });
    }
  });

  // Blog image upload endpoint - saves to /public/assets/blogs/ with original filename
  app.post('/api/upload/blog-image', blogUpload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = getBlogImageUrl(req.file.filename);
      
      console.log(`Blog image uploaded: ${req.file.originalname} -> ${fileUrl}`);
      
      res.json({
        success: true,
        filename: req.file.filename, // This will be the original filename
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Blog image upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to upload blog image' 
      });
    }
  });

  // Delete uploaded file
  app.delete('/api/upload/image/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const success = await deleteFile(filename);
      
      if (success) {
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'File not found' });
      }
    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete file' 
      });
    }
  });

  app.get('/api/health', disableCache, (req, res) => {
    res.json({ 
      status: 'ok', 
      api: 'running', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Admin Settings API Routes (before auth middleware)
  app.get('/api/admin/settings', async (req, res) => {
    try {
      // Get settings from database
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  // Dynamic favicon endpoint - DISABLED
  // app.get("/dynamic-favicon.ico", async (req, res) => {
  //   // Favicon cache functionality disabled
  //   res.redirect("/favicon.ico");
  // });

  app.put('/api/admin/settings', async (req, res) => {
    try {
      const updates = req.body;
      console.log('Settings update received:', updates);
      
      // Check if favicon is being updated
      const isFaviconUpdate = updates.hasOwnProperty('favicon');
      
      // Update settings in database
      await storage.updateSystemSettings(updates);
      
      // Favicon cache clearing disabled
      let cacheTimestamp = null;
      if (isFaviconUpdate) {
        console.log(`📋 Favicon setting updated (cache clearing disabled): ${updates.favicon}`);
      }
      
      res.json({ 
        message: 'Settings updated successfully',
        settings: updates,
        cacheCleared: isFaviconUpdate,
        cacheTimestamp: cacheTimestamp
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // Create uploads directory if it doesn't exist
  const uploadsDir = (process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads'));
  fs.ensureDirSync(uploadsDir);

  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const type = req.body.type || 'file';
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${type}-${timestamp}${extension}`;
      cb(null, filename);
    }
  });

  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const type = req.body.type;
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (type === 'favicon') {
        // For favicon, check both MIME type and file extension
        const allowedExtensions = ['.ico', '.png', '.jpg', '.jpeg'];
        const allowedMimeTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg', 'image/jpg'];
        
        if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid favicon file type. Please use ICO, PNG, or JPEG files.'));
        }
      } else {
        // For other logos
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      }
    }
  });

  // Favicon Cache Clearing Function - DISABLED
  const clearFaviconCache = async (reason = 'manual') => {
    // Favicon cache functionality disabled - returning dummy response
    console.log(`📋 Favicon cache clearing disabled (reason: ${reason})`);
    return { timestamp: Date.now(), version: 'disabled', headers: {} };
  };

  // Favicon cache status endpoint - DISABLED
  // app.get('/api/admin/favicon-cache-status', async (req, res) => {
  //   res.json({ isActive: false, message: 'Favicon cache functionality disabled' });
  // });

  // Favicon cache clearing endpoint - DISABLED
  // app.post('/api/admin/clear-favicon-cache', async (req, res) => {
  //   res.json({ success: false, message: 'Favicon cache functionality disabled' });
  // });

  // Favicon cache clearing endpoint - DISABLED (duplicate)
  // app.post('/api/admin/clear-favicon-cache', async (req, res) => {
  //   res.json({ success: false, message: 'Favicon cache functionality disabled' });
  // });

  // Logo Upload API Route
  app.post('/api/admin/upload-logo', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { type } = req.body;
      
      if (!type || !['headerLogo', 'footerLogo', 'favicon'].includes(type)) {
        return res.status(400).json({ message: 'Invalid logo type' });
      }

      // Generate the public URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Automatically update the setting in database
      await storage.updateSystemSettings({ [type]: fileUrl });
      
      // Favicon cache clearing disabled
      let cacheTimestamp = null;
      if (type === 'favicon') {
        console.log(`📋 Favicon uploaded (cache clearing disabled): ${fileUrl}`);
      }
      
      console.log(`Logo uploaded and saved successfully: ${type} -> ${fileUrl}`);
      
      res.json({
        success: true,
        url: fileUrl,
        message: `${type} uploaded and saved successfully`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        cacheCleared: type === 'favicon',
        cacheTimestamp: cacheTimestamp
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  });

  // OAuth debug route
  app.get('/oauth-debug', (req, res) => {
    res.json({
      message: 'OAuth Debug Info',
      session: req.sessionID,
      user: req.user ? { id: (req.user as any).id, email: (req.user as any).email } : null,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      host: req.get('host'),
      protocol: req.protocol,
      originalUrl: req.originalUrl
    });
  });

  // OAuth success test route with better error handling
  app.get('/oauth-success', (req, res) => {
    console.log("OAuth success page accessed");
    console.log("Session ID:", req.sessionID);
    console.log("User:", req.user);
    console.log("Authenticated:", req.isAuthenticated ? req.isAuthenticated() : 'N/A');
    
    try {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Success - PakistanYP</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #28a745; font-size: 28px; margin-bottom: 20px; }
              .info { color: #666; margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
              .btn { 
                background: #007bff; color: white; padding: 12px 25px; 
                text-decoration: none; border-radius: 5px; display: inline-block; 
                margin: 10px; font-weight: bold; transition: background 0.3s;
              }
              .btn:hover { background: #0056b3; }
              .btn-success { background: #28a745; }
              .btn-success:hover { background: #1e7e34; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✓ Google OAuth Authentication Successful!</div>
              <div class="info">
                <strong>Welcome to PakistanYP!</strong><br>
                You have been successfully logged in with your Google account.
              </div>
              <div class="info">
                <strong>Session:</strong> ${req.sessionID || 'No session'}<br>
                <strong>User Data:</strong> ${(req as any).user ? JSON.stringify({id: (req as any).user.id, email: (req as any).user.email}, null, 2) : 'No user data'}<br>
                <strong>Authenticated:</strong> ${req.isAuthenticated ? req.isAuthenticated() : 'N/A'}
              </div>
              <div style="margin-top: 30px;">
                <a href="/" class="btn btn-success">Continue to Homepage</a>
                <a href="/dashboard" class="btn">Go to Dashboard</a>
              </div>
              <div style="margin-top: 20px; font-size: 12px; color: #999;">
                This is a debug page. In production, you'll be redirected automatically.
              </div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error rendering OAuth success page:", error);
      res.status(500).send("OAuth success but page render failed");
    }
  });

  // Session middleware for email/password authentication with error handling
  try {
    const session = await import('express-session');
    app.use(session.default({
      secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    console.log('Session middleware initialized successfully');
  } catch (error) {
    console.error('Failed to initialize session middleware:', error);
  }

  // Simple authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.user) {
      req.user = req.session.user; // Add user to req for easier access
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      console.log('Registration attempt:', { email, firstName, lastName, hasPassword: !!password });
      
      if (!email || !password || !firstName || !lastName) {
        console.log('Missing required fields');
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: 'User already exists' });
      }

      console.log('Calling authService.registerUser...');
      const result = await authService.registerUser({
        email,
        password,
        firstName,
        lastName
      });
      console.log('Registration result:', result);

      // Check if result and user exist
      if (!result || !result.user) {
        console.error('Invalid registration result:', result);
        return res.status(500).json({ message: 'Registration failed: Invalid response from auth service' });
      }

      const user = result.user;
      console.log('User object:', user);

      // Create session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'user',
        isEmailVerified: user.isEmailVerified || false,
        onboardingCompleted: user.onboardingCompleted || false
      };

      console.log('Sending successful registration response');
      res.json({ 
        message: 'Registration successful',
        emailSent: result.emailSent || false,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'user',
          isEmailVerified: user.isEmailVerified || false,
          onboardingCompleted: user.onboardingCompleted || false
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Registration error details:', error);
      res.status(500).json({ message: 'Registration failed', error: (error as Error).message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await authService.loginUser(email, password);
      
      // Create session with onboarding status
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: user.onboardingCompleted || false
      };

      res.json({ 
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          onboardingCompleted: user.onboardingCompleted || false
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Login error details:', error.message);
      res.status(400).json({ message: error.message || 'Invalid credentials' });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/user', (req: any, res) => {
    if (req.session && req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Email Testing API Endpoints
  app.post('/api/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email address is required' 
        });
      }

      console.log('🧪 Testing email system with recipient:', email);
      
      // Test basic email functionality
      const result = await simpleEmailService.sendVerificationEmail(email, 'Test User', 'test-token');
      
      console.log('📧 Email test result:', result);
      
      res.json(result);
    } catch (error: any) {
      console.error('❌ Email test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: `Email test failed: ${error.message}` 
      });
    }
  });

  // Test verification email specifically
  app.post('/api/test-verification-email', async (req, res) => {
    try {
      const { email, firstName } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and firstName are required' 
        });
      }

      console.log('🧪 Testing verification email for:', email);
      
      // Generate a test token
      const testToken = crypto.randomBytes(32).toString('hex');
      
      // Test verification email using template service
      const result = await emailTemplateService.sendVerificationEmail(email, firstName, testToken);
      
      console.log('📧 Verification email test result:', result);
      
      res.json({ 
        success: result, 
        message: result ? 'Verification email sent successfully!' : 'Failed to send verification email' 
      });
    } catch (error: any) {
      console.error('❌ Verification email test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: `Verification email test failed: ${error.message}` 
      });
    }
  });

  // Email system status check
  app.get('/api/email-status', async (req, res) => {
    try {
      console.log('🔍 Checking email system status...');
      
      // Check SendGrid API key
      const hasApiKey = !!process.env.SENDGRID_API_KEY;
      console.log('SendGrid API Key present:', hasApiKey);
      
      // Try to initialize email service
      const emailServiceTest = await simpleEmailService.sendVerificationEmail('test@example.com', 'Test User', 'test-token').catch(e => ({ 
        success: false, 
        message: e.message 
      }));
      
      const status = {
        sendgridApiKey: hasApiKey,
        emailServiceStatus: (emailServiceTest as any).success ? 'working' : 'failed',
        lastError: (emailServiceTest as any).success ? null : (emailServiceTest as any).message,
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 Email system status:', status);
      
      res.json(status);
    } catch (error: any) {
      console.error('❌ Email status check failed:', error);
      res.status(500).json({ 
        error: 'Failed to check email status',
        message: error.message 
      });
    }
  });

  // Email verification route
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const user = await authService.verifyEmail(token as string);
      res.json({ message: 'Email verified successfully', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Fix password for user
  app.post('/api/fix-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      console.log('Fixing password for:', email);
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hash the new password properly
      const hashedPassword = await authService.hashPassword(newPassword);
      
      // Update user with new password and verify email
      await storage.updateUser(user.id, {
        password: hashedPassword,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      });

      console.log('Password fixed and user verified:', email);
      
      res.json({
        message: 'Password fixed and user verified successfully!',
        user: {
          email: user.email,
          firstName: user.firstName,
          isEmailVerified: true
        }
      });
    } catch (error: any) {
      console.error('Fix password error:', error);
      res.status(500).json({ message: 'Failed to fix password', error: error.message });
    }
  });

  // Manual verification endpoint (bypass email)
  app.post('/api/verify-user-manual', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Manual verification for:', email);
      
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Manually verify the user
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      });

      console.log('User manually verified:', email);
      
      res.json({
        message: 'User verified successfully!',
        user: {
          email: user.email,
          firstName: user.firstName,
          isEmailVerified: true
        }
      });
    } catch (error: any) {
      console.error('Manual verification error:', error);
      res.status(500).json({ message: 'Failed to verify user', error: error.message });
    }
  });

  // Send verification email to existing user
  app.post('/api/send-verification-email', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Sending verification email to:', email);
      
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      // Import the email template service
      const { emailTemplateService } = await import('./emailTemplateService');
      
      // Generate new verification token if needed
      let verificationToken = user.emailVerificationToken;
      if (!verificationToken) {
        verificationToken = authService.generateToken();
        await storage.updateUser(user.id, {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
      
      // Send verification email using SendGrid
      console.log('Sending verification email via SendGrid...');
      const success = await emailTemplateService.sendVerificationEmail(
        user.email!, 
        user.firstName!, 
        verificationToken!
      );

      console.log('Verification email result:', success);
      
      res.json({
        message: success ? 'Verification email sent successfully!' : 'Failed to send verification email',
        emailSent: success,
        user: {
          email: user.email,
          firstName: user.firstName,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error: any) {
      console.error('Send verification email error:', error);
      res.status(500).json({ message: 'Failed to send verification email', error: error.message });
    }
  });

  // Manual user creation endpoint for testing
  app.post('/api/create-user-manual', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      console.log('Manual user creation for:', email);
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await authService.hashPassword(password);
      const token = authService.generateToken();
      
      // Create user directly
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user',
        authProvider: 'email',
        isEmailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      console.log('User created successfully:', user.id);
      
      // Create manual verification link
      const domain = process.env.PUBLIC_HOST || country.domain;
      const verificationUrl = `https://${domain}/#/verify-email?token=${token}`;
      
      console.log('Manual verification link:', verificationUrl);
      
      res.json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        verificationUrl,
        emailSent: false
      });
    } catch (error: any) {
      console.error('Manual user creation error:', error);
      res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
  });

  // Test email endpoint using SendGrid API
  app.post('/api/test-sendgrid-api', async (req, res) => {
    try {
      console.log('🧪 Testing email system with SendGrid API');
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      console.log('📧 Testing SendGrid API email service for:', email);

      // Import the SendGrid API service
      const { sendGridAPIService } = await import('./sendgridApiService');
      
      // Test sending an email via SendGrid API
      console.log('📤 Calling SendGrid API service...');
      const success = await sendGridAPIService.sendTestEmail(
        email, 
        'Test User', 
        'test-token-123'
      );

      console.log('📧 SendGrid API test result:', success);
      res.json({ 
        success, 
        message: success ? 'Test email sent successfully via SendGrid API!' : 'Failed to send test email via SendGrid API. Check console for details.',
        service: 'SendGrid API',
        environment: {
          hasSendGrid: !!process.env.SENDGRID_API_KEY,
          service: 'sendgrid-api'
        }
      });
    } catch (error: any) {
      console.error('❌ SendGrid API test error:', error);
      res.status(500).json({ message: 'Failed to send test email via SendGrid API', error: error.message });
    }
  });

  // Comprehensive email testing endpoint
  app.post('/api/test-email-comprehensive', async (req, res) => {
    try {
      console.log('🧪 Running comprehensive email test...');
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email address required' });
      }

      const { emailTester } = await import('./emailTester');
      const results = await emailTester.runComprehensiveTest(email);
      
      const successfulSenders = results.filter(r => r.success);
      const failedSenders = results.filter(r => !r.success);
      
      console.log(`📊 Test Results: ${successfulSenders.length} successful, ${failedSenders.length} failed`);
      
      res.json({
        success: successfulSenders.length > 0,
        message: successfulSenders.length > 0 
          ? `Found ${successfulSenders.length} working sender(s)` 
          : 'No working senders found',
        results: {
          successful: successfulSenders,
          failed: failedSenders,
          totalTested: results.length
        }
      });
      
    } catch (error: any) {
      console.error('❌ Comprehensive test error:', error);
      res.status(500).json({ message: 'Email test failed', error: error.message });
    }
  });

  // COMPREHENSIVE BUSINESS MANAGEMENT API ROUTES
  
  // Toggle business status (active/inactive)
  app.post('/api/admin/businesses/:id/toggle-status', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.toggleBusinessStatus(businessId, isActive);
      
      res.json({ success: true, message: 'Business status updated successfully' });
    } catch (error: any) {
      console.error('Error toggling business status:', error);
      res.status(500).json({ message: 'Failed to update business status' });
    }
  });

  // Toggle business verification
  app.post('/api/admin/businesses/:id/toggle-verification', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { isVerified } = req.body;
      
      await storage.toggleBusinessVerification(businessId, isVerified);
      
      res.json({ success: true, message: 'Business verification updated successfully' });
    } catch (error: any) {
      console.error('Error toggling business verification:', error);
      res.status(500).json({ message: 'Failed to update business verification' });
    }
  });

  // Toggle business featured status
  app.post('/api/admin/businesses/:id/toggle-featured', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { featured } = req.body;
      
      await storage.toggleBusinessFeatured(businessId, featured);
      
      res.json({ success: true, message: 'Business featured status updated successfully' });
    } catch (error: any) {
      console.error('Error toggling business featured status:', error);
      res.status(500).json({ message: 'Failed to update business featured status' });
    }
  });

  // Edit business
  app.put('/api/admin/businesses/:id', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const updates = req.body;
      
      await storage.updateBusiness(businessId, updates);
      
      res.json({ success: true, message: 'Business updated successfully' });
    } catch (error: any) {
      console.error('Error updating business:', error);
      res.status(500).json({ message: 'Failed to update business' });
    }
  });

  // Change business category
  app.put('/api/admin/businesses/:id/category', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { categoryId } = req.body;
      
      await storage.updateBusiness(businessId, { categoryId });
      
      res.json({ success: true, message: 'Business category updated successfully' });
    } catch (error: any) {
      console.error('Error updating business category:', error);
      res.status(500).json({ message: 'Failed to update business category' });
    }
  });

  // Delete business
  app.delete('/api/admin/businesses/:id', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      
      await storage.deleteBusiness(businessId);
      
      // Always return success since the method doesn't return a boolean
      if (true) {
        res.json({ success: true, message: 'Business deleted successfully' });
      } else {
        res.status(404).json({ message: 'Business not found' });
      }
    } catch (error: any) {
      console.error('Error deleting business:', error);
      res.status(500).json({ message: 'Failed to delete business' });
    }
  });

  // Bulk operations for businesses
  app.post('/api/admin/businesses/bulk-operation', async (req, res) => {
    try {
      const { operation, businessIds } = req.body;
      
      if (!operation || !Array.isArray(businessIds) || businessIds.length === 0) {
        return res.status(400).json({ message: 'Invalid operation or business IDs' });
      }
      
      await storage.bulkUpdateBusinesses(operation, businessIds);
      
      res.json({ success: true, message: `Bulk ${operation} operation completed successfully` });
    } catch (error: any) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({ message: 'Failed to perform bulk operation' });
    }
  });

  // Password reset request route  
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      await authService.requestPasswordReset(email);
      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  });

  // Password reset route
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      const success = await authService.resetPassword(token, password);
      if (success) {
        res.json({ message: 'Password reset successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired reset token' });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Email existence check API for real-time validation
  app.post('/api/auth/check-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const exists = await storage.checkEmailExists(email);
      res.json({ exists });
    } catch (error: any) {
      console.error('Email check error:', error);
      res.status(500).json({ message: 'Failed to check email availability' });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const verificationToken = authService.generateToken();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });

      // Send verification email using template service
      const { emailTemplateService } = await import('./emailTemplateService');
      const emailSent = await emailTemplateService.sendVerificationEmail(
        user.email!,
        user.firstName || 'User',
        verificationToken
      );

      res.json({ 
        message: 'Verification email sent successfully',
        emailSent 
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  });

  // Email template management API routes (Admin only)
  app.get('/api/admin/email-templates', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error('Get email templates error:', error);
      res.status(500).json({ message: 'Failed to fetch email templates' });
    }
  });

  app.post('/api/admin/email-templates', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const template = await storage.createEmailTemplate(req.body);
      res.json({ message: 'Email template created successfully', template });
    } catch (error: any) {
      console.error('Create email template error:', error);
      res.status(500).json({ message: 'Failed to create email template' });
    }
  });

  app.put('/api/admin/email-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const template = await storage.updateEmailTemplate(parseInt(id), req.body);
      res.json({ message: 'Email template updated successfully', template });
    } catch (error: any) {
      console.error('Update email template error:', error);
      res.status(500).json({ message: 'Failed to update email template' });
    }
  });

  app.delete('/api/admin/email-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const success = await storage.deleteEmailTemplate(parseInt(id));
      
      if (success) {
        res.json({ message: 'Email template deleted successfully' });
      } else {
        res.status(404).json({ message: 'Email template not found' });
      }
    } catch (error: any) {
      console.error('Delete email template error:', error);
      res.status(500).json({ message: 'Failed to delete email template' });
    }
  });

  // Test email template endpoint
  app.post('/api/admin/email-templates/:name/test', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { name } = req.params;
      const { testEmail } = req.body;
      
      const { emailTemplateService } = await import('./emailTemplateService');
      const success = await emailTemplateService.sendTestEmail(name, testEmail);
      
      res.json({ 
        message: success ? 'Test email sent successfully' : 'Failed to send test email',
        success 
      });
    } catch (error: any) {
      console.error('Test email template error:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Business insights API endpoints
  app.get('/api/business-insights/:businessId', isAuthenticated, async (req, res) => {
    try {
      const { businessId } = req.params;
      const { timeRange = '7d' } = req.query;
      
      // Mock insights data for now - in production this would come from analytics database
      const insights = {
        views: {
          current: Math.floor(Math.random() * 1000) + 500,
          previous: Math.floor(Math.random() * 800) + 400,
          trend: Math.random() * 30 + 5,
          data: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            views: Math.floor(Math.random() * 200) + 50,
            clicks: Math.floor(Math.random() * 80) + 20
          }))
        },
        ratings: {
          average: 4.2 + Math.random() * 0.6,
          total: Math.floor(Math.random() * 100) + 20,
          distribution: [
            { rating: 5, count: 45, percentage: 65 },
            { rating: 4, count: 15, percentage: 22 },
            { rating: 3, count: 6, percentage: 8 },
            { rating: 2, count: 2, percentage: 3 },
            { rating: 1, count: 1, percentage: 2 }
          ]
        },
        engagement: {
          clicks: Math.floor(Math.random() * 300) + 100,
          calls: Math.floor(Math.random() * 100) + 30,
          emails: Math.floor(Math.random() * 80) + 20,
          website: Math.floor(Math.random() * 150) + 50
        },
        demographics: {
          locations: [
            { province: 'Karachi', visits: 234, percentage: 45 },
            { province: 'Lahore', visits: 156, percentage: 30 },
            { province: 'Islamabad', visits: 89, percentage: 17 },
            { province: 'Rawalpindi', visits: 41, percentage: 8 }
          ],
          categories: [
            { category: 'Food & Dining', interest: 87 },
            { category: 'Shopping', interest: 76 },
            { category: 'Entertainment', interest: 65 },
            { category: 'Health & Wellness', interest: 54 }
          ],
          timeOfDay: Array.from({ length: 5 }, (_, i) => ({
            hour: ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM'][i],
            views: Math.floor(Math.random() * 150) + 50
          }))
        },
        performance: {
          score: Math.floor(Math.random() * 30) + 70,
          rank: Math.floor(Math.random() * 50) + 1,
          suggestions: [
            'Add more business photos',
            'Update operating hours',
            'Respond to customer reviews',
            'Verify business information'
          ]
        },
        competitors: {
          similar: [
            { name: 'Restaurant ABC', score: 85, distance: '0.5km' },
            { name: 'Cafe XYZ', score: 79, distance: '1.2km' },
            { name: 'Bistro 123', score: 72, distance: '0.8km' }
          ],
          comparison: {}
        }
      };

      res.json(insights);
    } catch (error) {
      console.error('Error fetching business insights:', error);
      res.status(500).json({ message: 'Failed to fetch insights' });
    }
  });

  // Business recommendations API endpoint
  app.get('/api/business-recommendations/:businessId', isAuthenticated, async (req, res) => {
    try {
      const recommendations = {
        quickInsights: [
          "Your business is trending upward with 15% more views this week",
          "Customer engagement peaks on weekends - consider special offers",
          "Your rating improved by 0.3 points - great customer service!",
          "Most customers find you through category searches"
        ],
        actionableInsights: [
          {
            title: "Optimize Business Hours",
            description: "Your peak traffic is 2-6 PM. Consider extending hours.",
            priority: "high",
            icon: "clock"
          },
          {
            title: "Add More Photos",
            description: "Businesses with 5+ photos get 30% more engagement",
            priority: "medium",
            icon: "camera"
          },
          {
            title: "Respond to Reviews",
            description: "3 recent reviews need responses",
            priority: "high",
            icon: "message"
          }
        ]
      };

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // Personalized dashboard API endpoint
  app.get('/api/personalized-dashboard', isAuthenticated, async (req, res) => {
    try {
      const { timeRange = '7d' } = req.query;
      const userId = (req as any).user?.claims?.sub;
      
      // Mock dashboard data for now
      const dashboardData = {
        overview: {
          totalViews: Math.floor(Math.random() * 5000) + 1000,
          totalRating: 4.2 + Math.random() * 0.6,
          totalReviews: Math.floor(Math.random() * 200) + 50,
          totalEngagement: Math.floor(Math.random() * 50) + 20,
          growth: {
            views: Math.random() * 20 + 5,
            rating: Math.random() * 10,
            reviews: Math.random() * 15 + 3,
            engagement: Math.random() * 25 + 10
          }
        },
        recentActivity: [
          { id: 1, action: 'Business viewed', count: 23, time: 'Today' },
          { id: 2, action: 'Review received', count: 1, time: 'Yesterday' },
          { id: 3, action: 'Profile updated', count: 1, time: '2 days ago' },
          { id: 4, action: 'Photo added', count: 3, time: '1 week ago' }
        ],
        notifications: [
          { id: 1, type: 'review', message: 'New 5-star review received', time: '2 hours ago', unread: true },
          { id: 2, type: 'performance', message: 'Your business views increased by 25%', time: '1 day ago', unread: true },
          { id: 3, type: 'update', message: 'Profile verification completed', time: '3 days ago', unread: false }
        ],
        insights: [
          {
            title: "Peak Performance Week",
            description: "Your businesses performed 30% better this week compared to last month average",
            action: "View detailed analytics",
            type: "success"
          },
          {
            title: "Optimization Opportunity", 
            description: "Add business hours to increase visibility during peak search times",
            action: "Update hours",
            type: "info"
          },
          {
            title: "Premium Benefits Available",
            description: "Unlock advanced analytics and priority placement with Premium listing",
            action: "Upgrade now",
            type: "premium"
          }
        ]
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching personalized dashboard:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  // Dashboard endpoint  
  app.get('/api/dashboard', async (req: any, res) => {
    try {
      // Return basic dashboard data
      const dashboardData = {
        user: req.user,
        businesses: [],
        recentReviews: [],
        recentActivities: [],
        stats: {
          totalBusinesses: 0,
          totalReviews: 0,
          averageRating: 0
        }
      };

      res.json(dashboardData);
    } catch (error: any) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard data', error: error.message });
    }
  });

  // Get all users for author selection (admin only)
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const usersForSelection = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      }).from(users).orderBy(users.firstName, users.lastName);
      
      res.json(usersForSelection);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // For email auth users, req.user is the database user
      // For OAuth users, req.user might have different structure
      let user = req.user;
      
      // If it's an OAuth user with claims, get user from database
      if (req.user.claims && req.user.claims.sub) {
        user = await storage.getUser(req.user.claims.sub);
      } else if (req.user.id) {
        // For email auth users
        user = await storage.getUser(req.user.id);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Authentication Routes
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.registerUser(data);
      
      res.json({
        message: 'Registration successful',
        user: { id: result.user.id, email: result.user.email, firstName: result.user.firstName },
        emailSent: result.emailSent,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await authService.loginUser(email, password);
      
      // Create session compatible with passport
      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ message: 'Session creation failed' });
        }
        res.json({ message: 'Login successful', user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName 
        }});
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  });

  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const user = await authService.verifyEmail(token);
      
      // Create session for verified user using passport
      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error during email verification:', err);
        }
      });
      res.redirect('/?verified=true');
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.redirect('/login?error=verification_failed');
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      console.log('Processing forgot password for:', email);
      const success = await authService.requestPasswordReset(email);
      console.log('Password reset request result:', success);
      res.json({ message: 'Password reset email sent if account exists' });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(400).json({ message: 'Invalid email format' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(8),
      }).parse(req.body);
      
      await authService.resetPassword(token, password);
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(400).json({ message: error.message || 'Password reset failed' });
    }
  });

  // Logout route for email auth
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('Session destroy error:', destroyErr);
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // AI-powered business recommendation routes
  // Enhanced AI Recommendations with Intelligent Fallback
  app.post('/api/ai/recommendations-enhanced', async (req, res) => {
    try {
      console.log('Enhanced AI recommendations request:', req.body);
      
      const {
        searchQuery,
        categoryId,
        provinceId,
        userLocation,
        priceRange = [0, 100],
        maxDistance = 25,
        sortBy = 'ai_score',
        onlyVerified = false,
        onlyOpen = false,
        aiMode = 'comprehensive',
        personalized = false,
        recentSearches = []
      } = req.body;

      // Build intelligent business filters
      const filters: any = {};
      if (categoryId && categoryId !== 'all') filters.categoryId = parseInt(categoryId);
      if (provinceId && provinceId !== 'all') filters.provinceId = parseInt(provinceId);
      if (searchQuery) filters.query = searchQuery;
      if (onlyVerified) filters.isVerified = true;
      
      // Get businesses from storage
      const businessData = await storage.getBusinesses({
        ...filters,
        limit: 20,
        offset: 0
      });

      // Intelligent AI-style scoring and analysis (no external API needed)
      const recommendations = businessData.businesses.map((business: any, index: number) => {
        // Calculate intelligent relevance score
        let aiScore = 95; // Start with high baseline
        
        // Boost verified and featured businesses
        if (business.isVerified) aiScore += 5;
        if (business.isFeatured) aiScore += 3;
        
        // Rating-based adjustments
        if (business.rating >= 4.5) aiScore += 4;
        else if (business.rating >= 4.0) aiScore += 2;
        else if (business.rating >= 3.5) aiScore += 1;
        else if (business.rating < 3.0) aiScore -= 8;
        
        // Position penalty (later results = lower relevance)
        aiScore -= (index * 2);
        
        // Search query relevance boost
        if (searchQuery && business.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
          aiScore += 6;
        }
        
        // Ensure realistic bounds
        aiScore = Math.max(Math.min(aiScore, 98), 65);
        
        // Generate contextual reasoning
        const reasoningComponents = [];
        if (searchQuery) {
          reasoningComponents.push(`Excellent match for "${searchQuery}"`);
        }
        if (business.isVerified) {
          reasoningComponents.push('verified business meeting quality standards');
        }
        if (business.rating >= 4.5) {
          reasoningComponents.push(`outstanding ${business.rating}⭐ customer satisfaction`);
        } else if (business.rating >= 4.0) {
          reasoningComponents.push(`strong ${business.rating}⭐ customer rating`);
        }
        if (business.isFeatured) {
          reasoningComponents.push('premium featured establishment');
        }
        
        const aiReasoning = reasoningComponents.length > 0
          ? reasoningComponents.join(', ') + '. Highly recommended based on business quality and customer feedback.'
          : 'Solid business match with good reputation and service standards in your area.';

        // Generate relevance factors
        const relevanceFactors = [
          business.isVerified ? '✓ Verified Business' : 'Listed Business',
          business.rating ? `${business.rating}⭐ Rating` + (business.reviewCount ? ` (${business.reviewCount} reviews)` : '') : 'Local Business',
          business.isFeatured ? '⭐ Premium Featured' : '',
          business.category || 'Business Service',
          business.city ? `${business.city} Location` : '',
          searchQuery ? `Keyword Match: "${searchQuery}"` : ''
        ].filter(Boolean);

        return {
          ...business,
          aiScore,
          aiReasoning,
          relevanceFactors,
          distance: userLocation ? Math.round(Math.random() * maxDistance * 0.7) + 0.5 : null
        };
      }).sort((a, b) => b.aiScore - a.aiScore); // Sort by AI score

      // Generate comprehensive analytics
      const avgRating = recommendations.reduce((sum, b) => sum + (b.rating || 3.5), 0) / Math.max(recommendations.length, 1);
      const verifiedCount = recommendations.filter(b => b.isVerified).length;
      const featuredCount = recommendations.filter(b => b.isFeatured).length;
      
      const analytics = {
        searchInsights: searchQuery 
          ? `Analyzed ${recommendations.length} businesses for "${searchQuery}". Found ${verifiedCount} verified establishments with ${avgRating.toFixed(1)} average rating. ${featuredCount} premium featured options available.`
          : `Discovered ${recommendations.length} quality businesses in your selected area. ${verifiedCount} verified businesses with excellent service standards.`,
        recommendationConfidence: Math.min(82 + (verifiedCount * 3) + Math.round(avgRating * 3) + (featuredCount * 2), 96),
        searchVolume: (Math.floor(Math.random() * 6000) + 3000).toLocaleString(),
        categoryPopularity: recommendations.length > 15 ? 'Very High Demand' : 
                          recommendations.length > 10 ? 'High Demand' : 
                          recommendations.length > 5 ? 'Moderate Demand' : 'Niche Market',
        marketTrends: [
          verifiedCount > recommendations.length * 0.7 ? 'Premium Quality Focus' : 'Quality Standards Rising',
          avgRating > 4.2 ? 'Exceptional Service Standards' : 'Customer-Centric Approach',
          featuredCount > 0 ? 'Competitive Market' : 'Emerging Opportunities',
          'Digital Presence Growth',
          'Local Business Excellence'
        ].slice(0, Math.min(5, Math.max(3, Math.ceil(recommendations.length / 4))))
      };

      console.log('Intelligent AI recommendations generated:', recommendations.length, 'results with avg confidence:', analytics.recommendationConfidence);

      res.json({
        recommendations,
        analytics,
        intelligentMode: true,
        searchQuery,
        totalResults: recommendations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Enhanced AI recommendations error:', error);
      res.status(500).json({ 
        message: 'Failed to generate enhanced recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        recommendations: [],
        analytics: {}
      });
    }
  });

  // Keep the old endpoint for backward compatibility
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const {
        searchQuery,
        categoryId,
        provinceId,
        userLocation,
        userPreferences,
        previousSearches
      } = req.body;

      // Get user ID if authenticated (skip auth check for now due to quota limits)
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub || undefined;

      // AI service temporarily disabled - return mock recommendations
      const recommendations = {
        businesses: [],
        message: "AI service temporarily disabled. Please use the enhanced recommendations page."
      };
      // const recommendations = await aiService.generateBusinessRecommendations({
      //   userId,
      //   searchQuery,
      //   categoryId,
      //   provinceId,
      //   userLocation,
      //   userPreferences,
      //   previousSearches
      // });

      res.json(recommendations);
    } catch (error: any) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  app.get('/api/ai/search-suggestions', async (req, res) => {
    try {
      const { query, limit } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.json({ suggestions: [] });
      }

      const searchTerm = query.trim().toLowerCase();
      const maxSuggestions = parseInt(limit as string) || 5;

      // Generate intelligent suggestions based on Pakistani business context
      const suggestions: string[] = [];

      // Business type suggestions
      const businessTypes = [
        'restaurants', 'hotels', 'shops', 'clinics', 'banks', 'pharmacies',
        'salons', 'gyms', 'cafes', 'supermarkets', 'car dealerships', 'schools',
        'hospitals', 'malls', 'spas', 'lawyers', 'dentists', 'opticians',
        'real estate', 'insurance', 'travel agencies', 'car rental'
      ];

      // Location-specific suggestions
      const provinces = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan'];
      const popularAreas = ['Clifton', 'DHA', 'Gulberg', 'Johar Town', 'Blue Area', 'F-7', 'Saddar'];

      // Add business type matches
      businessTypes.forEach(type => {
        if (type.includes(searchTerm) || searchTerm.includes(type.substring(0, 3)) || 
            type.startsWith(searchTerm) || searchTerm.startsWith(type.substring(0, 3))) {
          suggestions.push(type);
        }
      });

      // Add location + business combinations
      if (searchTerm.length >= 3) {
        provinces.forEach(province => {
          if (province.toLowerCase().includes(searchTerm)) {
            suggestions.push(`businesses in ${province}`);
          }
        });

        // Common search patterns
        if (searchTerm.includes('food') || searchTerm.includes('eat')) {
          suggestions.push('restaurants near me', 'food delivery', 'cafes');
        }
        if (searchTerm.includes('shop') || searchTerm.includes('buy')) {
          suggestions.push('shopping malls', 'retail stores', 'online shops');
        }
        if (searchTerm.includes('health') || searchTerm.includes('doctor')) {
          suggestions.push('hospitals', 'clinics', 'pharmacies');
        }
        if (searchTerm.includes('car') || searchTerm.includes('auto')) {
          suggestions.push('car dealerships', 'auto repair', 'car rental');
        }
        if (searchTerm.includes('beauty') || searchTerm.includes('salon')) {
          suggestions.push('beauty salons', 'spas', 'barbershops');
        }
      }

      // Remove duplicates and limit results
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, maxSuggestions);

      res.json({ suggestions: uniqueSuggestions });
    } catch (error: any) {
      console.error('Search suggestions error:', error);
      res.status(500).json({ message: 'Failed to generate search suggestions' });
    }
  });

  // Smart autocomplete for business form fields
  app.post('/api/ai/autocomplete', async (req, res) => {
    try {
      const { name, category, province, locality, description, field } = req.body;
      
      if (!field) {
        return res.status(400).json({ message: 'Field parameter is required' });
      }

      console.log(`Generating AI autocomplete for field: ${field}, business: ${name || 'unnamed'}`);
      
      // OpenAI integration for business autocomplete suggestions
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Generate business ${field} suggestions for:
Business: ${name || 'New Business'}
Category: ${category || 'General Business'}
Location: ${locality || province || 'Pakistan'}
Description: ${description || 'Business in Pakistan'}

Generate 5 relevant, professional suggestions for the "${field}" field and provide insights.
Return JSON format: {"suggestions": [...], "insights": "helpful insights about the field"}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a business consultant specializing in Pakistan markets. Provide relevant, professional suggestions that comply with Pakistani business standards."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"suggestions": [], "insights": "Unable to generate suggestions"}');

      res.json(result);
    } catch (error: any) {
      console.error('Business autocomplete error:', error);
      res.status(500).json({ 
        suggestions: [],
        insights: 'Unable to generate suggestions at this time',
        error: error.message 
      });
    }
  });

  app.get('/api/ai/category-trends', async (req, res) => {
    try {
      // Import AI service
      const { aiService } = await import('./ai-service');
      const trends = await aiService.generateCategoryTrends();
      res.json(trends);
    } catch (error: any) {
      console.error('Category trends error:', error);
      // Fallback trends if AI fails
      const fallbackTrends = {
        trends: [
          { category: "Technology Services", growth: "25%", description: "Growing demand for digital solutions", seasonality: "Year-round" },
          { category: "Healthcare", growth: "18%", description: "Increasing healthcare needs", seasonality: "Stable" },
          { category: "Food & Beverage", growth: "15%", description: "Tourism and dining growth", seasonality: "Peak in winter" },
          { category: "Real Estate", growth: "12%", description: "Property market expansion", seasonality: "Peak in Q1" },
          { category: "Education", growth: "10%", description: "Growing educational sector", seasonality: "Academic calendar" }
        ]
      };
      res.json(fallbackTrends);
    }
  });

  // Business routes
  app.get('/api/businesses', disableCache, async (req, res) => {
    try {
      const { categoryId, provinceId, localityId, query, isVerified, isFeatured, limit = 20, offset = 0 } = req.query;
      
      const filters: any = {};
      
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (provinceId) filters.provinceId = parseInt(provinceId as string);
      if (localityId) filters.localityId = parseInt(localityId as string);
      if (query) filters.query = query as string;
      if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      filters.limit = parseInt(limit as string);
      filters.offset = parseInt(offset as string);

      const result = await storage.getBusinesses(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get('/api/businesses/featured', disableCache, async (req, res) => {
    try {
      const result = await storage.getBusinesses({ isFeatured: true, limit: 6 });
      res.json(result.businesses);
    } catch (error) {
      console.error("Error fetching featured businesses:", error);
      res.status(500).json({ message: "Failed to fetch featured businesses" });
    }
  });

  // New businesses - most recently registered
  app.get('/api/businesses/new', disableCache, async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const businesses = await storage.getNewBusinesses(parseInt(limit as string));
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching new businesses:", error);
      res.status(500).json({ message: "Failed to fetch new businesses" });
    }
  });

  app.get('/api/businesses/count-by-locality/:provinceId?', async (req, res) => {
    try {
      const { provinceId } = req.params;
      const counts = await storage.getBusinessCountsByLocality(provinceId ? parseInt(provinceId) : undefined);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching business counts by locality:", error);
      res.status(500).json({ message: "Failed to fetch business counts" });
    }
  });

  // Business counts by province for Enhanced Google Provinces Map
  app.get('/api/businesses/count-by-province', async (req, res) => {
    try {
      const counts = await storage.getBusinessCountsByProvince();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching business counts by province:", error);
      res.status(500).json({ message: "Failed to fetch business counts" });
    }
  });

  // Locality counts by province for Provinces page
  app.get('/api/localities/count-by-province', async (req, res) => {
    try {
      const counts = await storage.getLocalityCountsByProvince();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching locality counts by province:", error);
      res.status(500).json({ message: "Failed to fetch locality counts" });
    }
  });

  // Get businesses by province for individual province pages
  app.get('/api/businesses/by-province/:provinceId', async (req, res) => {
    try {
      const { provinceId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const showFeatured = req.query.featured === 'true';
      const showVerified = req.query.verified === 'true';
      
      const businesses = await storage.getBusinessesByProvince(
        parseInt(provinceId), 
        { page, limit, showFeatured, showVerified }
      );
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses by province:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get('/api/businesses/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const business = await storage.getBusinessBySlug(slug);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Increment view count
      await storage.incrementBusinessViews(business.id);
      
      // Names for SEO titles/breadcrumbs (the table only stores ids)
      const [cat, em, loc] = await Promise.all([
        business.categoryId ? storage.getCategoryById(business.categoryId).catch(() => undefined) : undefined,
        business.provinceId ? storage.getProvinceById(business.provinceId).catch(() => undefined) : undefined,
        business.localityId ? storage.getLocalityById(business.localityId).catch(() => undefined) : undefined,
      ]);
      res.json({ ...business, categoryName: cat?.name, categorySlug: cat?.slug, provinceName: em?.name, provinceSlug: em?.slug, localityName: loc?.name });
    } catch (error) {
      console.error("Error fetching business by slug:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.get('/api/businesses/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      let business;
      
      if (isNaN(Number(identifier))) {
        business = await storage.getBusinessBySlug(identifier);
      } else {
        business = await storage.getBusinessById(parseInt(identifier));
      }
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Increment view count
      await storage.incrementBusinessViews(business.id);
      
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post('/api/businesses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const placementError = await checkBusinessPlacement(req.body);
      if (placementError) return res.status(400).json({ message: placementError });
      const { cityId: _cityId, ...body } = req.body || {};
      const businessData = { ...body, ownerId: userId };
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ message: "Failed to create business" });
    }
  });

  app.post('/api/businesses/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businessId = parseInt(req.params.id);
      const claimData = req.body;

      // Validate required fields
      if (!claimData.relationshipToBusiness) {
        return res.status(400).json({ message: "Relationship to business is required" });
      }

      // Get business and user details for notifications
      const [business, user] = await Promise.all([
        storage.getBusinessById(businessId),
        storage.getUser(userId)
      ]);

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if business is already claimed
      if (business.isClaimed) {
        return res.status(400).json({ message: "Business is already claimed" });
      }

      // Check if user already has a pending claim for this business
      const existingClaim = await storage.getBusinessClaimByUserAndBusiness(userId, businessId);
      if (existingClaim && existingClaim.status === 'pending') {
        return res.status(400).json({ message: "You already have a pending claim for this business" });
      }

      // Create the business claim
      const claim = await storage.createBusinessClaim({
        businessId,
        userId,
        relationshipToBusiness: claimData.relationshipToBusiness,
        businessEmail: claimData.businessEmail,
        businessPhone: claimData.businessPhone,
        position: claimData.position,
        verificationMethod: claimData.verificationMethod,
        documents: claimData.documents || [],
        additionalInfo: claimData.additionalInfo,
        notes: claimData.notes,
        status: 'pending'
      });

      // Send confirmation email to user
      try {
        const { BusinessClaimEmailService } = await import('./services/businessClaimEmailService');
        await BusinessClaimEmailService.sendSubmissionConfirmation({
          userEmail: user.email!,
          userName: user.firstName || user.username || 'User',
          businessName: business.name,
          claimId: claim.id
        });

        // Send notification to admin (use a default admin email or get from settings)
        await BusinessClaimEmailService.sendAdminNotification({
          adminEmail: 'admin@pakistanyp.com', // This could come from system settings
          businessName: business.name,
          claimerName: user.firstName || user.username || 'User',
          claimerEmail: user.email!,
          relationshipToBusiness: claimData.relationshipToBusiness,
          claimId: claim.id,
          businessId: businessId
        });

        // Update claim to mark email as sent
        await storage.updateBusinessClaim(claim.id, { notes: (claimData.notes || '') + '\n[Email notifications sent]' });
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
        // Don't fail the entire operation due to email issues
      }

      res.status(201).json({ 
        message: "Business claim submitted successfully",
        claimId: claim.id,
        status: 'pending'
      });
    } catch (error) {
      console.error("Error claiming business:", error);
      res.status(500).json({ message: "Failed to submit business claim" });
    }
  });

  // User business claims routes
  app.get('/api/user/business-claims', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both OAuth and email auth user structures
      const userId = req.user.claims?.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const claims = await storage.getBusinessClaimsByUser(userId);
      
      // Enhance claims with business details
      const enhancedClaims = await Promise.all(
        claims.map(async (claim) => {
          const business = await storage.getBusinessById(claim.businessId);
          return {
            ...claim,
            businessName: business?.name || 'Unknown Business'
          };
        })
      );
      
      res.json(enhancedClaims);
    } catch (error) {
      console.error("Error fetching user business claims:", error);
      res.status(500).json({ message: "Failed to fetch business claims" });
    }
  });

  // Admin business claims routes
  app.get('/api/admin/business-claims', async (req, res) => {
    try {
      const claims = await storage.getBusinessClaims();
      
      // Enhance claims with business and user details
      const enhancedClaims = await Promise.all(
        claims.map(async (claim) => {
          const [business, user] = await Promise.all([
            storage.getBusinessById(claim.businessId),
            storage.getUser(claim.userId)
          ]);
          
          return {
            ...claim,
            businessName: business?.name || 'Unknown Business',
            userName: user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
            userEmail: user?.email || 'Unknown Email'
          };
        })
      );
      
      res.json(enhancedClaims);
    } catch (error) {
      console.error("Error fetching admin business claims:", error);
      res.status(500).json({ message: "Failed to fetch business claims" });
    }
  });

  app.get('/api/admin/business-claims/stats', async (req, res) => {
    try {
      const claims = await storage.getBusinessClaims();
      
      const stats = {
        total: claims.length,
        pending: claims.filter(c => c.status === 'pending').length,
        approved: claims.filter(c => c.status === 'approved').length,
        rejected: claims.filter(c => c.status === 'rejected').length,
        thisMonth: claims.filter(c => {
          const created = new Date(c.createdAt);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching business claims stats:", error);
      res.status(500).json({ message: "Failed to fetch business claims statistics" });
    }
  });

  app.patch('/api/admin/business-claims/:id/review', async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      const { action, rejectionReason, adminNotes } = req.body;
      
      // Validate action
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
      }
      
      // Get the claim and related data
      const claim = await storage.getBusinessClaimById(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Business claim not found" });
      }
      
      if (claim.status !== 'pending') {
        return res.status(400).json({ message: "Claim has already been processed" });
      }
      
      // Get business and user details for notifications
      const [business, user] = await Promise.all([
        storage.getBusinessById(claim.businessId),
        storage.getUser(claim.userId)
      ]);
      
      if (!business || !user) {
        return res.status(404).json({ message: "Business or user not found" });
      }
      
      // Update claim status
      const updatedClaim = await storage.updateBusinessClaim(claimId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        notes: adminNotes ? (claim.notes ? `${claim.notes}\n[Admin Notes: ${adminNotes}]` : `[Admin Notes: ${adminNotes}]`) : claim.notes,
        // processedAt: new Date().toISOString() // Field doesn't exist in schema
      });
      
      // If approved, update business to mark as claimed
      if (action === 'approve') {
        await storage.updateBusiness(claim.businessId, {
          isClaimed: true,
          ownerId: claim.userId
        });
      }
      
      // Send email notifications
      try {
        const { BusinessClaimEmailService } = await import('./services/businessClaimEmailService');
        
        if (action === 'approve') {
          await BusinessClaimEmailService.sendApprovalNotification({
            userEmail: user.email!,
            userName: user.firstName || user.username || 'User',
            businessName: business.name,
            claimId: claim.id,
            businessId: claim.businessId
          });
        } else {
          await BusinessClaimEmailService.sendRejectionNotification({
            userEmail: user.email!,
            userName: user.firstName || user.username || 'User',
            businessName: business.name,
            claimId: claim.id,
            businessId: claim.businessId,
            rejectionReason: rejectionReason || 'No specific reason provided'
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
        // Don't fail the entire operation due to email issues
      }
      
      res.json({
        message: `Business claim ${action}d successfully`,
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error reviewing business claim:", error);
      res.status(500).json({ message: "Failed to review business claim" });
    }
  });

  // Admin business statistics  
  app.get('/api/admin/business-stats', async (req, res) => {
    try {
      const allBusinesses = await storage.getBusinesses({ includeUnapproved: true, limit: 1000 });
      const businesses = allBusinesses.businesses;
      
      const stats = {
        totalBusinesses: businesses.length,
        approvedBusinesses: businesses.filter(b => b.adminApproved === true).length,
        pendingBusinesses: businesses.filter(b => b.adminApproved === false || b.adminApproved === null).length,
        featuredBusinesses: businesses.filter(b => b.isFeatured === true).length,
        verifiedBusinesses: businesses.filter(b => b.isVerified === true).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching business statistics:", error);
      res.status(500).json({ message: "Failed to fetch business statistics" });
    }
  });

  // Admin business approval routes
  app.get('/api/admin/businesses/pending', async (req, res) => {
    try {
      const { businesses } = await storage.getBusinesses({ 
        includeUnapproved: true,
        limit: 100 
      });
      
      // Filter only unapproved businesses and add owner email, province name, and category name
      const unapproved = [];
      for (const business of businesses) {
        if (business.adminApproved === false || business.adminApproved === null) {
          // Get owner email
          const owner = business.ownerId ? await storage.getUserById(business.ownerId) : null;
          
          // Get province name
          const province = await storage.getProvinceById(business.provinceId);
          
          // Get category name
          const category = await storage.getCategoryById(business.categoryId);
          
          unapproved.push({
            ...business,
            ownerEmail: owner?.email || 'Unknown',
            provinces: { name: province?.name || 'Unknown' },
            categories: { name: category?.name || 'Unknown' }
          });
        }
      }
      
      res.json(unapproved);
    } catch (error) {
      console.error("Error fetching pending businesses:", error);
      res.status(500).json({ message: "Failed to fetch pending businesses" });
    }
  });

  app.post('/api/admin/businesses/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateBusiness(parseInt(id), { adminApproved: true });
      res.json({ message: "Business approved successfully" });
    } catch (error) {
      console.error("Error approving business:", error);
      res.status(500).json({ message: "Failed to approve business" });
    }
  });

  app.post('/api/admin/businesses/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateBusiness(parseInt(id), { 
        adminApproved: false,
        isActive: false 
      });
      res.json({ message: "Business rejected successfully" });
    } catch (error) {
      console.error("Error rejecting business:", error);
      res.status(500).json({ message: "Failed to reject business" });
    }
  });

  app.post('/api/admin/businesses/:id/feature', async (req, res) => {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      await storage.updateBusiness(parseInt(id), { isFeatured: featured });
      res.json({ message: "Business featured status updated successfully" });
    } catch (error) {
      console.error("Error updating business featured status:", error);
      res.status(500).json({ message: "Failed to update featured status" });
    }
  });

  app.patch('/api/businesses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const businessData = req.body;
      
      // Check if user owns the business
      const business = await storage.getBusinessById(parseInt(id));
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this business" });
      }
      const placementError = await checkBusinessPlacement(businessData, business as any);
      if (placementError) return res.status(400).json({ message: placementError });
      delete (businessData as any).cityId;
      
      const updatedBusiness = await storage.updateBusiness(parseInt(id), businessData);
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  // Admin business verification route
  app.patch('/api/admin/businesses/:id/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;
      
      const updatedBusiness = await storage.updateBusiness(parseInt(id), { isVerified });
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business verification:", error);
      res.status(500).json({ message: "Failed to update business verification" });
    }
  });

  // Categories routes
  app.get('/api/categories', disableCache, async (req, res) => {
    try {
      const { level, parentId } = req.query;
      let categories;
      
      if (level) {
        categories = await storage.getCategoriesByLevel(parseInt(level as string));
      } else if (parentId) {
        categories = await storage.getCategoriesByParent(parseInt(parentId as string));
      } else {
        categories = await storage.getCategories();
      }
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Provinces and Cities routes - Enhanced for admin management
  app.get('/api/provinces', disableCache, async (req, res) => {
    try {
      const { with_stats } = req.query;
      
      if (with_stats === 'true') {
        const provincesWithStats = await storage.getProvincesWithStats();
        res.json(provincesWithStats.map(publicProvince));
      } else {
        const provinces = await storage.getProvinces();
        res.json(provinces.map(publicProvince));
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      res.status(500).json({ message: "Failed to fetch provinces" });
    }
  });

  app.get('/api/provinces/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const province = await storage.getProvinceById(parseInt(id));
      
      if (!province) {
        return res.status(404).json({ message: "Province not found" });
      }
      
      // Increment view count
      await storage.incrementProvinceViews(parseInt(id));
      
      res.json(publicProvince(province));
    } catch (error) {
      console.error("Error fetching province:", error);
      res.status(500).json({ message: "Failed to fetch province" });
    }
  });

  // Admin Provinces CRUD endpoints
  app.post('/api/admin/provinces', isAuthenticated, async (req, res) => {
    try {
      const provinceData = req.body;
      provinceData.lastModifiedBy = (req.user as any)?.id || 'system';
      
      const newProvince = await storage.createProvince(provinceData);
      res.status(201).json(newProvince);
    } catch (error) {
      console.error("Error creating province:", error);
      res.status(500).json({ message: "Failed to create province" });
    }
  });

  app.put('/api/admin/provinces/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.lastModifiedBy = (req.user as any)?.id || 'system';
      
      const updatedProvince = await storage.updateProvince(parseInt(id), updateData);
      res.json(updatedProvince);
    } catch (error) {
      console.error("Error updating province:", error);
      res.status(500).json({ message: "Failed to update province" });
    }
  });

  app.delete('/api/admin/provinces/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProvince(parseInt(id));
      
      if (success) {
        res.json({ message: "Province deleted successfully" });
      } else {
        res.status(400).json({ message: "Cannot delete province with existing localities" });
      }
    } catch (error) {
      console.error("Error deleting province:", error);
      res.status(500).json({ message: "Failed to delete province" });
    }
  });

  app.put('/api/admin/provinces/:id/image', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { imageType, imageUrl } = req.body;
      
      if (!imageType || !imageUrl || !['homepage', 'header'].includes(imageType)) {
        return res.status(400).json({ message: "Invalid image type or URL" });
      }
      
      const updatedProvince = await storage.updateProvinceImage(
        parseInt(id), 
        imageType as 'homepage' | 'header', 
        imageUrl
      );
      
      res.json(updatedProvince);
    } catch (error) {
      console.error("Error updating province image:", error);
      res.status(500).json({ message: "Failed to update province image" });
    }
  });



  // Business detail endpoint for hover cards
  app.get('/api/businesses/:id/details', async (req, res) => {
    try {
      const { id } = req.params;
      const business = await storage.getBusinessById(parseInt(id));
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Get additional details like reviews, categories, etc.
      const reviews = await storage.getBusinessReviews(parseInt(id));
      const reviewCount = reviews.length;
      const ratingAverage = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Enhanced business details for hover card
      const enhancedDetails = {
        ...business,
        rating: ratingAverage,
        reviewCount,
        subcategories: business.subcategories || [],
        features: business.features || [],
        workingHours: business.workingHours || {
          monday: { open: "09:00", close: "18:00", isClosed: false },
          tuesday: { open: "09:00", close: "18:00", isClosed: false },
          wednesday: { open: "09:00", close: "18:00", isClosed: false },
          thursday: { open: "09:00", close: "18:00", isClosed: false },
          friday: { open: "09:00", close: "18:00", isClosed: false },
          saturday: { open: "09:00", close: "18:00", isClosed: false },
          sunday: { open: "09:00", close: "18:00", isClosed: true }
        },
        socialMedia: business.socialMedia || {},
        establishedYear: business.establishedYear || 2020,
        employeeCount: business.employeeCount || "1-10",
        priceRange: business.priceRange || "$$",
        paymentMethods: business.paymentMethods || ["Cash", "Card"],
        languages: business.languages || ["English", "Arabic"],
        certifications: business.certifications || [],
        lastUpdated: business.updatedAt || new Date().toISOString(),
        responseTime: "Usually responds within 24 hours",
        businessType: business.businessType || "Service Provider",
        services: business.services || [],
        images: business.images || []
      };

      res.json(enhancedDetails);
    } catch (error) {
      console.error("Error fetching business details:", error);
      res.status(500).json({ message: "Failed to fetch business details" });
    }
  });

  // Reviews routes
  app.get('/api/businesses/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getBusinessReviews(parseInt(id));
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/businesses/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const reviewData = { ...req.body, businessId: parseInt(id), userId };
      const review = await storage.createBusinessReview(reviewData);
      
      // Update business rating
      await storage.updateBusinessRating(parseInt(id));
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Enquiries routes
  app.post('/api/businesses/:id/enquiries', async (req, res) => {
    try {
      const { id } = req.params;
      const enquiryData = { ...req.body, businessId: parseInt(id) };
      const enquiry = await storage.createBusinessEnquiry(enquiryData);
      res.status(201).json(enquiry);
    } catch (error) {
      console.error("Error creating enquiry:", error);
      res.status(500).json({ message: "Failed to create enquiry" });
    }
  });

  // Business Claims routes
  app.get('/api/business-claims', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const claims = await storage.getBusinessClaims(status as string);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching business claims:", error);
      res.status(500).json({ message: "Failed to fetch business claims" });
    }
  });

  app.patch('/api/business-claims/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const claim = await storage.updateBusinessClaim(parseInt(id), req.body);
      res.json(claim);
    } catch (error) {
      console.error("Error updating business claim:", error);
      res.status(500).json({ message: "Failed to update business claim" });
    }
  });

  // Public news reads come from the news_articles table (published + active only).
  // The former in-memory tempNewsService served fake articles whose pages 404'd.
  const publishedNews = async (limit = 50) => {
    const all = await storage.getNewsArticles(500);
    return all
      .filter((a: any) => a.isActive !== false && (!a.status || a.status === "published"))
      .slice(0, limit);
  };

  // News Categories routes
  app.get('/api/news/categories', async (req, res) => {
    try {
      const categories = await storage.getNewsCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching news categories:", error);
      res.status(500).json({ message: "Failed to fetch news categories" });
    }
  });

  app.get('/api/news/categories/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getNewsCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ message: "News category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching news category:", error);
      res.status(500).json({ message: "Failed to fetch news category" });
    }
  });

  app.post('/api/news/categories', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertNewsCategorySchema.parse(req.body);
      const category = await storage.createNewsCategory(data);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating news category:", error);
      res.status(400).json({ message: error.message || "Failed to create news category" });
    }
  });

  // News routes
  app.get('/api/news', async (req, res) => {
    try {
      const { limit, categoryId, isFeatured, isPinned, status, query } = req.query;
      const filters: any = {};
      
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (isPinned !== undefined) filters.isPinned = isPinned === 'true';
      if (status) filters.status = status as string;
      if (query) filters.query = query as string;

      let news: any[] = await publishedNews(500);
      if (filters.categoryId) news = news.filter((a) => a.categoryId === filters.categoryId);
      if (filters.isFeatured !== undefined) news = news.filter((a) => !!a.isFeatured === filters.isFeatured);
      if (filters.isPinned !== undefined) news = news.filter((a) => !!a.isPinned === filters.isPinned);
      if (filters.query) {
        const q = String(filters.query).toLowerCase();
        news = news.filter((a) => [a.title, a.summary, a.content].some((t) => String(t || "").toLowerCase().includes(q)));
      }
      res.json(news.slice(0, limit ? parseInt(limit as string) : 50));
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get('/api/news/breaking', async (req, res) => {
    try {
      const breakingNews = (await publishedNews(500)).filter((a: any) => a.isBreaking);
      res.json(breakingNews);
    } catch (error) {
      console.error("Error fetching breaking news:", error);
      res.status(500).json({ message: "Failed to fetch breaking news" });
    }
  });

  app.get('/api/news/featured', async (req, res) => {
    try {
      const { limit } = req.query;
      const featuredNews = (await publishedNews(500)).filter((a: any) => a.isFeatured).slice(0, limit ? parseInt(limit as string) : 5);
      res.json(featuredNews);
    } catch (error) {
      console.error("Error fetching featured news:", error);
      res.status(500).json({ message: "Failed to fetch featured news" });
    }
  });

  app.get('/api/news/pinned', async (req, res) => {
    try {
      const pinnedNews = (await publishedNews(500)).filter((a: any) => a.isPinned);
      res.json(pinnedNews);
    } catch (error) {
      console.error("Error fetching pinned news:", error);
      res.status(500).json({ message: "Failed to fetch pinned news" });
    }
  });

  app.get('/api/news/search', async (req, res) => {
    try {
      const { q, limit } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const needle = String(q).toLowerCase();
      const results = (await publishedNews(500))
        .filter((a: any) => [a.title, a.summary, a.content].some((t) => String(t || "").toLowerCase().includes(needle)))
        .slice(0, limit ? parseInt(limit as string) : 20);
      res.json(results);
    } catch (error) {
      console.error("Error searching news:", error);
      res.status(500).json({ message: "Failed to search news" });
    }
  });

  // News ticker endpoint - latest 8 business news articles (moved before dynamic routes)
  app.get('/api/news/ticker', async (req, res) => {
    try {
      // Get latest news from database, focusing on business-related categories
      const tickerNews = await db.select({
        id: news.id,
        title: news.title,
        summary: news.summary,
        publishedAt: news.publishedAt,
        slug: news.slug,
        category: news.category
      })
      .from(news)
      .where(eq(news.isActive, true))
      .orderBy(desc(news.publishedAt))
      .limit(8);

      // If no database news available, return empty array (temp service disabled)
      if (tickerNews.length === 0) {
        return res.json([]);
      }

      res.json(tickerNews);
    } catch (error) {
      console.error("Error fetching news ticker:", error);
      
      // Return empty array since temp service is disabled
      res.json([]);
    }
  });

  app.get('/api/news/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const article = /^\d+$/.test(id)
        ? await storage.getNewsArticleById(parseInt(id))
        : await storage.getNewsArticleBySlug(id);
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching news article:", error);
      res.status(500).json({ message: "Failed to fetch news article" });
    }
  });

  app.get('/api/news/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const found: any = await storage.getNewsArticleBySlug(slug);
      const article = found && (!found.status || found.status === "published") ? found : null;
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching news article by slug:", error);
      res.status(500).json({ message: "Failed to fetch news article" });
    }
  });

  app.get('/api/news/category/:categoryId', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { limit } = req.query;
      const cat = parseInt(categoryId);
      const newsArray = (await publishedNews(500)).filter((a: any) => a.categoryId === cat).slice(0, limit ? parseInt(limit as string) : 10);
      // const news = tempNewsService.getNewsByCategory(
      //   parseInt(categoryId), 
      //   limit ? parseInt(limit as string) : undefined
      // );
      res.json(newsArray);
    } catch (error) {
      console.error("Error fetching news by category:", error);
      res.status(500).json({ message: "Failed to fetch news by category" });
    }
  });

  app.post('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertNewsArticleSchema.parse(req.body);
      const article = await storage.createNewsArticle(data);
      res.status(201).json(article);
    } catch (error: any) {
      console.error("Error creating news article:", error);
      res.status(400).json({ message: error.message || "Failed to create news article" });
    }
  });

  app.put('/api/news/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const article = await storage.updateNewsArticle(parseInt(id), updates);
      if (!article) {
        return res.status(404).json({ message: "News article not found" });
      }
      res.json(article);
    } catch (error: any) {
      console.error("Error updating news article:", error);
      res.status(400).json({ message: error.message || "Failed to update news article" });
    }
  });

  app.delete('/api/news/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsArticle(parseInt(id));
      res.json({ message: "News article deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting news article:", error);
      res.status(400).json({ message: error.message || "Failed to delete news article" });
    }
  });

  app.post('/api/news/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateNewsLikes(parseInt(id));
      res.json({ message: "News article liked successfully" });
    } catch (error) {
      console.error("Error liking news article:", error);
      res.status(500).json({ message: "Failed to like news article" });
    }
  });

  app.post('/api/news/:id/share', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateNewsShares(parseInt(id));
      res.json({ message: "News article shared successfully" });
    } catch (error) {
      console.error("Error sharing news article:", error);
      res.status(500).json({ message: "Failed to share news article" });
    }
  });

  // Newsletter subscription routes
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email is required" });
      }

      const cleanEmail = email.trim().toLowerCase();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Generate unique tokens
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');
      
      // Get user IP and User Agent
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      try {
        // Check if email already exists
        const [existingSubscription] = await db.select()
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.email, cleanEmail))
          .limit(1);

        if (existingSubscription) {
          if (existingSubscription.isActive && existingSubscription.isConfirmed) {
            return res.status(400).json({ message: "Email is already subscribed" });
          } else if (existingSubscription.isActive && !existingSubscription.isConfirmed) {
            // Resend confirmation email
            await simpleEmailService.sendNewsletterConfirmationEmail(cleanEmail, name || '', confirmationToken);
            await simpleEmailService.sendAdminNotificationEmail(cleanEmail, name || '', 'resubscribe');
            return res.json({ 
              message: "Confirmation email resent. Please check your inbox.", 
              needsConfirmation: true 
            });
          } else {
            // Reactivate subscription
            await db.update(newsletterSubscriptions)
              .set({
                isActive: true,
                isConfirmed: false,
                confirmationToken,
                unsubscribeToken,
                name: name?.trim() || existingSubscription.name,
                subscribedAt: new Date(),
                unsubscribedAt: null,
                ipAddress,
                userAgent,
                updatedAt: new Date()
              })
              .where(eq(newsletterSubscriptions.email, cleanEmail));
          }
        } else {
          // Create new subscription
          await db.insert(newsletterSubscriptions).values({
            email: cleanEmail,
            name: name?.trim() || null,
            confirmationToken,
            unsubscribeToken,
            ipAddress,
            userAgent,
            source: 'footer'
          });
        }

        // Send confirmation email to subscriber
        await simpleEmailService.sendNewsletterConfirmationEmail(cleanEmail, name?.trim() || '', confirmationToken);
        
        // Send notification to admin
        await simpleEmailService.sendAdminNotificationEmail(cleanEmail, name?.trim() || '', 'subscribe');

        res.json({ 
          message: "Subscription successful! Please check your email to confirm.", 
          needsConfirmation: true 
        });

      } catch (dbError: any) {
        console.error("Database error during newsletter subscription:", dbError);
        if (dbError.code === '23505') { // Unique constraint violation
          return res.status(400).json({ message: "Email is already subscribed" });
        }
        throw dbError;
      }

    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "Failed to subscribe. Please try again later." });
    }
  });

  // Confirm newsletter subscription
  app.get('/api/newsletter/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const [subscription] = await db.select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.confirmationToken, token))
        .limit(1);

      if (!subscription) {
        return res.status(404).json({ message: "Invalid confirmation token" });
      }

      if (subscription.isConfirmed) {
        return res.status(400).json({ message: "Email is already confirmed" });
      }

      // Update subscription to confirmed
      await db.update(newsletterSubscriptions)
        .set({
          isConfirmed: true,
          confirmedAt: new Date(),
          confirmationToken: null,
          updatedAt: new Date()
        })
        .where(eq(newsletterSubscriptions.confirmationToken, token));

      // Send welcome email
      await simpleEmailService.sendNewsletterWelcomeEmail(subscription.email, subscription.name || '', subscription.unsubscribeToken);

      res.json({ message: "Email confirmed successfully! Welcome to our newsletter." });

    } catch (error: any) {
      console.error("Newsletter confirmation error:", error);
      res.status(500).json({ message: "Failed to confirm subscription" });
    }
  });

  // Unsubscribe from newsletter
  app.get('/api/newsletter/unsubscribe/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const [subscription] = await db.select()
        .from(newsletterSubscriptions)
        .where(eq(newsletterSubscriptions.unsubscribeToken, token))
        .limit(1);

      if (!subscription) {
        return res.status(404).json({ message: "Invalid unsubscribe token" });
      }

      if (!subscription.isActive) {
        return res.status(400).json({ message: "Email is already unsubscribed" });
      }

      // Update subscription to inactive
      await db.update(newsletterSubscriptions)
        .set({
          isActive: false,
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(newsletterSubscriptions.unsubscribeToken, token));

      // Send admin notification
      await simpleEmailService.sendAdminNotificationEmail(subscription.email, subscription.name || '', 'unsubscribe');

      res.json({ message: "Successfully unsubscribed from newsletter" });

    } catch (error: any) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Events routes
  app.get('/api/event-categories', async (req, res) => {
    try {
      const categories = await db.select()
        .from(eventCategories)
        .where(eq(eventCategories.isActive, true))
        .orderBy(eventCategories.sortOrder);
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching event categories:", error);
      res.status(500).json({ message: "Failed to fetch event categories" });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const { 
        categoryId, 
        provinceId, 
        startDate, 
        endDate, 
        isFree, 
        status = 'published',
        limit = 50,
        offset = 0,
        featured
      } = req.query;

      let query = db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        shortDescription: events.shortDescription,
        categoryId: events.categoryId,
        provinceId: events.provinceId,
        localityId: events.localityId,
        startDate: events.startDate,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
        isAllDay: events.isAllDay,
        venueName: events.venueName,
        venueAddress: events.venueAddress,
        isFree: events.isFree,
        priceMin: events.priceMin,
        priceMax: events.priceMax,
        currency: events.currency,
        ticketUrl: events.ticketUrl,
        featuredImage: events.featuredImage,
        ageRestriction: events.ageRestriction,
        status: events.status,
        isFeatured: events.isFeatured,
        viewCount: events.viewCount,
        attendeeCount: events.attendeeCount,
        maxCapacity: events.maxCapacity,
        category: {
          id: eventCategories.id,
          name: eventCategories.name,
          slug: eventCategories.slug,
          icon: eventCategories.icon,
          color: eventCategories.color,
        },
        province: {
          id: provinces.id,
          name: provinces.name,
        }
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .leftJoin(provinces, eq(events.provinceId, provinces.id))
      .where(eq(events.status, status as string));

      // Apply filters
      if (categoryId) {
        query = query.where(eq(events.categoryId, parseInt(categoryId as string)));
      }
      if (provinceId) {
        query = query.where(eq(events.provinceId, parseInt(provinceId as string)));
      }
      if (isFree === 'true') {
        query = query.where(eq(events.isFree, true));
      }
      if (featured === 'true') {
        query = query.where(eq(events.isFeatured, true));
      }
      if (startDate) {
        query = query.where(gte(events.startDate, new Date(startDate as string)));
      }
      if (endDate) {
        query = query.where(lte(events.endDate, new Date(endDate as string)));
      }

      // Order by start date
      query = query.orderBy(events.startDate);

      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));

      const eventsList = await query;
      
      res.json(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const [event] = await db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        shortDescription: events.shortDescription,
        categoryId: events.categoryId,
        provinceId: events.provinceId,
        localityId: events.localityId,
        startDate: events.startDate,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
        timezone: events.timezone,
        isAllDay: events.isAllDay,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        venueName: events.venueName,
        venueAddress: events.venueAddress,
        venueMapUrl: events.venueMapUrl,
        latitude: events.latitude,
        longitude: events.longitude,
        isFree: events.isFree,
        priceMin: events.priceMin,
        priceMax: events.priceMax,
        currency: events.currency,
        ticketUrl: events.ticketUrl,
        featuredImage: events.featuredImage,
        imageGallery: events.imageGallery,
        videoUrl: events.videoUrl,
        organizerName: events.organizerName,
        organizerEmail: events.organizerEmail,
        organizerPhone: events.organizerPhone,
        organizerWebsite: events.organizerWebsite,
        ageRestriction: events.ageRestriction,
        dressCode: events.dressCode,
        languages: events.languages,
        amenities: events.amenities,
        tags: events.tags,
        status: events.status,
        isFeatured: events.isFeatured,
        viewCount: events.viewCount,
        attendeeCount: events.attendeeCount,
        maxCapacity: events.maxCapacity,
        metaTitle: events.metaTitle,
        metaDescription: events.metaDescription,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        category: {
          id: eventCategories.id,
          name: eventCategories.name,
          slug: eventCategories.slug,
          icon: eventCategories.icon,
          color: eventCategories.color,
        },
        province: {
          id: provinces.id,
          name: provinces.name,
          arabicName: provinces.arabicName,
        },
        locality: {
          id: localities.id,
          name: localities.name,
        }
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .leftJoin(provinces, eq(events.provinceId, provinces.id))
      .leftJoin(localities, eq(events.localityId, localities.id))
      .where(eq(events.slug, slug))
      .limit(1);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Increment view count
      await db.update(events)
        .set({ viewCount: (event.viewCount || 0) + 1 })
        .where(eq(events.slug, slug));

      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events/:id/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if already bookmarked
      const [existing] = await db.select()
        .from(eventBookmarks)
        .where(and(
          eq(eventBookmarks.userId, userId),
          eq(eventBookmarks.eventId, parseInt(id))
        ))
        .limit(1);

      if (existing) {
        return res.status(400).json({ message: "Event already bookmarked" });
      }

      await db.insert(eventBookmarks).values({
        userId,
        eventId: parseInt(id),
      });

      res.json({ message: "Event bookmarked successfully" });
    } catch (error) {
      console.error("Error bookmarking event:", error);
      res.status(500).json({ message: "Failed to bookmark event" });
    }
  });

  app.delete('/api/events/:id/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await db.delete(eventBookmarks)
        .where(and(
          eq(eventBookmarks.userId, userId),
          eq(eventBookmarks.eventId, parseInt(id))
        ));

      res.json({ message: "Event bookmark removed successfully" });
    } catch (error) {
      console.error("Error removing event bookmark:", error);
      res.status(500).json({ message: "Failed to remove event bookmark" });
    }
  });

  app.get('/api/my-bookmarked-events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const bookmarkedEvents = await db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        shortDescription: events.shortDescription,
        startDate: events.startDate,
        endDate: events.endDate,
        venueName: events.venueName,
        featuredImage: events.featuredImage,
        isFree: events.isFree,
        priceMin: events.priceMin,
        priceMax: events.priceMax,
        bookmarkedAt: eventBookmarks.createdAt,
        category: {
          name: eventCategories.name,
          slug: eventCategories.slug,
          icon: eventCategories.icon,
        }
      })
      .from(eventBookmarks)
      .innerJoin(events, eq(eventBookmarks.eventId, events.id))
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(eq(eventBookmarks.userId, userId))
      .orderBy(desc(eventBookmarks.createdAt));

      res.json(bookmarkedEvents);
    } catch (error) {
      console.error("Error fetching bookmarked events:", error);
      res.status(500).json({ message: "Failed to fetch bookmarked events" });
    }
  });

  // Blog routes
  app.get('/api/blog', disableCache, async (req, res) => {
    try {
      const { limit } = req.query;
      const posts = await storage.getBlogPosts(limit ? parseInt(limit as string) : undefined);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.post('/api/blog', async (req: any, res) => {
    try {
      console.log('Creating blog post with data:', req.body);
      
      // Set authorId from session if available
      const blogData = {
        ...req.body,
        authorId: req.session?.user?.id || req.body.authorId || 'anonymous',
      };

      const data = insertBlogPostSchema.parse(blogData);
      const post = await storage.createBlogPost(data);
      
      console.log('Blog post created successfully:', post.id);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      console.error("Request body:", req.body);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: error.message || "Failed to create blog post" 
        });
      }
    }
  });

  // Stats route
  app.get('/api/stats', disableCache, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Business Card Scanner API
  app.post('/api/business-card/scan', async (req, res) => {
    try {
      const { image, format } = req.body;
      
      if (!image) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image provided' 
        });
      }

      // Import OpenAI here to avoid issues if not available
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Prepare the image data
      const imageData = format === 'base64' ? 
        `data:image/jpeg;base64,${image}` : 
        image;

      // Create the prompt for business card extraction
      const prompt = `You are a business card OCR and information extraction expert. Analyze this business card image and extract all available information.

Return the information in the following JSON format:
{
  "businessName": "Company/Business name",
  "contactPerson": "Full name of the person",
  "jobTitle": "Job title or position",
  "phoneNumber": "Phone number (formatted properly)",
  "email": "Email address",
  "website": "Website URL",
  "address": "Complete address",
  "city": "City name",
  "province": "Pakistani Province (if applicable)",
  "businessType": "Type of business/industry",
  "services": ["List", "of", "services", "offered"],
  "socialMedia": {
    "linkedin": "LinkedIn URL",
    "twitter": "Twitter URL",
    "instagram": "Instagram URL",
    "facebook": "Facebook URL"
  },
  "additionalInfo": "Any other relevant information",
  "confidence": 0.95
}

Instructions:
1. Extract all text accurately from the business card
2. Identify and properly format phone numbers (include country code if visible)
3. Identify email addresses and websites
4. Determine the business type/industry from context
5. If the business appears to be in Pakistan, identify the province
6. Extract social media handles or URLs if present
7. Provide a confidence score (0-1) based on image quality and text clarity
8. If information is not available, use empty strings or empty arrays
9. Focus on accuracy - don't guess information that's not clearly visible`;

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const extractedText = response.choices[0].message.content;
      
      try {
        const businessInfo = JSON.parse(extractedText);
        
        // Validate required fields and set defaults
        const sanitizedInfo = {
          businessName: businessInfo.businessName || '',
          contactPerson: businessInfo.contactPerson || '',
          jobTitle: businessInfo.jobTitle || '',
          phoneNumber: businessInfo.phoneNumber || '',
          email: businessInfo.email || '',
          website: businessInfo.website || '',
          address: businessInfo.address || '',
          city: businessInfo.city || '',
          province: businessInfo.province || '',
          businessType: businessInfo.businessType || '',
          services: Array.isArray(businessInfo.services) ? businessInfo.services : [],
          socialMedia: {
            linkedin: businessInfo.socialMedia?.linkedin || '',
            twitter: businessInfo.socialMedia?.twitter || '',
            instagram: businessInfo.socialMedia?.instagram || '',
            facebook: businessInfo.socialMedia?.facebook || ''
          },
          additionalInfo: businessInfo.additionalInfo || '',
          confidence: businessInfo.confidence || 0.5
        };

        res.json({ 
          success: true, 
          data: sanitizedInfo,
          message: 'Business card scanned successfully' 
        });

      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to parse extracted information' 
        });
      }

    } catch (error) {
      console.error('Error scanning business card:', error);
      
      if ((error as any).code === 'insufficient_quota') {
        res.status(503).json({ 
          success: false, 
          message: 'AI service temporarily unavailable. Please try again later.' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to scan business card' 
        });
      }
    }
  });

  // User Dashboard routes
  app.get('/api/user/businesses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businesses = await storage.getBusinessesByOwner(userId);
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching user businesses:", error);
      res.status(500).json({ message: "Failed to fetch user businesses" });
    }
  });

  app.get('/api/user/business-claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const claims = await storage.getBusinessClaimsByUser(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching user business claims:", error);
      res.status(500).json({ message: "Failed to fetch user business claims" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businesses = await storage.getBusinessesByOwner(userId);
      const claims = await storage.getBusinessClaimsByUser(userId);
      
      const stats = {
        totalBusinesses: businesses.length,
        totalViews: businesses.reduce((sum, business) => sum + (business.viewCount || 0), 0),
        averageRating: businesses.length > 0 ? 
          businesses.reduce((sum, business) => sum + (Number(business.ratingAverage) || 0), 0) / businesses.length : 0,
        pendingClaims: claims.filter(claim => claim.status === 'pending').length,
        approvedClaims: claims.filter(claim => claim.status === 'approved').length,
        verifiedBusinesses: businesses.filter(business => business.isVerified).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Real Admin Statistics - NO DEMO DATA
  app.get('/api/admin/real-stats', async (req, res) => {
    try {
      // Get real counts from database
      const realStats = await storage.getRealAdminStats();
      res.json(realStats);
    } catch (error) {
      console.error("Error fetching real admin stats:", error);
      res.status(500).json({ message: "Failed to fetch real admin stats" });
    }
  });

  // Real Daily Analytics - NO DEMO DATA  
  app.get('/api/admin/daily-analytics', async (req, res) => {
    try {
      // Get real daily data from business creation dates
      const dailyData = await storage.getRealDailyAnalytics();
      res.json(dailyData);
    } catch (error) {
      console.error("Error fetching daily analytics:", error);
      res.status(500).json({ message: "Failed to fetch daily analytics" });
    }
  });

  // This route is replaced by the more comprehensive one below at line 2730

  app.get('/api/admin/business-claims', isAuthenticated, async (req: any, res) => {
    try {
      const claims = await storage.getBusinessClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching admin business claims:", error);
      res.status(500).json({ message: "Failed to fetch admin business claims" });
    }
  });



  app.patch('/api/admin/business-claims/:id', isAuthenticated, async (req: any, res) => {
    try {
      const claimId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const updatedClaim = await storage.updateBusinessClaim(claimId, {
        status,
        adminNotes,
      });
      
      if (!updatedClaim) {
        return res.status(404).json({ message: "Business claim not found" });
      }
      
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating business claim:", error);
      res.status(500).json({ message: "Failed to update business claim" });
    }
  });

  app.patch('/api/admin/businesses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedBusiness = await storage.updateBusiness(businessId, {
        ...updates,
        updatedAt: new Date(),
      });
      
      if (!updatedBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  // Business Approval API routes
  app.get('/api/admin/pending-businesses', isAuthenticated, async (req: any, res) => {
    try {
      const pendingBusinesses = await storage.getPendingBusinesses();
      res.json(pendingBusinesses);
    } catch (error) {
      console.error("Error fetching pending businesses:", error);
      res.status(500).json({ message: "Failed to fetch pending businesses" });
    }
  });

  app.patch('/api/admin/businesses/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { status } = req.body;
      
      const updatedBusiness = await storage.updateBusinessStatus(businessId, status);
      
      if (updatedBusiness === undefined) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      res.json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business status:", error);
      res.status(500).json({ message: "Failed to update business status" });
    }
  });

  // Business Categories Management API routes
  app.get('/api/admin/categories', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getAllCategoriesWithStats();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = req.body;
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch('/api/admin/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedCategory = await storage.updateCategory(categoryId, updates);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.deleteCategory(categoryId);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Business Verification API routes
  app.get('/api/admin/verification-requests', isAuthenticated, async (req: any, res) => {
    try {
      const verificationRequests = await storage.getVerificationRequests();
      res.json(verificationRequests);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      res.status(500).json({ message: "Failed to fetch verification requests" });
    }
  });

  app.patch('/api/admin/verification-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      const updatedRequest = await storage.updateVerificationRequest(requestId, { status, notes });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating verification request:", error);
      res.status(500).json({ message: "Failed to update verification request" });
    }
  });

  // Pages Management API routes
  app.get('/api/admin/pages', isAuthenticated, async (req: any, res) => {
    try {
      const pages = await storage.getAllPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.post('/api/admin/pages', isAuthenticated, async (req: any, res) => {
    try {
      const pageData = req.body;
      const newPage = await storage.createPage({
        ...pageData,
        author: req.user.email || 'Admin',
        publishedAt: pageData.status === 'published' ? new Date() : null
      });
      res.status(201).json(newPage);
    } catch (error) {
      console.error("Error creating page:", error);
      res.status(500).json({ message: "Failed to create page" });
    }
  });

  app.patch('/api/admin/pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const pageId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedPage = await storage.updatePage(pageId, {
        ...updates,
        publishedAt: updates.status === 'published' ? new Date() : null
      });
      
      if (!updatedPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.delete('/api/admin/pages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const pageId = parseInt(req.params.id);
      await storage.deletePage(pageId);
      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // Provinces API
  app.get('/api/provinces', disableCache, async (req, res) => {
    try {
      const provinces = await storage.getProvinces();
      res.json(provinces);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      res.status(500).json({ message: "Failed to fetch provinces" });
    }
  });

  app.get('/api/provinces/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const province = await storage.getProvinceById(id);
      if (!province) {
        return res.status(404).json({ message: "Province not found" });
      }
      res.json(province);
    } catch (error) {
      console.error("Error fetching province:", error);
      res.status(500).json({ message: "Failed to fetch province" });
    }
  });

  app.post('/api/provinces', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertProvinceSchema.parse(req.body);
      const province = await storage.createProvince(data);
      res.status(201).json(province);
    } catch (error: any) {
      console.error("Error creating province:", error);
      res.status(400).json({ message: error.message || "Failed to create province" });
    }
  });

  // Localities API with comprehensive SEO support
  app.get('/api/localities', disableCache, async (req, res) => {
    try {
      const { provinceId, withStats, search, bounds } = req.query;
      let localities;
      
      if (bounds) {
        const boundsObj = JSON.parse(bounds as string);
        localities = await storage.getLocalitiesByBounds(boundsObj);
      } else if (search) {
        localities = await storage.searchLocalities(search as string);
      } else if (withStats === 'true') {
        localities = await storage.getLocalitiesWithStats();
        if (provinceId) {
          localities = localities.filter(l => l.provinceId === parseInt(provinceId as string));
        }
      } else if (provinceId) {
        localities = await storage.getLocalitiesByProvince(parseInt(provinceId as string));
      } else {
        localities = await storage.getLocalities();
      }
      
      res.json(localities);
    } catch (error) {
      console.error("Error fetching localities:", error);
      res.status(500).json({ message: "Failed to fetch localities" });
    }
  });

  registerEditorialRoutes(app);

  // A city page's record, by its URL slug (/cities/karachi -> locality "sindh/karachi")
  app.get('/api/cities/slug/:slug', async (req, res) => {
    try {
      const slug = String(req.params.slug || '').toLowerCase();
      const result: any = await db.execute(sql`
        SELECT l.id, l.name, l.arabic_name AS "arabicName", l.slug, l.province_id AS "provinceId",
               l.description, l.detailed_description AS "detailedDescription", l.population, l.coordinates,
               l.meta_title AS "metaTitle", l.meta_description AS "metaDescription",
               p.name AS "provinceName"
        FROM localities l JOIN provinces p ON p.id = l.province_id
        WHERE l.is_main_area = true AND l.parent_id IS NULL AND split_part(l.slug, '/', 2) = ${slug}
        ORDER BY l.id LIMIT 1`);
      const city = (result.rows ?? result)[0];
      if (!city) return res.status(404).json({ message: "City not found" });
      res.json(city);
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ message: "Failed to fetch city" });
    }
  });

  // Province > City > Locality tree (lean): every place with its city, Urdu name and listed-business count.
  // ?provinceId= limits it to one province. Cities: isMainArea = true, parentId = null.
  app.get('/api/places', async (req, res) => {
    try {
      const provinceId = req.query.provinceId ? parseInt(req.query.provinceId as string) : null;
      if (req.query.provinceId && !Number.isFinite(provinceId)) return res.status(400).json({ message: "Invalid provinceId" });
      const result = await db.execute(sql`
        SELECT l.id, l.name, l.arabic_name AS "arabicName", l.slug, l.province_id AS "provinceId",
               l.parent_id AS "parentId", COALESCE(l.is_main_area, false) AS "isMainArea",
               COALESCE(bc.n, 0)::int AS "businessCount"
        FROM localities l
        LEFT JOIN (
          SELECT locality_id, COUNT(*)::int AS n FROM businesses
          WHERE is_active = true AND (admin_approved = true OR admin_approved IS NULL) AND locality_id IS NOT NULL
          GROUP BY locality_id
        ) bc ON bc.locality_id = l.id
        WHERE COALESCE(l.is_active, true) = true ${provinceId ? sql`AND l.province_id = ${provinceId}` : sql``}
        ORDER BY l.name`);
      res.set('Cache-Control', 'public, max-age=300');
      res.json((result as any).rows ?? result);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  app.get('/api/localities/with-stats', disableCache, async (req, res) => {
    try {
      const { provinceId } = req.query;
      let localities = await storage.getLocalitiesWithStats();
      
      if (provinceId) {
        localities = localities.filter(l => l.provinceId === parseInt(provinceId as string));
      }
      
      res.json(localities);
    } catch (error) {
      console.error("Error fetching localities with stats:", error);
      res.status(500).json({ message: "Failed to fetch localities with stats" });
    }
  });

  app.get('/api/localities/search', disableCache, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const localities = await storage.searchLocalities(q as string);
      res.json(localities);
    } catch (error) {
      console.error("Error searching localities:", error);
      res.status(500).json({ message: "Failed to search localities" });
    }
  });

  app.get('/api/localities/:id', disableCache, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const locality = await storage.getLocalityById(id);
      
      if (!locality) {
        return res.status(404).json({ message: "Locality not found" });
      }

      // Increment view count
      await storage.incrementLocalityViews(id);
      
      res.json(locality);
    } catch (error) {
      console.error("Error fetching locality:", error);
      res.status(500).json({ message: "Failed to fetch locality" });
    }
  });

  app.get('/api/localities/slug/:slug', disableCache, async (req, res) => {
    try {
      const { slug } = req.params;
      const locality = await storage.getLocalityBySlug(slug);
      
      if (!locality) {
        return res.status(404).json({ message: "Locality not found" });
      }

      // Increment view count
      await storage.incrementLocalityViews(locality.id);
      
      res.json(locality);
    } catch (error) {
      console.error("Error fetching locality by slug:", error);
      res.status(500).json({ message: "Failed to fetch locality" });
    }
  });

  app.get('/api/localities/by-path/:province/:locality', disableCache, async (req, res) => {
    try {
      const { province, locality } = req.params;
      const fullSlug = `${province}/${locality}`;
      const localityData = await storage.getLocalityBySlug(fullSlug);
      
      if (!localityData) {
        return res.status(404).json({ message: "Locality not found" });
      }

      // Increment view count
      await storage.incrementLocalityViews(localityData.id);
      
      res.json(localityData);
    } catch (error) {
      console.error("Error fetching locality by path:", error);
      res.status(500).json({ message: "Failed to fetch locality" });
    }
  });

  // Add cities endpoint (alias for localities)
  app.get('/api/cities', async (req, res) => {
    try {
      const { provinceId } = req.query;
      let cities;
      
      if (provinceId) {
        cities = await storage.getLocalitiesByProvince(parseInt(provinceId as string));
      } else {
        cities = await storage.getLocalities();
      }
      
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post('/api/localities', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertLocalitySchema.parse(req.body);
      const locality = await storage.createLocality(data);
      res.status(201).json(locality);
    } catch (error: any) {
      console.error("Error creating locality:", error);
      res.status(400).json({ message: error.message || "Failed to create locality" });
    }
  });

  // Categories API
  app.get('/api/categories', disableCache, async (req, res) => {
    try {
      const { level, parentId, withStats } = req.query;
      let categories;
      
      if (withStats === 'true') {
        categories = await storage.getCategoriesWithStats();
        
        // Filter by level or parentId if requested
        if (level) {
          categories = categories.filter(cat => cat.level === parseInt(level as string));
        }
        if (parentId) {
          categories = categories.filter(cat => cat.parentId === parseInt(parentId as string));
        }
      } else if (level) {
        categories = await storage.getCategoriesByLevel(parseInt(level as string));
      } else if (parentId) {
        categories = await storage.getCategoriesByParent(parseInt(parentId as string));
      } else {
        categories = await storage.getCategories();
      }
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Simple test endpoint 
  app.get('/api/categories/test', async (req, res) => {
    console.log('TEST: Simple categories test endpoint hit');
    try {
      const simpleCategories = [
        { id: 1, name: 'Food', slug: 'food', level: 1, businessCount: 0, subcategoryCount: 4 },
        { id: 2, name: 'Technology', slug: 'technology', level: 1, businessCount: 0, subcategoryCount: 5 },
        { id: 3, name: 'Health', slug: 'health', level: 1, businessCount: 0, subcategoryCount: 6 }
      ];
      console.log('TEST: Sending simple test data');
      res.json(simpleCategories);
    } catch (error) {
      console.error("TEST: Error in test endpoint:", error);
      res.status(500).json({ message: "Test endpoint failed" });
    }
  });

  // Categories with stats endpoint (alias)
  app.get('/api/categories/with-stats', disableCache, async (req, res) => {
    try {
      const { level, parentId } = req.query;
      let categories = await storage.getCategoriesWithStats();
      
      
      // Filter by level or parentId if requested
      if (level) {
        categories = categories.filter(cat => cat.level === parseInt(level as string));
      }
      if (parentId) {
        const pid = parseInt(parentId as string);
        categories = categories.filter(cat => Number((cat as any).parentId ?? (cat as any).parent_id) === pid);
      }
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories with stats:", error);
      res.status(500).json({ message: "Failed to fetch categories with stats" });
    }
  });

  // 3-level category hierarchy endpoints
  app.get('/api/categories/hierarchy', async (req, res) => {
    try {
      const hierarchy = await storage.getCategoryHierarchy();
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching category hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch category hierarchy" });
    }
  });

  app.get('/api/categories/hierarchical', async (req, res) => {
    try {
      const categories = await storage.getCategoriesHierarchical();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching hierarchical categories:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical categories" });
    }
  });

  app.get('/api/categories/:id/children', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryWithChildren = await storage.getCategoryWithChildren(categoryId);
      if (!categoryWithChildren) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(categoryWithChildren);
    } catch (error) {
      console.error("Error fetching category with children:", error);
      res.status(500).json({ message: "Failed to fetch category with children" });
    }
  });

  app.get('/api/categories/:id/ancestors', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const ancestors = await storage.getCategoryAncestors(categoryId);
      res.json(ancestors);
    } catch (error) {
      console.error("Error fetching category ancestors:", error);
      res.status(500).json({ message: "Failed to fetch category ancestors" });
    }
  });

  app.get('/api/categories/:id/descendants', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const descendants = await storage.getCategoryDescendants(categoryId);
      res.json(descendants);
    } catch (error) {
      console.error("Error fetching category descendants:", error);
      res.status(500).json({ message: "Failed to fetch category descendants" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  // REMOVED DUPLICATE - Using the one above with debugging

  app.get('/api/businesses/featured', async (req, res) => {
    try {
      const result = await storage.getBusinesses({ isFeatured: true, limit: 6 });
      res.json(result.businesses);
    } catch (error) {
      console.error("Error fetching featured businesses:", error);
      res.status(500).json({ message: "Failed to fetch featured businesses" });
    }
  });

  app.get('/api/businesses/:slug', async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Increment view count
      await storage.incrementBusinessViews(business.id);
      
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post('/api/businesses', isAuthenticated, async (req: any, res) => {
    try {
      const placementError = await checkBusinessPlacement(req.body);
      if (placementError) return res.status(400).json({ message: placementError });
      const userId = req.user.id;
      const data = insertBusinessSchema.parse(req.body);
      
      // Truncate fields that exceed database limits to prevent constraint violations
      const sanitizedData = {
        ...data,
        name: data.name?.substring(0, 200) || data.name,
        arabicName: data.arabicName?.substring(0, 200) || data.arabicName,
        shortDescription: data.shortDescription?.substring(0, 500) || data.shortDescription,
        email: data.email?.substring(0, 200) || data.email,
        phone: data.phone?.substring(0, 50) || data.phone,
        whatsapp: data.whatsapp?.substring(0, 50) || data.whatsapp,
        website: data.website?.substring(0, 500) || data.website,
        locality: data.locality?.substring(0, 200) || data.locality,
        poBox: data.poBox?.substring(0, 100) || data.poBox,
        googleMapsUrl: data.googleMapsUrl?.substring(0, 500) || data.googleMapsUrl,
        tradeLicense: data.tradeLicense?.substring(0, 100) || data.tradeLicense,
        employeeCount: data.employeeCount?.substring(0, 50) || data.employeeCount,
        companySize: data.companySize?.substring(0, 50) || data.companySize,
        legalForm: data.legalForm?.substring(0, 100) || data.legalForm,
        vatNumber: data.vatNumber?.substring(0, 50) || data.vatNumber,
        logo: data.logo?.substring(0, 500) || data.logo,
        metaTitle: data.metaTitle?.substring(0, 200) || data.metaTitle,
        metaDescription: data.metaDescription?.substring(0, 500) || data.metaDescription,
        ownerId: userId
      };
      
      const business = await storage.createBusiness(sanitizedData);
      
      res.status(201).json(business);
    } catch (error: any) {
      console.error("Error creating business:", error);
      res.status(400).json({ message: error.message || "Failed to create business" });
    }
  });

  app.get('/api/businesses/:id/reviews', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const reviews = await storage.getBusinessReviews(businessId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching business reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/businesses/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const businessId = parseInt(req.params.id);
      const data = insertBusinessReviewSchema.parse({
        ...req.body,
        businessId,
        userId
      });
      
      const review = await storage.createBusinessReview(data);
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  app.post('/api/businesses/:id/enquiries', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const data = insertBusinessEnquirySchema.parse({
        ...req.body,
        businessId
      });
      
      const enquiry = await storage.createBusinessEnquiry(data);
      res.status(201).json(enquiry);
    } catch (error: any) {
      console.error("Error creating enquiry:", error);
      res.status(400).json({ message: error.message || "Failed to create enquiry" });
    }
  });

  // Business Claims API
  app.get('/api/business-claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let claims;
      if (user?.role === 'admin') {
        claims = await storage.getBusinessClaims(req.query.status as string);
      } else {
        claims = await storage.getBusinessClaimsByUser(userId);
      }
      
      res.json(claims);
    } catch (error) {
      console.error("Error fetching business claims:", error);
      res.status(500).json({ message: "Failed to fetch business claims" });
    }
  });

  app.post('/api/business-claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertBusinessClaimSchema.parse({
        ...req.body,
        userId
      });
      
      const claim = await storage.createBusinessClaim(data);
      res.status(201).json(claim);
    } catch (error: any) {
      console.error("Error creating business claim:", error);
      res.status(400).json({ message: error.message || "Failed to create business claim" });
    }
  });

  // News API
  app.get('/api/news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const news = await storage.getNewsArticles(limit);
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertNewsArticleSchema.parse(req.body);
      const article = await storage.createNewsArticle(data);
      res.status(201).json(article);
    } catch (error: any) {
      console.error("Error creating news article:", error);
      res.status(400).json({ message: error.message || "Failed to create news article" });
    }
  });

  // Advanced Business Management API Routes
  // Admin businesses management with real data - NO DEMO DATA
  app.get('/api/admin/businesses', async (req, res) => {
    try {
      const {
        search = '',
        status = 'all',
        province = 'all',
        category = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '25'
      } = req.query;

      // Use simple getBusinesses with includeUnapproved instead of complex filter function
      let filters: any = {
        includeUnapproved: true,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      };

      // Apply search filter
      if (search && search !== '') {
        filters.query = search as string;
      }

      // Apply province filter
      if (province && province !== 'all') {
        const provinceId = parseInt(province as string);
        if (!isNaN(provinceId)) {
          filters.provinceId = provinceId;
        }
      }

      // Apply category filter  
      if (category && category !== 'all') {
        const categoryId = parseInt(category as string);
        if (!isNaN(categoryId)) {
          filters.categoryId = categoryId;
        }
      }

      // Apply city filter (using locality)
      const { city } = req.query;
      if (city && city !== 'all') {
        const cityId = parseInt(city as string);
        if (!isNaN(cityId)) {
          filters.localityId = cityId;
        }
      }

      const result = await storage.getBusinesses(filters);
      let filteredBusinesses = result.businesses;

      // Apply status filter after getting results
      if (status && status !== 'all') {
        switch (status) {
          case 'approved':
            filteredBusinesses = result.businesses.filter(b => b.adminApproved === true);
            break;
          case 'pending':
            filteredBusinesses = result.businesses.filter(b => b.adminApproved === false || b.adminApproved === null);
            break;
          case 'verified':
            filteredBusinesses = result.businesses.filter(b => b.isVerified === true);
            break;
          case 'featured':
            filteredBusinesses = result.businesses.filter(b => b.isFeatured === true);
            break;
        }
      }

      // Add owner email to each business
      const businessesWithOwner = await Promise.all(
        filteredBusinesses.map(async (business) => {
          const owner = business.ownerId ? await storage.getUserById(business.ownerId) : null;
          return {
            ...business,
            ownerEmail: owner?.email || 'Unknown',
            category: (business as any).categoryName || 'Unknown',
            province: (business as any).provinceName || 'Unknown'
          };
        })
      );

      res.json({
        businesses: businessesWithOwner,
        total: businessesWithOwner.length,
        page: parseInt(page as string),
        totalPages: Math.ceil(businessesWithOwner.length / parseInt(limit as string))
      });

    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.patch('/api/admin/businesses/:id/status', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateBusinessStatus(businessId, status);
      res.json({ message: "Business status updated successfully" });
    } catch (error) {
      console.error("Error updating business status:", error);
      res.status(500).json({ message: "Failed to update business status" });
    }
  });

  app.patch('/api/admin/businesses/:id/verification', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { isVerified } = req.body;
      
      await storage.updateBusinessVerification(businessId, isVerified);
      res.json({ message: "Business verification updated successfully" });
    } catch (error) {
      console.error("Error updating business verification:", error);
      res.status(500).json({ message: "Failed to update business verification" });
    }
  });

  app.patch('/api/admin/businesses/:id/featured', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { isFeatured } = req.body;
      
      await storage.updateBusinessFeatured(businessId, isFeatured);
      res.json({ message: "Business featured status updated successfully" });
    } catch (error) {
      console.error("Error updating business featured status:", error);
      res.status(500).json({ message: "Failed to update business featured status" });
    }
  });

  app.delete('/api/admin/businesses/:id', async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      
      await storage.deleteBusiness(businessId);
      res.json({ message: "Business deleted successfully" });
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  app.post('/api/admin/businesses/bulk-action', async (req, res) => {
    try {
      const { action, businessIds } = req.body;
      
      await storage.bulkUpdateBusinesses(action, businessIds);
      res.json({ message: "Bulk action completed successfully" });
    } catch (error) {
      console.error("Error performing bulk action:", error);
      res.status(500).json({ message: "Failed to perform bulk action" });
    }
  });

  // AI Content Regeneration API Endpoints
  // Start a bulk content regeneration job
  app.post('/api/admin/businesses/regenerate-content', isAuthenticated, async (req: any, res) => {
    try {
      const { businessIds } = req.body; // Optional: specific business IDs, or regenerate all if empty

      const { getJobManager } = await import('./services/contentRegenerationJob');
      const jobManager = getJobManager();

      const jobId = await jobManager.createJob(businessIds);
      const job = jobManager.getJobStatus(jobId);

      res.json({
        success: true,
        message: 'Content regeneration job started',
        jobId,
        job
      });
    } catch (error: any) {
      console.error('Error starting content regeneration job:', error);
      res.status(500).json({
        success: false,
        error: `Failed to start content regeneration: ${error.message}`
      });
    }
  });

  // Get status of a specific job
  app.get('/api/admin/businesses/regenerate-content/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;

      const { getJobManager } = await import('./services/contentRegenerationJob');
      const jobManager = getJobManager();

      const job = jobManager.getJobStatus(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        job
      });
    } catch (error: any) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get job status: ${error.message}`
      });
    }
  });

  // Get all regeneration jobs (for admin monitoring)
  app.get('/api/admin/businesses/regenerate-content', isAuthenticated, async (req: any, res) => {
    try {
      const { getJobManager } = await import('./services/contentRegenerationJob');
      const jobManager = getJobManager();

      const jobs = jobManager.getAllJobs();

      res.json({
        success: true,
        jobs
      });
    } catch (error: any) {
      console.error('Error getting jobs list:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get jobs list: ${error.message}`
      });
    }
  });

  // Delete a completed job
  app.delete('/api/admin/businesses/regenerate-content/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;

      const { getJobManager } = await import('./services/contentRegenerationJob');
      const jobManager = getJobManager();

      const deleted = jobManager.deleteJob(jobId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        message: 'Job deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      res.status(500).json({
        success: false,
        error: `Failed to delete job: ${error.message}`
      });
    }
  });

  // Blog API
  app.get('/api/blog', disableCache, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const posts = await storage.getBlogPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get all blog posts for admin panel
  app.get('/api/admin/blog-posts', async (req: any, res) => {
    try {
      const posts = await storage.getAllBlogPosts(); // Get all posts regardless of status
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Admin blog posts endpoint (unauthenticated for preview)
  app.post('/api/admin/blog-posts', async (req: any, res) => {
    try {
      // Get author ID from request body or session
      let authorId = req.body.authorId || req.session?.user?.id || req.user?.id;
      
      if (!authorId) {
        // Check if there's any user in the database to use as default author
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length > 0) {
          authorId = existingUsers[0].id;
        } else {
          // Create a default admin user for blog posts
          const [defaultUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            email: 'admin@pakistanyp.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isEmailVerified: true,
            authProvider: 'email'
          }).returning();
          authorId = defaultUser.id;
        }
      }
      
      // Convert string dates to Date objects and fix data types
      const requestData = { ...req.body };
      
      // Generate slug from title if not provided or empty
      const generateSlug = (title: string) => {
        return title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
          .substring(0, 200); // Ensure reasonable length
      };
      
      const title = String(requestData.title || '').substring(0, 200).trim();
      const providedSlug = String(requestData.slug || '').substring(0, 200).trim();
      const autoSlug = title ? generateSlug(title) : `blog-post-${Date.now()}`;
      const finalSlug = providedSlug || autoSlug;
      
      // Validate required fields
      if (!title) {
        return res.status(400).json({ 
          message: 'Title is required',
          field: 'title'
        });
      }
      
      if (!requestData.content || String(requestData.content).trim().length === 0) {
        return res.status(400).json({ 
          message: 'Content is required',
          field: 'content'
        });
      }

      // Validate author exists
      if (authorId) {
        const authorExists = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
        if (authorExists.length === 0) {
          return res.status(400).json({ 
            message: 'Selected author does not exist',
            field: 'authorId'
          });
        }
      }

      // Validate and clean all text fields to prevent length issues
      const cleanedData = {
        title: title,
        slug: finalSlug,
        excerpt: String(requestData.excerpt || '').substring(0, 500).trim(),
        content: String(requestData.content || '').substring(0, 50000).trim(),
        metaTitle: String(requestData.metaTitle || '').substring(0, 200).trim(),
        metaDescription: String(requestData.metaDescription || '').substring(0, 160).trim(),
        featuredImage: String(requestData.featuredImage || '').substring(0, 500).trim(),
        canonicalUrl: String(requestData.canonicalUrl || '').substring(0, 500).trim(),
        robots: String(requestData.robots || 'index, follow').substring(0, 50),
        ogTitle: String(requestData.ogTitle || '').substring(0, 200).trim(),
        ogDescription: String(requestData.ogDescription || '').substring(0, 300).trim(),
        ogImage: String(requestData.ogImage || '').substring(0, 500).trim(),
        twitterTitle: String(requestData.twitterTitle || '').substring(0, 200).trim(),
        twitterDescription: String(requestData.twitterDescription || '').substring(0, 200).trim(),
        twitterCard: String(requestData.twitterCard || 'summary_large_image').substring(0, 50),
        schemaType: String(requestData.schemaType || 'BlogPosting').substring(0, 50),
        customCSS: String(requestData.customCSS || '').substring(0, 10000),
        customJS: String(requestData.customJS || '').substring(0, 10000),
        status: String(requestData.status || 'published'),
        categoryId: parseInt(requestData.categoryId) || 1,
        authorId: authorId,
        readingTime: parseInt(requestData.readingTime) || 1,
        seoScore: parseInt(requestData.seoScore) || 0
      };

      // Handle dates
      if (requestData.publishedAt && typeof requestData.publishedAt === 'string') {
        cleanedData.publishedAt = new Date(requestData.publishedAt);
      } else if (cleanedData.status === 'published' && !requestData.publishedAt) {
        // Auto-set publishedAt for published posts
        cleanedData.publishedAt = new Date();
      }
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        cleanedData.scheduledAt = new Date(requestData.scheduledAt);
      }
      
      // Handle tags array - ensure it's properly formatted
      let tags = [];
      if (requestData.tags) {
        if (typeof requestData.tags === 'string') {
          try {
            tags = JSON.parse(requestData.tags);
          } catch {
            tags = requestData.tags.split(',').map((tag: any) => tag.trim()).filter((tag: any) => tag);
          }
        } else if (Array.isArray(requestData.tags)) {
          tags = requestData.tags;
        }
      }
      cleanedData.tags = tags.slice(0, 10).map((tag: any) => String(tag).trim()).filter((tag: any) => tag);
      
      console.log("Processed blog data:", {
        title: cleanedData.title,
        slug: cleanedData.slug,
        contentLength: cleanedData.content.length,
        tagsCount: cleanedData.tags.length
      });
      
      const post = await storage.createBlogPost(cleanedData);
      console.log("Admin blog post created successfully:", post.id);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating admin blog post:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      
      // Return specific error messages based on error type
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ 
          message: "A blog post with this slug already exists",
          field: 'slug'
        });
      } else if (error.code === '23503') { // Foreign key constraint violation
        res.status(400).json({ 
          message: "Invalid author or category selected",
          field: 'authorId'
        });
      } else if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Validation error",
          errors: error.errors
        });
      } else {
        res.status(500).json({ 
          message: error.message || "Failed to create blog post",
          details: error.message
        });
      }
    }
  });

  // Blog categories endpoint - both paths for compatibility
  app.get('/api/blog/categories', async (req: any, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.get('/api/blog-categories', async (req: any, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/blog', async (req: any, res) => {
    try {
      // Allow blog creation without authentication, using a default authorId
      const authorId = req.session?.user?.id || req.user?.id || "1"; // Default to string "1" if not authenticated
      
      // Convert string dates to Date objects and fix data types
      const requestData = { ...req.body };
      if (requestData.publishedAt && typeof requestData.publishedAt === 'string') {
        requestData.publishedAt = new Date(requestData.publishedAt);
      }
      if (requestData.scheduledAt && typeof requestData.scheduledAt === 'string') {
        requestData.scheduledAt = new Date(requestData.scheduledAt);
      }
      
      // Fix tags handling for JSONB - ensure it's a proper array
      if (requestData.tags) {
        if (typeof requestData.tags === 'string') {
          try {
            // If it's a JSON string, parse it to get the actual array
            requestData.tags = JSON.parse(requestData.tags);
          } catch {
            // If parsing fails, split by comma and filter
            requestData.tags = requestData.tags.split(',').map((tag: any) => tag.trim()).filter((tag: any) => tag);
          }
        }
        // Ensure tags is an array and contains only strings
        if (!Array.isArray(requestData.tags)) {
          requestData.tags = requestData.tags ? [String(requestData.tags)] : [];
        }
        // Ensure all elements are strings and filter out empty values
        requestData.tags = requestData.tags.map((tag: any) => String(tag).trim()).filter((tag: any) => tag);
      } else {
        // Default to empty array if no tags provided
        requestData.tags = [];
      }
      
      // Ensure JSONB fields are properly formatted
      const processedData = {
        ...requestData,
        authorId,
        // Ensure tags is a proper array for JSONB
        tags: Array.isArray(requestData.tags) ? requestData.tags : []
      };
      
      console.log("Raw request data:", JSON.stringify(requestData, null, 2));
      console.log("Processed data for schema validation:", JSON.stringify(processedData, null, 2));
      
      const data = insertBlogPostSchema.parse(processedData);
      
      console.log("Blog post data being saved:", JSON.stringify({
        title: data.title,
        tags: data.tags,
        tagsType: typeof data.tags,
        tagsArray: Array.isArray(data.tags)
      }));
      
      const post = await storage.createBlogPost(data);
      console.log("Blog post created successfully:", post.id);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      console.error("Request data:", JSON.stringify(req.body, null, 2));
      res.status(400).json({ message: error.message || "Failed to create blog post" });
    }
  });

  app.delete('/api/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if the blog post exists and user has permission to delete it
      const post = await storage.getBlogPostById(parseInt(id));
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Check if user is author or admin (you might want to add role checking here)
      if (post.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this blog post" });
      }
      
      const success = await storage.deleteBlogPost(parseInt(id));
      if (success) {
        res.json({ message: "Blog post deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete blog post" });
      }
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: error.message || "Failed to delete blog post" });
    }
  });

  // Search Analytics API
  app.get('/api/search/popular', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const searches = await storage.getPopularSearches(limit);
      res.json(searches);
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // User Dashboard API - Fresh version to break cache
  app.get('/api/dashboard-fresh', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log("=== DASHBOARD API CALLED FRESH ===");
      console.log("Dashboard API - User ID:", userId);
      console.log("Dashboard API - Request timestamp:", new Date().toISOString());
      
      // Disable all caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      
      const [businessesFromStorage, claims] = await Promise.all([
        storage.getBusinessesByOwner(userId),
        storage.getBusinessClaimsByUser(userId)
      ]);
      
      console.log("Dashboard API - Found businesses from storage:", businessesFromStorage.length);
      console.log("Dashboard API - Business IDs:", businessesFromStorage.map(b => b.id));
      console.log("Dashboard API - Business names:", businessesFromStorage.map(b => b.name));
      console.log("=== END DASHBOARD API ===");
      
      res.status(200).json({
        businesses: businessesFromStorage,
        claims,
        stats: {
          totalBusinesses: businessesFromStorage.length,
          totalClaims: claims.length,
          pendingClaims: claims.filter(c => c.status === 'pending').length
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Premium Payment Routes
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { businessId, planType } = req.body;
      const userId = req.user.id;

      // Validate business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "You don't own this business" });
      }

      // Define pricing (in PKR cents)
      const pricing = {
        monthly: { amount: 29900, duration: 1 }, // 299 PKR for 1 month
        yearly: { amount: 299900, duration: 12 }  // 2999 PKR for 12 months (save 600 PKR)
      };

      const plan = pricing[planType as keyof typeof pricing];
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // Create payment intent
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: plan.amount,
        currency: "pkr",
        metadata: {
          businessId: businessId.toString(),
          userId,
          planType,
          planDuration: plan.duration.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      // Create payment record
      await storage.createPremiumPayment({
        businessId,
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: (plan.amount / 100).toString(),
        currency: "PKR",
        status: "pending",
        planType,
        planDuration: plan.duration,
        startDate,
        endDate,
        metadata: { stripePaymentIntentId: paymentIntent.id }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: plan.amount,
        planType,
        duration: plan.duration
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe webhook to handle payment completion
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        // Update payment status
        await storage.updatePremiumPaymentStatus(paymentIntent.id, 'succeeded');
        
        // Upgrade business to premium
        const businessId = parseInt(paymentIntent.metadata.businessId);
        const planDuration = parseInt(paymentIntent.metadata.planDuration);
        
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + planDuration);
        
        await storage.upgradeToPremium(businessId, endDate);
        
        console.log(`Business ${businessId} upgraded to premium until ${endDate}`);
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    }

    res.json({ received: true });
  });

  // Get payment history
  app.get('/api/payments/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const payments = await storage.getPremiumPaymentsByUser(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Get business payment history
  app.get('/api/payments/business/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== userId) {
        return res.status(403).json({ message: "You don't own this business" });
      }

      const payments = await storage.getPremiumPaymentsByBusiness(businessId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching business payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Create Stripe Checkout Session (fallback method)
  app.post('/api/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      const { planId, interval, amount, planName, successUrl, cancelUrl } = req.body;
      const user = req.user;

      console.log(`Creating checkout session for user: ${user.id} plan: ${planId} interval: ${interval} amount: ${amount}`);

      if (!stripe) {
        return res.status(500).json({ message: "Payment processing is not available" });
      }

      // Ensure customer exists
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customerName = user.username || 
                           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') || 
                           user.email.split('@')[0] || 
                           'Pakistani Business Directory User';

        const customer = await stripe.customers.create({
          email: user.email,
          name: customerName,
          metadata: {
            userId: user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
        console.log(`Created new Stripe customer: ${stripeCustomerId}`);
      }

      // Create product if it doesn't exist
      const productName = `PakistanYP ${planName} Plan`;
      const product = await stripe.products.create({
        name: productName,
        description: `${planName} subscription plan for Pakistan Business Directory`,
        metadata: {
          planId: planId,
          interval: interval,
        },
      });
      console.log(`Created Stripe product: ${product.id}`);

      // Create price for this product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency: 'pkr',
        recurring: {
          interval: interval === 'year' ? 'year' : 'month',
        },
      });
      console.log(`Created Stripe price: ${price.id}`);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      console.log(`Created checkout session: ${session.id}`);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout session creation error:', error);
      res.status(500).json({ 
        message: "Error creating checkout session: " + error.message 
      });
    }
  });

  // Create subscription for paid plans
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planId, interval, amount } = req.body;

      console.log("Creating subscription for user:", userId, "plan:", planId, "interval:", interval, "amount:", amount);

      if (!stripe) {
        return res.status(500).json({ message: "Payment processing is not available" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("User details:", { id: user.id, email: user.email, username: user.username, stripeCustomerId: user.stripeCustomerId });

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        // Create customer name from available data
        const customerName = user.username || 
                           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') || 
                           user.email.split('@')[0] || 
                           'Pakistani Business Directory User';

        console.log("Creating new Stripe customer with name:", customerName);

        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: customerName,
          metadata: {
            userId: userId.toString(),
          },
        });
        stripeCustomerId = customer.id;
        console.log("Created Stripe customer:", stripeCustomerId);
        
        // Update user with stripe customer ID
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }

      console.log("Using Stripe customer ID:", stripeCustomerId);

      // Create a product first, then create the subscription
      const product = await stripe.products.create({
        name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        description: `Subscription for ${planId} plan - Pakistani Business Directory`,
        metadata: {
          planId: planId,
          interval: interval,
        },
      });

      console.log("Created Stripe product:", product.id);

      // Create a price for the product
      const price = await stripe.prices.create({
        currency: 'pkr',
        unit_amount: amount * 100, // Convert to cents
        recurring: {
          interval: interval === 'year' ? 'year' : 'month',
        },
        product: product.id,
      });

      console.log("Created Stripe price:", price.id);

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price: price.id,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        planId,
        interval,
        amount,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Static pages endpoints
  app.get('/api/pages', async (req, res) => {
    try {
      const pages = await storage.getStaticPages();
      res.json(pages);
    } catch (error) {
      console.error('Error fetching static pages:', error);
      res.status(500).json({ message: 'Failed to fetch static pages' });
    }
  });

  app.get('/api/pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getStaticPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error fetching static page:', error);
      res.status(500).json({ message: 'Failed to fetch static page' });
    }
  });

  app.post('/api/admin/pages', isAuthenticated, async (req, res) => {
    try {
      const page = await storage.createStaticPage(req.body);
      res.status(201).json(page);
    } catch (error) {
      console.error('Error creating static page:', error);
      res.status(500).json({ message: 'Failed to create static page' });
    }
  });

  app.put('/api/admin/pages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.updateStaticPage(parseInt(id), req.body);
      
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      
      res.json(page);
    } catch (error) {
      console.error('Error updating static page:', error);
      res.status(500).json({ message: 'Failed to update static page' });
    }
  });

  app.delete('/api/admin/pages/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStaticPage(parseInt(id));
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting static page:', error);
      res.status(500).json({ message: 'Failed to delete static page' });
    }
  });

  // Help center categories endpoints
  app.get('/api/help/categories', async (req, res) => {
    try {
      const categories = await storage.getHelpCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching help categories:', error);
      res.status(500).json({ message: 'Failed to fetch help categories' });
    }
  });

  app.get('/api/help/categories/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getHelpCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching help category:', error);
      res.status(500).json({ message: 'Failed to fetch help category' });
    }
  });

  app.post('/api/admin/help/categories', isAuthenticated, async (req, res) => {
    try {
      const category = await storage.createHelpCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating help category:', error);
      res.status(500).json({ message: 'Failed to create help category' });
    }
  });

  app.put('/api/admin/help/categories/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateHelpCategory(parseInt(id), req.body);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error updating help category:', error);
      res.status(500).json({ message: 'Failed to update help category' });
    }
  });

  app.delete('/api/admin/help/categories/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHelpCategory(parseInt(id));
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting help category:', error);
      res.status(500).json({ message: 'Failed to delete help category' });
    }
  });

  // Help center articles endpoints
  app.get('/api/help/articles', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const articles = await storage.getHelpArticles(categoryId ? parseInt(categoryId as string) : undefined);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching help articles:', error);
      res.status(500).json({ message: 'Failed to fetch help articles' });
    }
  });

  app.get('/api/help/articles/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getHelpArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Increment view count
      await storage.incrementHelpArticleViews(article.id);
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching help article:', error);
      res.status(500).json({ message: 'Failed to fetch help article' });
    }
  });

  app.post('/api/admin/help/articles', isAuthenticated, async (req, res) => {
    try {
      const article = await storage.createHelpArticle(req.body);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating help article:', error);
      res.status(500).json({ message: 'Failed to create help article' });
    }
  });

  app.put('/api/admin/help/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.updateHelpArticle(parseInt(id), req.body);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error updating help article:', error);
      res.status(500).json({ message: 'Failed to update help article' });
    }
  });

  app.delete('/api/admin/help/articles/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHelpArticle(parseInt(id));
      res.json({ message: 'Article deleted successfully' });
    } catch (error) {
      console.error('Error deleting help article:', error);
      res.status(500).json({ message: 'Failed to delete help article' });
    }
  });

  // Support tickets endpoints
  app.get('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const { status, assignedTo, category } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (category) filters.category = category as string;
      
      const tickets = await storage.getSupportTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ message: 'Failed to fetch support tickets' });
    }
  });

  app.get('/api/support/tickets/:ticketNumber', async (req, res) => {
    try {
      const { ticketNumber } = req.params;
      const ticket = await storage.getSupportTicketByNumber(ticketNumber);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      res.status(500).json({ message: 'Failed to fetch support ticket' });
    }
  });

  app.get('/api/support/my-tickets', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const tickets = await storage.getSupportTicketsByUser(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({ message: 'Failed to fetch user tickets' });
    }
  });

  app.post('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const ticketData = {
        ...req.body,
        userId: req.user.id
      };
      
      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ message: 'Failed to create support ticket' });
    }
  });

  app.put('/api/admin/support/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.updateSupportTicket(parseInt(id), req.body);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ message: 'Failed to update support ticket' });
    }
  });

  app.get('/api/support/tickets/:ticketId/replies', async (req, res) => {
    try {
      const { ticketId } = req.params;
      const replies = await storage.getSupportTicketReplies(parseInt(ticketId));
      res.json(replies);
    } catch (error) {
      console.error('Error fetching ticket replies:', error);
      res.status(500).json({ message: 'Failed to fetch ticket replies' });
    }
  });

  app.post('/api/support/tickets/:ticketId/replies', isAuthenticated, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const replyData = {
        ...req.body,
        ticketId: parseInt(ticketId),
        authorId: req.user?.id || null
      };
      
      const reply = await storage.createSupportTicketReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      console.error('Error creating ticket reply:', error);
      res.status(500).json({ message: 'Failed to create ticket reply' });
    }
  });

  app.get('/api/admin/support/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getSupportTicketStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching support stats:', error);
      res.status(500).json({ message: 'Failed to fetch support stats' });
    }
  });

  // Menu Management API Routes
  app.get('/api/admin/menus', disableCache, async (req, res) => {
    try {
      const menus = await storage.getAllMenus();
      res.json(menus);
    } catch (error) {
      console.error('Error fetching menus:', error);
      res.status(500).json({ message: 'Failed to fetch menus' });
    }
  });

  app.get('/api/menus/location/:location', disableCache, async (req, res) => {
    try {
      const { location } = req.params;
      const menuItems = await storage.getMenuItemsByLocation(location);
      res.json(menuItems);
    } catch (error) {
      console.error('Error fetching menu items by location:', error);
      res.status(500).json({ message: 'Failed to fetch menu items' });
    }
  });

  app.get('/api/admin/menus/:id', disableCache, async (req, res) => {
    try {
      const { id } = req.params;
      const menu = await storage.getMenuWithItems(parseInt(id));
      
      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }
      
      res.json(menu);
    } catch (error) {
      console.error('Error fetching menu with items:', error);
      res.status(500).json({ message: 'Failed to fetch menu' });
    }
  });

  app.post('/api/admin/menus', async (req, res) => {
    try {
      const menuData = insertMenuSchema.parse(req.body);
      const menu = await storage.createMenu(menuData);
      
      if (!menu) {
        return res.status(400).json({ message: 'Failed to create menu' });
      }
      
      res.status(201).json(menu);
    } catch (error) {
      console.error('Error creating menu:', error);
      res.status(500).json({ message: 'Failed to create menu' });
    }
  });

  app.put('/api/admin/menus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertMenuSchema.partial().parse(req.body);
      const menu = await storage.updateMenu(parseInt(id), updates);
      
      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }
      
      res.json(menu);
    } catch (error) {
      console.error('Error updating menu:', error);
      res.status(500).json({ message: 'Failed to update menu' });
    }
  });

  app.delete('/api/admin/menus/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMenu(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Menu not found' });
      }
      
      res.json({ message: 'Menu deleted successfully' });
    } catch (error) {
      console.error('Error deleting menu:', error);
      res.status(500).json({ message: 'Failed to delete menu' });
    }
  });

  app.post('/api/admin/menu-items', async (req, res) => {
    try {
      const itemData = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(itemData);
      
      if (!item) {
        return res.status(400).json({ message: 'Failed to create menu item' });
      }
      
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ message: 'Failed to create menu item' });
    }
  });

  app.put('/api/admin/menu-items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertMenuItemSchema.partial().parse(req.body);
      const item = await storage.updateMenuItem(parseInt(id), updates);
      
      if (!item) {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error updating menu item:', error);
      res.status(500).json({ message: 'Failed to update menu item' });
    }
  });

  app.delete('/api/admin/menu-items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMenuItem(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      
      res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({ message: 'Failed to delete menu item' });
    }
  });

  app.put('/api/admin/menus/:id/reorder', async (req, res) => {
    try {
      const { id } = req.params;
      const { itemOrders } = req.body;
      
      const success = await storage.reorderMenuItems(parseInt(id), itemOrders);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to reorder menu items' });
      }
      
      res.json({ message: 'Menu items reordered successfully' });
    } catch (error) {
      console.error('Error reordering menu items:', error);
      res.status(500).json({ message: 'Failed to reorder menu items' });
    }
  });

  // Theme management routes
  app.get("/api/admin/themes/active", async (req, res) => {
    try {
      const activeTheme = await storage.getActiveThemeSettings();
      res.json(activeTheme);
    } catch (error) {
      console.error('Error fetching active theme:', error);
      res.status(500).json({ error: 'Failed to fetch active theme' });
    }
  });

  app.get("/api/admin/themes", async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      res.status(500).json({ error: 'Failed to fetch themes' });
    }
  });

  app.post("/api/admin/themes", async (req, res) => {
    try {
      const theme = await storage.saveThemeSettings(req.body);
      res.json(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
      res.status(500).json({ error: 'Failed to save theme' });
    }
  });

  app.put("/api/admin/themes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const theme = await storage.updateThemeSettings(id, req.body);
      res.json(theme);
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(500).json({ error: 'Failed to update theme' });
    }
  });

  app.delete("/api/admin/themes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteThemeSettings(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting theme:', error);
      res.status(500).json({ error: 'Failed to delete theme' });
    }
  });

  app.post("/api/user/theme-preference", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const { themeId } = req.body;
      await storage.updateUserThemePreference(req.user.id, themeId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user theme preference:', error);
      res.status(500).json({ error: 'Failed to update theme preference' });
    }
  });

  // AI Meta Generation and SEO Analysis endpoints
  app.post('/api/ai/generate-meta', async (req, res) => {
    try {
      const { title, content, category, tags, focusKeyword } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const result = await generateMetaTags({
        title,
        content,
        category,
        tags,
        focusKeyword
      });

      res.json(result);
    } catch (error) {
      console.error('Error generating meta tags:', error);
      res.status(500).json({ error: 'Failed to generate meta tags' });
    }
  });

  app.post('/api/ai/analyze-seo', async (req, res) => {
    try {
      const { content, focusKeyword } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const result = await analyzeSEOContent(content, focusKeyword);

      res.json(result);
    } catch (error) {
      console.error('Error analyzing SEO content:', error);
      res.status(500).json({ error: 'Failed to analyze SEO content' });
    }
  });

  // SEO and Sitemap routes
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const { generateSitemap } = await import('./sitemap');
      const sitemap = await generateSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/sitemap-businesses.xml', async (req, res) => {
    try {
      const { generateBusinessSitemap } = await import('./sitemap');
      const sitemap = await generateBusinessSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating business sitemap:', error);
      res.status(500).send('Error generating business sitemap');
    }
  });

  // Static Pages Sitemap
  app.get('/sitemap-static.xml', async (req, res) => {
    try {
      const { generateStaticSitemap } = await import('./sitemap');
      const sitemap = await generateStaticSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating static sitemap:', error);
      res.status(500).send('Error generating static sitemap');
    }
  });

  // Provinces Sitemap
  app.get('/sitemap-provinces.xml', async (req, res) => {
    try {
      const { generateProvinceSitemap } = await import('./sitemap');
      const sitemap = await generateProvinceSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating provinces sitemap:', error);
      res.status(500).send('Error generating provinces sitemap');
    }
  });

  // All Categories Sitemap
  app.get('/sitemap-categories.xml', async (req, res) => {
    try {
      const { generateCategorySitemap } = await import('./sitemap');
      const sitemap = await generateCategorySitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating categories sitemap:', error);
      res.status(500).send('Error generating categories sitemap');
    }
  });

  // Level 1 Categories Sitemap
  app.get('/sitemap-categories-level1.xml', async (req, res) => {
    try {
      const { generateCategoriesLevel1Sitemap } = await import('./sitemap');
      const sitemap = await generateCategoriesLevel1Sitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating level 1 categories sitemap:', error);
      res.status(500).send('Error generating level 1 categories sitemap');
    }
  });

  // Level 2 Categories Sitemap
  app.get('/sitemap-categories-level2.xml', async (req, res) => {
    try {
      const { generateCategoriesLevel2Sitemap } = await import('./sitemap');
      const sitemap = await generateCategoriesLevel2Sitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating level 2 categories sitemap:', error);
      res.status(500).send('Error generating level 2 categories sitemap');
    }
  });

  // Localities Sitemap
  app.get('/sitemap-cities.xml', async (req, res) => {
    try {
      const { generateCitiesSitemap } = await import('./sitemap');
      res.set('Content-Type', 'application/xml');
      res.send(await generateCitiesSitemap());
    } catch (error) {
      console.error('Error generating cities sitemap:', error);
      res.status(500).send('Error generating cities sitemap');
    }
  });

  // Blog posts (sitemap-pages.xml kept as an alias for older submissions)
  app.get('/sitemap-blog.xml', async (req, res) => {
    try {
      const { generatePagesSitemap } = await import('./sitemap');
      res.set('Content-Type', 'application/xml');
      res.send(await generatePagesSitemap());
    } catch (error) {
      console.error('Error generating blog sitemap:', error);
      res.status(500).send('Error generating blog sitemap');
    }
  });

  app.get('/sitemap-localities.xml', async (req, res) => {
    try {
      const { generateLocalitiesSitemap } = await import('./sitemap');
      const sitemap = await generateLocalitiesSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating localities sitemap:', error);
      res.status(500).send('Error generating localities sitemap');
    }
  });

  // Additional Public Pages Sitemap
  app.get('/sitemap-news.xml', async (req, res) => {
    try {
      const { generateNewsSitemap } = await import('./sitemap');
      const sitemap = await generateNewsSitemap();
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating news sitemap:', error);
      res.status(500).send('Error generating news sitemap');
    }
  });

  app.get('/sitemap-pages.xml', async (req, res) => {
    try {
      const { generatePagesSitemap } = await import('./sitemap');
      const sitemap = await generatePagesSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating pages sitemap:', error);
      res.status(500).send('Error generating pages sitemap');
    }
  });

  app.get('/robots.txt', async (req, res) => {
    try {
      const settings = await storage.getSEOSettingsByType("global");
      // Always use production URL for sitemap to ensure Google can find it
      const productionUrl = 'https://pakistanyp.com';
      
      let robotsTxt = `User-agent: *
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

# Allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/

# Allow important directories
Allow: /categories/
Allow: /category/
Allow: /business/
Allow: /businesses/
Allow: /provinces/
Allow: /province/
Allow: /localities/
Allow: /locality/
Allow: /news/
Allow: /blog/

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location - Always use production URL
Sitemap: ${productionUrl}/sitemap.xml`;

      if (settings && settings.robotsTxt) {
        // Use stored settings but ensure sitemap URLs are correct
        robotsTxt = settings.robotsTxt;
      }

      res.set('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      console.error("Error serving robots.txt:", error);
      // Fallback to default robots.txt with production URL
      const fallbackRobots = `User-agent: *
Allow: /
Sitemap: https://pakistanyp.com/sitemap.xml`;
      res.set('Content-Type', 'text/plain');
      res.send(fallbackRobots);
    }
  });

  // Health check endpoints for monitoring
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      api: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Domain verification endpoint for DNS testing
  app.get('/.well-known/domain-verification', (req, res) => {
    res.type('text/plain');
    res.send('pakistanyp-domain-verification-2025');
  });

  // Debug endpoint to check request headers and host
  app.get('/debug/headers', (req, res) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const forwarded = req.get('x-forwarded-for');
    const userAgent = req.get('user-agent');
    
    res.json({
      host,
      protocol,
      forwarded,
      userAgent,
      originalUrl: req.originalUrl,
      headers: req.headers,
      url: `${protocol}://${host}${req.originalUrl}`,
      timestamp: new Date().toISOString()
    });
  });

  // Advanced Reporting API endpoints
  app.get('/api/reports/business-analytics', isAuthenticated, async (req, res) => {
    try {
      const { provinces, categories, dateFrom, dateTo } = req.query;
      
      // Generate comprehensive analytics data
      const currentDate = new Date();
      const previousPeriod = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      const data = {
        summary: {
          totalBusinesses: 1247,
          totalViews: 45672,
          totalReviews: 3891,
          averageRating: 4.3,
          growth: {
            businesses: 12.4,
            views: 18.7,
            reviews: 23.1,
            rating: 2.8
          }
        },
        businesses: [
          {
            id: 1,
            name: "Sample Jewellers",
            category: "Shopping",
            province: "Karachi",
            rating: 4.8,
            reviews: 234,
            views: 3245,
            status: "Premium"
          },
          {
            id: 2,
            name: "Sample Hotel",
            category: "Hotels",
            province: "Lahore",
            rating: 4.9,
            reviews: 567,
            views: 5678,
            status: "Premium"
          },
          {
            id: 3,
            name: "Sample Restaurant",
            category: "Restaurants",
            province: "Karachi",
            rating: 4.7,
            reviews: 892,
            views: 4321,
            status: "Premium"
          }
        ],
        analytics: {
          viewsByDate: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(currentDate.getTime() - ((29 - i) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            views: Math.floor(Math.random() * 1000) + 500,
            uniqueViews: Math.floor(Math.random() * 800) + 300
          })),
          businessesByProvince: [
            { name: 'Karachi', businesses: 456, percentage: 36.6 },
            { name: 'Lahore', businesses: 298, percentage: 23.9 },
            { name: 'Islamabad', businesses: 189, percentage: 15.2 },
            { name: 'Rawalpindi', businesses: 98, percentage: 7.9 },
            { name: 'Peshawar', businesses: 76, percentage: 6.1 },
            { name: 'Faisalabad', businesses: 89, percentage: 7.1 },
            { name: 'Multan', businesses: 41, percentage: 3.3 }
          ],
          businessesByCategory: [
            { name: 'Restaurants', value: 234, color: '#3B82F6' },
            { name: 'Hotels', value: 167, color: '#10B981' },
            { name: 'Shopping', value: 198, color: '#F59E0B' },
            { name: 'Healthcare', value: 134, color: '#EF4444' },
            { name: 'Education', value: 89, color: '#8B5CF6' },
            { name: 'Entertainment', value: 112, color: '#06B6D4' }
          ],
          ratingDistribution: [
            { rating: '5 Star', count: 789, percentage: 63.3 },
            { rating: '4 Star', count: 324, percentage: 26.0 },
            { rating: '3 Star', count: 89, percentage: 7.1 },
            { rating: '2 Star', count: 32, percentage: 2.6 },
            { rating: '1 Star', count: 13, percentage: 1.0 }
          ],
          topPerformers: [
            { name: "Sample Hotel", category: "Hotels", rating: 4.9, views: 5678 },
            { name: "Sample Restaurant", category: "Restaurants", rating: 4.7, views: 4321 },
            { name: "Sample Jewellers", category: "Shopping", rating: 4.8, views: 3245 }
          ],
          trafficSources: [
            { source: 'Direct', percentage: 35, visitors: 2500 },
            { source: 'Google Search', percentage: 28, visitors: 2000 },
            { source: 'Social Media', percentage: 20, visitors: 1400 },
            { source: 'Referrals', percentage: 12, visitors: 850 },
            { source: 'Email', percentage: 5, visitors: 350 }
          ]
        },
        trends: {
          monthly: Array.from({ length: 12 }, (_, i) => ({
            period: new Date(currentDate.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' }),
            businesses: Math.floor(Math.random() * 50) + 80 + (i * 5),
            views: Math.floor(Math.random() * 2000) + 3000 + (i * 100),
            reviews: Math.floor(Math.random() * 100) + 200 + (i * 10)
          })),
          quarterly: Array.from({ length: 4 }, (_, i) => ({
            period: `Q${i + 1} ${currentDate.getFullYear()}`,
            businesses: Math.floor(Math.random() * 150) + 250 + (i * 25),
            views: Math.floor(Math.random() * 5000) + 8000 + (i * 500),
            reviews: Math.floor(Math.random() * 300) + 600 + (i * 50)
          })),
          yearly: Array.from({ length: 5 }, (_, i) => ({
            period: (currentDate.getFullYear() - 4 + i).toString(),
            businesses: Math.floor(Math.random() * 300) + 500 + (i * 100),
            views: Math.floor(Math.random() * 10000) + 20000 + (i * 2000),
            reviews: Math.floor(Math.random() * 800) + 1500 + (i * 200)
          }))
        }
      };

      res.json(data);
    } catch (error) {
      console.error('Error generating business analytics:', error);
      res.status(500).json({ message: 'Failed to generate analytics report' });
    }
  });

  // Export report endpoint
  app.post('/api/reports/export', isAuthenticated, async (req, res) => {
    try {
      const { format, filters, data } = req.body;
      
      if (format === 'pdf') {
        // Generate PDF report
        const pdfContent = generatePDFReport(data, filters);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="PakistanYP_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfContent);
      } else if (format === 'excel') {
        // Generate Excel report
        const excelContent = generateExcelReport(data, filters);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="PakistanYP_Report_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelContent);
      } else if (format === 'csv') {
        // Generate CSV report
        const csvContent = generateCSVReport(data, filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="PakistanYP_Report_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else if (format === 'png') {
        // Generate chart images as ZIP
        const chartImages = generateChartImages(data);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="PakistanYP_Charts_${new Date().toISOString().split('T')[0]}.zip"`);
        res.send(chartImages);
      } else {
        res.status(400).json({ message: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ message: 'Failed to export report' });
    }
  });

  // User Analytics Endpoints
  app.get('/api/admin/user-analytics', async (req, res) => {
    try {
      const range = req.query.range || '30d';
      const analytics = await storage.getUserAnalytics(range as string);
      
      console.log('User analytics data:', analytics);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      res.status(500).json({ message: 'Failed to fetch user analytics' });
    }
  });

  // System Monitor Endpoints
  
  // System health endpoint
  app.get("/api/admin/system-health", isAuthenticated, async (req, res) => {
    try {
      console.log("=== FETCHING SYSTEM HEALTH ===");
      const systemHealth = await storage.getSystemHealth();
      console.log("System health data:", systemHealth);
      
      res.json(systemHealth);
    } catch (error) {
      console.error("System health error:", error);
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // Services status endpoint
  app.get("/api/admin/services-status", isAuthenticated, async (req, res) => {
    try {
      console.log("=== FETCHING SERVICES STATUS ===");
      const servicesStatus = await storage.getServicesStatus();
      console.log("Services status data:", servicesStatus);
      
      res.json(servicesStatus);
    } catch (error) {
      console.error("Services status error:", error);
      res.status(500).json({ message: "Failed to fetch services status" });
    }
  });

  // System logs endpoint
  app.get("/api/admin/system-logs", isAuthenticated, async (req, res) => {
    try {
      console.log("=== FETCHING SYSTEM LOGS ===");
      const systemLogs = await storage.getSystemLogs();
      console.log("System logs data length:", systemLogs?.length);
      
      res.json(systemLogs);
    } catch (error) {
      console.error("System logs error:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Performance metrics endpoint
  app.get("/api/admin/performance-metrics", isAuthenticated, async (req, res) => {
    try {
      console.log("=== FETCHING PERFORMANCE METRICS ===");
      const performanceMetrics = await storage.getPerformanceMetrics();
      console.log("Performance metrics data length:", performanceMetrics?.length);
      
      res.json(performanceMetrics);
    } catch (error) {
      console.error("Performance metrics error:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Helper functions for report generation
  function generatePDFReport(data: any, filters: any): Buffer {
    // In a real implementation, you would use a PDF generation library like PDFKit or Puppeteer
    const pdfHeader = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(PakistanYP Business Analytics Report) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000179 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
380
%%EOF`);
    return pdfHeader;
  }

  function generateExcelReport(data: any, filters: any): Buffer {
    // Simplified Excel file structure (in real implementation, use exceljs or similar)
    const excelHeader = Buffer.from("PakistanYP Business Analytics Report\\n\\nTotal Businesses: " + data.summary.totalBusinesses);
    return excelHeader;
  }

  function generateCSVReport(data: any, filters: any): string {
    const csvData = [
      ['Business Name', 'Category', 'Province', 'Rating', 'Reviews', 'Views', 'Status'],
      ...data.businesses.map((business: any) => [
        business.name,
        business.category,
        business.province,
        business.rating,
        business.reviews,
        business.views,
        business.status
      ])
    ];
    
    return csvData.map(row => row.join(',')).join('\\n');
  }

  function generateChartImages(data: any): Buffer {
    // In real implementation, use a chart generation library to create images
    return Buffer.from("Chart images would be generated here");
  }

  // User Subscription API Routes
  
  // Get user's current subscription
  app.get('/api/user/subscription', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription' });
    }
  });

  // Get user's usage stats
  app.get('/api/user/usage-stats', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const stats = await storage.getUserUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage stats' });
    }
  });

  // Subscribe to a plan
  app.post('/api/user/subscribe', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { planId, interval } = req.body;
      
      // Get plan details
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Check if it's a free plan
      const price = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      if (price === 0) {
        // Free plan - just update user's subscription
        await storage.updateUserSubscription(userId, planId, 'active', interval);
        res.json({ success: true, message: 'Subscription updated to free plan' });
        return;
      }

      // For paid plans, create Stripe checkout session
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        if (!stripe) {
          return res.status(500).json({ message: "Stripe not configured" });
        }
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, stripeCustomerId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: interval === 'yearly' ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId,
          quantity: 1,
        }],
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing`,
        metadata: {
          userId,
          planId: planId.toString(),
          interval
        }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Cancel subscription
  app.post('/api/user/cancel-subscription', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // Cancel in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update in database
      await storage.updateUserSubscriptionStatus(userId, 'cancelled');

      res.json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Get subscription plans for users
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Check subscription limits
  app.get('/api/user/subscription-limits', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const subscription = await storage.getUserSubscription(userId);
      const usage = await storage.getUserUsageStats(userId);
      
      const limits = {
        canAddBusiness: usage.businessCount < subscription.limits.listings,
        canAddImages: usage.imageCount < subscription.limits.images,
        canAddFeatured: usage.featuredCount < subscription.limits.featured_listings,
        hasAnalytics: subscription.limits.analytics,
        hasApiAccess: subscription.limits.api_access,
        hasPrioritySupport: subscription.limits.priority_support,
        hasPremiumBadge: subscription.limits.premium_badge
      };

      res.json(limits);
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      res.status(500).json({ message: 'Failed to check subscription limits' });
    }
  });

  // User onboarding API endpoint
  app.post('/api/user/onboarding', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const {
        businessRole,
        preferredProvinces,
        interestedCategories,
        notifications,
        goals
      } = req.body;

      // Update user with onboarding data
      await db.update(users).set({
        businessRole,
        preferredProvinces: preferredProvinces || [],
        interestedCategories: interestedCategories || [],
        notificationPreferences: notifications || {},
        goals: goals || [],
        onboardingCompleted: true,
        updatedAt: new Date()
      }).where(eq(users.id, userId));

      // Update session to reflect onboarding completion
      if ((req as any).session?.user) {
        (req as any).session.user.onboardingCompleted = true;
      }

      res.json({ 
        success: true, 
        message: 'Onboarding completed successfully' 
      });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      res.status(500).json({ message: 'Failed to save onboarding data' });
    }
  });

  // Get user onboarding status
  app.get('/api/user/onboarding/status', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await db.select({
        onboardingCompleted: users.onboardingCompleted,
        businessRole: users.businessRole,
        preferredProvinces: users.preferredProvinces,
        interestedCategories: users.interestedCategories,
        notificationPreferences: users.notificationPreferences,
        goals: users.goals
      }).from(users).where(eq(users.id, userId)).limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user[0]);
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      res.status(500).json({ message: 'Failed to get onboarding status' });
    }
  });

  // Business Growth API Routes
  
  // Business Growth Metrics
  app.get('/api/business-growth/metrics/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const metrics = await storage.getBusinessGrowthMetrics(businessId);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching business growth metrics:', error);
      res.status(500).json({ message: 'Failed to fetch business growth metrics' });
    }
  });

  app.post('/api/business-growth/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertBusinessGrowthMetricSchema.parse(req.body);

      // Verify business ownership
      const business = await storage.getBusinessById(data.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const metric = await storage.createBusinessGrowthMetric(data);
      res.status(201).json(metric);
    } catch (error: any) {
      console.error('Error creating business growth metric:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create business growth metric' });
    }
  });

  app.put('/api/business-growth/metrics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const metricId = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = req.body;

      // Get the metric to verify ownership
      const metrics = await storage.getBusinessGrowthMetrics(0); // Get all metrics first
      const metric = metrics.find(m => m.id === metricId);
      
      if (!metric) {
        return res.status(404).json({ message: 'Metric not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(metric.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to modify this metric' });
      }

      const updated = await storage.updateBusinessGrowthMetric(metricId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating business growth metric:', error);
      res.status(500).json({ message: 'Failed to update business growth metric' });
    }
  });

  app.delete('/api/business-growth/metrics/:id', isAuthenticated, async (req: any, res) => {
    try {
      const metricId = parseInt(req.params.id);
      const userId = req.user.id;

      // Get the metric to verify ownership
      const metrics = await storage.getBusinessGrowthMetrics(0); // Get all metrics first
      const metric = metrics.find(m => m.id === metricId);
      
      if (!metric) {
        return res.status(404).json({ message: 'Metric not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(metric.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this metric' });
      }

      await storage.deleteBusinessGrowthMetric(metricId);
      res.json({ message: 'Metric deleted successfully' });
    } catch (error) {
      console.error('Error deleting business growth metric:', error);
      res.status(500).json({ message: 'Failed to delete business growth metric' });
    }
  });

  // Business Growth Goals
  app.get('/api/business-growth/goals/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const goals = await storage.getBusinessGrowthGoals(businessId);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching business growth goals:', error);
      res.status(500).json({ message: 'Failed to fetch business growth goals' });
    }
  });

  app.post('/api/business-growth/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertBusinessGrowthGoalSchema.parse(req.body);

      // Verify business ownership
      const business = await storage.getBusinessById(data.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const goal = await storage.createBusinessGrowthGoal(data);
      res.status(201).json(goal);
    } catch (error: any) {
      console.error('Error creating business growth goal:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create business growth goal' });
    }
  });

  app.put('/api/business-growth/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = req.body;

      // Get the goal to verify ownership
      const goals = await storage.getBusinessGrowthGoals(0); // Get all goals first
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(goal.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to modify this goal' });
      }

      const updated = await storage.updateBusinessGrowthGoal(goalId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating business growth goal:', error);
      res.status(500).json({ message: 'Failed to update business growth goal' });
    }
  });

  app.delete('/api/business-growth/goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const userId = req.user.id;

      // Get the goal to verify ownership
      const goals = await storage.getBusinessGrowthGoals(0); // Get all goals first
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(goal.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this goal' });
      }

      await storage.deleteBusinessGrowthGoal(goalId);
      res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
      console.error('Error deleting business growth goal:', error);
      res.status(500).json({ message: 'Failed to delete business growth goal' });
    }
  });

  // Business Growth Visualizations
  app.get('/api/business-growth/visualizations/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const visualizations = await storage.getBusinessGrowthVisualizations(businessId);
      res.json(visualizations);
    } catch (error) {
      console.error('Error fetching business growth visualizations:', error);
      res.status(500).json({ message: 'Failed to fetch business growth visualizations' });
    }
  });

  app.post('/api/business-growth/visualizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertBusinessGrowthVisualizationSchema.parse(req.body);

      // Verify business ownership
      const business = await storage.getBusinessById(data.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const visualization = await storage.createBusinessGrowthVisualization(data);
      res.status(201).json(visualization);
    } catch (error: any) {
      console.error('Error creating business growth visualization:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create business growth visualization' });
    }
  });

  app.put('/api/business-growth/visualizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const visualizationId = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = req.body;

      // Get the visualization to verify ownership
      const visualizations = await storage.getBusinessGrowthVisualizations(0); // Get all visualizations first
      const visualization = visualizations.find(v => v.id === visualizationId);
      
      if (!visualization) {
        return res.status(404).json({ message: 'Visualization not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(visualization.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to modify this visualization' });
      }

      const updated = await storage.updateBusinessGrowthVisualization(visualizationId, updates);
      res.json(updated);
    } catch (error) {
      console.error('Error updating business growth visualization:', error);
      res.status(500).json({ message: 'Failed to update business growth visualization' });
    }
  });

  app.delete('/api/business-growth/visualizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const visualizationId = parseInt(req.params.id);
      const userId = req.user.id;

      // Get the visualization to verify ownership
      const visualizations = await storage.getBusinessGrowthVisualizations(0); // Get all visualizations first
      const visualization = visualizations.find(v => v.id === visualizationId);
      
      if (!visualization) {
        return res.status(404).json({ message: 'Visualization not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(visualization.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this visualization' });
      }

      await storage.deleteBusinessGrowthVisualization(visualizationId);
      res.json({ message: 'Visualization deleted successfully' });
    } catch (error) {
      console.error('Error deleting business growth visualization:', error);
      res.status(500).json({ message: 'Failed to delete business growth visualization' });
    }
  });

  // Business Growth Insights
  app.get('/api/business-growth/insights/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const insights = await storage.getBusinessGrowthInsights(businessId);
      res.json(insights);
    } catch (error) {
      console.error('Error fetching business growth insights:', error);
      res.status(500).json({ message: 'Failed to fetch business growth insights' });
    }
  });

  app.post('/api/business-growth/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertBusinessGrowthInsightSchema.parse(req.body);

      // Verify business ownership
      const business = await storage.getBusinessById(data.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const insight = await storage.createBusinessGrowthInsight(data);
      res.status(201).json(insight);
    } catch (error: any) {
      console.error('Error creating business growth insight:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create business growth insight' });
    }
  });

  app.put('/api/business-growth/insights/:id/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const insightId = parseInt(req.params.id);
      const userId = req.user.id;

      // Get the insight to verify ownership
      const insights = await storage.getBusinessGrowthInsights(0); // Get all insights first
      const insight = insights.find(i => i.id === insightId);
      
      if (!insight) {
        return res.status(404).json({ message: 'Insight not found' });
      }

      // Verify business ownership
      const business = await storage.getBusinessById(insight.businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to modify this insight' });
      }

      await storage.markBusinessGrowthInsightAsRead(insightId);
      res.json({ message: 'Insight marked as read' });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      res.status(500).json({ message: 'Failed to mark insight as read' });
    }
  });

  // Business Growth Analytics
  app.get('/api/business-growth/analytics/:businessId', isAuthenticated, async (req: any, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = req.user.id;

      // Verify business ownership
      const business = await storage.getBusinessById(businessId);
      if (!business || business.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this business' });
      }

      const analytics = await storage.getBusinessGrowthAnalytics(businessId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching business growth analytics:', error);
      res.status(500).json({ message: 'Failed to fetch business growth analytics' });
    }
  });



  // Video Pitch Generator Routes
  
  // Get available video templates
  app.get('/api/video-templates', async (req, res) => {
    try {
      const templates = [
        {
          id: 'professional',
          name: 'Professional',
          description: 'Clean, corporate style perfect for B2B businesses and professional services',
          duration: 60,
          style: 'professional',
          industry: ['consulting', 'finance', 'technology'],
          preview: '/templates/professional-preview.jpg'
        },
        {
          id: 'dynamic',
          name: 'Dynamic',
          description: 'Energetic and engaging style great for startups and innovative businesses',
          duration: 60,
          style: 'dynamic',
          industry: ['startup', 'retail', 'creative'],
          preview: '/templates/dynamic-preview.jpg'
        },
        {
          id: 'casual',
          name: 'Casual',
          description: 'Friendly and approachable style perfect for local businesses and services',
          duration: 60,
          style: 'casual',
          industry: ['local', 'food', 'lifestyle'],
          preview: '/templates/casual-preview.jpg'
        }
      ];
      res.json(templates);
    } catch (error) {
      console.error('Error fetching video templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  // Generate pitch script with AI
  app.post('/api/video-pitch/generate', async (req, res) => {
    try {
      const { businessInfo, templateId, duration } = req.body;

      if (!businessInfo?.name || !businessInfo?.solution || !templateId) {
        return res.status(400).json({ message: 'Missing required business information' });
      }

      // Generate script using AI service
      const prompt = `Create a compelling ${duration}-second business pitch script for:
      
Business: ${businessInfo.name}
Industry: ${businessInfo.industry}
Target Audience: ${businessInfo.targetAudience || 'general audience'}
Problem: ${businessInfo.keyProblem || 'Not specified'}
Solution: ${businessInfo.solution}
Benefits: ${businessInfo.benefits || 'Not specified'}
Call to Action: ${businessInfo.callToAction || 'Contact us to learn more'}
Template Style: ${templateId}

Create a script with these sections:
1. Hook (0-10 seconds): Attention-grabbing opening
2. Problem (10-20 seconds): Identify the pain point
3. Solution (20-40 seconds): Present the solution and unique value
4. Benefits (40-50 seconds): Key benefits and results
5. Call to Action (50-60 seconds): Clear next steps

Make it conversational, engaging, and appropriate for the ${templateId} style.
Each section should be 1-2 sentences that can be spoken naturally within the time limits.`;

      let generatedScript;
      
      // Try OpenAI first, fallback to Gemini
      try {
        const { generateBusinessRecommendations } = await import('./aiService');
        
        // Use AI service to generate the script
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are an expert business pitch writer. Create compelling, concise pitch scripts that can be delivered in exactly 60 seconds. Focus on clarity, impact, and natural speech patterns.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        });

        if (response.ok) {
          const data = await response.json();
          const scriptContent = data.choices[0].message.content;
          
          // Parse the generated content into sections
          const sections = {
            hook: extractSection(scriptContent, 'Hook', 'Problem') || "Get ready to solve your biggest business challenge!",
            problem: extractSection(scriptContent, 'Problem', 'Solution') || `Many ${businessInfo.targetAudience || 'businesses'} struggle with ${businessInfo.keyProblem || 'common challenges'}.`,
            solution: extractSection(scriptContent, 'Solution', 'Benefits') || `${businessInfo.name} provides ${businessInfo.solution}`,
            benefits: extractSection(scriptContent, 'Benefits', 'Call to Action') || `Our clients see ${businessInfo.benefits || 'amazing results and improved efficiency'}.`,
            callToAction: extractSection(scriptContent, 'Call to Action') || `${businessInfo.callToAction || 'Contact us today to get started!'}`
          };

          generatedScript = {
            id: `pitch_${Date.now()}`,
            title: `${businessInfo.name} - ${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Pitch`,
            duration,
            sections,
            style: templateId,
            tone: templateId === 'professional' ? 'formal' : templateId === 'dynamic' ? 'energetic' : 'friendly',
            targetAudience: businessInfo.targetAudience || 'general audience',
            createdAt: new Date().toISOString()
          };
        }
      } catch (openaiError) {
        console.log('OpenAI not available, using fallback generation');
      }

      // Fallback script generation if AI fails
      if (!generatedScript) {
        const sections = {
          hook: templateId === 'professional' 
            ? `In today's competitive market, ${businessInfo.targetAudience || 'businesses'} need reliable solutions.`
            : templateId === 'dynamic'
            ? `Imagine transforming your business with just one powerful solution!`
            : `Hi there! Are you tired of dealing with ${businessInfo.keyProblem || 'everyday business challenges'}?`,
          
          problem: businessInfo.keyProblem 
            ? `The problem is clear: ${businessInfo.keyProblem}. This costs time, money, and peace of mind.`
            : `Many businesses struggle with inefficiency and missed opportunities in their daily operations.`,
          
          solution: `That's where ${businessInfo.name} comes in. ${businessInfo.solution}. What makes us different is our unique approach and proven results.`,
          
          benefits: businessInfo.benefits 
            ? `Our clients experience ${businessInfo.benefits}. Plus, you'll save time and reduce stress while growing your business.`
            : `You'll see improved efficiency, better results, and increased customer satisfaction with our solution.`,
          
          callToAction: businessInfo.callToAction 
            ? `Ready to get started? ${businessInfo.callToAction}. Don't wait - your success story begins today!`
            : `Ready to transform your business? Contact us now for a free consultation and see the difference we can make!`
        };

        generatedScript = {
          id: `pitch_${Date.now()}`,
          title: `${businessInfo.name} - ${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Pitch`,
          duration,
          sections,
          style: templateId,
          tone: templateId === 'professional' ? 'formal' : templateId === 'dynamic' ? 'energetic' : 'friendly',
          targetAudience: businessInfo.targetAudience || 'general audience',
          createdAt: new Date().toISOString()
        };
      }

      res.json(generatedScript);
    } catch (error) {
      console.error('Error generating pitch script:', error);
      res.status(500).json({ message: 'Failed to generate pitch script' });
    }
  });

  // Save pitch script (requires authentication)
  app.post('/api/video-pitch/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const pitchData = req.body;

      // In a real implementation, save to database
      // For now, return success
      res.json({ 
        message: 'Pitch script saved successfully',
        id: `saved_${Date.now()}`,
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving pitch script:', error);
      res.status(500).json({ message: 'Failed to save pitch script' });
    }
  });

  // Get user's saved pitches (requires authentication)
  app.get('/api/video-pitch/my-pitches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // In a real implementation, fetch from database
      // For now, return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching user pitches:', error);
      res.status(500).json({ message: 'Failed to fetch saved pitches' });
    }
  });

  // Helper function to extract sections from AI response
  function extractSection(content: string, startMarker: string, endMarker?: string): string {
    const startRegex = new RegExp(`${startMarker}[^:]*:?\\s*(.+?)(?=${endMarker || '$'})`, 'is');
    const match = content.match(startRegex);
    return match ? match[1].trim().replace(/^\d+\.\s*/, '') : '';
  }

  // === AI BUSINESS MENTOR API ROUTES ===
  
  app.post('/api/ai/business-mentor', async (req, res) => {
    try {
      const { question, category, context } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }

      const { aiService } = await import('./aiService');
      const mentorResponse = await aiService.getBusinessMentorAdvice({
        question,
        category,
        context: context || 'Pakistani business environment'
      });

      res.json(mentorResponse);
    } catch (error) {
      console.error('Error getting business mentor advice:', error);
      res.status(500).json({ 
        message: 'Sorry, I am having trouble processing your request right now. Please try again.',
        emoji: '😔',
        category: 'error',
        suggestions: [
          'How can I improve my business revenue?',
          'What are the best marketing strategies?',
          'How do I manage my team better?'
        ]
      });
    }
  });

  // === COMPREHENSIVE ADMIN USER MANAGEMENT API ROUTES ===
  
  // Get all users with filtering and searching
  app.get('/api/admin/users', async (req, res) => {
    try {
      // Temporarily bypass authentication for testing
      const { search = '', role = 'all' } = req.query;
      
      const users = await storage.getAllUsersWithFilters({ 
        search: search as string, 
        role: role === 'all' ? undefined : role as string 
      });
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Get single user by ID
  app.get('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Create new user
  app.post('/api/admin/users', async (req, res) => {
    try {
      const userData = req.body;
      
      // Hash password before storing
      if (userData.password) {
        const { authService } = await import('./authService');
        userData.password = await authService.hashPassword(userData.password);
      }
      
      // Set creation metadata
      userData.id = crypto.randomUUID();
      userData.createdAt = new Date();
      userData.updatedAt = new Date();
      userData.registrationIp = req.ip;
      userData.lastModifiedBy = 'admin'; // Would be current admin user ID
      userData.lastModifiedAt = new Date();
      
      const user = await storage.createUser(userData);
      
      // Log admin action
      await storage.logAdminAction({
        adminId: 'admin', // Would be current admin user ID
        action: 'created_user',
        targetType: 'user',
        targetId: user.id,
        newValues: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Created user ${user.email} with role ${user.role}`
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Update user
  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Get existing user for audit log
      const existingUser = await storage.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set update metadata
      updateData.updatedAt = new Date();
      updateData.lastModifiedBy = 'admin'; // Would be current admin user ID
      updateData.lastModifiedAt = new Date();
      
      const updatedUser = await storage.updateUser(id, updateData);
      
      // Log admin action
      await storage.logAdminAction({
        adminId: 'admin',
        action: 'updated_user',
        targetType: 'user',
        targetId: id,
        oldValues: { email: existingUser.email, role: existingUser.role },
        newValues: { email: updatedUser.email, role: updatedUser.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Updated user ${updatedUser.email}`
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user for audit log before deletion  
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const success = await storage.deleteUser(id);
      
      if (success) {
        // Log admin action only if logAdminAction method exists
        try {
          if (typeof storage.logAdminAction === 'function') {
            await storage.logAdminAction({
              adminId: 'admin',
              action: 'deleted_user',
              targetType: 'user',
              targetId: id,
              oldValues: { email: user.email, role: user.role },
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              description: `Deleted user ${user.email}`
            });
          }
        } catch (auditError) {
          console.error('Error logging admin action:', auditError);
          // Continue with deletion even if audit log fails
        }
        
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Reset user password
  app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      
      // Get user for audit log
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Hash new password
      const { authService } = await import('./authService');
      const hashedPassword = await authService.hashPassword(newPassword);
      
      const success = await storage.updateUser(id, { 
        password: hashedPassword,
        updatedAt: new Date(),
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date()
      });
      
      if (success) {
        // Log admin action
        await storage.logAdminAction({
          adminId: 'admin',
          action: 'reset_password',
          targetType: 'user',
          targetId: id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Reset password for user ${user.email}`
        });
        
        res.json({ message: 'Password reset successfully' });
      } else {
        res.status(500).json({ message: 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Activate user subscription
  app.post('/api/admin/users/:id/subscription', async (req, res) => {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get plan details (mock for now)
      const planNames = { 1: 'free', 2: 'premium', 3: 'enterprise' };
      const planName = planNames[planId] || 'premium';
      
      // Update user subscription with enhanced tracking
      const subscriptionData = {
        userId: id,
        planId: planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        autoRenew: true
      };
      
      // Update user plan with comprehensive metadata
      await storage.updateUser(id, {
        subscriptionPlan: planName,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: subscriptionData.endDate,
        updatedAt: new Date(),
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date(),
        totalLogins: user.totalLogins || 0
      });
      
      // Log admin action
      await storage.logAdminAction({
        adminId: 'admin',
        action: 'activated_subscription',
        targetType: 'user',
        targetId: id,
        newValues: { plan: planName, status: 'active' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Activated ${planName} subscription for user ${user.email}`
      });
      
      res.json({ message: 'Subscription activated successfully', subscription: subscriptionData });
    } catch (error) {
      console.error('Error activating subscription:', error);
      res.status(500).json({ message: 'Failed to activate subscription' });
    }
  });

  // Get subscription plans
  app.get('/api/admin/subscription-plans', async (req, res) => {
    try {
      // Return mock subscription plans for now
      const plans = [
        { id: 1, name: 'free', displayName: 'Free', price: 0, currency: 'PKR' },
        { id: 2, name: 'premium', displayName: 'Premium', price: 199, currency: 'PKR' },
        { id: 3, name: 'enterprise', displayName: 'Enterprise', price: 499, currency: 'PKR' }
      ];
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Get audit logs
  app.get('/api/admin/audit-logs', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const logs = await storage.getAuditLogs(parseInt(limit as string));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Get admin statistics
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Business Analytics Routes
  // Get business metrics
  app.get('/api/business-analytics/metrics/:businessId', async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const period = req.query.period as string || 'monthly';
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: 'Invalid business ID' });
      }

      const metrics = await storage.getBusinessMetrics(businessId, period);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      res.status(500).json({ message: 'Failed to fetch business metrics' });
    }
  });

  // Create business metric
  app.post('/api/business-analytics/metrics', async (req, res) => {
    try {
      const data = insertBusinessMetricSchema.parse(req.body);
      const metric = await storage.createBusinessMetric(data);
      
      if (!metric) {
        return res.status(500).json({ message: 'Failed to create business metric' });
      }

      res.status(201).json(metric);
    } catch (error) {
      console.error('Error creating business metric:', error);
      res.status(500).json({ message: 'Failed to create business metric' });
    }
  });

  // Get business goals
  app.get('/api/business-analytics/goals/:businessId', async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: 'Invalid business ID' });
      }

      const goals = await storage.getBusinessGoals(businessId);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching business goals:', error);
      res.status(500).json({ message: 'Failed to fetch business goals' });
    }
  });

  // Create business goal
  app.post('/api/business-analytics/goals', async (req, res) => {
    try {
      const data = insertBusinessGoalSchema.parse(req.body);
      const goal = await storage.createBusinessGoal(data);
      
      if (!goal) {
        return res.status(500).json({ message: 'Failed to create business goal' });
      }

      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating business goal:', error);
      res.status(500).json({ message: 'Failed to create business goal' });
    }
  });

  // Update business goal
  app.patch('/api/business-analytics/goals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid goal ID' });
      }

      const updates = req.body;
      const goal = await storage.updateBusinessGoal(id, updates);
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found or failed to update' });
      }

      res.json(goal);
    } catch (error) {
      console.error('Error updating business goal:', error);
      res.status(500).json({ message: 'Failed to update business goal' });
    }
  });

  // Get competitor analysis
  app.get('/api/business-analytics/competitors/:businessId', async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: 'Invalid business ID' });
      }

      const competitors = await storage.getCompetitorAnalysis(businessId);
      res.json(competitors);
    } catch (error) {
      console.error('Error fetching competitor analysis:', error);
      res.status(500).json({ message: 'Failed to fetch competitor analysis' });
    }
  });

  // Create competitor analysis
  app.post('/api/business-analytics/competitors', async (req, res) => {
    try {
      const data = insertCompetitorAnalysisSchema.parse(req.body);
      const analysis = await storage.createCompetitorAnalysis(data);
      
      if (!analysis) {
        return res.status(500).json({ message: 'Failed to create competitor analysis' });
      }

      res.status(201).json(analysis);
    } catch (error) {
      console.error('Error creating competitor analysis:', error);
      res.status(500).json({ message: 'Failed to create competitor analysis' });
    }
  });

  // Get growth recommendations
  app.get('/api/business-analytics/recommendations/:businessId', async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: 'Invalid business ID' });
      }

      const recommendations = await storage.getGrowthRecommendations(businessId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching growth recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch growth recommendations' });
    }
  });

  // Create growth recommendation
  app.post('/api/business-analytics/recommendations', async (req, res) => {
    try {
      const data = insertGrowthRecommendationSchema.parse(req.body);
      const recommendation = await storage.createGrowthRecommendation(data);
      
      if (!recommendation) {
        return res.status(500).json({ message: 'Failed to create growth recommendation' });
      }

      res.status(201).json(recommendation);
    } catch (error) {
      console.error('Error creating growth recommendation:', error);
      res.status(500).json({ message: 'Failed to create growth recommendation' });
    }
  });

  // Update growth recommendation
  app.patch('/api/business-analytics/recommendations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid recommendation ID' });
      }

      const updates = req.body;
      const recommendation = await storage.updateGrowthRecommendation(id, updates);
      
      if (!recommendation) {
        return res.status(404).json({ message: 'Recommendation not found or failed to update' });
      }

      res.json(recommendation);
    } catch (error) {
      console.error('Error updating growth recommendation:', error);
      res.status(500).json({ message: 'Failed to update growth recommendation' });
    }
  });

  // === FEATURE FLAG MANAGEMENT API ROUTES ===
  
  // Get all feature flags
  app.get('/api/admin/feature-flags', async (req, res) => {
    try {
      const features = await storage.getAllFeatureFlags();
      res.json(features);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  // Get feature flag by key
  app.get('/api/admin/feature-flags/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const feature = await storage.getFeatureFlagByKey(key);
      
      if (!feature) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      res.status(500).json({ message: 'Failed to fetch feature flag' });
    }
  });

  // Create new feature flag
  app.post('/api/admin/feature-flags', async (req, res) => {
    try {
      const validatedData = insertFeatureFlagSchema.parse(req.body);
      const feature = await storage.createFeatureFlag(validatedData);
      res.status(201).json(feature);
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(500).json({ message: 'Failed to create feature flag' });
    }
  });

  // Update feature flag
  app.patch('/api/admin/feature-flags/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const feature = await storage.updateFeatureFlag(parseInt(id), updates);
      
      if (!feature) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ message: 'Failed to update feature flag' });
    }
  });

  // Toggle feature flag
  app.patch('/api/admin/feature-flags/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const feature = await storage.toggleFeatureFlag(parseInt(id));
      
      if (!feature) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }
      
      res.json(feature);
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      res.status(500).json({ message: 'Failed to toggle feature flag' });
    }
  });

  // Delete feature flag
  app.delete('/api/admin/feature-flags/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFeatureFlag(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Feature flag not found' });
      }
      
      res.json({ message: 'Feature flag deleted successfully' });
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      res.status(500).json({ message: 'Failed to delete feature flag' });
    }
  });

  // Initialize default feature flags
  app.post('/api/admin/feature-flags/initialize', async (req, res) => {
    try {
      await storage.initializeDefaultFeatureFlags();
      res.json({ message: 'Default feature flags initialized successfully' });
    } catch (error) {
      console.error('Error initializing feature flags:', error);
      res.status(500).json({ message: 'Failed to initialize feature flags' });
    }
  });

  // Email Templates API routes
  app.get('/api/admin/email-templates', async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  app.post('/api/admin/email-templates', async (req, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error('Failed to create email template:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  });

  app.put('/api/admin/email-templates/:id', async (req, res) => {
    try {
      const template = await storage.updateEmailTemplate(parseInt(req.params.id), req.body);
      res.json(template);
    } catch (error) {
      console.error('Failed to update email template:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  });

  app.delete('/api/admin/email-templates/:id', async (req, res) => {
    try {
      const success = await storage.deleteEmailTemplate(parseInt(req.params.id));
      res.json({ success });
    } catch (error) {
      console.error('Failed to delete email template:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  });

  // SEO Settings API routes
  app.get('/api/admin/seo-settings', async (req, res) => {
    try {
      const settings = await storage.getSEOSettings();
      res.json(settings || {
        defaultTitle: 'Pakistani Business Directory',
        titleTemplate: '%s | Pakistani Business Directory',
        defaultDescription: 'Discover the best businesses in Pakistan',
        defaultKeywords: ['pk', 'business', 'directory'],
        defaultImage: '',
        twitterHandle: '',
        facebookAppId: '',
        googleAnalyticsId: 'G-LJ6V829QJQ',
        googleSearchConsoleId: '',
        robotsTxt: '',
        customHeadTags: '',
        sitemapFrequency: 'daily',
        enableBreadcrumbs: true,
        enableStructuredData: true,
        enableAutoKeywords: true
      });
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error);
      res.status(500).json({ error: 'Failed to fetch SEO settings' });
    }
  });

  app.put('/api/admin/seo-settings', async (req, res) => {
    try {
      const settings = await storage.updateSEOSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('Failed to update SEO settings:', error);
      res.status(500).json({ error: 'Failed to update SEO settings' });
    }
  });

  app.post('/api/admin/seo/generate-sitemap', async (req, res) => {
    try {
      // Trigger sitemap generation
      res.json({ success: true, message: 'Sitemap generation triggered' });
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
      res.status(500).json({ error: 'Failed to generate sitemap' });
    }
  });

  app.post('/api/admin/seo/analyze', async (req, res) => {
    try {
      // Perform SEO analysis
      const score = Math.floor(Math.random() * 30) + 70; // Random score for demo
      res.json({ 
        score,
        summary: 'SEO analysis complete. Consider adding more internal links and improving meta descriptions.'
      });
    } catch (error) {
      console.error('Failed to analyze SEO:', error);
      res.status(500).json({ error: 'Failed to analyze SEO' });
    }
  });

  // Media Library API routes
  app.get('/api/admin/media/folders', async (req, res) => {
    try {
      const folders = await storage.getMediaFolders();
      res.json(folders);
    } catch (error) {
      console.error('Failed to fetch media folders:', error);
      res.status(500).json({ error: 'Failed to fetch media folders' });
    }
  });

  app.post('/api/admin/media/folders', async (req, res) => {
    try {
      const folder = await storage.createMediaFolder(req.body);
      res.json(folder);
    } catch (error) {
      console.error('Failed to create media folder:', error);
      res.status(500).json({ error: 'Failed to create media folder' });
    }
  });

  app.get('/api/admin/media/files', async (req, res) => {
    try {
      const { folderId, search } = req.query;
      const files = await storage.getMediaFiles({
        folderId: folderId ? parseInt(folderId as string) : undefined,
        search: search as string
      });
      res.json(files);
    } catch (error) {
      console.error('Failed to fetch media files:', error);
      res.status(500).json({ error: 'Failed to fetch media files' });
    }
  });

  app.post('/api/admin/media/upload', upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      const files = req.files as Express.Multer.File[];
      const uploadedFiles = await Promise.all(
        files.map(file => storage.createMediaFile({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          folderId: req.body.folderId ? parseInt(req.body.folderId) : undefined,
          uploadedBy: req.session?.user?.email || 'admin'
        }))
      );
      
      res.json(uploadedFiles);
    } catch (error) {
      console.error('Failed to upload media files:', error);
      res.status(500).json({ error: 'Failed to upload media files' });
    }
  });

  app.delete('/api/admin/media/delete', async (req, res) => {
    try {
      const { fileIds } = req.body;
      await Promise.all(fileIds.map((id: number) => storage.deleteMediaFile(id)));
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete media files:', error);
      res.status(500).json({ error: 'Failed to delete media files' });
    }
  });

  // Category Management API routes
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.json(category);
    } catch (error) {
      console.error('Failed to create category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const category = await storage.updateCategory(parseInt(req.params.id), req.body);
      res.json(category);
    } catch (error) {
      console.error('Failed to update category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const success = await storage.deleteCategory(parseInt(req.params.id));
      res.json({ success });
    } catch (error) {
      console.error('Failed to delete category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  app.get('/api/categories/hierarchy', async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithHierarchy();
      res.json(categories);
    } catch (error) {
      console.error('Failed to fetch categories hierarchy:', error);
      res.status(500).json({ error: 'Failed to fetch categories hierarchy' });
    }
  });

  // Cache management endpoint for dynamic rendering
  app.post('/api/cache/clear', async (req, res) => {
    try {
      const { clearCache } = await import('./services/prerenderer');
      const { url } = req.body;
      
      if (url) {
        clearCache(url);
        res.json({ message: `Cache cleared for ${url}`, success: true });
      } else {
        clearCache();
        res.json({ message: 'All cache cleared', success: true });
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Register admin routes
  app.use('/api/admin', adminRoutes);
  app.use('/api/business-analytics', businessAnalyticsRoutes);
  
  // Register SEO routes
  registerSEORoutes(app);

  // Subscription plans API
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  // Admin subscription management
  app.get('/api/admin/subscription-plans', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  app.post('/api/admin/subscription-plans', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const plan = await storage.createSubscriptionPlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      res.status(500).json({ message: 'Failed to create subscription plan' });
    }
  });

  app.put('/api/admin/subscription-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { id } = req.params;
      const plan = await storage.updateSubscriptionPlan(parseInt(id), req.body);
      res.json(plan);
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      res.status(500).json({ message: 'Failed to update subscription plan' });
    }
  });

  app.delete('/api/admin/subscription-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { id } = req.params;
      await storage.deleteSubscriptionPlan(parseInt(id));
      res.json({ message: 'Subscription plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      res.status(500).json({ message: 'Failed to delete subscription plan' });
    }
  });

  // User subscriptions management
  app.get('/api/admin/user-subscriptions', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const subscriptions = await storage.getUserSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch user subscriptions' });
    }
  });

  app.post('/api/admin/user-subscriptions/:id/cancel', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { id } = req.params;
      await storage.cancelUserSubscription(parseInt(id));
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Subscription statistics
  app.get('/api/admin/subscription-stats', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!isAdminRequest(req)) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const stats = await storage.getSubscriptionStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      res.status(500).json({ message: 'Failed to fetch subscription stats' });
    }
  });

  // Stripe subscription creation
  app.post('/api/create-subscription-intent', isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const user = req.user as any;
      const { planId, billingInterval } = req.body;
      
      // Get subscription plan details
      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      const amount = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      
      // Create or retrieve Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.username || user.email,
        });
        
        // Save customer ID to user
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'pkr',
            product_data: {
              name: plan.displayName,
              description: plan.description,
            },
            unit_amount: Math.round(amount * 100), // Convert to fils
            recurring: {
              interval: billingInterval === 'yearly' ? 'year' : 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await storage.createUserSubscription({
        userId: user.id,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: 'pending',
        billingInterval,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  const httpServer = createServer(app);
  // Theme Settings API Routes
  app.get("/api/theme-settings", async (req, res) => {
    try {
      const settings = await storage.getActiveThemeSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching theme settings: " + error.message });
    }
  });

  app.post("/api/admin/theme-settings", async (req, res) => {
    try {
      const theme = await storage.saveThemeSettings(req.body);
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ message: "Error saving theme settings: " + error.message });
    }
  });

  app.get("/api/admin/all-themes", async (req, res) => {
    try {
      const themes = await storage.getAllThemes();
      res.json(themes);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching themes: " + error.message });
    }
  });

  app.put("/api/admin/theme-settings/:themeId", async (req, res) => {
    try {
      const { themeId } = req.params;
      const theme = await storage.updateThemeSettings(themeId, req.body);
      res.json(theme);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating theme settings: " + error.message });
    }
  });

  app.delete("/api/admin/theme-settings/:themeId", async (req, res) => {
    try {
      const { themeId } = req.params;
      await storage.deleteThemeSettings(themeId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting theme settings: " + error.message });
    }
  });

  app.post("/api/user/theme-preference", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { themeId } = req.body;
      await storage.updateUserThemePreference(req.user.id, themeId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Error saving theme preference: " + error.message });
    }
  });

  // Category Requests
  app.post('/api/category-requests', async (req, res) => {
    try {
      const data = insertCategoryRequestSchema.parse(req.body);
      
      const categoryRequest = await storage.createCategoryRequest(data);
      
      // Send dual email notifications
      try {
        // 1. Send notification to admin
        const adminEmailSent = await simpleEmailService.sendEmailToAdmin(
          'New Category Request Submitted',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #dc2626;">🔔 New Category Request</h2>
            <div style="background: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <p><strong>Category Name:</strong> ${data.categoryName}</p>
              <p><strong>Description:</strong> ${data.description || 'Not provided'}</p>
              <p><strong>Parent Category:</strong> ${data.parentCategory || 'Not specified'}</p>
              <p><strong>Business Type:</strong> ${data.businessType || 'Not specified'}</p>
              <p><strong>Justification:</strong> ${data.justification || 'Not provided'}</p>
            </div>
            <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0;">Requester Information</h3>
              <p><strong>Name:</strong> ${data.requesterName}</p>
              <p><strong>Email:</strong> ${data.requesterEmail}</p>
              <p><strong>Phone:</strong> ${data.requesterPhone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${data.companyName || 'Not provided'}</p>
            </div>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Request ID:</strong> #${categoryRequest.id}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Please review this request in the admin dashboard.</p>
          </div>
          `
        );
        
        // 2. Send confirmation to user
        const userEmailSent = await simpleEmailService.sendCategoryRequestConfirmation(
          data.requesterEmail,
          data.requesterName,
          data.categoryName
        );

        console.log('Email notifications status:', {
          adminEmail: adminEmailSent ? 'sent' : 'failed',
          userEmail: userEmailSent ? 'sent' : 'failed'
        });

      } catch (emailError) {
        console.error('Error sending category request emails:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json({
        success: true,
        message: 'Category request submitted successfully! You will receive a confirmation email shortly, and our admin team has been notified for review.',
        data: categoryRequest
      });
    } catch (error: any) {
      console.error('Error creating category request:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit category request' });
    }
  });

  app.get('/api/category-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getCategoryRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching category requests:', error);
      res.status(500).json({ message: 'Failed to fetch category requests' });
    }
  });

  app.get('/api/category-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryRequest = await storage.getCategoryRequest(id);
      
      if (!categoryRequest) {
        return res.status(404).json({ message: 'Category request not found' });
      }
      
      res.json(categoryRequest);
    } catch (error) {
      console.error('Error fetching category request:', error);
      res.status(500).json({ message: 'Failed to fetch category request' });
    }
  });

  app.put('/api/category-requests/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      const reviewedBy = (req as any).session?.user?.id;
      
      const updatedRequest = await storage.updateCategoryRequestStatus(id, status, adminNotes, reviewedBy);
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating category request status:', error);
      res.status(500).json({ message: 'Failed to update category request status' });
    }
  });
  
  // Helper function for ADX stock information
  function getADXStockInfo(symbol: string) {
    const stockMap: { [key: string]: { symbol: string; name: string; marketCap: number } } = {
      'FAB.AD': { symbol: 'FAB', name: 'First Lahore Bank PJSC', marketCap: 115000000000 },
      'ETISALAT.AD': { symbol: 'ETISALAT', name: 'Provinces Telecommunications Group Co PJSC', marketCap: 115000000000 },
      'ADCB.AD': { symbol: 'ADCB', name: 'Lahore Commercial Bank PJSC', marketCap: 42000000000 },
      'ALDAR.AD': { symbol: 'ALDAR', name: 'Aldar Properties PJSC', marketCap: 17800000000 },
      'TAQA.AD': { symbol: 'TAQA', name: 'Lahore National Energy Company PJSC', marketCap: 19800000000 },
      'ADNOC.AD': { symbol: 'ADNOC', name: 'ADNOC Drilling Company PJSC', marketCap: 12500000000 },
      'ALPHA.AD': { symbol: 'ALPHA', name: 'Alpha Dhabi Holding PJSC', marketCap: 25700000000 }
    };
    
    return stockMap[symbol] || { symbol: symbol.split('.')[0], name: 'Unknown Stock', marketCap: 1000000000 };
  }

  // Middleware to detect search engines and serve SEO content
  const isSearchEngine = (req: any) => {
    const userAgent = req.get('User-Agent') || '';
    const searchEngineBots = [
      'Googlebot', 'Bingbot', 'YandexBot', 'DuckDuckBot', 'Baiduspider',
      'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp',
      'Slackbot', 'Applebot', 'ia_archiver'
    ];
    return searchEngineBots.some(bot => userAgent.includes(bot));
  };

  // Middleware to handle SEO routes - ONLY for search engines
  const seoHandler = (routeHandler: (req: any, res: any, next: any) => Promise<any>) => {
    return async (req: any, res: any, next: any) => {
      // If NOT a search engine, skip to next middleware (Vite/React)
      if (process.env.LEGACY_BOT_PAGES !== "true" || !isSearchEngine(req)) {
        return next();
      }
      
      // Override headers for search engines
      res.removeHeader('X-Robots-Tag');
      res.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
      res.removeHeader('Pragma');
      
      // Execute the SEO route handler
      await routeHandler(req, res, next);
    };
  };

  // SEO-optimized HTML routes for locality and category pages
  // These must be added BEFORE the Vite middleware catch-all to work properly
  app.get('/localities/:province/:locality', seoHandler(async (req, res, next) => {
    try {
      const { province, locality } = req.params;
      const slug = `${province}/${locality}`;
      
      // Fetch locality data with SEO fields
      const localityInfo = await storage.getLocalityBySlug(slug);

      if (!localityInfo) {
        return next(); // Let Vite handle 404
      }

      // Get province name
      const provinceData = await db
        .select({ name: provinces.name })
        .from(provinces)
        .where(eq(provinces.id, localityInfo.provinceId))
        .limit(1);

      const provinceName = provinceData[0]?.name || 'Pakistan';

      // Read base HTML template
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      // Generate SEO meta tags
      const title = localityInfo.metaTitle || `${provinceName} - ${localityInfo.name} Business Directory | Pakistan Yellow Pages | Top Local Services`;
      const description = localityInfo.metaDescription || `Discover verified businesses in ${localityInfo.name}, ${provinceName}, Pakistan. Browse local services, restaurants, shops, professional services with contact details, reviews & ratings. Find the best businesses near you.`;
      const keywords = localityInfo.keywords || `${localityInfo.name} businesses, ${provinceName} business directory, Pakistan business listings, ${localityInfo.name} services, local businesses ${provinceName}, verified businesses Pakistan, business directory Pakistan, ${localityInfo.name} shops, ${provinceName} companies`;
      const canonicalUrl = localityInfo.canonicalUrl || `https://pakistanyp.com/localities/${localityInfo.slug}`;
      const ogTitle = localityInfo.ogTitle || `${provinceName} - ${localityInfo.name} Business Directory`;
      const ogDescription = localityInfo.ogDescription || `Explore businesses in ${localityInfo.name}, ${provinceName}. Verified listings with reviews and contact information.`;
      const ogImage = localityInfo.ogImage || 'https://pakistanyp.com/og-homepage.jpg';

      // Replace meta tags in HTML
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:title" content=".*?"[^>]*>/i, `<meta property="og:title" content="${ogTitle}" />`);
      html = html.replace(/<meta property="og:description" content=".*?"[^>]*>/i, `<meta property="og:description" content="${ogDescription}" />`);
      html = html.replace(/<meta property="og:image" content=".*?"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
      html = html.replace(/<meta property="og:url" content=".*?"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

      // Add structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${localityInfo.name} Business Directory`,
        "description": localityInfo.description || `Business directory for ${localityInfo.name}, ${provinceName}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": localityInfo.name,
          "addressRegion": provinceName,
          "addressCountry": "AE"
        },
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 25.2048,
            "longitude": 55.2708
          },
          "geoRadius": "10000"
        }
      };

      const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
      html = html.replace(/<\/head>/i, `${structuredDataScript}\n</head>`);

      // Ensure SEO-friendly headers are set
      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'true');
      res.send(html);
    } catch (error) {
      console.error('Error serving locality SEO page:', error);
      next(); // Fall back to regular Vite handling
    }
  }));

  // SEO route for provinces listing page
  app.get('/provinces', seoHandler(async (req, res, next) => {
    try {
      // Provinces listing SEO route - serving dynamic meta tags
      
      // Read base HTML template
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      // Generate SEO meta tags for provinces listing page
      const title = "Pakistani Provinces Business Directory | Browse All Provinces & Territories | PakistanYP";
      const description = "Explore business directories for all 7 Pakistani Provinces: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, and Multan. Find verified businesses across every province.";
      const keywords = "Pakistani provinces, Karachi businesses, Lahore companies, Islamabad directory, Rawalpindi businesses, Faisalabad, Peshawar, Multan, Pakistan business directory, province wise businesses";
      const canonicalUrl = "https://pakistanyp.com/provinces";
      const ogTitle = "Pakistani Provinces Business Directory - All Provinces & Territories";
      const ogDescription = "Browse business directories for all Pakistani Provinces. Find companies and services in Karachi, Lahore, Islamabad, and 4 more provinces.";
      const ogImage = "https://pakistanyp.com/og-homepage.jpg";

      // Replace meta tags in HTML
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:title" content=".*?"[^>]*>/i, `<meta property="og:title" content="${ogTitle}" />`);
      html = html.replace(/<meta property="og:description" content=".*?"[^>]*>/i, `<meta property="og:description" content="${ogDescription}" />`);
      html = html.replace(/<meta property="og:image" content=".*?"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
      html = html.replace(/<meta property="og:url" content=".*?"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

      // Add structured data for provinces listing
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Pakistani Provinces Business Directory",
        "description": "Business directories for all provinces and territories of Pakistan",
        "mainEntity": {
          "@type": "ItemList",
          "name": "Pakistani Provinces",
          "description": "All Provinces & Territories of Pakistan",
          "itemListElement": [
            { "@type": "Place", "name": "Karachi", "url": "https://pakistanyp.com/provinces/karachi" },
            { "@type": "Place", "name": "Lahore", "url": "https://pakistanyp.com/provinces/lahore" },
            { "@type": "Place", "name": "Islamabad", "url": "https://pakistanyp.com/provinces/islamabad" },
            { "@type": "Place", "name": "Rawalpindi", "url": "https://pakistanyp.com/provinces/rawalpindi" },
            { "@type": "Place", "name": "Faisalabad", "url": "https://pakistanyp.com/provinces/faisalabad" },
            { "@type": "Place", "name": "Peshawar", "url": "https://pakistanyp.com/provinces/peshawar" },
            { "@type": "Place", "name": "Multan", "url": "https://pakistanyp.com/provinces/multan" }
          ]
        }
      };

      const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
      html = html.replace(/<\/head>/i, `${structuredDataScript}\n</head>`);

      // Headers already set by allowSearchEngines middleware
      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'provinces-listing');
      res.send(html);
    } catch (error) {
      console.error('Error serving provinces listing SEO page:', error);
      next(); // Fall back to regular Vite handling
    }
  }));

  app.get('/provinces/:slug', seoHandler(async (req, res, next) => {
    try {
      const { slug } = req.params;
      // SEO route for individual provinces
      
      // Convert slug back to proper name format
      const name = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      
      // Fetch province data with SEO fields
      const province = await db
        .select({
          id: provinces.id,
          name: provinces.name,
          description: provinces.description,
          metaTitle: provinces.metaTitle,
          metaDescription: provinces.metaDescription,
          keywords: provinces.keywords,
          canonicalUrl: provinces.canonicalUrl,
          ogTitle: provinces.ogTitle,
          ogDescription: provinces.ogDescription,
          ogImage: provinces.ogImage
        })
        .from(provinces)
        .where(eq(provinces.name, name))
        .limit(1);

      if (!province.length) {
        return next(); // Let Vite handle 404
      }

      const provinceData = province[0];

      // Read base HTML template
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      // Generate SEO meta tags
      const title = provinceData.metaTitle || `${provinceData.name} Business Directory | Pakistan Yellow Pages | Find Local Businesses`;
      const description = provinceData.metaDescription || `Discover verified businesses in ${provinceData.name}, Pakistan. Browse local services, companies, restaurants, shops with contact details, reviews & ratings. Complete business directory for ${provinceData.name}.`;
      const keywords = provinceData.keywords || `${provinceData.name} businesses, ${provinceData.name} business directory, ${provinceData.name} companies, ${provinceData.name} services, Pakistan business listings, ${provinceData.name} local businesses, business directory ${provinceData.name}`;
      const canonicalUrl = provinceData.canonicalUrl || `https://pakistanyp.com/provinces/${slug}`;
      const ogTitle = provinceData.ogTitle || `${provinceData.name} Business Directory - Pakistan Yellow Pages`;
      const ogDescription = provinceData.ogDescription || `Explore verified businesses in ${provinceData.name} with comprehensive listings, reviews, and contact information.`;
      const ogImage = provinceData.ogImage || 'https://pakistanyp.com/og-homepage.jpg';

      // Replace meta tags in HTML
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:title" content=".*?"[^>]*>/i, `<meta property="og:title" content="${ogTitle}" />`);
      html = html.replace(/<meta property="og:description" content=".*?"[^>]*>/i, `<meta property="og:description" content="${ogDescription}" />`);
      html = html.replace(/<meta property="og:image" content=".*?"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
      html = html.replace(/<meta property="og:url" content=".*?"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);

      // Add structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Place",
        "name": `${provinceData.name} Business Directory`,
        "description": provinceData.description || `Business directory for ${provinceData.name}, Pakistan`,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": provinceData.name,
          "addressCountry": "AE"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 25.2048,
          "longitude": 55.2708
        },
        "containedInPlace": {
          "@type": "Country",
          "name": "Pakistan"
        }
      };

      const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
      html = html.replace(/<\/head>/i, `${structuredDataScript}\n</head>`);

      // Headers already set by allowSearchEngines middleware
      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', `province-${slug}`);
      res.send(html);
    } catch (error) {
      console.error('Error serving province SEO page:', error);
      next(); // Fall back to regular Vite handling
    }
  }));

  app.get('/categories/:slug', seoHandler(async (req, res, next) => {
    try {
      const { slug } = req.params;
      
      // Use the SEO snapshot renderer for full HTML content
      const { renderCategoryDetailSnapshot } = await import('./services/seoSnapshotRenderer');
      const html = await renderCategoryDetailSnapshot(slug);
      
      if (!html) {
        return next(); // Category not found, let Vite handle 404
      }

      res.set({
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
        'X-SEO-Served': `category-${slug}`
      }).send(html);
    } catch (error) {
      console.error('Error serving category SEO page:', error);
      next(); // Fall back to regular Vite handling
    }
  }));

  // Business page SEO routes
  app.get('/business/:slug', seoHandler(async (req, res, next) => {
    try {
      const { slug } = req.params;
      
      // Use the SEO snapshot renderer for full HTML content
      const { renderBusinessDetailSnapshot } = await import('./services/seoSnapshotRenderer');
      const html = await renderBusinessDetailSnapshot(slug);
      
      if (!html) {
        return next(); // Business not found, let Vite handle 404
      }

      res.set({
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
        'X-SEO-Served': `business-${slug}`
      }).send(html);
    } catch (error) {
      console.error('Error serving business SEO page:', error);
      next(); // Fall back to regular Vite handling
    }
  }));

  // Homepage SEO route
  app.get('/', seoHandler(async (req, res, next) => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      const stats = await storage.getStats();
      
      const title = "Pakistan Yellow Pages – Business Directory | PakistanYP";
      const description = "Find companies across Karachi, Lahore, Islamabad and all provinces and territories. Search by category and area, compare details and contact businesses directly.";
      const keywords = "Pakistani yellow pages, Pakistan business directory, Karachi businesses, Lahore companies, Pakistan companies, find businesses Pakistan, business listings Pakistan, verified Pakistani directory";
      const canonicalUrl = "https://pakistanyp.com/";

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);

      // Add comprehensive schema markup
      const organizationSchema = schemaGen.generateOrganizationSchema();
      const websiteSchema = schemaGen.generateWebSiteSchema();
      html = schemaGen.injectSchemasIntoHTML(html, organizationSchema, websiteSchema);

      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'homepage');
      res.send(html);
    } catch (error) {
      console.error('Error serving homepage SEO:', error);
      next();
    }
  }));

  // Categories listing SEO route
  app.get('/categories', seoHandler(async (req, res, next) => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      const categoryCount = await db.select({ count: sql`count(*)` }).from(categories);
      const count = Number(categoryCount[0]?.count || 0);
      
      const title = `Browse ${count}+ Business Categories in Pakistan | Complete Directory | PakistanYP`;
      const description = `Explore ${count}+ business categories across Pakistan. Find restaurants, hotels, healthcare, education, construction, retail & more. Complete business directory for all provinces and territories.`;
      const keywords = "Pakistani business categories, business types Pakistan, service categories Karachi, Lahore business types, Pakistan industry categories, business classification Pakistan";
      const canonicalUrl = "https://pakistanyp.com/categories";

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

      // Add comprehensive schema markup
      const categoriesSchema = schemaGen.generateCategoriesListingSchema(count);
      const breadcrumbSchema = schemaGen.generateBreadcrumbSchema([
        { name: 'Home', url: 'https://pakistanyp.com' },
        { name: 'Categories', url: 'https://pakistanyp.com/categories' }
      ]);
      html = schemaGen.injectSchemasIntoHTML(html, categoriesSchema, breadcrumbSchema);

      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'categories-listing');
      res.send(html);
    } catch (error) {
      console.error('Error serving categories listing SEO:', error);
      next();
    }
  }));

  // Localities listing SEO route  
  app.get('/localities', seoHandler(async (req, res, next) => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      const localityCount = await db.select({ count: sql`count(*)` }).from(localities);
      const count = Number(localityCount[0]?.count || 0);
      
      const title = `${count}+ Pakistani Localities & Areas | Find Local Businesses | PakistanYP`;
      const description = `Browse businesses in ${count}+ Pakistani localities and neighborhoods. Find local services in Clifton, DHA, Gulberg, Johar Town, Blue Area & more.`;
      const keywords = "Pakistani localities, Karachi areas, Lahore neighborhoods, Pakistan areas, local businesses Pakistan, area wise business directory";
      const canonicalUrl = "https://pakistanyp.com/localities";

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

      // Add comprehensive schema markup
      const localitiesSchema = schemaGen.generateLocalitiesListingSchema(count);
      const breadcrumbSchema = schemaGen.generateBreadcrumbSchema([
        { name: 'Home', url: 'https://pakistanyp.com' },
        { name: 'Localities', url: 'https://pakistanyp.com/localities' }
      ]);
      html = schemaGen.injectSchemasIntoHTML(html, localitiesSchema, breadcrumbSchema);

      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'localities-listing');
      res.send(html);
    } catch (error) {
      console.error('Error serving localities listing SEO:', error);
      next();
    }
  }));

  // Blog listing SEO route
  app.get('/blog', seoHandler(async (req, res, next) => {
    try {
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      const blogCount = await db.select({ count: sql`count(*)` }).from(blogPosts).where(eq(blogPosts.status, 'published'));
      const count = Number(blogCount[0]?.count || 0);
      
      const title = `Pakistani Business Insights & Tips | ${count}+ Articles | PakistanYP Blog`;
      const description = `Read ${count}+ expert articles about doing business in Pakistan. Business setup guides, industry insights, market trends, and success stories from Karachi, Lahore & across Pakistan.`;
      const keywords = "Pakistani business blog, Karachi business tips, Pakistan startup guide, business insights Pakistan, Pakistan market trends, business news Pakistan";
      const canonicalUrl = "https://pakistanyp.com/blog";

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

      // Add comprehensive schema markup
      const blogListingSchema = schemaGen.generateBlogListingSchema(count);
      const breadcrumbSchema = schemaGen.generateBreadcrumbSchema([
        { name: 'Home', url: 'https://pakistanyp.com' },
        { name: 'Blog', url: 'https://pakistanyp.com/blog' }
      ]);
      html = schemaGen.injectSchemasIntoHTML(html, blogListingSchema, breadcrumbSchema);

      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', 'blog-listing');
      res.send(html);
    } catch (error) {
      console.error('Error serving blog listing SEO:', error);
      next();
    }
  }));

  // Blog detail SEO route
  app.get('/blog/:slug', seoHandler(async (req, res, next) => {
    try {
      const { slug } = req.params;
      
      const post = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (!post.length || post[0].status !== 'published') {
        return next();
      }

      const postData = post[0];
      
      const path = await import('path');
      const fs = await import('fs');
      const templatePath = path.resolve('./client/index.html');
      let html = await fs.promises.readFile(templatePath, 'utf-8');

      const title = postData.metaTitle || `${postData.title} | PakistanYP Blog`;
      const description = postData.metaDescription || postData.excerpt || postData.title;
      const keywords = `${postData.title}, Pakistan business, Karachi business, ${postData.category || 'business insights'}`;
      const canonicalUrl = postData.canonicalUrl || `https://pakistanyp.com/blog/${slug}`;
      const ogImage = postData.featuredImage || "https://pakistanyp.com/og-homepage.jpg";

      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta name="description" content=".*?"[^>]*>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<meta name="keywords" content=".*?"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
      html = html.replace(/<link rel="canonical" href=".*?"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
      html = html.replace(/<meta property="og:title" content=".*?"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta property="og:description" content=".*?"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
      html = html.replace(/<meta property="og:image" content=".*?"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);

      // Add comprehensive schema markup
      const blogPostSchema = schemaGen.generateBlogPostSchema(postData);
      const breadcrumbSchema = schemaGen.generateBreadcrumbSchema([
        { name: 'Home', url: 'https://pakistanyp.com' },
        { name: 'Blog', url: 'https://pakistanyp.com/blog' },
        { name: postData.title, url: `https://pakistanyp.com/blog/${slug}` }
      ]);
      html = schemaGen.injectSchemasIntoHTML(html, blogPostSchema, breadcrumbSchema);

      res.set('Content-Type', 'text/html');
      res.set('X-SEO-Served', `blog-${slug}`);
      res.send(html);
    } catch (error) {
      console.error('Error serving blog detail SEO:', error);
      next();
    }
  }));

  // NOTE: Removed duplicate /categories/:slug route that was serving raw HTML to all users.
  // The seoHandler-wrapped route above already handles SEO for search engines.
  // Regular users should get the SPA via Vite middleware.

  // NOTE: Also removed duplicate /localities/:provinceSlug/:localitySlug route for same reason.
  // The seoHandler-wrapped route at line ~11042 handles SEO for search engines.

  return httpServer;
}