import React from 'react';
import { useLocation } from 'wouter';
import { Helmet } from '@/lib/helmet-compat';
import { Mic, Search, Zap, Globe, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import Footer from '@/components/footer';
import VoiceSearch from '@/components/voice-search';
import { country, localize } from '@shared/country';
import { t as tx } from "@shared/i18n";

// Main city of each region, for example queries outside Pakistan
const cities = country.regions.map((r) => r.cities?.[0]?.name ?? r.name);

export default function VoiceSearchPage() {
  const [, navigate] = useLocation();

  const handleVoiceSearch = (query: string) => {
    const params = new URLSearchParams();
    params.set('q', query);
    navigate(`/categories?${params.toString()}`);
  };

  const features = [
    {
      icon: <Mic className="h-8 w-8 text-blue-500" />,
      title: "Natural Language Processing",
      description: "Speak naturally in English or Urdu. Our AI understands context and intent.",
    },
    {
      icon: <Search className="h-8 w-8 text-green-500" />,
      title: "Smart Business Matching",
      description: localize("Advanced algorithms match your voice queries to relevant Pakistani businesses instantly."),
    },
    {
      icon: <Zap className="h-8 w-8 text-[#B45309]" />,
      title: "Lightning Fast Results",
      description: "Get search results in under 2 seconds with our optimized voice processing engine.",
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-500" />,
      title: "Multi-Language Support",
      description: "Search in English, Urdu, Tamil, Bengali and more - we understand them all.",
    },
    {
      icon: <Clock className="h-8 w-8 text-[#B45309]" />,
      title: "24/7 Availability",
      description: localize("Voice search works around the clock, perfect for busy Pakistani business environment."),
    },
    {
      icon: <Star className="h-8 w-8 text-red-500" />,
      title: "Premium Accuracy",
      description: localize("99.5% accuracy rate with continuous learning from Pakistan business data."),
    },
  ];

  const useCases = [
    {
      category: "Restaurants",
      examples: [`Find Italian restaurants in ${cities[0]}`, "Best shawarma near me", `Halal sushi restaurants ${cities[1]}`]
    },
    {
      category: "Hotels & Tourism",
      examples: [`Luxury hotels in ${cities[0]}`, `Budget accommodations ${cities[2]}`, "Desert safari tour operators"]
    },
    {
      category: "Healthcare",
      examples: [`Pediatric clinics in ${cities[3]}`, "24-hour pharmacies near me", `Dental specialists ${cities[1]}`]
    },
    {
      category: "Shopping",
      examples: [`Electronics stores ${cities[0]}`, `Traditional souks in ${cities[1]}`, `Outlet malls ${cities[3]}`]
    },
    {
      category: "Services",
      examples: ["Car rental companies near the airport", "Visa processing centers", "Legal consultants for business setup"]
    },
    {
      category: "Education",
      examples: [`International schools in ${cities[0]}`, "Language learning centres", "University admission consultants"]
    },
  ];

  return (
    <>
      <Helmet>
        <title>Voice Search - AI-Powered Business Discovery | PakistanYP</title>
        <meta name="description" content="Revolutionary voice-activated business search for Pakistan. Speak naturally to find restaurants, hotels, services, and more across all provinces and territories with AI-powered accuracy." />
        <meta name="keywords" content="voice search Pakistan, AI business finder, speak to search, voice activated directory, Pakistan business voice search, smart business discovery" />
        <meta property="og:title" content="Voice Search - AI-Powered Business Discovery | PakistanYP" />
        <meta property="og:description" content="Revolutionary voice-activated business search for Pakistan. Speak naturally to find businesses across all provinces and territories." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://pakistanyp.com/voice-search" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PakistanYP Voice Search",
            "description": "AI-powered voice search for Pakistan businesses",
            "url": "https://pakistanyp.com/voice-search",
            "applicationCategory": "Business Directory",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "PKR"
            },
            "featureList": [
              "Natural Language Processing",
              "Multi-language Support",
              "Real-time Business Search",
              "Voice Recognition",
              "Smart Business Matching"
            ]
          })}
        </script>
      </Helmet>

      <Header />
      
      <div className="min-h-screen bg-[#FAF8F3]">
        {/* Hero Section */}
        <section className="border-b border-[#CFE8D8] bg-[#F2F9F4] text-[#0A0A0A] py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[18px] bg-[#E8F4EC]"><Mic className="h-8 w-8 text-[#0B6B2E]" /></span>
                <Badge variant="secondary" className="bg-white text-[#05501F] border border-[#CFE8D8] mb-4">
                  Revolutionary AI Technology
                </Badge>
              </div>
              
              <h1 className="yp-h1 mb-6">
                Voice-Activated
                <span className="block">
                  Business Search
                </span>
              </h1>
              
              <p className="yp-lead mb-8 max-w-3xl mx-auto">
                {tx("Simply speak to discover businesses across {0}. Our AI-powered voice search understands natural language and delivers instant, accurate results from our comprehensive business directory.", country.name)}
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="bg-white text-[#3A4354] border border-[#E7E9EE]">
                  99.5% Accuracy
                </Badge>
                <Badge variant="secondary" className="bg-white text-[#3A4354] border border-[#E7E9EE]">
                  Sub-2s Response
                </Badge>
                <Badge variant="secondary" className="bg-white text-[#3A4354] border border-[#E7E9EE]">
                  4 Languages
                </Badge>
              </div>
              
              <Button 
                size="lg" 
                className="min-h-[52px]"
                onClick={() => document.getElementById('voice-search-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Try Voice Search Now
              </Button>
            </div>
          </div>
        </section>

        {/* Voice Search Interface */}
        <section id="voice-search-section" className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Experience the Future of Business Discovery
              </h2>
              <p className="text-lg text-gray-600">
                Click the microphone, speak your search, and watch the magic happen
              </p>
            </div>
            
            <VoiceSearch onSearch={handleVoiceSearch} />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Powerful AI Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {localize("Our voice search technology combines cutting-edge AI with deep knowledge of Pakistan business landscape")}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Voice Search Examples
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {tx("Here are some examples of how you can use voice search to find businesses across {0}", country.name)}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-600">
                      {useCase.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {useCase.examples.map((example, exampleIndex) => (
                        <div 
                          key={exampleIndex}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleVoiceSearch(example)}
                        >
                          <div className="flex items-center">
                            <Mic className="h-4 w-4 text-blue-500 me-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">"{example}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="yp-wrap"><div className="rounded-[28px] border border-[#CFE8D8] bg-[#F2F9F4] px-6 py-14 text-center">
            <h2 className="yp-h2 mb-4">
              Ready to Transform Your Business Search?
            </h2>
            <p className="yp-lead mb-8 max-w-2xl mx-auto">
              Join thousands of users who have discovered the power of voice-activated business search
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="min-h-[52px]"
                onClick={() => document.getElementById('voice-search-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Mic className="me-2 h-5 w-5" />
                Start Voice Search
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="min-h-[52px]"
                onClick={() => navigate('/categories')}
              >
                Browse All Categories
              </Button>
            </div>
          </div></div>
        </section>
      </div>

      <Footer />
    </>
  );
}