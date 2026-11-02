import { Router } from "express";
import { db } from "./db";
import { 
  businessGrowthMetrics, 
  businessGrowthGoals, 
  businessGrowthVisualizations,
  businesses 
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";

const router = Router();

// Get business metrics for visualization
router.get("/metrics/:businessId", isAuthenticated, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = "monthly", startDate, endDate } = req.query;

    let whereClause = eq(businessGrowthMetrics.businessId, parseInt(businessId));
    
    if (startDate && endDate) {
      whereClause = and(
        whereClause,
        gte(businessGrowthMetrics.date, new Date(startDate as string)),
        lte(businessGrowthMetrics.date, new Date(endDate as string))
      );
    }

    const metrics = await db
      .select()
      .from(businessGrowthMetrics)
      .where(whereClause)
      .orderBy(asc(businessGrowthMetrics.date));

    // Group metrics by type and aggregate by period
    const groupedMetrics = metrics.reduce((acc, metric) => {
      const key = metric.metricType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, any[]>);

    res.json(groupedMetrics);
  } catch (error) {
    console.error("Error fetching business metrics:", error);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// Get business goals
router.get("/goals/:businessId", isAuthenticated, async (req, res) => {
  try {
    const { businessId } = req.params;

    const goals = await db
      .select()
      .from(businessGrowthGoals)
      .where(eq(businessGrowthGoals.businessId, parseInt(businessId)))
      .orderBy(desc(businessGrowthGoals.createdAt));

    res.json(goals);
  } catch (error) {
    console.error("Error fetching business goals:", error);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
});

// Create new business goal
router.post("/goals", isAuthenticated, async (req, res) => {
  try {
    const goalData = req.body;
    
    const [newGoal] = await db
      .insert(businessGrowthGoals)
      .values({
        ...goalData,
        userId: req.session.user.id,
      })
      .returning();

    res.json(newGoal);
  } catch (error) {
    console.error("Error creating business goal:", error);
    res.status(500).json({ message: "Failed to create goal" });
  }
});

// Update business goal
router.put("/goals/:goalId", isAuthenticated, async (req, res) => {
  try {
    const { goalId } = req.params;
    const updateData = req.body;

    const [updatedGoal] = await db
      .update(businessGrowthGoals)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(businessGrowthGoals.id, parseInt(goalId)))
      .returning();

    res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating business goal:", error);
    res.status(500).json({ message: "Failed to update goal" });
  }
});

// Add business metric
router.post("/metrics", isAuthenticated, async (req, res) => {
  try {
    const metricData = req.body;
    
    const [newMetric] = await db
      .insert(businessGrowthMetrics)
      .values({
        ...metricData,
        userId: req.session.user.id,
      })
      .returning();

    res.json(newMetric);
  } catch (error) {
    console.error("Error adding business metric:", error);
    res.status(500).json({ message: "Failed to add metric" });
  }
});

// Get business performance summary
router.get("/summary/:businessId", isAuthenticated, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = "monthly" } = req.query;

    // Get latest metrics for each type
    const latestMetrics = await db
      .select()
      .from(businessGrowthMetrics)
      .where(eq(businessGrowthMetrics.businessId, parseInt(businessId)))
      .orderBy(desc(businessGrowthMetrics.date));

    // Get active goals
    const activeGoals = await db
      .select()
      .from(businessGrowthGoals)
      .where(
        and(
          eq(businessGrowthGoals.businessId, parseInt(businessId)),
          eq(businessGrowthGoals.status, "active")
        )
      );

    // Calculate progress and trends
    const summary = {
      totalRevenue: latestMetrics.find(m => m.metricType === 'revenue')?.metricValue || 0,
      totalCustomers: latestMetrics.find(m => m.metricType === 'customers')?.metricValue || 0,
      totalViews: latestMetrics.find(m => m.metricType === 'views')?.metricValue || 0,
      conversionRate: latestMetrics.find(m => m.metricType === 'conversion_rate')?.metricValue || 0,
      activeGoals: activeGoals.length,
      goalsCompleted: await db
        .select()
        .from(businessGrowthGoals)
        .where(
          and(
            eq(businessGrowthGoals.businessId, parseInt(businessId)),
            eq(businessGrowthGoals.status, "completed")
          )
        ).then(goals => goals.length),
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching business summary:", error);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
});

// Generate AI-powered growth recommendations
router.get("/recommendations/:businessId", isAuthenticated, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Get business data for context
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, parseInt(businessId)));

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Get recent metrics for analysis
    const recentMetrics = await db
      .select()
      .from(businessGrowthMetrics)
      .where(eq(businessGrowthMetrics.businessId, parseInt(businessId)))
      .orderBy(desc(businessGrowthMetrics.date))
      .limit(20);

    // Generate mock recommendations (replace with AI service integration)
    const recommendations = [
      {
        id: 1,
        category: "Marketing",
        title: "Optimize Social Media Presence",
        description: `Based on your current engagement rates, increasing social media posting frequency could boost brand visibility by 25-40%. Focus on Instagram and LinkedIn for ${business.category} businesses.`,
        priority: "High",
        impact: "High",
        effort: "Medium",
        estimatedROI: "300%",
        implementationSteps: [
          "Conduct social media audit",
          "Create content calendar",
          "Increase posting frequency to 5-7 times per week",
          "Engage with followers and industry accounts",
          "Track engagement metrics weekly"
        ],
        requiredResources: ["Social media manager", "Content creation tools", "Analytics platform"],
        timeframe: "2-3 months"
      },
      {
        id: 2,
        category: "Operations",
        title: "Implement Customer Feedback System",
        description: "Set up automated review collection to improve service quality and online reputation. This could increase customer retention by 15-20%.",
        priority: "Medium",
        impact: "High",
        effort: "Low",
        estimatedROI: "250%",
        implementationSteps: [
          "Choose feedback collection platform",
          "Set up automated email campaigns",
          "Create review response templates",
          "Train staff on feedback handling",
          "Monitor and analyze feedback trends"
        ],
        requiredResources: ["Feedback platform subscription", "Staff training", "Email automation tool"],
        timeframe: "4-6 weeks"
      },
      {
        id: 3,
        category: "Finance",
        title: "Diversify Revenue Streams",
        description: "Explore subscription-based services or complementary products to create recurring revenue opportunities and reduce dependency on single income source.",
        priority: "High",
        impact: "High", 
        effort: "High",
        estimatedROI: "400%",
        implementationSteps: [
          "Analyze current customer needs",
          "Research market opportunities",
          "Develop service packages",
          "Test with pilot customers",
          "Launch and scale successful offerings"
        ],
        requiredResources: ["Market research", "Product development", "Marketing budget", "Additional staff"],
        timeframe: "3-6 months"
      }
    ];

    res.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ message: "Failed to generate recommendations" });
  }
});

