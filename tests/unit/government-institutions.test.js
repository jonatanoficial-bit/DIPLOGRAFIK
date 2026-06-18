import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../../src/core/stateFactory.js';
import { ensureInstitutionalState, calculateInstitutionalSnapshot, setInstitutionalReform, applyInstitutionalEffects, processInstitutionalMonth, institutionalHealthScore } from '../../src/systems/governmentInstitutions.js';

test('Fase 19 initializes institutional state and bounded snapshot', () => {
  const state = createNewState();
  const institutions = ensureInstitutionalState(state);
  assert.equal(institutions.schema, 1);
  assert.ok(institutions.institutions.length >= 8);
  const snapshot = calculateInstitutionalSnapshot(state);
  assert.ok(snapshot.institutionalScore >= 0 && snapshot.institutionalScore <= 100);
  assert.ok(institutionalHealthScore(state) >= 0 && institutionalHealthScore(state) <= 100);
});

test('Fase 19 reforms and effects bridge safely to other systems', () => {
  const state = createNewState();
  setInstitutionalReform(state, 'federal_cooperation');
  assert.equal(state.institutions.activeReform, 'federal_cooperation');
  const legacy = applyInstitutionalEffects(state, { federalCoordination: 4, regionalBalance: 2, businessConfidence: 3, stability: 1 });
  assert.ok(state.institutions.federalCoordination > 49);
  assert.ok(state.budgetTax.regionalBalance > 44);
  assert.ok(state.deepEconomy.businessConfidence > 50);
  assert.equal(legacy.stability, 1);
});

test('Fase 19 monthly processing remains finite and history bounded', () => {
  const state = createNewState();
  for (let i = 0; i < 180; i += 1) processInstitutionalMonth(state, {});
  assert.ok(Number.isFinite(state.institutions.institutionalScore));
  assert.ok(state.institutions.history.length <= 36);
});
