export const GOLD_RELEASE_TRACKS = Object.freeze([
  { id:"gold_candidate", icon:"🏆", nameKey:"gold.track.candidate.name", textKey:"gold.track.candidate.text", effects:{ goldStampReadiness:5, technicalCertification:4, launchRisk:-2 } },
  { id:"store_packaging", icon:"🛒", nameKey:"gold.track.store.name", textKey:"gold.track.store.text", effects:{ storeReadiness:7, legalCompliance:3, commercialScore:1 } },
  { id:"pwa_distribution", icon:"📲", nameKey:"gold.track.pwa.name", textKey:"gold.track.pwa.text", effects:{ rolloutReadiness:6, rollbackReadiness:4, supportReadiness:2 } },
  { id:"launch_operations", icon:"🚀", nameKey:"gold.track.launch.name", textKey:"gold.track.launch.text", effects:{ launchOps:7, supportReadiness:5, telemetryBaseline:3, launchRisk:2 } }
]);

export const GOLD_CERTIFICATION_GATES = Object.freeze([
  { id:"integrity", icon:"🔐", nameKey:"gold.gate.integrity.name", textKey:"gold.gate.integrity.text", metric:"technicalCertification", target:84 },
  { id:"saves", icon:"💾", nameKey:"gold.gate.saves.name", textKey:"gold.gate.saves.text", metric:"rollbackReadiness", target:78 },
  { id:"mobile", icon:"📱", nameKey:"gold.gate.mobile.name", textKey:"gold.gate.mobile.text", metric:"mobileCertification", target:80 },
  { id:"pwa", icon:"📡", nameKey:"gold.gate.pwa.name", textKey:"gold.gate.pwa.text", metric:"rolloutReadiness", target:78 },
  { id:"localization", icon:"🌎", nameKey:"gold.gate.localization.name", textKey:"gold.gate.localization.text", metric:"localizationCertification", target:88 },
  { id:"balance", icon:"⚖️", nameKey:"gold.gate.balance.name", textKey:"gold.gate.balance.text", metric:"balanceCertification", target:76 },
  { id:"privacy", icon:"🛡️", nameKey:"gold.gate.privacy.name", textKey:"gold.gate.privacy.text", metric:"legalCompliance", target:82 },
  { id:"operations", icon:"🛰️", nameKey:"gold.gate.operations.name", textKey:"gold.gate.operations.text", metric:"launchOps", target:78 }
]);

export const GOLD_MASTER_ACTIONS = Object.freeze([
  { id:"final_regression", titleKey:"gold.action.regression.title", textKey:"gold.action.regression.text", cost:16, actionPoints:2, cooldown:18, lagDays:7, effects:{ technicalCertification:8, mobileCertification:5, goldStampReadiness:4, launchRisk:-3 } },
  { id:"store_listing_pack", titleKey:"gold.action.store.title", textKey:"gold.action.store.text", cost:14, actionPoints:1, cooldown:16, lagDays:8, effects:{ storeReadiness:9, launchOps:2, commercialScore:2 } },
  { id:"privacy_compliance_pack", titleKey:"gold.action.privacy.title", textKey:"gold.action.privacy.text", cost:12, actionPoints:1, cooldown:18, lagDays:8, effects:{ legalCompliance:9, telemetryBaseline:2, launchRisk:-4 } },
  { id:"launch_comms_plan", titleKey:"gold.action.comms.title", textKey:"gold.action.comms.text", cost:18, actionPoints:2, cooldown:21, lagDays:10, effects:{ launchOps:7, supportReadiness:3, storeReadiness:3, launchRisk:1 } },
  { id:"support_playbook", titleKey:"gold.action.support.title", textKey:"gold.action.support.text", cost:10, actionPoints:1, cooldown:14, lagDays:7, effects:{ supportReadiness:9, rollbackReadiness:3, launchRisk:-2 } },
  { id:"analytics_baseline", titleKey:"gold.action.analytics.title", textKey:"gold.action.analytics.text", cost:9, actionPoints:1, cooldown:12, lagDays:5, effects:{ telemetryBaseline:10, launchOps:2, legalCompliance:1 } },
  { id:"gold_master_cut", titleKey:"gold.action.cut.title", textKey:"gold.action.cut.text", cost:22, actionPoints:2, cooldown:30, lagDays:12, effects:{ goldStampReadiness:10, technicalCertification:5, rollbackReadiness:4, launchRisk:-3 } },
  { id:"hotfix_war_room", titleKey:"gold.action.hotfix.title", textKey:"gold.action.hotfix.text", cost:13, actionPoints:1, cooldown:16, lagDays:6, effects:{ rollbackReadiness:8, supportReadiness:5, launchRisk:-5 } }
]);
