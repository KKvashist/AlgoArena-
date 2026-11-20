import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: "What is an array? Answer in 2 lines.",
  });
  console.log("TEXT:", response.text);
  console.log("RAW:", JSON.stringify(response.candidates?.[0], null, 2));
} catch (err) {
  console.log("ERROR:", err?.status, err?.message);
}