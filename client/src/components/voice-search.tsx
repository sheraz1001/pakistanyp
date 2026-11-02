import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Search, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { country, localize } from "@shared/country";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

// Example places for the voice-search tips/quick actions (Pakistan: Karachi / Lahore; elsewhere: capital + next region's main city).
const VS_CITY_1 = (country.regions.find((r) => r.capital) || country.regions[0]).name;
const VS_CITY_2 = (country.regions.find((r) => !r.capital)?.cities?.[0]?.name || country.regions[1]?.name || VS_CITY_1);

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onSearch, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setConfidence(0);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          setIsProcessing(true);
          handleVoiceSearch(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please enable microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        toast({
          title: "Voice Search Error",
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isProcessing) {
          setTranscript('');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError('Voice recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast, isProcessing]);

  const handleVoiceSearch = async (searchQuery: string) => {
    try {
      if (searchQuery.length < 2) {
        throw new Error('Search query too short');
      }

      // Provide voice feedback
      if (voiceEnabled) {
        speakText(`Searching for ${searchQuery}`);
      }

      // Process search query
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      onSearch(searchQuery);
      
      toast({
        title: "Voice Search",
        description: tx("Searching for: \"{0}\"", searchQuery),
      });

      // Clear transcript after successful search
      setTimeout(() => {
        setTranscript('');
        setConfidence(0);
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
      toast({
        title: "Search Error",
        description: "Failed to process voice search",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleVoiceEnabled = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      speakText("Voice feedback enabled");
    }
  };

  if (!isSupported) {
    return (
      <Alert className={className}>
        <AlertDescription>
          Voice search is not supported in this browser. Please try Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Search Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Mic className="me-2 h-5 w-5" />
              Voice Search
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceEnabled}
              className="flex items-center"
            >
              {voiceEnabled ? (
                <>
                  <Volume2 className="me-1 h-4 w-4" />
                  Voice On
                </>
              ) : (
                <>
                  <VolumeX className="me-1 h-4 w-4" />
                  Voice Off
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              size="lg"
              className={`${
                isListening 
                  ? 'bg-[#E3A82B] text-[#141414] hover:bg-[#D19719] text-white' 
                  : 'bg-[#0B6B2E] hover:bg-[#05501F] text-white'
              } transition-all duration-200`}
            >
              {isProcessing ? (
                <Loader2 className="me-2 h-5 w-5 animate-spin" />
              ) : isListening ? (
                <MicOff className="me-2 h-5 w-5" />
              ) : (
                <Mic className="me-2 h-5 w-5" />
              )}
              {isProcessing ? 'Processing...' : isListening ? 'Stop Listening' : 'Start Voice Search'}
            </Button>

            {confidence > 0 && (
              <Badge variant="secondary" className="text-sm">{tj("Confidence: {0}%", Math.round(confidence * 100))}</Badge>
            )}
          </div>

          {/* Voice Search Instructions */}
          {!isListening && !transcript && (
            <div className="mt-4 p-3 bg-[#F2F9F4] border border-[#CFE8D8] rounded-[14px]">
              <p className="text-sm text-[#05501F] mb-2">
                <strong>Voice Search Tips:</strong>
              </p>
              <ul className="text-xs text-[#3A4354] space-y-1">
                <li>{tx("• Say business names: \"Al Rajhi Bank\", \"Carrefour {0}\"", VS_CITY_1)}</li>
                <li>{tx("• Search by category: \"restaurants in {0}\", \"hotels in {1}\"", VS_CITY_1, VS_CITY_2)}</li>
                <li>• Use simple phrases: "coffee shops", "car rental", "medical centers"</li>
                <li>• Speak clearly and pause after your search term</li>
              </ul>
            </div>
          )}

          {/* Live Transcript Display */}
          {(isListening || transcript) && (
            <div className="mt-4 p-3 border border-dashed border-[#CFE8D8] rounded-[14px] bg-[#F2F9F4]">
              <p className="text-sm text-gray-600 mb-1">
                {isListening ? 'Listening...' : 'Search completed:'}
              </p>
              <p className="text-lg font-medium text-[#05501F]">
                {transcript || 'Speak now...'}
              </p>
              {isListening && (
                <div className="flex items-center mt-2">
                  <div className="flex space-x-1 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="ms-2 text-sm text-red-600">Recording...</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVoiceSearch(`restaurants in ${VS_CITY_1}`)}
              disabled={isListening || isProcessing}
            >
              <Search className="me-1 h-3 w-3" />
              {tx("Restaurants in {0}", VS_CITY_1)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVoiceSearch(`hotels in ${VS_CITY_2}`)}
              disabled={isListening || isProcessing}
            >
              <Search className="me-1 h-3 w-3" />
              {tx("Hotels in {0}", VS_CITY_2)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVoiceSearch(localize('banks in Pakistan'))}
              disabled={isListening || isProcessing}
            >
              <Search className="me-1 h-3 w-3" />
              {localize("Banks in Pakistan")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceSearch;