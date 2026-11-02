import { SAMPLE_FAQ } from "@shared/countries/locale";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, Code, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tj } from "@/i18n-jsx/tj";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQHTMLEditorProps {
  onGeneratedHTML: (html: string) => void;
  initialValue?: string;
}

export default function FAQHTMLEditor({ onGeneratedHTML, initialValue = "" }: FAQHTMLEditorProps) {
  const [inputText, setInputText] = useState(initialValue);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "code">("edit");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Parse FAQs from input text
  const parseFAQs = (text: string): FAQItem[] => {
    if (!text.trim()) return [];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const faqs: FAQItem[] = [];
    let currentFAQ: Partial<FAQItem> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect question patterns
      if (
        line.match(/^\d+\.?\s/) ||           // "1. Question" or "1 Question"
        line.match(/^Q\d*:?\s/i) ||          // "Q1:" or "Q:"
        line.match(/^Question\s*\d*:?\s/i) || // "Question 1:" or "Question:"
        line.endsWith('?') ||                 // Ends with question mark
        line.match(/^-\s*/) ||               // Starts with dash "- Question"
        line.match(/^\*\s*/)                 // Starts with asterisk "* Question"
      ) {
        // Save previous FAQ if exists
        if (currentFAQ.question && currentFAQ.answer) {
          faqs.push(currentFAQ as FAQItem);
        }
        
        // Start new FAQ
        currentFAQ = {
          question: line.replace(/^\d+\.?\s*|^Q\d*:?\s*|^Question\s*\d*:?\s*|^-\s*|^\*\s*/i, '').trim(),
          answer: ""
        };
      } else if (
        line.match(/^A\d*:?\s/i) ||          // "A1:" or "A:"
        line.match(/^Answer\s*\d*:?\s/i) ||  // "Answer 1:" or "Answer:"
        (currentFAQ.question && !currentFAQ.answer) // First line after question
      ) {
        // This is an answer
        const answerText = line.replace(/^A\d*:?\s*|^Answer\s*\d*:?\s*/i, '').trim();
        currentFAQ.answer = answerText;
      } else if (currentFAQ.question && currentFAQ.answer) {
        // Continue building the answer
        currentFAQ.answer += ' ' + line;
      } else if (currentFAQ.question && !currentFAQ.answer) {
        // If we have a question but no formal answer marker, treat this as answer
        currentFAQ.answer = line;
      }
    }

    // Don't forget the last FAQ
    if (currentFAQ.question && currentFAQ.answer) {
      faqs.push(currentFAQ as FAQItem);
    }

    return faqs;
  };

  // Generate HTML with schema markup
  const generateHTML = (faqList: FAQItem[]): string => {
    if (faqList.length === 0) return "";

    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqList.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const accordionHTML = `
<!-- FAQ Section with Schema.org Markup -->
<script type="application/ld+json">
${JSON.stringify(schemaMarkup, null, 2)}
</script>

<div class="faq-accordion max-w-4xl mx-auto my-8">
  <div class="space-y-4">
    ${faqList.map((faq, index) => `
    <div class="faq-item border border-gray-200 rounded-lg overflow-hidden">
      <button 
        class="faq-question w-full text-start px-6 py-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center justify-between"
        onclick="toggleFAQ(${index})"
        aria-expanded="false"
        id="faq-button-${index}"
        aria-controls="faq-answer-${index}"
      >
        <span class="font-semibold text-gray-900 pe-4">${faq.question}</span>
        <svg 
          class="faq-icon w-5 h-5 text-gray-500 transition-transform duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          id="faq-chevron-${index}"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div 
        class="faq-answer overflow-hidden transition-all duration-300 ease-in-out max-h-0"
        id="faq-answer-${index}"
        role="region"
        aria-labelledby="faq-button-${index}"
      >
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p class="text-gray-700 leading-relaxed">${faq.answer}</p>
        </div>
      </div>
    </div>`).join('')}
  </div>
</div>

<script>
function toggleFAQ(index) {
  const button = document.getElementById('faq-button-' + index);
  const answer = document.getElementById('faq-answer-' + index);
  const chevron = document.getElementById('faq-chevron-' + index);
  
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  
  if (isExpanded) {
    // Collapse
    button.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0';
    chevron.style.transform = 'rotate(0deg)';
  } else {
    // Expand
    button.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    chevron.style.transform = 'rotate(180deg)';
  }
}

// Initialize first FAQ as expanded (optional)
// toggleFAQ(0);
</script>

<style>
.faq-accordion .faq-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-accordion .faq-question:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.faq-accordion .faq-answer {
  transition: max-height 0.3s ease-in-out;
}
</style>`.trim();

    return accordionHTML;
  };

  // Update FAQs when input changes
  useEffect(() => {
    const parsedFAQs = parseFAQs(inputText);
    setFaqs(parsedFAQs);
    
    const html = generateHTML(parsedFAQs);
    setGeneratedHTML(html);
    onGeneratedHTML(html);
  }, [inputText, onGeneratedHTML]);

  // Toggle preview item expansion
  const togglePreviewItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Copy HTML to clipboard
  const copyHTML = async () => {
    try {
      await navigator.clipboard.writeText(generatedHTML);
      toast({
        title: "HTML Copied!",
        description: "FAQ HTML code has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the HTML manually from the code tab.",
      });
    }
  };

  // Sample FAQ text for demonstration
  const sampleFAQs = SAMPLE_FAQ;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            FAQ HTML Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Paste your FAQs and automatically generate a beautiful accordion with Schema.org markup
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  HTML Code
                </TabsTrigger>
              </TabsList>
              
              {faqs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{tj("{0} FAQ{1} detected", faqs.length, faqs.length !== 1 ? 's' : '')}</Badge>
                  <Button size="sm" onClick={copyHTML} variant="outline">
                    <Copy className="w-4 h-4 me-2" />
                    Copy HTML
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="edit" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Paste your FAQs here:</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInputText(sampleFAQs)}
                  >
                    Load Sample FAQs
                  </Button>
                </div>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Paste your FAQs in any of these formats:

1. Question format with numbers
Q: Question format with Q
Question: Full question format
- Dash format
* Asterisk format

Answers can follow with A:, Answer:, or just be the next line.

Example:
1. What is your return policy?
We offer a 30-day return policy on all items.

2. How do I track my order?
You can track your order using the tracking number sent to your email.`}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              
              {faqs.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p>{tj("✓ Detected {0} FAQ{1} from your input", faqs.length, faqs.length !== 1 ? 's' : '')}</p>
                  <p>• Complete HTML with Schema.org markup will be generated</p>
                  <p>• Accordion interaction with smooth animations included</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {faqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Paste your FAQs in the Edit tab to see the preview</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Preview of your FAQ accordion (click questions to expand):
                  </div>
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        className="w-full text-start px-6 py-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center justify-between"
                        onClick={() => togglePreviewItem(index)}
                      >
                        <span className="font-semibold text-gray-900 pe-4">{faq.question}</span>
                        {expandedItems.has(index) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedItems.has(index) && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              {faqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generate FAQs first to see the HTML code</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Generated HTML with Schema.org markup:</label>
                    <Button size="sm" onClick={copyHTML}>
                      <Copy className="w-4 h-4 me-2" />
                      Copy HTML
                    </Button>
                  </div>
                  <Textarea
                    value={generatedHTML}
                    readOnly
                    className="min-h-[500px] font-mono text-xs"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    This HTML includes Schema.org FAQPage markup for better SEO and rich snippets in search results.
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}