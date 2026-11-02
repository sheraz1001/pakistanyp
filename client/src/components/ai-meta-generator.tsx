import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  Target, 
  TrendingUp,
  Lightbulb,
  Copy,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MetaGenerationData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  focusKeyword?: string;
}

interface GeneratedMeta {
  metaTitle: string;
  metaDescription: string;
  suggestions: string[];
  score: number;
}

interface AIMetaGeneratorProps {
  data: MetaGenerationData;
  onMetaGenerated: (meta: { metaTitle: string; metaDescription: string }) => void;
  currentMeta?: {
    metaTitle: string;
    metaDescription: string;
  };
}

export default function AIMetaGenerator({ data, onMetaGenerated, currentMeta }: AIMetaGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeta, setGeneratedMeta] = useState<GeneratedMeta | null>(null);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const generateMeta = async () => {
    if (!data.title || !data.content) {
      setError("Title and content are required for AI meta generation");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch('/api/ai/generate-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags,
          focusKeyword: data.focusKeyword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meta tags');
      }

      const result = await response.json();
      setGeneratedMeta(result);
      
      toast({
        title: "AI Meta Generated!",
        description: "SEO meta title and description have been generated successfully.",
      });
    } catch (err) {
      console.error('Error generating meta:', err);
      setError('Failed to generate meta tags. Please try again.');
      toast({
        title: "Generation Failed",
        description: "Could not generate meta tags. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedMeta = () => {
    if (generatedMeta) {
      onMetaGenerated({
        metaTitle: generatedMeta.metaTitle,
        metaDescription: generatedMeta.metaDescription,
      });
      toast({
        title: "Meta Applied!",
        description: "Generated meta title and description have been applied to your post.",
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const getMetaScore = (metaTitle: string, metaDescription: string) => {
    let score = 0;
    
    // Title length (optimal: 50-60 characters)
    if (metaTitle.length >= 50 && metaTitle.length <= 60) score += 25;
    else if (metaTitle.length >= 40 && metaTitle.length <= 70) score += 15;
    else if (metaTitle.length >= 30) score += 10;
    
    // Description length (optimal: 150-160 characters)
    if (metaDescription.length >= 150 && metaDescription.length <= 160) score += 25;
    else if (metaDescription.length >= 130 && metaDescription.length <= 170) score += 15;
    else if (metaDescription.length >= 100) score += 10;
    
    // Contains focus keyword
    if (data.focusKeyword) {
      if (metaTitle.toLowerCase().includes(data.focusKeyword.toLowerCase())) score += 20;
      if (metaDescription.toLowerCase().includes(data.focusKeyword.toLowerCase())) score += 15;
    }
    
    // Call-to-action in description
    const ctaWords = ['discover', 'learn', 'find', 'explore', 'get', 'read', 'see', 'download', 'start'];
    if (ctaWords.some(word => metaDescription.toLowerCase().includes(word))) score += 15;
    
    return Math.min(score, 100);
  };

  const currentScore = currentMeta ? getMetaScore(currentMeta.metaTitle, currentMeta.metaDescription) : 0;
  const generatedScore = generatedMeta ? getMetaScore(generatedMeta.metaTitle, generatedMeta.metaDescription) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Meta Generator
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by GPT-4
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Meta Analysis */}
        {currentMeta && (currentMeta.metaTitle || currentMeta.metaDescription) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Current Meta Analysis</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">SEO Score:</span>
                <Badge variant={currentScore >= 80 ? "default" : currentScore >= 60 ? "secondary" : "destructive"}>
                  {currentScore}/100
                </Badge>
              </div>
            </div>
            <Progress value={currentScore} className="h-2" />
            
            {currentMeta.metaTitle && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Current Title ({currentMeta.metaTitle.length}/60)</Label>
                <div className="p-2 bg-gray-50 rounded text-sm border">
                  {currentMeta.metaTitle}
                </div>
              </div>
            )}
            
            {currentMeta.metaDescription && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Current Description ({currentMeta.metaDescription.length}/160)</Label>
                <div className="p-2 bg-gray-50 rounded text-sm border">
                  {currentMeta.metaDescription}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generation Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button 
              onClick={generateMeta} 
              disabled={isGenerating || !data.title || !data.content}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate AI Meta
                </>
              )}
            </Button>
          </div>

          {/* Input Requirements */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1 ${data.title ? 'text-green-600' : 'text-gray-400'}`}>
              {data.title ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              Title Required
            </div>
            <div className={`flex items-center gap-1 ${data.content ? 'text-green-600' : 'text-gray-400'}`}>
              {data.content ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              Content Required
            </div>
            <div className={`flex items-center gap-1 ${data.category ? 'text-green-600' : 'text-gray-400'}`}>
              {data.category ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Category (Optional)
            </div>
            <div className={`flex items-center gap-1 ${data.focusKeyword ? 'text-green-600' : 'text-gray-400'}`}>
              {data.focusKeyword ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              Focus Keyword (Optional)
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generated Results */}
        {generatedMeta && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                AI Generated Meta
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">SEO Score:</span>
                <Badge variant={generatedScore >= 80 ? "default" : generatedScore >= 60 ? "secondary" : "destructive"}>
                  {generatedScore}/100
                </Badge>
                {generatedScore > currentScore && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{generatedScore - currentScore}
                  </Badge>
                )}
              </div>
            </div>
            
            <Progress value={generatedScore} className="h-2" />

            {/* Generated Meta Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">
                  Meta Title ({generatedMeta.metaTitle.length}/60)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedMeta.metaTitle, "Meta Title")}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                {generatedMeta.metaTitle}
              </div>
            </div>

            {/* Generated Meta Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">
                  Meta Description ({generatedMeta.metaDescription.length}/160)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedMeta.metaDescription, "Meta Description")}
                  className="h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                {generatedMeta.metaDescription}
              </div>
            </div>

            {/* AI Suggestions */}
            {generatedMeta.suggestions && generatedMeta.suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  AI Suggestions
                </Label>
                <div className="space-y-1">
                  {generatedMeta.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <Button onClick={applyGeneratedMeta} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Generated Meta
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <p className="font-medium">💡 AI Tips:</p>
          <ul className="space-y-1 ml-4">
            <li>• Include your focus keyword in both title and description</li>
            <li>• Keep titles under 60 characters for better display</li>
            <li>• Use compelling calls-to-action in descriptions</li>
            <li>• Make descriptions 150-160 characters for optimal length</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}