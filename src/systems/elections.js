import { applyEffects, clamp } from "./calculations.js";
import { REGIONS, OPPONENTS } from "../data/electionData.js";

export function voteChance(state) {
  return clamp(
    state.approval * 0.32 +
    state.economy * 0.16 +
    state.stability * 0.12 +
    state.media * 0.12 +
    state.campaign * 0.18 +
    state.prestige * 0.06 +
    ((state.electoralCareer?.groundGame || 50) - 50) * 0.045 +
    ((state.electoralCareer?.digitalMobilization || 50) - 50) * 0.035 +
    ((state.electoralCareer?.coalitionEndorsements || 50) - 50) * 0.032 +
    ((state.electoralCareer?.careerMomentum || 50) - 50) * 0.040 -
    ((state.electoralCareer?.ethicsRisk || 25) - 25) * 0.030 -
    (state.rejection || 30) * 0.12 -
    state.corruption * 0.08 -
    state.crisis * 1.8
  );
}

export function regionalPolls(state) {
  return REGIONS.map(region => {
    const profileBoost =
      region.leaning === "social" ? (state.approval - 50) * 0.1 :
      region.leaning === "mercado" ? (state.marketConfidence - 50) * 0.08 :
      region.leaning === "agro" ? ((state.agribusiness || 50) - 50) * 0.12 :
      region.leaning === "seguranca" ? ((state.stability || 50) - 50) * 0.12 :
      (state.prestige - 50) * 0.06;

    const value = voteChance(state) + region.approvalBias + profileBoost + (Math.sin((state.day + region.voters) * 0.7) * 1.8);
    return { ...region, incumbent: clamp(value), opposition: clamp(100 - value) };
  });
}

export function nationalPoll(state) {
  const polls = regionalPolls(state);
  const totalVoters = polls.reduce((sum, r) => sum + r.voters, 0);
  const incumbent = polls.reduce((sum, r) => sum + r.incumbent * r.voters, 0) / totalVoters;
  const opposition = 100 - incumbent;
  return { incumbent: clamp(incumbent), opposition: clamp(opposition), polls };
}

export function mainOpponent(state) {
  const index = Math.abs((state.year + state.month + state.day) % OPPONENTS.length);
  const base = OPPONENTS[index];
  const strength = clamp(base.strength + (state.opposition - 45) * 0.28 + (state.crisis * 1.4) - (state.media - 50) * 0.08);
  return { ...base, strength };
}

export function applyCampaignAction(state, action, log) {
  if (!action) return;
  if ((action.cost || 0) > state.treasury) {
    log("Tesouro insuficiente para ação de campanha.", "negative");
    return;
  }

  if (action.debate) {
    state.treasury -= action.cost || 0;
    const performance = state.media * 0.25 + state.approval * 0.25 + state.stability * 0.15 + state.campaign * 0.2 + Math.random() * 25;
    if (performance >= 55) {
      applyEffects(state, { campaign: 8, approval: 4, media: 3, rejection: -3 });
      log("Debate vencido: a campanha ganha força nacional.", "positive");
    } else {
      applyEffects(state, { campaign: -5, approval: -4, media: -3, rejection: 4 });
      log("Debate ruim: adversários exploram falhas do governo.", "negative");
    }
    return;
  }

  applyEffects(state, action.effects);
  log(`Campanha: ${action.title} executada.`, "positive");
}

export function simulateElection(state, log) {
  const poll = nationalPoll(state);
  const opponent = mainOpponent(state);
  const incumbentVote = clamp(poll.incumbent + (Math.random() * 10 - 5));
  const opponentVote = clamp(opponent.strength + (Math.random() * 8 - 4));
  const others = clamp(100 - incumbentVote - opponentVote, 0, 25);

  state.lastElection = {
    year: state.year,
    incumbentVote: Math.round(incumbentVote),
    opponentVote: Math.round(opponentVote),
    others: Math.round(others),
    opponent: opponent.name,
    secondRound: incumbentVote < 50 && opponentVote < 50
  };

  if (incumbentVote >= 50 || incumbentVote > opponentVote + 3) {
    log(`Eleição vencida: ${Math.round(incumbentVote)}% contra ${opponent.name}. Mandato renovado.`, "positive");
    applyEffects(state, { prestige: 8, politicalCapital: 20, approval: 4, campaign: -28, rejection: -4 });
    state.electionDays = 1460;
    return true;
  }

  if (state.lastElection.secondRound) {
    const secondRound = clamp(incumbentVote + state.coalition * 0.08 + state.media * 0.05 - state.rejection * 0.12 + (Math.random() * 12 - 6));
    state.lastElection.secondRoundVote = Math.round(secondRound);
    if (secondRound >= 50) {
      log(`Segundo turno vencido com ${Math.round(secondRound)}%. Vitória apertada.`, "positive");
      applyEffects(state, { prestige: 5, politicalCapital: 12, approval: 2, campaign: -25 });
      state.electionDays = 1460;
      return true;
    }
  }

  log(`Derrota eleitoral para ${opponent.name}. Governo sai enfraquecido.`, "negative");
  applyEffects(state, { prestige: -10, politicalCapital: -18, approval: -8, campaign: -20 });
  state.electionDays = 1460;
  return false;
}