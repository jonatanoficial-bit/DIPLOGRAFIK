import { REGIONS, SOCIAL_GROUPS, POPULATION_POLICIES } from "../data/populationData.js";
import { applyEffects, clamp } from "./calculations.js";

export const POPULATION_SCHEMA = 1;
const REGION_METRICS = ["satisfaction","income","employment","education","health","security","infrastructure","housing","environment"];
const DEMOGRAPHIC_LIMITS = Object.freeze({
  populationMillions:[1,500], populationGrowth:[-3,5], urbanization:[0,100], lifeExpectancy:[45,95], literacy:[0,100],
  poverty:[0,100], extremePoverty:[0,100], hunger:[0,100], sanitation:[0,100], housingDeficit:[0,40],
  birthRate:[0,40], migrationBalance:[-5,5], medianAge:[15,70]
});

export function createPopulationState() {
  return {
    schema: POPULATION_SCHEMA,
    demographics: {
      populationMillions:215.3, populationGrowth:0.52, urbanization:87.4, lifeExpectancy:76.2, literacy:94.7,
      poverty:27.4, extremePoverty:5.9, hunger:6.8, sanitation:75.1, housingDeficit:7.4,
      birthRate:12.3, migrationBalance:0.1, medianAge:35.2
    },
    regions:REGIONS.map(item=>structuredClone(item)), groups:SOCIAL_GROUPS.map(item=>structuredClone(item)),
    nationalSatisfaction:53.1, qualityOfLife:56.4, regionalInequality:26.5, serviceCoverage:57.7,
    activePrograms:[], completedPrograms:[], history:[], lastMonthlyCycle:null, lastWeeklyCycle:null
  };
}

export function ensurePopulationState(state) {
  const current=state.population && typeof state.population==="object" ? state.population : {};
  if (current.schema===POPULATION_SCHEMA && current.demographics && Array.isArray(current.regions) && current.regions.length===REGIONS.length && Array.isArray(current.groups) && current.groups.length===SOCIAL_GROUPS.length && Array.isArray(current.activePrograms) && Array.isArray(current.completedPrograms) && Array.isArray(current.history)) {
    return current;
  }
  const defaults=createPopulationState();
  current.schema=POPULATION_SCHEMA;
  current.demographics={...defaults.demographics,...(current.demographics||{})};
  current.regions=mergeById(defaults.regions,current.regions);
  current.groups=mergeById(defaults.groups,current.groups);
  current.activePrograms=Array.isArray(current.activePrograms)?current.activePrograms.slice(0,12):[];
  current.completedPrograms=Array.isArray(current.completedPrograms)?current.completedPrograms.slice(-24):[];
  current.history=Array.isArray(current.history)?current.history.slice(-36):[];
  normalizePopulation(current); recalculatePopulation(current); state.population=current; return current;
}

export function getPopulationPolicy(id) { return POPULATION_POLICIES.find(item=>item.id===id)||null; }

export function runPopulationPolicy(state,policy,log) {
  const population=ensurePopulationState(state); if(!policy) return false;
  const key=`population:${policy.id}`;
  if(Number(state.cooldowns?.[key]||0)>0){log?.("Programa populacional ainda está em período de avaliação.","warning");return false;}
  if(Number(state.treasury||0)<Number(policy.cost||0)){log?.("Tesouro insuficiente para o programa populacional.","negative");return false;}
  state.treasury-=Number(policy.cost||0); state.cooldowns=state.cooldowns||{}; state.cooldowns[key]=Number(policy.cooldown||45);
  const targets=weakestRegions(population,policy.targetMetric,policy.regionCount||2).map(region=>region.id);
  population.activePrograms.push({id:`${policy.id}:${Date.now()}:${population.activePrograms.length}`,policyId:policy.id,titleKey:policy.titleKey,daysLeft:Number(policy.duration||60),totalDays:Number(policy.duration||60),targets,regionalEffects:{...(policy.regionalEffects||{})},demographicEffects:{...(policy.demographicEffects||{})},stateEffects:{...(policy.stateEffects||{})}});
  population.activePrograms=population.activePrograms.slice(-12); applyEffects(state,immediatePolicyEffects(policy));
  log?.("Programa populacional iniciado nas regiões prioritárias.","positive"); return true;
}

export function processPopulationDay(state,log) {
  const population=ensurePopulationState(state); const completed=[];
  for(const program of population.activePrograms){program.daysLeft=Math.max(0,Number(program.daysLeft||0)-1);if(program.daysLeft<=0)completed.push(program);}
  if(!completed.length)return 0;
  population.activePrograms=population.activePrograms.filter(item=>!completed.includes(item));
  for(const program of completed)matureProgram(state,population,program,log); recalculatePopulation(population); return completed.length;
}

