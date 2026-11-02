import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionTierMascotGuide from "@/components/subscription-tier-mascot-guide";
import SubscriptionUpgradeModal from "@/components/subscription-upgrade-modal";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { FadeIn } from "@/components/ui/fade-in";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, Heart, Zap, Crown } from "lucide-react";

export default function MascotGuideDemo() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <FadeIn>
          <div className="text-center space-y-6">
            <div className="flex justify-center items-center gap-2">
              <Sparkles className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Subscription Tier Mascot Guide
              </h1>
              <Star className="w-10 h-10 text-[#0B6B2E]" />
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Meet your personal business guides! Each subscription tier comes with a unique mascot character 
              who understands your needs and will help you succeed at every level of your business journey.
            </p>
            
            <div className="flex justify-center gap-2">
              {["🌱", "🔥", "💼", "⚡"].map((emoji, index) => (
                <span 
                  key={index} 
                  className="text-4xl transition-transform cursor-pointer" 
                  style={{animationDelay: `${index * 0.3}s`}}
                >
                  {emoji}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Personalized Guidance
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Interactive Tips
              </Badge>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Premium Support
              </Badge>
            </div>
          </div>
        </FadeIn>

        {/* Demo Buttons */}
        <FadeIn delay={0.2}>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              Open Subscription Modal
            </Button>
          </div>
        </FadeIn>

        {/* Standalone Mascot Guide */}
        <FadeIn delay={0.4}>
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Standalone Mascot Guide</h2>
              <p className="text-muted-foreground">
                Here's how the mascot guide looks when used independently
              </p>
            </div>
            
            <SubscriptionTierMascotGuide />
          </div>
        </FadeIn>

        {/* Feature Explanation */}
        <FadeIn delay={0.6}>
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  What Makes This Special?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
                    <div>
                      <p className="font-medium">Personalized Experience</p>
                      <p className="text-sm text-muted-foreground">Each mascot has unique personality and tips tailored to that subscription level</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div>
                      <p className="font-medium">Interactive Guidance</p>
                      <p className="text-sm text-muted-foreground">Step-by-step walkthroughs with animated feedback and progress tracking</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                    <div>
                      <p className="font-medium">Engaging Design</p>
                      <p className="text-sm text-muted-foreground">Beautiful animations, emoji characters, and color-coded theming</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-600" />
                  Meet Your Guides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <p className="font-medium text-green-600">Buddy (Free)</p>
                      <p className="text-sm text-muted-foreground">Friendly & encouraging starter guide</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="font-medium text-[#B45309]">Phoenix (Premium)</p>
                      <p className="text-sm text-muted-foreground">Ambitious growth-focused strategist</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💼</span>
                    <div>
                      <p className="font-medium text-blue-600">Atlas (Professional)</p>
                      <p className="text-sm text-muted-foreground">Strategic professional domain master</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-medium text-purple-600">Titan (Enterprise)</p>
                      <p className="text-sm text-muted-foreground">Powerful unlimited potential guide</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </FadeIn>
      </main>

      <Footer />

      {/* Subscription Modal */}
      <SubscriptionUpgradeModal 
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="upgrade"
      />
    </div>
  );
}