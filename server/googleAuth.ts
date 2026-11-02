import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials not provided");
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  // trust proxy is configured once in server/index.ts
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Support multiple domains including custom domain
  const replitDomains = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",") : [];
  const customDomains = ['pakistanyp.com', 'www.pakistanyp.com'];
  const allDomains = [...replitDomains, ...customDomains];
  
  console.log("Google OAuth setup:");
  console.log("Supported domains:", allDomains);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("OAuth callback will be registered before static serving");
  // Determine the correct callback URL based on current domain
  const getCallbackURL = (req: any) => {
    const host = req.get('host') || 'localhost';
    return `https://${host}/api/auth/google/callback`;
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'https://pakistanyp.com/api/auth/google/callback', // Primary production callback
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth strategy executing...");
          console.log("Profile ID:", profile.id);
          console.log("Profile email:", profile.emails?.[0]?.value);
          
          // Extract user information from Google profile
          const googleUser = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || "",
          };

          console.log("Attempting to upsert user:", googleUser);
          
          // Upsert user in database
          const user = await storage.upsertUser(googleUser);
          
          console.log("User upserted successfully:", user.id);
          
          // Create session data
          const sessionUser = {
            ...user,
            accessToken,
            refreshToken,
          };

          console.log("Returning session user to passport");
          return done(null, sessionUser);
        } catch (error) {
          console.error("Google auth error:", error);
          console.error("Error stack:", error.stack);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Google OAuth routes with improved logging
  app.get("/api/auth/google", (req, res, next) => {
    const host = req.get('host') || req.hostname;
    console.log("=== Google OAuth Initiation ===");
    console.log("Host:", host);
    console.log("Protocol:", req.protocol);
    console.log("Full URL:", `${req.protocol}://${host}${req.originalUrl}`);
    console.log("Expected callback:", `https://${host}/api/auth/google/callback`);
    console.log("Configured callback:", 'https://pakistanyp.com/api/auth/google/callback');
    
    passport.authenticate("google", {
      scope: ["profile", "email"]
    })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    console.log("=== Google OAuth Callback ===");
    console.log("Host:", req.get('host'));
    console.log("Protocol:", req.protocol);
    console.log("Original URL:", req.originalUrl);
    console.log("Query params:", req.query);
    console.log("Has error:", !!req.query.error);
    console.log("Has code:", !!req.query.code);
    
    if (req.query.error) {
      console.log("OAuth error:", req.query.error);
      console.log("Error description:", req.query.error_description);
      return res.redirect("/?error=oauth_failed");
    }
    
    passport.authenticate("google", { 
      failureRedirect: "/?error=oauth_failed",
      failureMessage: true
    })(req, res, next);
  }, (req, res) => {
    console.log("=== Google OAuth Success ===");
    console.log("User authenticated:", !!req.user);
    if (req.user) {
      console.log("User ID:", req.user.id);
      console.log("User email:", req.user.email);
    }
    
    // Save session before redirect to prevent race conditions
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Authentication successful but session save failed. Please go to the homepage manually.");
      }
      
      console.log("Session saved successfully, redirecting...");
      // Add a small delay to ensure everything is ready
      // Use full URL redirect to ensure it works in production
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      const redirectUrl = `${protocol}://${host}/oauth-success`;
      console.log(`Redirecting to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};