export function weeklyPopulationCycle(state,log) {
  const population=ensurePopulationState(state); const cycle=`${state.year}-W${state.governance?.weekNumber||1}`;
  if(population.lastWeeklyCycle===cycle)return population; population.lastWeeklyCycle=cycle;
  const economySignal=(Number(state.economy||50)-50)*0.025, approvalSignal=(Number(state.approval||50)-50)*0.012, securitySignal=(Number(state.security||50)-50)*0.018, socialBudget=(Number(state.budget?.social||25)-25)*0.02;
  for(const group of population.groups){const priorityEffect=groupPrioritySignal(group,state,population);group.satisfaction=clamp(group.satisfaction+economySignal+approvalSignal+priorityEffect+socialBudget*0.15,0,100);group.trust=clamp(group.trust+(Number(state.stability||50)-50)*0.008-Number(state.corruption||0)*0.004+securitySignal*0.15,0,100);group.incomeSecurity=clamp(group.incomeSecurity+economySignal*0.45-Math.max(0,Number(state.unemployment||0)-9)*0.025,0,100);}
  recalculatePopulation(population); if(population.nationalSatisfaction<36&&log)log("A satisfação social entrou em zona crítica. Priorize renda, serviços e segurança.","warning"); return population;
}

export function monthlyPopulationCycle(state,economicReport,log) {
  const population=ensurePopulationState(state); const cycle=`${state.year}-${String(state.month).padStart(2,"0")}`;
  if(population.lastMonthlyCycle===cycle)return population; population.lastMonthlyCycle=cycle;
  const d=population.demographics, healthInvestment=(Number(state.budget?.health||25)-25)/25, educationInvestment=(Number(state.budget?.education||25)-25)/25, securityInvestment=(Number(state.budget?.security||25)-25)/25, infrastructureInvestment=(Number(state.budget?.infrastructure||25)-25)/25, socialInvestment=(Number(state.budget?.social||25)-25)/25, economySignal=(Number(state.economy||50)-50)/50, unemploymentPressure=(Number(state.unemployment||9)-9)/10, before=population.nationalSatisfaction;
  for(const region of population.regions){const gap=1+Math.max(0,55-region.satisfaction)/100;region.health+=healthInvestment*0.34*gap+economySignal*0.05;region.education+=educationInvestment*0.30*gap;region.security+=securityInvestment*0.31*gap-Number(state.crisis||0)*0.035;region.infrastructure+=infrastructureInvestment*0.29*gap;region.housing+=infrastructureInvestment*0.12+socialInvestment*0.16;region.employment+=economySignal*0.22-unemploymentPressure*0.18;region.income+=economySignal*0.18+socialInvestment*0.08-unemploymentPressure*0.12;const services=average([region.health,region.education,region.security,region.infrastructure,region.housing]),localEconomy=average([region.income,region.employment]);region.satisfaction=clamp(region.satisfaction*0.72+services*0.16+localEconomy*0.08+Number(state.approval||50)*0.04,0,100);}
  d.populationMillions*=1+(Number(d.populationGrowth||0)/100)/12; d.lifeExpectancy+=healthInvestment*0.018+(average(population.regions.map(r=>r.health))-55)*0.0009; d.literacy+=educationInvestment*0.028+(average(population.regions.map(r=>r.education))-55)*0.0008; d.poverty+=unemploymentPressure*0.11-economySignal*0.08-socialInvestment*0.07; d.extremePoverty+=unemploymentPressure*0.035-socialInvestment*0.03; d.hunger+=unemploymentPressure*0.025-socialInvestment*0.024; d.sanitation+=infrastructureInvestment*0.045; d.housingDeficit+=unemploymentPressure*0.015-infrastructureInvestment*0.025-socialInvestment*0.018; d.migrationBalance+=(Number(state.economy||50)-50)*0.0006-Number(state.crisis||0)*0.002; d.medianAge+=0.006;
  normalizePopulation(population); recalculatePopulation(population); const delta=population.nationalSatisfaction-before, cohesionTarget=clamp(population.nationalSatisfaction-population.regionalInequality*0.18+8,0,100);
  if(state.governance)state.governance.socialCohesion=clamp(state.governance.socialCohesion*0.78+cohesionTarget*0.22,0,100);
  applyEffects(state,{approval:delta*0.20+(population.nationalSatisfaction-50)*0.008,stability:(cohesionTarget-50)*0.009,economy:(population.qualityOfLife-50)*0.003,inequality:(population.regionalInequality-25)*0.012+(d.poverty-25)*0.008});
  population.history.push({cycle,satisfaction:population.nationalSatisfaction,qualityOfLife:population.qualityOfLife,poverty:d.poverty,regionalInequality:population.regionalInequality}); population.history=population.history.slice(-36);
  if(log&&Math.abs(delta)>=1.2)log(delta>0?"Os indicadores sociais melhoraram neste mês.":"A avaliação da população recuou neste mês.",delta>0?"positive":"warning"); return population;
}

