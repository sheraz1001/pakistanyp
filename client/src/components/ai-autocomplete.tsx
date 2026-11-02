import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Lightbulb, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { localize } from "@shared/country";
import { t as tx } from "@shared/i18n";

interface AutocompleteSuggestion {
  suggestions: string[];
  insights: string;
}

interface AIAutocompleteProps {
  field: string;
  businessName?: string;
  category?: string;
  province?: string;
  locality?: string;
  description?: string;
  placeholder?: string;
  onSuggestionSelect?: (suggestion: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AIAutocomplete({
  field,
  businessName,
  category,
  province,
  locality,
  description,
  placeholder,
  onSuggestionSelect,
  disabled = false,
  className
}: AIAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (isLoading || disabled) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    
    try {
      console.log('Fetching AI suggestions for field:', field);
      
      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName || '',
          category: category || '',
          province: province || '',
          locality: locality || '',
          description: description || '',
          field
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('AI Autocomplete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data: AutocompleteSuggestion = await response.json();
      console.log('AI Autocomplete data received:', data);
      
      setSuggestions(data.suggestions || []);
      setInsights(data.insights || "");
      setIsOpen(true);
      
      if (data.suggestions && data.suggestions.length > 0) {
        toast({
          title: "✨ AI Suggestions Ready",
          description: tx("Generated {0} suggestions for {1}", data.suggestions.length, getFieldDisplayName(field)),
        });
      } else {
        // Show fallback suggestions even if we didn't get any from AI
        const fallbackSuggestions = getFallbackSuggestions(field);
        setSuggestions(fallbackSuggestions);
        setInsights("Here are some general suggestions for this field:");
        setIsOpen(true);
        
        toast({
          title: "Using Fallback Suggestions",
          description: "AI service unavailable, showing general suggestions instead",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('AI Autocomplete error:', error);
        setSuggestions([]);
        setInsights("");
        setIsOpen(false);
        
        // Show fallback suggestions when there's an error
        const fallbackSuggestions = getFallbackSuggestions(field);
        setSuggestions(fallbackSuggestions);
        setInsights("AI service temporarily unavailable. Here are some general suggestions:");
        setIsOpen(true);
        
        toast({
          title: "Using Fallback Suggestions",
          description: "AI service unavailable, showing helpful suggestions instead",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [field, businessName, category, province, locality, description, disabled, toast]);

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    setIsOpen(false);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Suggestion copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Local fallback function for client-side use
  const getFallbackSuggestions = (field: string): string[] => {
    const fallbacks: Record<string, string[]> = {
      services: [
        "Consultation and advisory services",
        "Customer support and assistance", 
        "Product development and design",
        "Maintenance and technical support",
        "Training and educational programs"
      ],
      products: [
        "High-quality products and solutions",
        "Premium service packages",
        "Customized offerings",
        "Digital products and services",
        "Professional tools and equipment"
      ],
      specialties: [
        "Industry expertise and knowledge",
        "Customer-focused approach",
        "Quality assurance and reliability",
        "Innovative solutions",
        "Professional standards"
      ],
      workingHours: [
        "Sunday to Thursday: 9:00 AM - 6:00 PM",
        "Saturday to Wednesday: 8:00 AM - 5:00 PM", 
        "Monday to Friday: 9:00 AM - 7:00 PM",
        "Sunday to Thursday: 10:00 AM - 8:00 PM"
      ],
      description: [
        localize("Professional business services in Pakistan"),
        "Leading provider of quality solutions", 
        localize("Trusted company serving Pakistani customers"),
        "Expert services with quality guarantee"
      ]
    };
    
    return fallbacks[field] || [
      "Professional services tailored to your needs",
      localize("Quality solutions for Pakistan businesses"), 
      "Expert assistance and support"
    ];
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      description: "Business Description",
      services: "Services Offered",
      products: "Products",
      workingHours: "Working Hours",
      specialties: "Specialties",
      certifications: "Certifications",
      paymentMethods: "Payment Methods",
      languages: "Languages Supported",
      deliveryAreas: "Delivery Areas",
      address: "Address Format",
      website: "Website URL",
      email: "Email Address"
    };
    return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchSuggestions}
        disabled={disabled || isLoading}
        className="mb-2 w-full sm:w-auto min-h-[44px] rounded-xl bg-[#F2F9F4] hover:bg-[#E8F4EC] border-[#CFE8D8] hover:border-[#0B6B2E] text-[#05501F] transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 me-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 me-2" />
        )}
{isLoading ? "Generating Suggestions..." : tx("Get AI Suggestions for {0}", getFieldDisplayName(field))}
      </Button>

      {isOpen && (suggestions.length > 0 || insights) && (
        <Card className="mt-2 border-[#CFE8D8] shadow-[0_24px_48px_-36px_rgba(0,115,47,.45)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI-Generated Suggestions
            </CardTitle>
            {insights && (
              <CardDescription className="text-sm bg-blue-50 p-3 rounded-md border-s-4 border-blue-300">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{insights}</span>
                </div>
              </CardDescription>
            )}
          </CardHeader>
          
          {suggestions.length > 0 && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="group relative p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-relaxed text-gray-700 group-hover:text-blue-800 flex-1">
                        {suggestion}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(suggestion, index);
                          }}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Click to use
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-gray-500 hover:text-gray-700"
                >
                  Close Suggestions
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

export default AIAutocomplete;