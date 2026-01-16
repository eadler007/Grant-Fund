
import { GoogleGenAI, Type } from "@google/genai";
import { FundingLevel, ApplicationStatus, Grant } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProposal = async (cityName: string, proposalData: string | { data: string, mimeType: string }) => {
  const isBinary = typeof proposalData !== 'string';
  
  const promptPart = {
    text: `
      Acting as an expert NFC Grant Research Analyst, analyze the project requirements for the city of ${cityName}.
      
      DATA EXTRACTION:
      1. TOTAL PROJECT BUDGET: Estimate the typical cost for a high-quality outdoor fitness court and infrastructure if not provided.
      2. FUNDING SECURED: Identify any committed funds.
      3. CORE PRIORITIES: Focus on health equity, park access, and community wellness.
      
      Format as JSON.
    `
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: isBinary 
      ? { parts: [promptPart, { inlineData: proposalData }] }
      : { parts: [promptPart, { text: (proposalData as string).substring(0, 15000) }] },
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
          scale: { type: Type.STRING },
          budgetEstimate: { type: Type.NUMBER },
          fundingSecured: { type: Type.NUMBER },
          equityGoals: { type: Type.STRING },
          phaseBreakdown: { type: Type.STRING }
        },
        required: ["priorities", "scale", "budgetEstimate", "fundingSecured", "equityGoals"]
      }
    }
  });

  if (!response.text) throw new Error("Empty response from AI");
  return JSON.parse(response.text);
};

export const discoverGrants = async (cityName: string, analysis: any) => {
  // We use Google Search to find REAL, current funding opportunities for this specific city
  const prompt = `
    Find 8-10 active funding opportunities for a public fitness court and park project in ${cityName}.
    Include:
    1. Local foundations (e.g., Community Foundation of ${cityName}).
    2. State-level health or recreation grants.
    3. Federal programs like CDBG or Land and Water Conservation Fund (LWCF).
    
    Current project focus: ${analysis.priorities.join(', ')}.
    
    Return the result as a JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }], // Use Google Search for live accuracy and speed
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            level: { type: Type.STRING, enum: Object.values(FundingLevel) },
            awardRange: { type: Type.STRING },
            minVal: { type: Type.NUMBER },
            maxVal: { type: Type.NUMBER },
            applicationPeriod: { type: Type.STRING },
            awardDate: { type: Type.STRING },
            projectExamples: { type: Type.STRING },
            matchRequired: { type: Type.STRING },
            eligibility: { type: Type.STRING },
            recommendedUse: { type: Type.STRING },
            sourceLink: { type: Type.STRING },
            narrativeDraft: { type: Type.STRING }
          },
          required: ["name", "level", "maxVal", "applicationPeriod"]
        }
      }
    }
  });

  // Extract URLs from grounding metadata if available to ensure links are real
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const searchUrls = groundingChunks
    .filter((chunk: any) => chunk.web?.uri)
    .map((chunk: any) => chunk.web.uri);

  const rawGrants = JSON.parse(response.text || "[]");
  return rawGrants.map((g: any, i: number) => ({
    ...g,
    id: `grant-${i}-${Date.now()}`,
    status: ApplicationStatus.NOT_STARTED,
    // Prefer search URLs for better accuracy if the model provided a placeholder
    sourceLink: g.sourceLink && g.sourceLink !== '#' ? g.sourceLink : (searchUrls[i % searchUrls.length] || '#')
  }));
};
