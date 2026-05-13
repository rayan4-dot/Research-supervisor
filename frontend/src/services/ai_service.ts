import { GoogleGenerativeAI } from '@google/generative-ai';
import { TelemetryService } from './telemetry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class AIService {
  private static getModel() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API Key is missing in environment variables');
    }
    return genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  private static getEmbeddingModel() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API Key is missing in environment variables');
    }
    return genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });
  }

  /**
   * Helper to execute a promise with a timeout
   */
  private static async withTimeout<T>(promise: Promise<T>, ms: number = 30000): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI generation timed out after ${ms / 1000}s`)), ms);
    });
    return Promise.race([promise, timeout]);
  }

  /**
   * Cleans common LLM artifacts from JSON responses (e.g., markdown code blocks)
   */
  private static sanitizeJSON(text: string): string {
    let clean = text.trim();
    // Remove ```json ... ``` wrappers if the LLM ignored the responseMimeType instruction
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    }
    if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }

  /**
   * Generates content with robust error handling, JSON parsing, and retry logic.
   */
  static async generate(prompt: string, retries: number = 2): Promise<any> {
    const model = this.getModel();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.withTimeout(model.generateContent(prompt), 35000); // 35s timeout
        const responseText = result.response.text();
        const cleanJson = this.sanitizeJSON(responseText);
        
        try {
          const parsed = JSON.parse(cleanJson);
          
          if (attempt > 1) {
             TelemetryService.log({ event_type: 'AI_RETRY', details: { resolved_on_attempt: attempt } });
          }
          return parsed;
        } catch (parseError) {
          console.error(`Attempt ${attempt}: Failed to parse JSON. Raw output:`, cleanJson);
          if (attempt === retries) throw new Error('AI returned an invalid response format that could not be parsed.');
          // Otherwise loop will retry
        }

      } catch (error: any) {
        console.error(`Attempt ${attempt}: AI generation error:`, error.message);
        
        // If it's a quota error or we've run out of retries, bubble it up immediately
        if (error.message.includes('429') || attempt === retries) {
          throw new Error(error.message || 'AI service is currently unavailable.');
        }
        
        // Wait 2s before retrying
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  /**
   * Generates a 768-dimensional embedding vector for RAG retrieval
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const model = this.getEmbeddingModel();
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}
