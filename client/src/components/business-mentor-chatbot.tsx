import { dateLocale } from "@shared/i18n";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  BarChart3,
  Minimize2,
  Maximize2,
  Bot
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { localize } from "@shared/country";

interface ChatMessage {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  category?: string;
  emoji?: string;
  suggestions?: string[];
}

interface MentorResponse {
  message: string;
  emoji: string;
  category: string;
  suggestions: string[];
  businessInsight?: string;
}

const mentorCategories = [
  { id: 'strategy', label: 'Business Strategy', icon: Target, emoji: '🎯' },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp, emoji: '📈' },
  { id: 'finance', label: 'Finance', icon: DollarSign, emoji: '💰' },
  { id: 'operations', label: 'Operations', icon: BarChart3, emoji: '⚙️' },
  { id: 'team', label: 'Team Building', icon: Users, emoji: '👥' },
  { id: 'innovation', label: 'Innovation', icon: Lightbulb, emoji: '💡' }
];

const quickQuestions = [
  "How can I increase my business revenue?",
  localize("What marketing strategies work best in Pakistan?"),
  "How do I manage cash flow effectively?",
  "What are the best hiring practices?",
  "How can I improve customer satisfaction?",
  "What digital tools should I use?"
];

export default function BusinessMentorChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'mentor',
      content: localize("Hello! I'm your AI Business Mentor 🤖 I'm here to help you grow your Pakistani business with personalized advice, insights, and strategies. What business challenge can I help you with today?"),
      timestamp: new Date(),
      category: 'general',
      emoji: '👋',
      suggestions: quickQuestions.slice(0, 3)
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // AI Mentor Response Mutation
  const mentorMutation = useMutation({
    mutationFn: async (question: string): Promise<MentorResponse> => {
      const response = await fetch('/api/ai/business-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          question, 
          category: selectedCategory,
          context: localize('Pakistani business environment')
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get mentor response');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const mentorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'mentor',
        content: data.message,
        timestamp: new Date(),
        category: data.category,
        emoji: data.emoji,
        suggestions: data.suggestions
      };
      
      setMessages(prev => [...prev, mentorMessage]);
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'mentor',
        content: "I apologize, but I'm having trouble connecting right now. Please try asking your question again in a moment. 😔",
        timestamp: new Date(),
        category: 'error',
        emoji: '😔'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const sendMessage = (messageText?: string) => {
    const text = messageText || currentMessage.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    // Get AI response
    mentorMutation.mutate(text);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-36 md:bottom-4 end-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-12 w-12 p-0 bg-[#0B6B2E] hover:bg-[#05501F] text-white shadow-[0_12px_28px_-12px_rgba(0,115,47,.6)]"
          aria-label="Open AI business mentor"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-20 md:bottom-4 end-4 z-50 max-w-[calc(100vw-2rem)] ${isMinimized ? 'w-80' : 'w-96'}`}>
      <Card className="overflow-hidden rounded-[20px] border border-[#E7E9EE] bg-white shadow-[0_30px_70px_-34px_rgba(10,10,10,.35)]">
        <CardHeader className="p-4 pb-3 bg-white border-b border-[#E7E9EE] text-[#0A0A0A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 rounded-[12px] bg-[#E8F4EC]">
                <AvatarFallback className="rounded-[12px] bg-transparent text-[#0B6B2E]">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">AI Business Mentor</CardTitle>
                <p className="text-xs text-[#5B6475]">Your 24/7 Business Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-[#3A4354] hover:bg-[#F1F2F6] h-8 w-8 p-0 min-h-0"
                aria-label={isMinimized ? "Expand mentor" : "Minimise mentor"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-[#3A4354] hover:bg-[#F1F2F6] h-8 w-8 p-0 min-h-0"
                aria-label="Close mentor"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            {/* Category Selection */}
            <div className="p-3 border-b border-[#E7E9EE] bg-[#F7F8FA]">
              <p className="text-xs text-gray-600 mb-2">Choose a business area for focused advice:</p>
              <div className="flex flex-wrap gap-1">
                {mentorCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1 px-2 rounded-full hover:border-[#0B6B2E]"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <category.icon className="me-1 h-3 w-3" aria-hidden="true" />
                    {category.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-80 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-[14px] px-3 py-2 text-sm leading-relaxed ${
                          message.type === 'user'
                            ? 'bg-[#0B6B2E] text-white'
                            : 'bg-[#F7F8FA] text-[#0A0A0A]'
                        }`}
                      >
                        {message.content}
                      </div>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500">Quick suggestions:</p>
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 me-1 mb-1"
                              onClick={() => handleQuickQuestion(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString(dateLocale([]), { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {mentorMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-[#F7F8FA] rounded-[14px] px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1 rtl:space-x-reverse">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-[#E7E9EE] bg-white">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business..."
                  className="flex-1 text-sm"
                  disabled={mentorMutation.isPending}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!currentMessage.trim() || mentorMutation.isPending}
                  size="sm"
                  className="bg-[#0B6B2E] hover:bg-[#05501F]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick Questions */}
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-[#0B6B2E] hover:bg-[#F2F9F4]"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}