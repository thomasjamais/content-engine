import { z } from "zod";
import { config } from "dotenv";
import {
  narrationSystemPrompt,
  captionSystemPrompt,
  NarrationRequest,
} from "../core/prompts";

// Load environment variables from .env.local
config({ path: ".env.local" });

export type NarrationResult = {
  title: string;
  narration: string; // 90-120 words
  caption: string;
  hashtags: string[];
};

const ResultSchema = z.object({
  title: z.string(),
  narration: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()).min(6).max(20),
});

export async function generateNarration(
  req: NarrationRequest
): Promise<NarrationResult> {
  const provider = process.env.AI_PROVIDER || "openai";

  try {
    switch (provider) {
      case "openai":
        return await generateWithOpenAI(req);
      case "gemini":
        return await generateWithGemini(req);
      default:
        return await generateStub(req);
    }
  } catch (error) {
    console.warn(`AI provider ${provider} failed, using stub:`, error);
    return await generateStub(req);
  }
}

async function generateWithOpenAI(
  req: NarrationRequest
): Promise<NarrationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found");
  }

  const systemPrompt = narrationSystemPrompt(req.lang, req.style);
  const userPrompt = `Create content for a ${
    req.durationSec
  }-second diving video clip${req.context ? ` about ${req.context}` : ""}. 
  
  Return JSON with: title, narration (90-120 words), caption (2 sentences), hashtags (6-20 tags).`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // Use gpt-3.5-turbo instead of gpt-4 for better compatibility
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Try to parse JSON from response
  try {
    const parsed = JSON.parse(content);
    return ResultSchema.parse(parsed);
  } catch {
    // Fallback to stub if JSON parsing fails
    return await generateStub(req);
  }
}

async function generateWithGemini(
  req: NarrationRequest
): Promise<NarrationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found");
  }

  const systemPrompt = narrationSystemPrompt(req.lang, req.style);
  const userPrompt = `Create content for a ${
    req.durationSec
  }-second diving video clip${req.context ? ` about ${req.context}` : ""}. 
  
  Return JSON with: title, narration (90-120 words), caption (2 sentences), hashtags (6-20 tags).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  // Try to parse JSON from response
  try {
    const parsed = JSON.parse(content);
    return ResultSchema.parse(parsed);
  } catch {
    // Fallback to stub if JSON parsing fails
    return await generateStub(req);
  }
}

async function generateStub(req: NarrationRequest): Promise<NarrationResult> {
  const out = {
    title: "Breath with the Ocean",
    narration:
      "Dive deep into the tranquil waters where time slows and the world above fades away. Feel the gentle rhythm of your breath as you explore the underwater realm, surrounded by vibrant coral and curious marine life. Each moment beneath the surface is a meditation, a chance to connect with the ancient rhythms of the sea. Let the weightlessness carry you as you discover the hidden beauty that lies beneath the waves.",
    caption:
      "Experience the serenity of underwater exploration. Dive into a world of peace and wonder.",
    hashtags: [
      "#ocean",
      "#diving",
      "#underwater",
      "#meditation",
      "#nature",
      "#peace",
      "#marine",
      "#serenity",
      "#breath",
      "#calm",
    ],
  };
  return ResultSchema.parse(out);
}
