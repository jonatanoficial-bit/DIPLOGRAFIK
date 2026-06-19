import { BUILD } from "../core/build.js";

export const RELEASE_CHECKLIST = [
  { id:"build-truth", titleKey:"release.check.buildTruth.title", status:"ok", detailKey:"release.check.buildTruth.detail" },
  { id:"full-zip", titleKey:"release.check.fullZip.title", status:"ok", detailKey:"release.check.fullZip.detail" },
  { id:"saves", titleKey:"release.check.saves.title", status:"ok", detailKey:"release.check.saves.detail" },
  { id:"mobile", titleKey:"release.check.mobile.title", status:"ok", detailKey:"release.check.mobile.detail" },
  { id:"i18n", titleKey:"release.check.i18n.title", status:"ok", detailKey:"release.check.i18n.detail" },
  { id:"alpha-beta", titleKey:"release.check.alphaBeta.title", status:"ok", detailKey:"release.check.alphaBeta.detail" },
  { id:"gold-master", titleKey:"release.check.gold.title", status:"ok", detailKey:"release.check.gold.detail" }
];

export const TEST_CHECKLIST = [
  { id:"gold-master-audit", textKey:"release.test.goldAudit" },
  { id:"government-cycle", textKey:"release.test.governmentCycle" },
  { id:"release-devices", textKey:"release.test.releaseDevices" },
  { id:"simulation", textKey:"release.test.simulation" },
  { id:"assets", textKey:"release.test.assets" },
  { id:"languages", textKey:"release.test.languages" },
  { id:"github-vercel", textKey:"release.test.githubVercel" }
];

export const NEXT_RELEASE_STEPS = [
  { id:"gold-scope", textKey:"release.next.goldScope" },
  { id:"manual-approval", textKey:"release.next.manualApproval" },
  { id:"v2-seal", textKey:"release.next.v2Seal" },
  { id:"official-zip", textKey:"release.next.keepZip" }
];
