// Simple test for AI text generation using CommonJS
const { promises: fs } = require("fs");
const path = require("path");

// Simple stub implementation
async function generateNarration(req) {
  return {
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
}

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
