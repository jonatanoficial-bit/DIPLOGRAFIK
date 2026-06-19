export const INTERNATIONAL_MARKETS = Object.freeze([
  { id:"latin_america", icon:"🌎", nameKey:"intl.market.latam.name", textKey:"intl.market.latam.text", effects:{ marketReach:7, localizationDepth:4, supportCoverage:2 } },
  { id:"north_america", icon:"🗽", nameKey:"intl.market.na.name", textKey:"intl.market.na.text", effects:{ monetizationReadiness:6, storePresence:5, complianceCoverage:3, marketRisk:2 } },
  { id:"europe", icon:"🇪🇺", nameKey:"intl.market.eu.name", textKey:"intl.market.eu.text", effects:{ complianceCoverage:7, localizationDepth:3, privacyReadiness:5, marketRisk:-2 } },
  { id:"global_south", icon:"🌍", nameKey:"intl.market.south.name", textKey:"intl.market.south.text", effects:{ marketReach:6, culturalFit:5, supportCoverage:3 } }
]);

export const INTERNATIONAL_GATES = Object.freeze([
  { id:"localization", icon:"🌐", nameKey:"intl.gate.localization.name", textKey:"intl.gate.localization.text", metric:"localizationDepth", target:86 },
  { id:"compliance", icon:"⚖️", nameKey:"intl.gate.compliance.name", textKey:"intl.gate.compliance.text", metric:"complianceCoverage", target:84 },
  { id:"support", icon:"🎧", nameKey:"intl.gate.support.name", textKey:"intl.gate.support.text", metric:"supportCoverage", target:80 },
  { id:"store", icon:"🛒", nameKey:"intl.gate.store.name", textKey:"intl.gate.store.text", metric:"storePresence", target:82 },
  { id:"culture", icon:"🧭", nameKey:"intl.gate.culture.name", textKey:"intl.gate.culture.text", metric:"culturalFit", target:78 },
  { id:"privacy", icon:"🛡️", nameKey:"intl.gate.privacy.name", textKey:"intl.gate.privacy.text", metric:"privacyReadiness", target:84 },
  { id:"monetization", icon:"💎", nameKey:"intl.gate.monetization.name", textKey:"intl.gate.monetization.text", metric:"monetizationReadiness", target:76 },
  { id:"operations", icon:"🛰️", nameKey:"intl.gate.operations.name", textKey:"intl.gate.operations.text", metric:"globalOps", target:80 }
]);

export const INTERNATIONAL_LAUNCH_ACTIONS = Object.freeze([
  { id:"locale_review", titleKey:"intl.action.locale.title", textKey:"intl.action.locale.text", cost:14, actionPoints:1, cooldown:16, lagDays:7, effects:{ localizationDepth:9, culturalFit:4, marketRisk:-2 } },
  { id:"privacy_legal_matrix", titleKey:"intl.action.legal.title", textKey:"intl.action.legal.text", cost:18, actionPoints:2, cooldown:22, lagDays:10, effects:{ complianceCoverage:10, privacyReadiness:8, marketRisk:-4 } },
  { id:"store_multiregion", titleKey:"intl.action.store.title", textKey:"intl.action.store.text", cost:16, actionPoints:1, cooldown:18, lagDays:8, effects:{ storePresence:10, marketReach:4, monetizationReadiness:3 } },
  { id:"support_playbooks", titleKey:"intl.action.support.title", textKey:"intl.action.support.text", cost:12, actionPoints:1, cooldown:15, lagDays:7, effects:{ supportCoverage:10, globalOps:4, marketRisk:-2 } },
  { id:"community_ambassadors", titleKey:"intl.action.community.title", textKey:"intl.action.community.text", cost:15, actionPoints:2, cooldown:24, lagDays:12, effects:{ communityMomentum:10, culturalFit:5, marketReach:3 } },
  { id:"international_presskit", titleKey:"intl.action.press.title", textKey:"intl.action.press.text", cost:13, actionPoints:1, cooldown:18, lagDays:8, effects:{ marketReach:6, storePresence:3, communityMomentum:4 } },
  { id:"pricing_localization", titleKey:"intl.action.pricing.title", textKey:"intl.action.pricing.text", cost:11, actionPoints:1, cooldown:14, lagDays:6, effects:{ monetizationReadiness:9, culturalFit:3, marketRisk:-1 } },
  { id:"global_launch_room", titleKey:"intl.action.ops.title", textKey:"intl.action.ops.text", cost:20, actionPoints:2, cooldown:28, lagDays:10, effects:{ globalOps:11, supportCoverage:4, marketReach:4, marketRisk:-3 } }
]);
