// Simple test script for AI text generation
import { generateNarration } from "./packages/ai/text.js";

async function testAI() {
  try {
    console.log("Testing AI text generation...");
    const result = await generateNarration({
      lang: "en",
      style: "zen",
      durationSec: 20,
    });
    console.log("✅ AI text generation works:", result.title);
    console.log("Narration:", result.narration.substring(0, 100) + "...");
    console.log("Hashtags:", result.hashtags.slice(0, 5).join(", "));
  } catch (error) {
    console.log("⚠️ AI text generation failed:", error.message);
  }
}

testAI();
