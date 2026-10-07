export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    if (!this.apiKey) {
      console.warn('⚠️ Groq API key not configured');
    }
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

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(msg => ({
              role: msg.role === "assistant" ? "assistant" : "user",
              content: msg.content,
            })),
          ],
        }),
      });

      if (!response.ok) throw new Error(`Groq request failed with HTTP ${response.status}`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content || 'Unable to generate response';
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
