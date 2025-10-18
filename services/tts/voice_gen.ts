import { promises as fs } from "node:fs";
import * as path from "node:path";

export type VoiceInput = {
  text: string;
  voiceId?: string; // provider-specific
  outPath: string;
  provider?: "elevenlabs" | "openai" | "beep";
};

export async function synthesizeVoice(input: VoiceInput): Promise<string> {
  const provider = input.provider || process.env.TTS_PROVIDER || "beep";
  const outPath = path.resolve(input.outPath);

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  try {
    switch (provider) {
      case "elevenlabs":
        return await synthesizeWithElevenLabs(input, outPath);
      case "openai":
        return await synthesizeWithOpenAI(input, outPath);
      case "beep":
      default:
        return await synthesizeBeep(input, outPath);
    }
  } catch (error) {
    console.warn(
      `TTS provider ${provider} failed, falling back to beep:`,
      error
    );
    return await synthesizeBeep(input, outPath);
  }
}

async function synthesizeWithElevenLabs(
  input: VoiceInput,
  outPath: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not found");
  }

  const voiceId = input.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: input.text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  await fs.writeFile(outPath, new Uint8Array(audioBuffer));
  return outPath;
}

async function synthesizeWithOpenAI(
  input: VoiceInput,
  outPath: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: input.text,
      voice: "alloy",
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const audioBuffer = await response.arrayBuffer();
  await fs.writeFile(outPath, new Uint8Array(audioBuffer));
  return outPath;
}

async function synthesizeBeep(
  input: VoiceInput,
  outPath: string
): Promise<string> {
  // Create a simple beep audio file as placeholder
  console.warn(
    "Using beep placeholder for TTS - configure a real TTS provider"
  );

  // Create a simple WAV file with beeps
  const duration = Math.max(1, input.text.length / 10); // Rough estimate
  const sampleRate = 44100;
  const frequency = 440; // A4 note
  const samples = Math.floor(sampleRate * duration);

  const buffer = Buffer.alloc(44 + samples * 2); // WAV header + 16-bit samples

  // WAV header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);

  // Generate sine wave
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.3;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  await fs.writeFile(outPath, new Uint8Array(buffer));
  return outPath;
}
