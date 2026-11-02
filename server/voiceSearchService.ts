import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "not-configured", // optional: app must start without it
});

interface VoiceQueryResponse {
  searchQuery: string;
  message: string;
  category?: string;
  province?: string;
  businessType?: string;
  confidence: number;
}

export async function processVoiceQuery(query: string): Promise<VoiceQueryResponse> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful Pakistani business directory assistant. Process voice search queries for Pakistan businesses and extract:
          
          1. Clean search terms for business lookup
          2. Location/province if mentioned (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan)
          3. Business category/type
          4. Friendly response message
          
          Pakistani Business Categories include:
          - Restaurants, Food & Dining
          - Hotels & Accommodation  
          - Shopping & Retail
          - Healthcare & Medical
          - Banking & Finance
          - Real Estate
          - Education & Training
          - Automotive
          - Beauty & Wellness
          - Technology & IT
          - Legal & Professional Services
          - Entertainment & Recreation
          - Construction & Engineering
          - Transportation & Logistics
          
          Examples:
          "Find restaurants in Karachi" → searchQuery: "restaurants Karachi", category: "restaurants", province: "Karachi"
          "I need a good doctor" → searchQuery: "doctors healthcare", category: "healthcare"
          "Banks near me" → searchQuery: "banks finance", category: "banking"
          "Hotel booking Lahore" → searchQuery: "hotels Lahore", category: "hotels", province: "Lahore"
          
          Respond in JSON format with searchQuery, message, category, province (if mentioned), and confidence (0-1).`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      searchQuery: result.searchQuery || query,
      message: result.message || `Searching for "${result.searchQuery || query}" in Pakistan businesses...`,
      category: result.category || '',
      province: result.province || '',
      businessType: result.businessType || '',
      confidence: result.confidence || 0.8
    };

  } catch (error) {
    console.error('Error processing voice query with OpenAI:', error);
    
    // Fallback processing without AI
    const cleanQuery = query.toLowerCase().trim();
    let searchQuery = cleanQuery;
    let category = '';
    let province = '';
    let message = `Searching for "${cleanQuery}"...`;

    // Simple keyword matching for categories
    const categoryKeywords = {
      'restaurant': ['restaurant', 'food', 'eat', 'dining', 'cafe', 'coffee'],
      'hotel': ['hotel', 'accommodation', 'stay', 'resort', 'booking'],
      'shopping': ['shop', 'store', 'mall', 'retail', 'buy'],
      'healthcare': ['doctor', 'hospital', 'clinic', 'medical', 'health'],
      'banking': ['bank', 'finance', 'atm', 'money', 'loan'],
      'education': ['school', 'university', 'college', 'education', 'training']
    };

    // Simple keyword matching for provinces
    const provinceKeywords = ['punjab', 'sindh', 'khyber pakhtunkhwa', 'balochistan', 'islamabad', 'gilgit', 'kashmir', 'karachi', 'lahore', 'rawalpindi', 'faisalabad', 'peshawar', 'multan', 'quetta'];

    // Detect category
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => cleanQuery.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // Detect province
    province = provinceKeywords.find(em => cleanQuery.includes(em)) || '';

    // Create enhanced search query
    if (category && province) {
      searchQuery = `${category} ${province}`;
      message = `Found ${category} options in ${province}! Loading results...`;
    } else if (category) {
      searchQuery = category;
      message = `Found ${category} businesses! Loading results...`;
    } else if (province) {
      searchQuery = `businesses ${province}`;
      message = `Found businesses in ${province}! Loading results...`;
    }

    return {
      searchQuery,
      message,
      category,
      province,
      businessType: category,
      confidence: 0.6
    };
  }
}