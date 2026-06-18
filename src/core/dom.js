export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
export const fmt = (value) => Math.round(Number(value) || 0).toLocaleString(document?.documentElement?.lang || "pt-BR");
export const pct = (value) => `${Math.round(clamp(value))}%`;
