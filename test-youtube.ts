import { GoogleGenAI } from "@google/genai";
import ytdl from "ytdl-core";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Make sure apiKey is available

async function run() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const info = await ytdl.getBasicInfo(url);
  console.log("Duration:", info.videoDetails.lengthSeconds);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        "Descreva o que acontece neste vídeo.",
        url
      ],
    });
    console.log(response.text);
  } catch (err) {
    console.error("Gemini failed:", err);
  }
}

run();
