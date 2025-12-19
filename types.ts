export interface Entity {
  name: string;
  category: string;
  value?: string;
}

export interface AnalysisResult {
  transcription: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | 'Confused' | 'Angry';
  sentimentScore: number; // 0 to 100
  intent: string;
  entities: Entity[];
  suggestedQuestions: string[];
  objectionHandling: string[];
  productRecommendations: string[];
}

export interface AiSuggestions {
  questions: string[];
  objectionHandler?: string;
  recommendation?: string;
}

export interface ConversationTurn {
  speaker: 'Sales Rep' | 'Customer';
  text: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | 'Confused' | 'Angry';
  intent?: string;
  entities?: Entity[];
  suggestions?: AiSuggestions; // Suggested AI response for the Rep based on this turn
}

export interface CallAnalysisResult {
  conversation: ConversationTurn[];
}

export enum AppTab {
  LIVE_ASSISTANT = 'Live Assistant',
  UPLOAD_ANALYSIS = 'Upload & Analyze'
}