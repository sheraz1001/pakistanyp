import { StepBar } from "@/components/owner-shell";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Play, 
  Video, 
  Download, 
  Sparkles, 
  Clock, 
  Target, 
  Users, 
  TrendingUp,
  FileVideo,
  Wand2,
  Eye,
  Share2,
  Copy
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PitchScript {
  id: string;
  title: string;
  duration: number;
  sections: {
    hook: string;
    problem: string;
    solution: string;
    benefits: string;
    callToAction: string;
  };
  style: string;
  tone: string;
  targetAudience: string;
  createdAt: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  style: 'professional' | 'casual' | 'dynamic' | 'minimalist';
  industry: string[];
  preview: string;
}

export default function VideoPitchGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    industry: "",
    targetAudience: "",
    uniqueValue: "",
    keyProblem: "",
    solution: "",
    benefits: "",
    callToAction: "",
    contactInfo: ""
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<PitchScript | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available video templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/video-templates"],
    queryFn: () => apiRequest("GET", "/api/video-templates")
  });

  // Generate pitch script mutation
  const generateScriptMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/video-pitch/generate", data),
    onSuccess: (data) => {
      setGeneratedScript(data);
      setCurrentStep(3);
      toast({
        title: "Pitch Script Generated!",
        description: "Your 60-second business pitch has been created."
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate pitch script. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save pitch script mutation
  const savePitchMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/video-pitch/save", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-pitch/my-pitches"] });
      toast({
        title: "Pitch Saved!",
        description: "Your pitch script has been saved to your library."
      });
    }
  });

  const handleBusinessInfoSubmit = () => {
    if (!businessInfo.name || !businessInfo.industry || !businessInfo.solution) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleGenerateScript = () => {
    if (!selectedTemplate) {
      toast({
        title: "Select Template",
        description: "Please choose a video template to continue.",
        variant: "destructive"
      });
      return;
    }

    generateScriptMutation.mutate({
      businessInfo,
      templateId: selectedTemplate,
      duration: 60
    });
  };

  const handleSavePitch = () => {
    if (generatedScript) {
      savePitchMutation.mutate({
        ...generatedScript,
        businessInfo
      });
    }
  };

  const copyScriptToClipboard = () => {
    if (generatedScript) {
      const fullScript = `${generatedScript.sections.hook}\n\n${generatedScript.sections.problem}\n\n${generatedScript.sections.solution}\n\n${generatedScript.sections.benefits}\n\n${generatedScript.sections.callToAction}`;
      navigator.clipboard.writeText(fullScript);
      toast({
        title: "Script Copied!",
        description: "The pitch script has been copied to your clipboard."
      });
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <span className="yp-label">Free tool</span>
          <h1 className="mt-2 flex items-center gap-3 text-[32px] font-bold leading-tight tracking-[-0.045em] sm:text-[40px]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[#E8F4EC] text-[#0B6B2E]"><Video className="h-6 w-6" /></span>
            60-Second Pitch Video Generator
          </h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-[#4B5565]">
            Create compelling business pitch videos in minutes with AI-powered script generation and professional templates
          </p>
        </div>

        {/* Progress Bar */}
        <Progress value={progressPercentage} className="sr-only" />
        <StepBar step={currentStep} labels={["Business Info", "Choose Template", "Generate & Review"]} />
      </div>

      {/* Step 1: Business Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Step 1: Tell Us About Your Business
            </CardTitle>
            <CardDescription>
              Provide key information about your business to create a personalized pitch script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select onValueChange={(value) => setBusinessInfo({...businessInfo, industry: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Who is your ideal customer? (e.g., small business owners, young professionals)"
                value={businessInfo.targetAudience}
                onChange={(e) => setBusinessInfo({...businessInfo, targetAudience: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyProblem">Key Problem You Solve</Label>
              <Textarea
                id="keyProblem"
                placeholder="What specific problem does your business solve for customers?"
                value={businessInfo.keyProblem}
                onChange={(e) => setBusinessInfo({...businessInfo, keyProblem: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Your Solution *</Label>
              <Textarea
                id="solution"
                placeholder="How does your business solve this problem? What makes you unique?"
                value={businessInfo.solution}
                onChange={(e) => setBusinessInfo({...businessInfo, solution: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Key Benefits</Label>
              <Textarea
                id="benefits"
                placeholder="What are the main benefits customers get from your business?"
                value={businessInfo.benefits}
                onChange={(e) => setBusinessInfo({...businessInfo, benefits: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="callToAction">Call to Action</Label>
              <Input
                id="callToAction"
                placeholder="What do you want viewers to do next? (e.g., visit website, call, book consultation)"
                value={businessInfo.callToAction}
                onChange={(e) => setBusinessInfo({...businessInfo, callToAction: e.target.value})}
              />
            </div>

            <Button onClick={handleBusinessInfoSubmit} className="w-full" size="lg">
              Continue to Templates
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Template */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              Step 2: Choose Your Video Style
            </CardTitle>
            <CardDescription>
              Select a template that matches your business style and target audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Professional Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === 'professional' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate('professional')}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Professional</h3>
                      <Badge variant="secondary">60s</Badge>
                    </div>
                    <div className="w-full h-32 bg-[#E8F4EC] rounded-lg flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clean, corporate style perfect for B2B businesses and professional services
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Consulting</Badge>
                      <Badge variant="outline" className="text-xs">Finance</Badge>
                      <Badge variant="outline" className="text-xs">Tech</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === 'dynamic' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate('dynamic')}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Dynamic</h3>
                      <Badge variant="secondary">60s</Badge>
                    </div>
                    <div className="w-full h-32 bg-[#FFF4E0] rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-[#B45309]" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Energetic and engaging style great for startups and innovative businesses
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Startups</Badge>
                      <Badge variant="outline" className="text-xs">Retail</Badge>
                      <Badge variant="outline" className="text-xs">Creative</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Casual Template */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === 'casual' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate('casual')}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Casual</h3>
                      <Badge variant="secondary">60s</Badge>
                    </div>
                    <div className="w-full h-32 bg-[#E6F6F1] rounded-lg flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Friendly and approachable style perfect for local businesses and services
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">Local</Badge>
                      <Badge variant="outline" className="text-xs">Food</Badge>
                      <Badge variant="outline" className="text-xs">Lifestyle</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleGenerateScript} 
                className="flex-1"
                disabled={!selectedTemplate || generateScriptMutation.isPending}
              >
                {generateScriptMutation.isPending ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Pitch Script
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generated Script */}
      {currentStep === 3 && generatedScript && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Your 60-Second Pitch Script
              </CardTitle>
              <CardDescription>
                Review your generated script and make any adjustments before recording
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="script" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="tips">Recording Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="script" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Hook (0-10 seconds)</h4>
                      <p className="text-blue-800 ">{generatedScript.sections.hook}</p>
                    </div>
                    
                    <div className="p-4 bg-[#FFF4E0] rounded-lg">
                      <h4 className="font-semibold text-[#B45309] mb-2">Problem (10-20 seconds)</h4>
                      <p className="text-[#B45309] ">{generatedScript.sections.problem}</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Solution (20-40 seconds)</h4>
                      <p className="text-green-800 ">{generatedScript.sections.solution}</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Benefits (40-50 seconds)</h4>
                      <p className="text-purple-800 ">{generatedScript.sections.benefits}</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">Call to Action (50-60 seconds)</h4>
                      <p className="text-red-800 ">{generatedScript.sections.callToAction}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">0-10s:</span>
                      <span>Grab attention with compelling hook</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-[#B45309] rounded-full"></div>
                      <span className="font-medium">10-20s:</span>
                      <span>Identify the problem your audience faces</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">20-40s:</span>
                      <span>Present your solution and unique value</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">40-50s:</span>
                      <span>Highlight key benefits and results</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium">50-60s:</span>
                      <span>Clear call to action and next steps</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tips" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Recording Setup</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Use good lighting (face the light source)</li>
                          <li>• Ensure clear audio (use external mic if possible)</li>
                          <li>• Keep camera at eye level</li>
                          <li>• Use a clean, professional background</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Delivery Tips</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Speak clearly and at moderate pace</li>
                          <li>• Make eye contact with camera</li>
                          <li>• Use gestures to emphasize points</li>
                          <li>• Show enthusiasm and confidence</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={copyScriptToClipboard} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Script
                </Button>
                <Button onClick={handleSavePitch} disabled={savePitchMutation.isPending}>
                  <Download className="h-4 w-4 mr-2" />
                  Save to Library
                </Button>
                <Button onClick={() => setCurrentStep(1)} variant="outline">
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}