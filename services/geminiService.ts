import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, CallAnalysisResult, ConversationTurn } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GENERATION_CONFIG_LIVE = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      transcription: { type: Type.STRING, description: "The full text transcription of the audio." },
      sentiment: { 
        type: Type.STRING, 
        enum: ["Positive", "Negative", "Neutral", "Mixed", "Confused", "Angry"],
        description: "The overall sentiment of the customer." 
      },
      sentimentScore: { type: Type.INTEGER, description: "Sentiment score from 0 (very negative) to 100 (very positive)." },
      intent: { type: Type.STRING, description: "The primary goal or intent of the customer." },
      entities: {
        type: Type.ARRAY,
        description: "Extracted named entities.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, description: "e.g., Product, Price, Feature, Date" },
            value: { type: Type.STRING, description: "Specific value associated if any" }
          }
        }
      },
      suggestedQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 smart follow-up questions for the agent."
      },
      objectionHandling: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tips or scripts to handle objections found in the audio."
      },
      productRecommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Products or features to upsell/cross-sell."
      }
    },
    required: ["transcription", "sentiment", "sentimentScore", "intent", "entities", "suggestedQuestions", "objectionHandling"]
  },
};

const GENERATION_CONFIG_RECORDING = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      conversation: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, enum: ["Sales Rep", "Customer"] },
            text: { type: Type.STRING },
            sentiment: { 
              type: Type.STRING, 
              enum: ["Positive", "Negative", "Neutral", "Mixed", "Confused", "Angry"],
              nullable: true 
            },
            intent: { type: Type.STRING, nullable: true },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  value: { type: Type.STRING, nullable: true }
                }
              },
              nullable: true
            },
            suggestions: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                objectionHandler: { type: Type.STRING, nullable: true },
                recommendation: { type: Type.STRING, nullable: true }
              }
            }
          },
          required: ["speaker", "text"]
        }
      }
    }
  }
};

export const analyzeAudio = async (base64Audio: string, history: ConversationTurn[] = []): Promise<AnalysisResult> => {
  try {
    const historyText = history.length > 0 
      ? `PREVIOUS CONVERSATION CONTEXT:\n${history.map(t => `${t.speaker}: "${t.text}"`).join('\n')}\n\n`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
          {
            text: `You are an expert Sales AI Assistant. Analyze the provided customer audio clip.
            
            ${historyText}
            
            Perform the following steps for the NEW AUDIO:
            1. Transcribe the speech accurately to text.
            2. Analyze the sentiment (Angry, Happy, Confused, Neutral, Mixed). Provide a score 0-100 (100 being most positive).
            3. Determine the specific Customer Intent (e.g., "Returning an item", "Asking for price", "Technical Support").
            4. Extract Named Entities (NER) like Products, Prices, Dates, Features.
            5. Generate 3 specific, helpful suggested follow-up questions for the agent based on the CONTEXT and the NEW AUDIO.
            6. If the customer raises an objection, provide a rebuttal. If not, provide general tips.
            7. Recommend relevant products or upgrades based on the context.`,
          },
        ],
      },
      config: GENERATION_CONFIG_LIVE,
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("No data returned from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeCallRecording = async (base64Audio: string): Promise<CallAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav", 
              data: base64Audio,
            },
          },
          {
            text: `You are a sophisticated AI analyzing a sales call recording between a Sales Rep and a Customer. 
            Perform Speaker Diarization (identify who is speaking) and analyze the conversation turn-by-turn.
            
            Return a JSON object with a 'conversation' array. For each turn:
            1. Identify the 'speaker' as either "Sales Rep" or "Customer".
            2. Transcribe the 'text'.
            
            IF the speaker is "Customer":
            - Perform Sentiment Analysis (Positive, Negative, Neutral, Angry, Confused, Mixed).
            - Identify the Intent.
            - Extract Entities (product, price, feature, etc.).
            - Generate 'suggestions' for the Sales Rep:
               - 3 Suggested Questions to ask next.
               - Objection Handling reply (if applicable).
               - Product Recommendation (if applicable).
            
            IF the speaker is "Sales Rep":
            - Only provide the 'text'.
            
            Ensure the conversation flows chronologically.`,
          },
        ],
      },
      config: GENERATION_CONFIG_RECORDING,
    });

    if (response.text) {
      return JSON.parse(response.text) as CallAnalysisResult;
    }

    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Call Recording Analysis Error:", error);
    throw error;
  }
};