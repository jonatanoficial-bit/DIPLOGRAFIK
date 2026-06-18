import test from "node:test";
import assert from "node:assert/strict";
import { DECISIONS, PROJECTS, PRESS_QUESTIONS } from "../../src/data/content.js";
import { ECONOMIC_MEASURES, TAX_PROFILES } from "../../src/data/economyData.js";
import { GOVERNMENT_ACTIONS, LAW_PROJECTS, MINISTERS } from "../../src/data/governmentData.js";
import { MEDIA_ACTIONS, PRESS_BRIEFINGS } from "../../src/data/mediaData.js";
import { CAMPAIGN_ACTIONS, REGIONS, OPPONENTS } from "../../src/data/electionData.js";
import { AI_COUNTRIES, TREATIES, DIPLOMACY_ACTIONS, INTERNATIONAL_EVENTS } from "../../src/data/diplomacyData.js";
import { MILITARY_ACTIONS, INTEL_OPERATIONS, SECURITY_FORCES, SECURITY_EVENTS } from "../../src/data/securityData.js";
import { CRISIS_ACTIONS, CRISIS_CHAINS } from "../../src/data/crisisData.js";

const collections = {
  DECISIONS, PROJECTS, PRESS_QUESTIONS, ECONOMIC_MEASURES, TAX_PROFILES,
  GOVERNMENT_ACTIONS, LAW_PROJECTS, MINISTERS, MEDIA_ACTIONS, PRESS_BRIEFINGS,
  CAMPAIGN_ACTIONS, REGIONS, OPPONENTS, AI_COUNTRIES, TREATIES, DIPLOMACY_ACTIONS,
  INTERNATIONAL_EVENTS, MILITARY_ACTIONS, INTEL_OPERATIONS, SECURITY_FORCES,
  SECURITY_EVENTS, CRISIS_ACTIONS, CRISIS_CHAINS
};

function inspectNumbers(value, path = "root") {
  if (typeof value === "number") assert.ok(Number.isFinite(value), `${path} must be finite`);
  if (Array.isArray(value)) value.forEach((item, index) => inspectNumbers(item, `${path}[${index}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => {
    if (typeof item !== "function") inspectNumbers(item, `${path}.${key}`);
  });
}

test("all gameplay collections are non-empty and have unique identifiers", () => {
  for (const [name, items] of Object.entries(collections)) {
    assert.ok(Array.isArray(items) && items.length > 0, `${name} must be non-empty`);
    const ids = items.map((item, index) => String(item.id ?? item.name ?? item.title ?? index));
    assert.equal(new Set(ids).size, ids.length, `${name} contains duplicate identifiers`);
    inspectNumbers(items, name);
  }
});

test("cost and cooldown fields never use invalid negative values", () => {
  for (const [name, items] of Object.entries(collections)) {
    for (const item of items) {
      if (Object.hasOwn(item, "cost")) assert.ok(item.cost >= 0, `${name}:${item.id} negative cost`);
      if (Object.hasOwn(item, "cooldown")) assert.ok(item.cooldown >= 0, `${name}:${item.id} negative cooldown`);
    }
  }
});
