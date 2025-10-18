import { synthesizeVoice } from "./voice_gen";
import { promises as fs } from "node:fs/promises";
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

  it("should generate WAV file with correct format", async () => {
    process.env.ELEVENLABS_API_KEY = "";

    await synthesizeVoice({
      text: "Test narration text for voice synthesis",
      outPath: "./test.wav",
    });

    expect(mockedFs.writeFile).toHaveBeenCalled();

    // Check that a buffer was written (WAV format)
    const writeCall = mockedFs.writeFile.mock.calls[0];
    expect(writeCall[0]).toBe(path.resolve("./test.wav"));
    expect(writeCall[1]).toBeInstanceOf(Uint8Array);
  });

  it("should handle different providers", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.TTS_PROVIDER = "openai";

    // Mock fetch to return error (fallback to beep)
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    const result = await synthesizeVoice({
      text: "Hello world",
      outPath: "./test.wav",
      provider: "openai",
    });

    expect(result).toBe(path.resolve("./test.wav"));
  });
});
