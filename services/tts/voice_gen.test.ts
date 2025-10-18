import { synthesizeVoice } from "./voice_gen";
import fs from "node:fs/promises";
import path from "node:path";

// Mock fs
jest.mock("node:fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("synthesizeVoice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create beep placeholder when no API keys", async () => {
    process.env.ELEVENLABS_API_KEY = "";
    process.env.OPENAI_API_KEY = "";

    const result = await synthesizeVoice({
      text: "Hello world",
      outPath: "./test.wav",
    });

    expect(result).toBe(path.resolve("./test.wav"));
    expect(mockedFs.mkdir).toHaveBeenCalled();
    expect(mockedFs.writeFile).toHaveBeenCalled();
  });

  it("should fallback to beep on API error", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    process.env.TTS_PROVIDER = "elevenlabs";

    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    const result = await synthesizeVoice({
      text: "Hello world",
      outPath: "./test.wav",
    });

    expect(result).toBe(path.resolve("./test.wav"));
    expect(mockedFs.writeFile).toHaveBeenCalled();
  });

  it("should create output directory", async () => {
    process.env.ELEVENLABS_API_KEY = "";

    await synthesizeVoice({
      text: "Hello world",
      outPath: "./nested/path/test.wav",
    });

    expect(mockedFs.mkdir).toHaveBeenCalledWith(
      path.dirname(path.resolve("./nested/path/test.wav")),
      { recursive: true }
    );
  });
});
