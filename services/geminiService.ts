import { GoogleGenAI, Type } from "@google/genai";
import { Player } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Opponent Persona
const personaSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A nickname for a gambler (in Russian or English).",
    },
    personality: {
      type: Type.STRING,
      description: "A short description of their gambling style and personality (in Russian).",
    },
    avatarSeed: {
      type: Type.STRING,
      description: "A random string to seed the avatar generator.",
    },
  },
  required: ["name", "personality", "avatarSeed"],
};

export const generateOpponentPersona = async (): Promise<Partial<Player>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a fictional high-stakes coin toss gambler. Be creative, they can be rich tycoons, desperate hustlers, or eccentric mathematical geniuses. Respond in JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: personaSchema,
        systemInstruction: "You are a creative writer for a casino game. Generate content in Russian mostly, but names can be English.",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return { name: 'Игрок 99', personality: 'Загадочный.', avatarSeed: 'default' };
  } catch (error) {
    console.error("Gemini Persona Error:", error);
    return { name: 'Хайроллер', personality: 'Любит рисковать.', avatarSeed: 'default' + Date.now() };
  }
};

export const generateTrashTalk = async (
  opponent: Player, 
  context: 'WIN' | 'LOSS' | 'BET' | 'GREETING',
  amount?: number
): Promise<string> => {
  try {
    const prompt = `
      Character Name: ${opponent.name}
      Personality: ${opponent.personality || 'Competitive'}
      Context: ${context}
      ${amount ? `Bet Amount: $${amount}` : ''}
      
      Write a very short (max 10 words) chat message from this character to the player.
      If Context is WIN: The bot won the coin toss.
      If Context is LOSS: The bot lost the coin toss.
      If Context is BET: The player just placed a large bet.
      If Context is GREETING: The match just started.
      
      Language: Russian (Informal, slang allowed if fits personality).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || (context === 'GREETING' ? "Всем привет." : "Хмм...");
  } catch (error) {
    console.error("Gemini Trash Talk Error:", error);
    return context === 'GREETING' ? "Удачи." : "...";
  }
};