export function populationSummary(state){const population=ensurePopulationState(state);const weakest=[...population.regions].sort((a,b)=>a.satisfaction-b.satisfaction)[0];const criticalMetric=REGION_METRICS.filter(key=>key!=="satisfaction").sort((a,b)=>average(population.regions.map(r=>r[a]))-average(population.regions.map(r=>r[b])))[0];return{...population,weakestRegion:weakest,criticalMetric};}

function matureProgram(state,population,program,log){for(const regionId of program.targets||[]){const region=population.regions.find(item=>item.id===regionId);if(!region)continue;for(const [key,value] of Object.entries(program.regionalEffects||{}))region[key]=clamp(Number(region[key]||0)+Number(value||0),0,100);}for(const [key,value] of Object.entries(program.demographicEffects||{}))population.demographics[key]=Number(population.demographics[key]||0)+Number(value||0);applyEffects(state,program.stateEffects||{});population.completedPrograms.push({policyId:program.policyId,titleKey:program.titleKey,targets:[...(program.targets||[])],completedAt:{day:state.day,month:state.month,year:state.year}});population.completedPrograms=population.completedPrograms.slice(-24);log?.("Um programa populacional concluiu sua fase de implantação e começou a produzir resultados.","positive");}
function weakestRegions(population,metric,count){return[...population.regions].sort((a,b)=>Number(a[metric]||0)-Number(b[metric]||0)).slice(0,Math.max(1,Number(count||1)));}
function immediatePolicyEffects(policy){const result={politicalCapital:-Math.max(1,Math.round(Number(policy.actionPoints||1)*0.8))};if(policy.id==="popular_housing")result.approval=0.4;if(policy.id==="regional_jobs")result.marketConfidence=0.3;return result;}
function groupPrioritySignal(group,state,population){const d=population.demographics;let score=0;for(const priority of group.priorities||[]){if(priority==="jobs")score+=(50-Number(state.unemployment||9)*3)*0.002;else if(priority==="taxes")score+=(35-Number(state.taxBurden||33))*0.018;else if(priority==="security")score+=(Number(state.security||50)-50)*0.012;else if(priority==="health")score+=(average(population.regions.map(r=>r.health))-50)*0.010;else if(priority==="education")score+=(average(population.regions.map(r=>r.education))-50)*0.010;else if(priority==="housing")score+=(55-Number(d.housingDeficit||7)*4)*0.006;else if(priority==="food")score+=(10-Number(d.hunger||7))*0.025;else if(priority==="income")score+=(30-Number(d.poverty||27))*0.018;else if(priority==="stability")score+=(Number(state.stability||50)-50)*0.012;else if(priority==="market")score+=(Number(state.marketConfidence||50)-50)*0.010;else if(priority==="climate")score+=(Number(state.environment||50)-50)*0.010;}return score;}
function recalculatePopulation(population){population.nationalSatisfaction=weightedAverage(population.regions,"satisfaction","populationShare");population.serviceCoverage=average(population.regions.map(region=>average([region.health,region.education,region.security,region.infrastructure,region.housing])));population.qualityOfLife=clamp(population.serviceCoverage*0.52+weightedAverage(population.regions,"income","populationShare")*0.24+weightedAverage(population.regions,"employment","populationShare")*0.14+Number(population.demographics.sanitation||0)*0.10,0,100);const incomes=population.regions.map(r=>r.income);population.regionalInequality=clamp(Math.max(...incomes)-Math.min(...incomes)+Math.max(0,Number(population.demographics.poverty||0)-20)*0.35,0,100);}
function normalizePopulation(population){for(const region of population.regions)for(const key of REGION_METRICS)region[key]=clamp(Number(region[key]??50),0,100);for(const group of population.groups){group.satisfaction=clamp(Number(group.satisfaction??50),0,100);group.trust=clamp(Number(group.trust??50),0,100);group.incomeSecurity=clamp(Number(group.incomeSecurity??50),0,100);}for(const [key,[min,max]] of Object.entries(DEMOGRAPHIC_LIMITS))population.demographics[key]=clamp(Number(population.demographics[key]??min),min,max);}
function mergeById(defaults,current){const map=new Map((Array.isArray(current)?current:[]).filter(item=>item&&item.id).map(item=>[item.id,item]));return defaults.map(item=>({...structuredClone(item),...(map.get(item.id)||{})}));}
function weightedAverage(items,valueKey,weightKey){const total=items.reduce((sum,item)=>sum+Number(item[weightKey]||0),0)||1;return items.reduce((sum,item)=>sum+Number(item[valueKey]||0)*Number(item[weightKey]||0),0)/total;}
function average(values){const safe=values.map(Number).filter(Number.isFinite);return safe.length?safe.reduce((a,b)=>a+b,0)/safe.length:0;}
