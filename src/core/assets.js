import { BACKGROUND_ASSETS, PARTY_ASSETS } from "../data/assetCatalog.js";

export const TAB_BACKGROUND_KEYS = Object.freeze({
  dashboard: "bg_dashboard_city_view_v1",
  government: "bg_parliament_v1",
  economy: "bg_economy_financial_center_v1",
  population: "bg_dashboard_city_view_v1",
  diplomacy: "bg_diplomacy_room_v1",
  military: "bg_military_command_center_v1",
  intelligence: "bg_global_map_v1",
  projects: "bg_economy_financial_center_v1",
  press: "bg_press_conference_stage_v1",
  elections: "bg_election_room_v1",
  crisis: "bg_crisis_scene_v1",
  progression: "bg_global_map_v1",
  store: "bg_main_menu_presidential_office_v1",
  release: "bg_global_map_v1"
});

const APP_ROOT = (() => {
  try {
    const moduleUrl = new URL(import.meta.url);
    if (["http:", "https:", "file:"].includes(moduleUrl.protocol)) return new URL("../../", moduleUrl);
  } catch (_) {}
  try {
    const documentUrl = new URL(document.baseURI);
    if (["http:", "https:", "file:"].includes(documentUrl.protocol)) return new URL("./", documentUrl);
  } catch (_) {}
  // URL neutra usada somente pelos harnesses que executam módulos por data URL.
  return new URL("https://diplocraft.invalid/");
})();

export function resolveAppUrl(path) {
  if (!path) return "";
  if (/^(?:data:|blob:|https?:)/i.test(path)) return path;
  return new URL(String(path).replace(/^\.\//, ""), APP_ROOT).href;
}

function cssUrl(path) {
  return `url("${resolveAppUrl(path).replace(/"/g, "%22")}")`;
}

function imageSet(variant) {
  if (!variant) return "none";
  return `image-set(${cssUrl(variant.avif)} type("image/avif"), ${cssUrl(variant.webp)} type("image/webp"))`;
}

function backgroundLayers(variant, source) {
  const fallback = cssUrl(source);
  const supportsImageSet = typeof CSS !== "undefined" && CSS.supports?.(
    "background-image",
    `image-set(${cssUrl(variant.webp)} type("image/webp"))`
  );
  const optimized = supportsImageSet ? imageSet(variant) : cssUrl(variant.webp);
  // A segunda camada sempre aponta para o PNG original. Caso a variante otimizada
  // retorne 404 na hospedagem, o navegador ainda renderiza a camada inferior.
  return `${optimized}, ${fallback}`;
}

export function applyResponsiveBackground(element, key) {
  const asset = BACKGROUND_ASSETS[key];
  if (!element || !asset) return false;
  element.style.setProperty("--bg-desktop", backgroundLayers(asset.variants.desktop, asset.source));
  element.style.setProperty("--bg-mobile", backgroundLayers(asset.variants.mobile, asset.source));
  element.dataset.assetKey = key;
  element.dataset.assetFallback = resolveAppUrl(asset.source);
  return true;
}

export function preloadPath(path, priority = "low") {
  const href = resolveAppUrl(path);
  if (!href || document.querySelector(`link[data-asset-preload="${CSS.escape(href)}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = href;
  link.fetchPriority = priority;
  link.dataset.assetPreload = href;
  document.head.appendChild(link);
}

export function preloadBackground(key, priority = "low") {
  const asset = BACKGROUND_ASSETS[key];
  if (!asset) return;
  const mobile = matchMedia("(max-width: 880px)").matches;
  preloadPath((mobile ? asset.variants.mobile : asset.variants.desktop).webp, priority);
}

export function initializeAssetPipeline() {
  applyResponsiveBackground(document.querySelector(".bg-menu"), "bg_global_map_v1");
  applyResponsiveBackground(document.querySelector(".bg-office"), "bg_main_menu_presidential_office_v1");
  applyResponsiveBackground(document.getElementById("gameBg"), TAB_BACKGROUND_KEYS.dashboard);
  preloadBackground("bg_global_map_v1", "high");

  const idle = window.requestIdleCallback || (callback => setTimeout(callback, 250));
  idle(() => preloadBackground("bg_main_menu_presidential_office_v1", "low"));
}

function activateImageFallback(img) {
  if (!img || img.dataset.fallbackTried === "1") return;
  const fallback = img.dataset.fallbackSrc;
  if (!fallback) return;
  img.dataset.fallbackTried = "1";
  const picture = img.closest("picture");
  picture?.querySelectorAll("source").forEach(source => source.remove());
  img.srcset = "";
  img.src = fallback;
  img.loading = "eager";
  img.classList.add("asset-fallback-active");
}

export function attachImageFallback(img, fallbackPath) {
  if (!img) return img;
  if (fallbackPath) img.dataset.fallbackSrc = resolveAppUrl(fallbackPath);
  if (img.dataset.assetFallbackBound === "1") return img;
  img.dataset.assetFallbackBound = "1";
  img.addEventListener("error", () => {
    if (img.dataset.fallbackTried !== "1" && img.dataset.fallbackSrc) {
      activateImageFallback(img);
      return;
    }
    img.classList.add("asset-missing");
    img.removeAttribute("src");
  });
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
    queueMicrotask(() => activateImageFallback(img));
  }
  return img;
}

export function bindImageFallbacks(root = document) {
  root.querySelectorAll?.("img[data-fallback-src]").forEach(img => attachImageFallback(img));
}

export function partyPictureMarkup(party, index = 0) {
  const asset = PARTY_ASSETS[party.assetKey];
  if (!asset) return `<span class="partyTextFallback"><b>${party.sigla} ${party.numero}</b><small>${party.nome}</small></span>`;
  const loading = index < 4 ? "eager" : "lazy";
  const priority = index === 0 ? "high" : "low";
  const avif = resolveAppUrl(asset.variants.party.avif);
  const webp = resolveAppUrl(asset.variants.party.webp);
  const fallback = resolveAppUrl(asset.source);
  return `<picture class="partyPicture"><source type="image/avif" srcset="${avif}"><img src="${webp}" data-fallback-src="${fallback}" alt="${party.nome}" loading="${loading}" decoding="async" fetchpriority="${priority}" width="360" height="336"></picture>`;
}

export function avatarPictureMarkup(avatar, index = 0) {
  const loading = index < 2 ? "eager" : "lazy";
  const priority = index === 0 ? "high" : "low";
  const avif = resolveAppUrl(avatar.thumbAvif);
  const webp = resolveAppUrl(avatar.thumbWebp);
  const fallback = resolveAppUrl(avatar.source);
  return `<picture><source type="image/avif" srcset="${avif}"><img src="${webp}" data-fallback-src="${fallback}" alt="${avatar.name}" loading="${loading}" decoding="async" fetchpriority="${priority}" width="320" height="320"></picture>`;
}
