import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { InteractiveBusinessCardScanner } from '@/components/interactive-business-card-scanner';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  ZoomIn, 
  Edit,
  Copy,
  RotateCcw,
  CheckCircle,
  Camera,
  Upload,
  Scan,
  Settings,
  Play,
  Pause
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

export function InteractiveScannerDemoPage() {
  const [, navigate] = useLocation();
  const [extractedInfo, setExtractedInfo] = useState<ExtractedBusinessInfo | null>(null);
  const [demoStep, setDemoStep] = useState(0);

  const handleBusinessExtracted = (businessInfo: ExtractedBusinessInfo) => {
    setExtractedInfo(businessInfo);
  };

  const handleAddBusiness = (businessInfo: ExtractedBusinessInfo) => {
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
    
    sessionStorage.setItem('businessCardData', JSON.stringify(businessData));
    navigate('/pricing');
  };

  const demoSteps = [
    {
      title: "Upload or Capture",
      description: "Choose from file upload, camera capture, or drag & drop",
      icon: <Upload className="w-6 h-6" />,
      features: ["File upload support", "Camera integration", "Drag & drop interface"]
    },
    {
      title: "Interactive Preview",
      description: "Zoom, pan, and explore your business card image",
      icon: <Eye className="w-6 h-6" />,
      features: ["Zoom controls", "Pan and drag", "Full screen preview"]
    },
    {
      title: "AI Scanning",
      description: "Advanced AI analyzes and extracts business information",
      icon: <Scan className="w-6 h-6" />,
      features: ["Real-time progress", "Text region detection", "High accuracy"]
    },
    {
      title: "Region Highlighting",
      description: "Visual overlay shows detected text regions",
      icon: <ZoomIn className="w-6 h-6" />,
      features: ["Region visualization", "Field mapping", "Interactive selection"]
    },
    {
      title: "Inline Editing",
      description: "Edit extracted information directly in the interface",
      icon: <Edit className="w-6 h-6" />,
      features: ["Click to edit", "Real-time updates", "Field validation"]
    },
    {
      title: "Export & Integration",
      description: "Copy data or add directly to business directory",
      icon: <Copy className="w-6 h-6" />,
      features: ["One-click copy", "Direct integration", "Multiple formats"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/business-card-scanner')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-500" />
              Interactive Business Card Scanner
              <Badge variant="secondary" className="text-lg px-3 py-1">Demo</Badge>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of business card scanning with real-time preview, 
              region detection, zoom controls, and inline editing capabilities.
            </p>
          </div>
        </div>

        {/* Demo Steps Showcase */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Interactive Features Overview</CardTitle>
            <CardDescription className="text-center">
              Discover all the advanced features that make this scanner unique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoSteps.map((step, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    demoStep === index ? 'border-blue-500 bg-white' : 'border-[#E7E9EE]'
                  }`}
                  onClick={() => setDemoStep(index)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                      demoStep === index ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Real-time Preview</CardTitle>
              <CardDescription>
                Interactive image preview with zoom and pan controls for detailed examination
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ZoomIn className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Region Detection</CardTitle>
              <CardDescription>
                Visual overlay showing detected text regions with clickable field mapping
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Edit className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Inline Editing</CardTitle>
              <CardDescription>
                Edit extracted information directly in the interface with real-time updates
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Improvements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enhanced User Experience</CardTitle>
            <CardDescription>
              See how the interactive scanner improves upon traditional scanning methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-red-600">Traditional Scanners</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Static image upload only</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">No preview or zoom capabilities</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Basic text extraction only</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Limited editing options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">No visual feedback during scanning</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-4 text-green-600">Interactive Scanner</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Multiple upload methods + camera</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Interactive preview with zoom & pan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Visual region detection overlay</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Inline editing with real-time updates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Progress tracking & visual feedback</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Scanner Component */}
        <div className="mb-8">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-500" />
                <span>Try the Interactive Scanner</span>
              </CardTitle>
              <CardDescription>
                Upload a business card image to experience all the interactive features
              </CardDescription>
            </CardHeader>
          </Card>
          
          <InteractiveBusinessCardScanner 
            onBusinessExtracted={handleBusinessExtracted}
            onAddBusiness={handleAddBusiness}
          />
        </div>

        {/* Technical Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <Camera className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold mb-1">Multi-Input</h3>
                <p className="text-sm text-gray-600">File upload, camera, drag & drop</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Settings className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-1">AI-Powered</h3>
                <p className="text-sm text-gray-600">OpenAI GPT-4 Vision API</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <ZoomIn className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold mb-1">Interactive UI</h3>
                <p className="text-sm text-gray-600">Zoom, pan, region detection</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Copy className="w-8 h-8 mx-auto mb-2 text-[#B45309]" />
                <h3 className="font-semibold mb-1">Smart Export</h3>
                <p className="text-sm text-gray-600">Multiple output formats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {extractedInfo && (
          <Card className="border-[#E7E9EE] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                Demo Completed Successfully!
              </CardTitle>
              <CardDescription className="text-green-700">
                Information extracted for <strong>{extractedInfo.businessName}</strong>. 
                The interactive scanner has successfully demonstrated its capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/business-card-scanner')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scanner Options
          </Button>
          <Button
            onClick={() => navigate('/add-business-enhanced')}
          >
            Try Adding a Business
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}