// Google Gemini Client Configuration & Fallback Engine
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const embeddingModelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

let aiInstance: GoogleGenAI | null = null;
if (apiKey && apiKey.trim().length > 0 && apiKey !== 'your_gemini_api_key') {
  try {
    aiInstance = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize Google Gen AI client:', err);
  }
}

export function getGenAI(): GoogleGenAI | null {
  return aiInstance;
}

export function getModelName(): string {
  return modelName;
}

export function getEmbeddingModelName(): string {
  return embeddingModelName;
}

export function isGeminiConfigured(): boolean {
  return aiInstance !== null;
}
