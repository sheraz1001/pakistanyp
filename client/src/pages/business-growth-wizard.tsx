import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import BusinessGrowthVisualizationWizard from "@/components/business-growth-visualization-wizard";
import SEO from "@/components/seo";

export default function BusinessGrowthWizardPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO 
        title="Business Growth Wizard - PakistanYP Admin"
        description="Comprehensive business growth analytics and visualization wizard for Pakistan business directory administrators"
        canonicalUrl="https://pakistanyp.com/business-growth-wizard"
      />
      
      <Header />
      
      <div className="yp-wrap py-10 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <span className="yp-label">Growth tools</span>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">Business Growth Visualization Wizard</h1>
          <p className="mt-2 text-[16px] text-[#5B6475]">
            Comprehensive analytics and growth tracking for Pakistan businesses with AI-powered insights
          </p>
        </div>
        
        {/* Example business data for the wizard */}
        <BusinessGrowthVisualizationWizard 
          businessId={1} 
          businessName="Provinces Steel Industries"
        />
      </div>
      
      <Footer />
    </div>
  );
}