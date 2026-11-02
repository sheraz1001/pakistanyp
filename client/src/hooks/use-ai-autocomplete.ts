import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface AutocompleteResult {
  suggestions: string[];
  insights: string;
}

interface BusinessContext {
  name?: string;
  category?: string;
  province?: string;
  locality?: string;
  description?: string;
}

export function useAIAutocomplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [insights, setInsights] = useState<string>("");
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async (
    field: string,
    businessContext: BusinessContext
  ): Promise<AutocompleteResult | null> => {
    setIsLoading(true);
    setSuggestions([]);
    setInsights("");

    try {
      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field,
          ...businessContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: AutocompleteResult = await response.json();
      setSuggestions(data.suggestions || []);
      setInsights(data.insights || "");
      
      return data;
    } catch (error: any) {
      console.error('Autocomplete error:', error);
      toast({
        title: "AI Suggestions Error",
        description: "Unable to generate suggestions at this time",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setInsights("");
  }, []);

  return {
    isLoading,
    suggestions,
    insights,
    fetchSuggestions,
    clearSuggestions
  };
}

export default useAIAutocomplete;