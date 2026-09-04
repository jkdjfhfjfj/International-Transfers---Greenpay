import OpenAI from "openai";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Groq API key not configured');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || '',
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      const systemPrompt = `
You are a helpful AI assistant for Geepay, a comprehensive fintech payment application for KES users.

You MUST only answer questions related to Geepay's features and services:
- Bill payments and money transfers
- Virtual cards and airtime purchases
- Currency exchange services
- Document uploads and KYC verification
- Support and account management
- WhatsApp Business integration
- Two-factor authentication and biometric login
- Admin panel and support ticket system

If asked about unrelated topics, politely redirect the user.
`;

      const response = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user' as const,
            content: msg.content
          }))
        ],
      });

      return response.choices[0]?.message?.content || 'Unable to generate response';
    } catch (error) {
      console.error('Groq AI API error:', error);
      throw error;
    }
  }

  async getAIFeatureSuggestions(context: string): Promise<string> {
    return this.generateResponse([
      { role: 'user', content: context },
    ]);
  }
}

export const openaiService = new OpenAIService();
