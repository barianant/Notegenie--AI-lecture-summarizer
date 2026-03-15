
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DetailLevel } from "./types";

const API_KEY = process.env.API_KEY || '';

export const analyzeLecture = async (
  transcript: string, 
  detail: DetailLevel, 
  audioData?: { data: string; mimeType: string }
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const detailPrompt = {
    [DetailLevel.CONCISE]: "Keep the summary brief and focus only on critical takeaways.",
    [DetailLevel.STANDARD]: "Provide a balanced overview with clear main points and supporting details.",
    [DetailLevel.COMPREHENSIVE]: "Deep dive into every subtopic, providing exhaustive details and nuanced explanations."
  }[detail];

  const prompt = `
    You are an expert academic assistant. Analyze the provided lecture transcript (and optional audio) and generate structured notes.
    
    Level of detail: ${detailPrompt}
    
    Output the following in JSON format:
    1. executiveSummary: A clear, high-level overview.
    2. hierarchy: A list of main topics, each with a list of subtopics.
    3. keyConcepts: A list of technical terms/concepts with their definitions.
    4. mindMap: A structure for visualization with 'nodes' (id, label, x, y coordinates - roughly layout them) and 'edges' (source id to target id).
    5. language: Detect the language of the transcript.

    Transcript:
    ${transcript}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: audioData ? [
      { inlineData: audioData },
      { text: prompt }
    ] : prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          hierarchy: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                subtopics: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["topic", "subtopics"]
            }
          },
          keyConcepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            }
          },
          mindMap: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  },
                  required: ["id", "label", "x", "y"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                  },
                  required: ["source", "target"]
                }
              }
            },
            required: ["nodes", "edges"]
          },
          language: { type: Type.STRING }
        },
        required: ["executiveSummary", "hierarchy", "keyConcepts", "mindMap", "language"]
      }
    }
  });

  return JSON.parse(response.text);
};
