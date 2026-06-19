export const BETA_CHANNELS = Object.freeze([
  { id:"internal_alpha", icon:"🧪", nameKey:"alphaBeta.channel.internal.name", textKey:"alphaBeta.channel.internal.text", effects:{ qaCoverage:4, telemetryQuality:3, betaFeedback:2, publicRisk:-1 } },
  { id:"closed_beta", icon:"👥", nameKey:"alphaBeta.channel.closed.name", textKey:"alphaBeta.channel.closed.text", effects:{ betaFeedback:7, gameplayBalance:3, releaseReadiness:2, publicRisk:2 } },
  { id:"device_lab", icon:"📱", nameKey:"alphaBeta.channel.device.name", textKey:"alphaBeta.channel.device.text", effects:{ mobileStability:6, performanceScore:5, crashFreeSessions:2, qaCoverage:2 } },
  { id:"release_candidate", icon:"🏁", nameKey:"alphaBeta.channel.rc.name", textKey:"alphaBeta.channel.rc.text", effects:{ releaseReadiness:8, buildConfidence:5, qaCoverage:3, publicRisk:3 } }
]);

export const BETA_MILESTONES = Object.freeze([
  { id:"boot", icon:"⚙️", nameKey:"alphaBeta.milestone.boot.name", textKey:"alphaBeta.milestone.boot.text", metric:"buildConfidence", target:75 },
  { id:"mobile", icon:"📲", nameKey:"alphaBeta.milestone.mobile.name", textKey:"alphaBeta.milestone.mobile.text", metric:"mobileStability", target:78 },
  { id:"saves", icon:"💾", nameKey:"alphaBeta.milestone.saves.name", textKey:"alphaBeta.milestone.saves.text", metric:"qaCoverage", target:70 },
  { id:"balance", icon:"⚖️", nameKey:"alphaBeta.milestone.balance.name", textKey:"alphaBeta.milestone.balance.text", metric:"gameplayBalance", target:68 },
  { id:"localization", icon:"🌎", nameKey:"alphaBeta.milestone.localization.name", textKey:"alphaBeta.milestone.localization.text", metric:"localizationReadiness", target:86 },
  { id:"offline", icon:"📡", nameKey:"alphaBeta.milestone.offline.name", textKey:"alphaBeta.milestone.offline.text", metric:"performanceScore", target:72 },
  { id:"feedback", icon:"📝", nameKey:"alphaBeta.milestone.feedback.name", textKey:"alphaBeta.milestone.feedback.text", metric:"betaFeedback", target:55 },
  { id:"gold", icon:"★", nameKey:"alphaBeta.milestone.gold.name", textKey:"alphaBeta.milestone.gold.text", metric:"releaseReadiness", target:75 }
]);

export const ALPHA_BETA_ACTIONS = Object.freeze([
  { id:"device_matrix", titleKey:"alphaBeta.action.device.title", textKey:"alphaBeta.action.device.text", cost:10, actionPoints:1, cooldown:14, lagDays:7, effects:{ mobileStability:8, performanceScore:5, qaCoverage:3 } },
  { id:"save_migration_drill", titleKey:"alphaBeta.action.save.title", textKey:"alphaBeta.action.save.text", cost:8, actionPoints:1, cooldown:14, lagDays:7, effects:{ qaCoverage:6, crashFreeSessions:3, buildConfidence:4 } },
  { id:"balance_sprint", titleKey:"alphaBeta.action.balance.title", textKey:"alphaBeta.action.balance.text", cost:14, actionPoints:2, cooldown:21, lagDays:14, effects:{ gameplayBalance:9, releaseReadiness:3, playerGuidance:2 } },
  { id:"localization_pass", titleKey:"alphaBeta.action.localization.title", textKey:"alphaBeta.action.localization.text", cost:9, actionPoints:1, cooldown:16, lagDays:8, effects:{ localizationReadiness:7, buildConfidence:2, playerGuidance:1 } },
  { id:"pwa_offline_drill", titleKey:"alphaBeta.action.pwa.title", textKey:"alphaBeta.action.pwa.text", cost:12, actionPoints:1, cooldown:18, lagDays:10, effects:{ performanceScore:7, crashFreeSessions:2, mobileStability:3 } },
  { id:"closed_beta_session", titleKey:"alphaBeta.action.closed.title", textKey:"alphaBeta.action.closed.text", cost:18, actionPoints:2, cooldown:28, lagDays:15, effects:{ betaFeedback:10, telemetryQuality:5, releaseReadiness:3, publicRisk:2 } },
  { id:"telemetry_review", titleKey:"alphaBeta.action.telemetry.title", textKey:"alphaBeta.action.telemetry.text", cost:7, actionPoints:1, cooldown:12, lagDays:5, effects:{ telemetryQuality:8, qaCoverage:3, publicRisk:-2 } },
  { id:"gold_readiness_board", titleKey:"alphaBeta.action.board.title", textKey:"alphaBeta.action.board.text", cost:20, actionPoints:2, cooldown:35, lagDays:18, effects:{ releaseReadiness:9, buildConfidence:5, qaCoverage:4, gameplayBalance:3 } }
]);
