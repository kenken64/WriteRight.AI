/**
 * Central AI model configuration.
 * All model IDs read from environment variables with sensible fallbacks.
 * Update Railway env vars to switch models without code changes.
 */

/** Primary model for complex tasks: marking, rewriting, coaching, outlines */
export const MODEL_PRIMARY = process.env.OPENAI_MODEL_PRIMARY ?? "gpt-4o";

/** Higher-quality model for essay evaluation — richer feedback and advice */
export const MODEL_EVALUATION = process.env.OPENAI_MODEL_EVALUATION ?? "gpt-5";

/** Lightweight model for fast tasks: grammar checking, live scoring, analysis */
export const MODEL_FAST = process.env.OPENAI_MODEL_FAST ?? "gpt-4o-mini";

/** TTS model */
export const MODEL_TTS = process.env.OPENAI_MODEL_TTS ?? "tts-1";
