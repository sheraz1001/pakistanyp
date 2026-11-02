import { localize } from "@shared/country";
import { SEO } from "@/components/seo";
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { BusinessCardScanner } from '@/components/business-card-scanner';
import { InteractiveBusinessCardScanner } from '@/components/interactive-business-card-scanner';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Scan, 
  CheckCircle, 
  Clock, 
  Zap,
  Camera,
  Upload,
  Sparkles,
  Eye,
  Settings
} from 'lucide-react';

interface ExtractedBusinessInfo {
  businessName: string;
  contactPerson: string;
  jobTitle: string;
  phoneNumber: string;
  email: string;
  website: string;
  address: string;
  city: string;
  province: string;
  businessType: string;
  services: string[];
  socialMedia: {
    linkedin: string;
    twitter: string;
    instagram: string;
    facebook: string;
  };
  additionalInfo: string;
  confidence: number;
}

export function BusinessCardScannerPage() {
  const [, navigate] = useLocation();
  const [extractedInfo, setExtractedInfo] = useState<ExtractedBusinessInfo | null>(null);

  const handleBusinessExtracted = (businessInfo: ExtractedBusinessInfo) => {
    setExtractedInfo(businessInfo);
  };

  const handleAddBusiness = (businessInfo: ExtractedBusinessInfo) => {
    // Navigate to the add business form with pre-filled data
    const businessData = {
      name: businessInfo.businessName,
      contactPerson: businessInfo.contactPerson,
      phoneNumber: businessInfo.phoneNumber,
      email: businessInfo.email,
      website: businessInfo.website,
      address: businessInfo.address,
      city: businessInfo.city,
      province: businessInfo.province,
      businessType: businessInfo.businessType,
      services: businessInfo.services.join(', '),
      description: businessInfo.additionalInfo,
      socialMedia: businessInfo.socialMedia
    };
    
    // Store in sessionStorage for the add business form
    sessionStorage.setItem('businessCardData', JSON.stringify(businessData));
    
    // Navigate to add business form
    navigate('/add-business-enhanced');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <SEO
        title="Business Card Scanner – Save Contacts Instantly | PakistanYP"
        description="Scan a business card with your camera and turn it into a contact in seconds. Free tool from Pakistan Yellow Pages, works on mobile and desktop."
        canonical="https://pakistanyp.com/business-card-scanner"
      />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Business Card Magic Scanner
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform any business card into a complete directory listing with AI-powered scanning. 
              Just upload or photograph a business card and watch the magic happen!
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Instant Capture</CardTitle>
              <CardDescription>
                Upload image or use your camera to capture business cards instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">AI-Powered Extraction</CardTitle>
              <CardDescription>
                Advanced AI analyzes and extracts all business information accurately
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">One-Click Add</CardTitle>
              <CardDescription>
                Automatically populate business forms with extracted information
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
            <CardDescription className="text-center">
              Simple 3-step process to add businesses from business cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload or Capture</h3>
                <p className="text-sm text-gray-600">
                  Choose a business card image from your device or take a photo using your camera
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Our AI analyzes the image and extracts all business information including contact details, services, and social media
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Add to Directory</h3>
                <p className="text-sm text-gray-600">
                  {localize("Review the extracted information and add the business to Pakistan Yellow Pages with one click")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Component with Tabs */}
        <Tabs defaultValue="interactive" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="interactive" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Interactive Scanner</span>
              <Badge variant="secondary" className="ml-2">New</Badge>
            </TabsTrigger>
            <TabsTrigger value="classic" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Classic Scanner</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactive">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <span>Interactive Business Card Scanner</span>
                  <Badge variant="secondary">Advanced</Badge>
                </CardTitle>
                <CardDescription>
                  Enhanced scanning experience with real-time preview, zoom controls, region detection, and inline editing capabilities.
                </CardDescription>
              </CardHeader>
            </Card>
            <InteractiveBusinessCardScanner 
              onBusinessExtracted={handleBusinessExtracted}
              onAddBusiness={handleAddBusiness}
            />
          </TabsContent>

          <TabsContent value="classic">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scan className="w-5 h-5 text-green-500" />
                  <span>Classic Business Card Scanner</span>
                </CardTitle>
                <CardDescription>
                  Simple and reliable business card scanning with quick upload and extraction.
                </CardDescription>
              </CardHeader>
            </Card>
            <BusinessCardScanner 
              onBusinessExtracted={handleBusinessExtracted}
              onAddBusiness={handleAddBusiness}
            />
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Good Lighting</p>
                    <p className="text-sm text-gray-600">Ensure the business card is well-lit and clearly visible</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">High Resolution</p>
                    <p className="text-sm text-gray-600">Use high-quality images for better text recognition</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Flat Surface</p>
                    <p className="text-sm text-gray-600">Place the card on a flat surface to avoid shadows and distortion</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Straight Alignment</p>
                    <p className="text-sm text-gray-600">Keep the card straight and properly aligned in the frame</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Clean Background</p>
                    <p className="text-sm text-gray-600">Use a clean, contrasting background for better detection</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Full Card Visible</p>
                    <p className="text-sm text-gray-600">Make sure the entire business card is visible in the image</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Formats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">JPG</Badge>
              <Badge variant="secondary">PNG</Badge>
              <Badge variant="secondary">WEBP</Badge>
              <Badge variant="secondary">Up to 10MB</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              The scanner works with most common image formats and can handle various business card designs, 
              including cards with logos, colors, and different layouts.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-8 bg-white border-[#E7E9EE]">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <span>Experience the Interactive Scanner</span>
            </CardTitle>
            <CardDescription className="text-center">
              Try our advanced interactive demo with real-time preview and editing capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => navigate('/interactive-scanner-demo')}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-48"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Interactive Demo
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="min-w-48"
              >
                Add Your Business
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}