// Get competitor analysis data
router.get("/competitors/:businessId", isAuthenticated, async (req, res) => {
  try {
    const { businessId } = req.params;

    // Mock competitor data (replace with real analysis)
    const competitors = [
      {
        id: 1,
        name: "Competitor A",
        marketShare: 25,
        rating: 4.2,
        priceRange: "High",
        strengths: ["Strong brand recognition", "Premium service quality", "Extensive network"],
        weaknesses: ["Higher prices", "Limited digital presence", "Slow customer service"],
        opportunities: ["Expand to new markets", "Digital transformation", "Partnership opportunities"],
        threats: ["Economic downturn", "New market entrants", "Changing customer preferences"]
      },
      {
        id: 2,
        name: "Competitor B", 
        marketShare: 18,
        rating: 3.8,
        priceRange: "Medium",
        strengths: ["Competitive pricing", "Good location", "Fast service"],
        weaknesses: ["Limited service range", "Inconsistent quality", "Poor online reviews"],
        opportunities: ["Service expansion", "Quality improvement", "Digital marketing"],
        threats: ["Price competition", "Customer churn", "Regulatory changes"]
      },
      {
        id: 3,
        name: "Your Business",
        marketShare: 12,
        rating: 4.5,
        priceRange: "Medium",
        strengths: ["Excellent customer service", "Innovative solutions", "Strong online presence"],
        weaknesses: ["Limited market reach", "Resource constraints", "Brand awareness"],
        opportunities: ["Market expansion", "Strategic partnerships", "Technology adoption"],
        threats: ["Increased competition", "Economic uncertainty", "Resource limitations"]
      }
    ];

    res.json(competitors);
  } catch (error) {
    console.error("Error fetching competitor analysis:", error);
    res.status(500).json({ message: "Failed to fetch competitor analysis" });
  }
});

export default router;