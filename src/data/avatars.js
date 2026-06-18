import { CHARACTER_ASSETS } from "./assetCatalog.js";

function avatar(id, name, key) {
  const asset = CHARACTER_ASSETS[key];
  return Object.freeze({
    id,
    name,
    assetKey: key,
    source: asset.source,
    src: asset.variants.display.webp,
    srcAvif: asset.variants.display.avif,
    thumbWebp: asset.variants.thumb.webp,
    thumbAvif: asset.variants.thumb.avif
  });
}

export const AVATARS = Object.freeze([
  avatar("white", "Executivo", "char_leader_male_white_v1"),
  avatar("black", "Líder negro", "char_leader_male_black_v1"),
  avatar("elder", "Estadista", "char_leader_male_elder_v1"),
  avatar("veteran", "Veterano", "char_leader_male_elder_refined_v1"),
  avatar("young", "Carismático", "char_leader_latest_v1")
]);
