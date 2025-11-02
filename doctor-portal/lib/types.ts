export interface Patient {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  profileImage?: string;
  pushToken?: string;
  pushTokenUpdatedAt?: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  mood?: string;
  createdAt: any;
}

export interface ExtractedData {
  symptoms?: Array<{
    name: string;
    severity?: string;
    frequency?: string;
  }>;
  moods?: {
    overall?: string;
    score?: number;
    emotions?: string[];
  };
  medications?: Array<{
    name: string;
    dosage?: string;
  }>;
  otherHealthChallenges?: string[];
}

export interface DiaryEntry {
  id: string;
  conversationText?: string;
  userInput?: string;
  extractedData?: ExtractedData;
  summary?: string;
  messageCount?: number;
  type?: 'chat' | 'note';
  createdAt: any;
  updatedAt?: any;
}

export interface Doctor {
  id: string;
  email: string;
  name: string;
  patients: string[];
}
