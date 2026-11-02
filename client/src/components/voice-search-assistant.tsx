import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

// AI Assistant Character component
const AIAssistantCharacter = ({ isListening, isProcessing, emotion = 'happy' }: {
  isListening: boolean;
  isProcessing: boolean;
  emotion?: 'happy' | 'listening' | 'thinking' | 'speaking';
}) => {
  const getEmoji = () => {
    if (isProcessing) return '🤔';
    if (isListening) return '👂';
    switch (emotion) {
      case 'listening': return '🎧';
      case 'thinking': return '💭';
      case 'speaking': return '🗣️';
      default: return '🤖';
    }
  };

  return (
    <motion.div
      className="relative w-16 h-16 mx-auto mb-4"
      animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
        isListening ? 'bg-blue-100 border-2 border-blue-400' : 
        isProcessing ? 'bg-[#FFF4E0] border-2 border-[#F3DDB5]' :
        ' bg-white border-2 border-[#E7E9EE]'
      }`}>
        {getEmoji()}
      </div>
      
      {/* Listening animation rings */}
      {isListening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-300"
            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
          />
        </>
      )}
      
      {/* Processing animation */}
      {isProcessing && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#D71920] rounded-full flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Loader2 className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
};

// Voice Search Assistant Component
const VoiceSearchAssistant = ({ compact = false }: { compact?: boolean }) => {
  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [showAssistant, setShowAssistant] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
        setError('');
        setAssistantMessage('I\'m listening... Tell me what business you\'re looking for!');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            maxConfidence = result[0].confidence;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
        setConfidence(maxConfidence);

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setIsProcessing(true);
          setAssistantMessage('Let me search for that...');
          processVoiceQuery(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice search failed. ';
        switch (event.error) {
          case 'no-speech':
            errorMessage += 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage += 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage += 'Microphone permission denied. Please allow microphone access.';
            break;
          default:
            errorMessage += 'Please try again or use text search.';
        }
        
        setError(errorMessage);
        setAssistantMessage(errorMessage);
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };
    }

    if (speechSynthesis) {
      synthesisRef.current = speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Process voice query using AI
  const processVoiceQuery = async (query: string) => {
    try {
      // Use OpenAI to process and enhance the voice query
      const response = await fetch('/api/ai/process-voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to process voice query');
      }

      const result = await response.json();
      
      setAssistantMessage(result.message || `Found ${result.searchQuery}! Redirecting you now...`);
      
      // Speak the response
      if (synthesisRef.current && result.message) {
        speakText(result.message);
      }

      // Redirect to search results
      setTimeout(() => {
        if (result.searchQuery) {
          setLocation(`/categories?search=${encodeURIComponent(result.searchQuery)}`);
        }
      }, 1500);

    } catch (error) {
      console.error('Error processing voice query:', error);
      const errorMsg = 'Sorry, I had trouble understanding that. Please try again.';
      setError(errorMsg);
      setAssistantMessage(errorMsg);
      speakText(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    if (synthesisRef.current && text) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthesisRef.current.speak(utterance);
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (!isSupported) {
      setError('Voice search is not supported in this browser');
      return;
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError('');
      setConfidence(0);
      setShowAssistant(true);
      recognitionRef.current.start();
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Toggle speech synthesis
  const toggleSpeech = () => {
    if (synthesisRef.current) {
      if (isSpeaking) {
        synthesisRef.current.cancel();
        setIsSpeaking(false);
      } else if (assistantMessage) {
        speakText(assistantMessage);
      }
    }
  };

  if (compact) {
    return (
      <Button
        onClick={startListening}
        disabled={!isSupported || isListening || isProcessing}
        className="relative bg-blue-500 hover:bg-blue-600 text-white"
        size="sm"
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Mic className="w-4 h-4" />
          </motion.div>
        ) : isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
        <span className="ml-1">Voice</span>
      </Button>
    );
  }

  return (
    <div className="voice-search-assistant">
      {/* Main Voice Search Button */}
      <Button
        onClick={startListening}
        disabled={!isSupported || isListening || isProcessing}
        className="relative bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-sm transition-all duration-300"
        size="lg"
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center"
          >
            <Mic className="w-5 h-5 mr-2" />
            Listening...
          </motion.div>
        ) : isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Voice Search
          </>
        )}
        
        {/* Listening indicator */}
        {isListening && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </Button>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !isListening && !isProcessing && setShowAssistant(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-sm"
            >
              {/* AI Character */}
              <AIAssistantCharacter 
                isListening={isListening} 
                isProcessing={isProcessing}
                emotion={isListening ? 'listening' : isProcessing ? 'thinking' : 'happy'}
              />

              {/* Assistant Message */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Voice Search Assistant
                </h3>
                {assistantMessage && (
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                    {assistantMessage}
                  </p>
                )}
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2">
                    {confidence > 0 ? `${Math.round(confidence * 100)}% confident` : 'Listening...'}
                  </Badge>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    "{transcript}"
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 bg-red-50 rounded-lg p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center space-x-3">
                {isListening ? (
                  <Button onClick={stopListening} variant="outline" size="sm">
                    <MicOff className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button onClick={startListening} disabled={isProcessing} size="sm">
                    <Mic className="w-4 h-4 mr-1" />
                    Try Again
                  </Button>
                )}
                
                <Button onClick={toggleSpeech} variant="outline" size="sm">
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 mr-1" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-1" />
                  )}
                  {isSpeaking ? 'Mute' : 'Speak'}
                </Button>
                
                <Button 
                  onClick={() => setShowAssistant(false)} 
                  variant="ghost" 
                  size="sm"
                  disabled={isListening || isProcessing}
                >
                  Close
                </Button>
              </div>

              {/* Browser Support Notice */}
              {!isSupported && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Voice search requires a modern browser with microphone support
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearchAssistant;