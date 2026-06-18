import { MESSAGES as PT } from "../i18n/locales/pt-BR.js";
import { MESSAGES as EN } from "../i18n/locales/en.js";
import { MESSAGES as ES } from "../i18n/locales/es.js";

export const DEFAULT_LOCALE = "pt-BR";
export const SUPPORTED_LOCALES = Object.freeze(["pt-BR", "en", "es"]);
export const LOCALE_LABEL_KEYS = Object.freeze({
  "pt-BR": "language.portuguese",
  en: "language.english",
  es: "language.spanish"
});

const STORAGE_KEY = "diplocraft_locale_v1";
const CATALOGS = Object.freeze({ "pt-BR": PT, en: EN, es: ES });
const listeners = new Set();
let currentLocale = DEFAULT_LOCALE;
let installed = false;
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();

function safeStorageGet() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
}
function safeStorageSet(value) {
  try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
}
function normalizeLocale(locale) {
  const value = String(locale || "").trim();
  if (SUPPORTED_LOCALES.includes(value)) return value;
  const lower = value.toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
function interpolate(value, vars = {}) {
  return String(value).replace(/\{([A-Za-z0-9_]+)\}/g, (_, key) => Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : `{${key}}`);
}

const reverseExact = new Map();
const reverseFolded = new Map();
for (const locale of SUPPORTED_LOCALES) {
  for (const [key, value] of Object.entries(CATALOGS[locale])) {
    const normalized = String(value).replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    if (!reverseExact.has(normalized)) reverseExact.set(normalized, key);
    const folded = normalized.toLocaleLowerCase(locale);
    if (!reverseFolded.has(folded)) reverseFolded.set(folded, key);
  }
}

const missingTranslations = new Map();

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function applySourceCase(source, target, locale = currentLocale) {
  if (!source || !target) return target;
  const letters = source.match(/[A-Za-zÀ-ÿ]/gu) || [];
  if (letters.length && letters.every(ch => ch === ch.toLocaleUpperCase(DEFAULT_LOCALE))) {
    return target.toLocaleUpperCase(locale);
  }
  const first = source.match(/[A-Za-zÀ-ÿ]/u)?.[0];
  if (first && first === first.toLocaleUpperCase(DEFAULT_LOCALE)) {
    return target.charAt(0).toLocaleUpperCase(locale) + target.slice(1);
  }
  return target;
}

function exactTranslation(value, locale = currentLocale) {
  const normalized = normalizeText(value);
  let key = reverseExact.get(normalized);
  let folded = false;
  if (!key) {
    key = reverseFolded.get(normalized.toLocaleLowerCase(DEFAULT_LOCALE));
    folded = Boolean(key);
  }
  if (!key) return null;
  const target = CATALOGS[locale]?.[key] ?? CATALOGS[DEFAULT_LOCALE]?.[key] ?? null;
  return folded && target !== null ? applySourceCase(normalized, target, locale) : target;
}

function localizedFragment(value) {
  const exact = exactTranslation(value);
  return exact ?? String(value ?? "");
}

function translateKnownParts(parts, separator = " • ") {
  const localized = parts.map(part => {
    const trimmed = part.trim();
    const translated = exactTranslation(trimmed);
    if (translated !== null) return translated;
    if (/^[\d.,%#₿💎🪙+\-\s]+$/u.test(trimmed)) return trimmed;
    if (/^[A-ZÀ-Ý0-9_-]{2,16}$/u.test(trimmed)) return trimmed;
    return null;
  });
  return localized.every(value => value !== null) ? localized.join(separator) : null;
}

function translatePattern(source) {
  if (currentLocale === DEFAULT_LOCALE) return source;
  const rules = [
    [/^([✓▫🔒🔓🏭🌾🏙💠⚡]\s*)(.+)$/u, m => {
      const translated = exactTranslation(m[2]);
      return translated === null ? null : m[1] + translated;
    }],
    [/^(.+?)Alt\+(\d+)$/u, m => {
      const translated = exactTranslation(m[1]);
      return translated === null ? null : `${translated}Alt+${m[2]}`;
    }],
    [/^₿\s*([\d.,]+)\s*bi$/u, m => t("pattern.billions", { value: m[1] })],
    [/^(\d+) dias • custo ₿ ([\d.,]+) bi$/u, m => t("pattern.durationCost", { days: m[1], cost: m[2] })],
    [/^Dificuldade (\d+)% • Capital (\d+)$/u, m => t("pattern.difficultyCapital", { difficulty: m[1], capital: m[2] })],
    [/^Risco operacional (\d+)%$/u, m => t("pattern.operationalRisk", { value: m[1] })],
    [/^(.+?) • alcance (\d+)% • confiança (\d+)%$/u, m => t("pattern.reachTrust", { type: localizedFragment(m[1]), reach: m[2], trust: m[3] })],
    [/^peso eleitoral (\d+)% • governo (\d+)%$/u, m => t("pattern.electoralWeight", { weight: m[1], government: m[2] })],
    [/^Posse concluída: (.+?) assume o (.+?) pelo (.+?)\.$/u, m => t("pattern.inauguration", { leader: localizedFragment(m[1]), country: localizedFragment(m[2]), party: localizedFragment(m[3]) })],
    [/^Ranking #(\d+)$/u, m => t("pattern.ranking", { value: m[1] })],
    [/^Idioma alterado para (.+)\.$/u, m => t("pattern.languageChanged", { language: localizedFragment(m[1]) })],
    [/^Language changed to (.+)\.$/u, m => t("pattern.languageChanged", { language: localizedFragment(m[1]) })],
    [/^Idioma cambiado a (.+)\.$/u, m => t("pattern.languageChanged", { language: localizedFragment(m[1]) })],
    [/^Versão, cache e pacote derivam da fonte canônica da build (.+)\.$/u, m => t("pattern.buildDerived", { version: m[1] })],
    [/^Versão, cache, módulos, testes e pacote derivam da fonte canônica da build (.+)\.$/u, m => t("pattern.buildDerived", { version: m[1] })],
    [/^Disponível nos 30 dias finais\. Restam (\d+) dias\.$/u, m => t("coreLoop.electionLocked", { days: m[1] })],
    [/^Available in the final 30 days\. (\d+) days remain\.$/u, m => t("coreLoop.electionLocked", { days: m[1] })],
    [/^Disponible en los últimos 30 días\. Quedan (\d+) días\.$/u, m => t("coreLoop.electionLocked", { days: m[1] })],
    [/^Seção atual: (.+)$/u, m => t("pattern.currentSection", { section: localizedFragment(m[1]) })],
    [/^Status: (.+)$/u, m => t("pattern.statusValue", { value: localizedFragment(m[1]) })],
    [/^Dias para eleição:\s*(\d+)$/u, m => t("pattern.daysElection", { days: m[1] })],
    [/^(.+?) • (\d+) deputados$/u, m => t("pattern.deputies", { party: localizedFragment(m[1]), count: m[2] })],
    [/^(.+?) • demanda: (.+)$/u, m => t("pattern.demand", { leaning: localizedFragment(m[1]), demand: localizedFragment(m[2]) })],
    [/^(.+?) • risco (\d+)%$/u, m => t("pattern.riskPercent", { skill: localizedFragment(m[1]), value: m[2] })],
    [/^Sensibilidade: (.+)$/u, m => t("pattern.sensitivity", { value: localizedFragment(m[1]) })],
    [/^Tensão (\d+)% • interesses: (.+)$/u, m => t("pattern.tensionInterests", { value: m[1], interests: m[2].split(",").map(x => localizedFragment(x.trim())).join(", ") })],
    [/^cooldown (\d+) dia\(s\)$/u, m => t("pattern.cooldownDays", { days: m[1] })],
    [/^nível (\d+)$/u, m => t("pattern.level", { value: m[1] })],
    [/^meta máxima (\d+(?:[.,]\d+)?)$/u, m => t("pattern.maximumGoal", { value: m[1] })],
    [/^meta (\d+(?:[.,]\d+)?)$/u, m => t("pattern.goal", { value: m[1] })],
    [/^Passo (\d+)$/u, m => t("pattern.step", { value: m[1] })],
    [/^ativo • atraso (\d+) ms$/u, m => t("pattern.activeDelay", { value: m[1] })],
    [/^(\d+) • diagnóstico persistente$/u, m => t("pattern.incidents", { count: m[1] })],
    [/^(\d+) • escrita transacional \+ checksum$/u, m => t("pattern.schema", { schema: m[1] })],
    [/^(.+?) • SHA-256 ([a-f0-9]{32,64})$/iu, m => t("pattern.sourceHash", { source: localizedFragment(m[1]), hash: m[2] })],
    [/^(.+?): entrega 💎 (\d+) e 🪙 (\d+)\.$/u, m => t("pattern.delivery", { label: localizedFragment(m[1]), premium: m[2], soft: m[3] })],
  ];
  for (const [pattern, render] of rules) {
    const match = source.match(pattern);
    if (match) {
      const rendered = render(match);
      if (rendered !== null) return rendered;
    }
  }
  if (source.includes(" • ")) {
    const joined = translateKnownParts(source.split(" • "));
    if (joined !== null) return joined;
  }
  const colon = source.match(/^([^:]{2,60}):\s+(.+)$/u);
  if (colon) {
    const left = exactTranslation(colon[1]);
    const right = exactTranslation(colon[2]);
    if (left !== null && right !== null) return `${left}: ${right}`;
  }
  return null;
}

function shouldTrackMissing(source) {
  if (!source || source.length < 2 || source.length > 400) return false;
  if (/^(?:https?:|\.\.?\/|#|\[|rgba\(|linear-gradient\()/i.test(source)) return false;
  if (/^[\d\s%+\-–—•₿💎🪙#.:/]+$/u.test(source)) return false;
  if (/^(?:v\d+\.\d+\.\d+(?:\s*•.*)?|DIPLOCRAFT(?:_.*|\s+v.*|$)|[A-Z0-9_]{8,}|PT-BR|EN|ES|[A-ZÀ-Ý]{2,16}\s+\d+)$/u.test(source)) return false;
  if (/^\d{1,2}\/\d{1,2}\/\d{4},/.test(source)) return false;
  if (/^(?:before:|save • save|\d+ • before:)/u.test(source)) return false;
  return /[A-Za-zÀ-ÿ]/u.test(source);
}

function recordMissing(source) {
  if (currentLocale === DEFAULT_LOCALE || !shouldTrackMissing(source)) return;
  const item = missingTranslations.get(source) || { source, count: 0, locale: currentLocale };
  item.count += 1;
  item.locale = currentLocale;
  missingTranslations.set(source, item);
  document.dispatchEvent(new CustomEvent("diplocraft:i18nmissing", { detail: item }));
}

export function t(key, vars = {}, fallback = key) {
  const catalog = CATALOGS[currentLocale] || CATALOGS[DEFAULT_LOCALE];
  const value = catalog[key] ?? CATALOGS[DEFAULT_LOCALE][key] ?? fallback;
  return interpolate(value, vars);
}

export function translateText(value) {
  if (value === null || value === undefined) return "";
  const source = String(value);
  const exact = exactTranslation(source);
  if (exact !== null) return exact;
  const patterned = translatePattern(source);
  if (patterned !== null) return patterned;
  recordMissing(normalizeText(source));
  return source;
}

export function getMissingTranslations() {
  return Array.from(missingTranslations.values()).sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

export function clearMissingTranslations() { missingTranslations.clear(); }

function translateTextNode(node) {
  if (!node?.nodeValue || !node.nodeValue.trim()) return;
  const parent = node.parentElement;
  if (!parent || parent.closest("[data-i18n-skip], [data-i18n-final], script, style, code, pre, kbd")) return;
  const explicitSource = parent.getAttribute("data-i18n-source");
  if (!originalTextNodes.has(node) || explicitSource !== null) originalTextNodes.set(node, explicitSource ?? node.nodeValue);
  const before = explicitSource ?? originalTextNodes.get(node);
  const lead = before.match(/^\s*/)?.[0] || "";
  const trail = before.match(/\s*$/)?.[0] || "";
  const core = before.trim();
  if (!core) return;
  node.nodeValue = lead + translateText(core) + trail;
}

export function translateElement(root = document) {
  if (!root) return;
  const scope = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
  if (!scope) return;
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
  const elements = scope.querySelectorAll ? [scope, ...scope.querySelectorAll("[placeholder], [aria-label], [title], [alt], [data-i18n]")] : [];
  for (const el of elements) {
    if (!(el instanceof Element) || el.closest("[data-i18n-skip]")) continue;
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
    let originals = originalAttributes.get(el);
    if (!originals) { originals = {}; originalAttributes.set(el, originals); }
    for (const attr of ["placeholder", "aria-label", "title", "alt"]) {
      if (!el.hasAttribute(attr)) continue;
      if (!Object.prototype.hasOwnProperty.call(originals, attr)) originals[attr] = el.getAttribute(attr);
      el.setAttribute(attr, translateText(originals[attr]));
    }
  }
}

export function translateDocument() { translateElement(document); }

export function getLocale() { return currentLocale; }
export function getLocaleLabel(locale = currentLocale) { return t(LOCALE_LABEL_KEYS[normalizeLocale(locale)]); }
export function getCatalog(locale = currentLocale) { return CATALOGS[normalizeLocale(locale)]; }

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(currentLocale, options).format(Number(value) || 0);
}
export function formatDateParts(day, month, year) {
  const date = new Date(Date.UTC(Number(year), Math.max(0, Number(month) - 1), Number(day)));
  return new Intl.DateTimeFormat(currentLocale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}
export function formatList(items = []) {
  try { return new Intl.ListFormat(currentLocale, { style: "short", type: "conjunction" }).format(items.map(String)); }
  catch (_) { return items.join(", "); }
}

export function bindLocaleControls(selector = "[data-locale-select]") {
  document.querySelectorAll(selector).forEach(select => {
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = currentLocale;
    select.onchange = () => setLocale(select.value, { source: select.id || "selector" });
  });
}

export function setLocale(locale, { source = "api", silent = false } = {}) {
  const next = normalizeLocale(locale);
  const changed = next !== currentLocale;
  currentLocale = next;
  safeStorageSet(currentLocale);
  document.documentElement.lang = currentLocale;
  document.documentElement.dir = "ltr";
  document.body?.setAttribute("data-locale", currentLocale);
  document.querySelectorAll("[data-locale-select]").forEach(el => { if (el instanceof HTMLSelectElement) el.value = currentLocale; });
  if (changed || !installed) translateDocument();
  if (changed && !silent) {
    const detail = { locale: currentLocale, source, label: getLocaleLabel(currentLocale) };
    document.dispatchEvent(new CustomEvent("diplocraft:localechange", { detail }));
    listeners.forEach(listener => { try { listener(detail); } catch (_) {} });
  }
  return currentLocale;
}

export function onLocaleChange(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installI18n({ onChange } = {}) {
  if (typeof onChange === "function") onLocaleChange(onChange);
  const stored = safeStorageGet();
  currentLocale = normalizeLocale(stored || DEFAULT_LOCALE);
  installed = true;
  setLocale(currentLocale, { source: stored ? "storage" : "default", silent: true });
  bindLocaleControls();
  translateDocument();
  const api = Object.freeze({
    getLocale, setLocale, t, translateText, translateDocument, getMissingTranslations, clearMissingTranslations, formatNumber, formatDateParts,
    supportedLocales: SUPPORTED_LOCALES, defaultLocale: DEFAULT_LOCALE
  });
  window.DIPLOCRAFT_I18N = api;
  return api;
}
