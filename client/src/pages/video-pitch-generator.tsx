import SEO from "@/components/seo";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VideoPitchGenerator from "@/components/video-pitch-generator";

export default function VideoPitchGeneratorPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO 
        title="60-Second Business Pitch Video Generator | Pakistan Yellow Pages"
        description="Create compelling 60-second business pitch videos with AI-powered script generation and professional templates. Perfect for entrepreneurs and businesses in Pakistan."
        keywords="business pitch video, video generator, business presentation, pitch script, video marketing, Pakistan business tools"
        ogTitle="60-Second Business Pitch Video Generator - PakistanYP"
        ogDescription="Generate professional business pitch videos in minutes with AI-powered templates and scripts tailored for Pakistan businesses."
        canonical="https://pakistanyp.com/video-pitch-generator"
      />
      
      <Header />
      <main className="yp-wrap py-10 sm:py-14">
        <VideoPitchGenerator />
      </main>
      <Footer />
    </div>
  );
}