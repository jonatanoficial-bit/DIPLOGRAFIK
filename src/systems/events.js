import { EVENT_POOL } from "../data/content.js";
import { applyEffects } from "./calculations.js";

export function pickEvent(state) {
  const pool = [...EVENT_POOL];
  if (state.inflation > 9) pool.push({ id:"price_crisis", title:"Crise de preços", text:"Supermercados registram pressão popular por alimentos.", type:"negative", effects:{approval:-5, stability:-3, crisis:1} });
  if (state.coalition < 38) pool.push({ id:"cpi", title:"Ameaça de CPI", text:"A oposição encontra apoio para investigar o governo.", type:"negative", effects:{coalition:-3, approval:-2, crisis:1} });
  if (state.debt > 85) pool.push({ id:"debt_alarm", title:"Alerta de dívida", text:"Agências e mercado cobram ajuste fiscal.", type:"warning", effects:{marketConfidence:-5, economy:-2, approval:-2} });
  if (state.tradeBalance < 35) pool.push({ id:"trade_deficit", title:"Balança comercial deteriora", text:"Importações pressionam câmbio e inflação.", type:"negative", effects:{inflation:0.5, economy:-2, marketConfidence:-2} });
  if (state.crisis > 5) pool.push({ id:"national_crisis", title:"Crise nacional se agrava", text:"Governadores e Congresso cobram ação imediata.", type:"negative", effects:{approval:-4, stability:-5, politicalCapital:-6} });
  return pool[Math.floor(Math.random() * pool.length)];
}

export function processRandomEvent(state, log) {
  const event = pickEvent(state);
  applyEffects(state, event.effects);
  log(`${event.title}: ${event.text}`, event.type);
}