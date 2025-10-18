export type NarrationStyle = "zen" | "adventure";
export type Lang = "fr" | "en";

export type NarrationRequest = {
  lang: Lang;
  style: NarrationStyle;
  durationSec: number; // target duration of clip
  context?: string; // optional keywords from scene
};

export const narrationSystemPrompt = (lang: Lang, style: NarrationStyle) =>
  `You are a concise ${style} narrator in ${lang}. Keep 90-120 words, vivid but not cheesy. Avoid clichés.`;

export const captionSystemPrompt = (lang: Lang) =>
  `You write a 2-sentence caption in ${lang} and 12 SEO hashtags (no spaces in hashtags).`;
