import { applyEffects, normalizeState } from "./calculations.js";
import { HEADLINE_TEMPLATES } from "../data/mediaData.js";

export function publicMood(state) {
  return Math.max(0, Math.min(100,
    state.approval * 0.42 +
    state.media * 0.22 +
    state.economy * 0.16 +
    state.stability * 0.12 +
    state.prestige * 0.08 -
    state.crisis * 2 -
    state.corruption * 0.08
  ));
}

export function mediaHostility(state) {
  return Math.max(0, Math.min(100,
    (100 - state.media) * 0.35 +
    state.opposition * 0.22 +
    state.corruption * 0.2 +
    state.crisis * 3 +
    Math.max(0, state.inflation - 8) * 1.2
  ));
}

export function generateHeadline(state) {
  const mood = publicMood(state);
  const hostility = mediaHostility(state);
  let type = "warning";
  if (mood > 64 && hostility < 45) type = "positive";
  if (mood < 45 || hostility > 65) type = "negative";
  const list = HEADLINE_TEMPLATES.filter(h => h.type === type);
  const headline = list[Math.floor(Math.random() * list.length)] || HEADLINE_TEMPLATES[0];
  return { ...headline, mood: Math.round(mood), hostility: Math.round(hostility) };
}

export function answerPressQuestion(state, answer, log) {
  if (!answer) return;
  applyEffects(state, answer.effects);
  const headline = generateHeadline(state);
  state.headlines = state.headlines || [];
  state.headlines.unshift({
    text: headline.text,
    type: headline.type,
    mood: headline.mood,
    hostility: headline.hostility
  });
  state.headlines = state.headlines.slice(0, 10);
  log(`Coletiva (${answer.tone}): ${headline.text}.`, headline.type);
  normalizeState(state);
}

export function updateMediaCycle(state, log) {
  const headline = generateHeadline(state);
  state.headlines = state.headlines || [];
  state.headlines.unshift({
    text: headline.text,
    type: headline.type,
    mood: headline.mood,
    hostility: headline.hostility
  });
  state.headlines = state.headlines.slice(0, 10);

  if (headline.type === "negative") {
    applyEffects(state, { approval: -1, media: -0.8, crisis: 0.2 });
  } else if (headline.type === "positive") {
    applyEffects(state, { approval: 0.8, media: 0.6 });
  }

  log(`Manchete: ${headline.text}.`, headline.type);
}