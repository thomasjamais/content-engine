import { generateNarration } from "./text";

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("generateNarration", () => {
  it("should generate narration with stub when no API keys", async () => {
    process.env.OPENAI_API_KEY = "";
    process.env.GEMINI_API_KEY = "";

    const result = await generateNarration({
      lang: "en",
      style: "zen",
      durationSec: 20,
    });

    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("narration");
    expect(result).toHaveProperty("caption");
    expect(result).toHaveProperty("hashtags");
    expect(result.hashtags.length).toBeGreaterThanOrEqual(6);
  });

  it("should handle OpenAI API errors gracefully", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.AI_PROVIDER = "openai";

    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    const result = await generateNarration({
      lang: "en",
      style: "zen",
      durationSec: 20,
    });

    expect(result).toHaveProperty("title");
    expect(result.title).toBe("Breath with the Ocean");
  });

  it("should handle Gemini API errors gracefully", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.AI_PROVIDER = "gemini";

    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    const result = await generateNarration({
      lang: "fr",
      style: "adventure",
      durationSec: 30,
    });

    expect(result).toHaveProperty("title");
    expect(result.title).toBe("Breath with the Ocean");
  });
});
