const BUILD={version:'0.8.7',stamp:'20260514_1544',label:'v0.9.3 | build 2026-05-14 18:44'};
const A='assets/';
const bg=n=>`${A}backgrounds/background_${String(n).padStart(2,'0')}.png`;
const av=n=>`${A}avatars/avatar_${String(n).padStart(2,'0')}.png`;
const ui=n=>`${A}ui/ui_${String(n).padStart(2,'0')}.png`;
const app=document.querySelector('#app');
const saveKey='medsim-vale-save-v080';
const fresh=()=>({screen:'setup',drawer:false,sound:true,selectedSpec:'clinica-medica',currentCase:0,score:null,timeline:[],prontuario:{history:[],exams:[],procedures:[],hypotheses:[],conduct:[],notes:[]},vitalTrend:[],actions:{questions:[],exams:[],procedures:[],hypotheses:[],conduct:[]},player:{name:'Dr. Rafael Santos',short:'Dr. Rafael',avatar:1,level:1,xp:0,credits:2450,reputation:'Boa',patients:0,correct:88,highScoreCases:0,learnedModules:0,title:'Interno',rank:1248,streak:0},simulation:{minutes:720,criticality:0},encounter:null,popup:null,unlocks:{specialties:['clinica-medica']},missions:{claimed:[]},completed:[]});
function deepMerge(base, extra){
  if(!extra || typeof extra !== 'object') return base;
  Object.keys(extra).forEach(k=>{
    if(extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], extra[k]);
    else base[k]=extra[k];
  });
  return base;
}
function safeLoad(){
  try{
    const raw=localStorage.getItem(saveKey);
    if(!raw) return fresh();
    const parsed=JSON.parse(raw);
    return deepMerge(fresh(), parsed);
  }catch(err){
    try{localStorage.setItem(saveKey+'-backup-corrompido-'+Date.now(), localStorage.getItem(saveKey)||'');}catch(e){}
    return fresh();
  }
}
let state=safeLoad();
function normalizeState(){
  const base=fresh();
  state=deepMerge(base, state||{});
  const validScreens=['setup','menu','hub','specialty','shift','post','learning','settings'];
  if(!validScreens.includes(state.screen)) state.screen='hub';
  state.actions=deepMerge({questions:[],exams:[],procedures:[],hypotheses:[],conduct:[]}, state.actions||{});
  state.prontuario=deepMerge({history:[],exams:[],procedures:[],hypotheses:[],conduct:[],notes:[]}, state.prontuario||{});
  state.missions=deepMerge({claimed:[]}, state.missions||{});
  state.player=deepMerge(base.player, state.player||{});
  state.currentCase=Number.isFinite(Number(state.currentCase))?Number(state.currentCase):0;
  state.simulation=deepMerge({minutes:720,criticality:0}, state.simulation||{});
}
const save=()=>{try{normalizeState();localStorage.setItem(saveKey,JSON.stringify(state));}catch(err){console.warn('Save protegido: falha ignorada',err)}};
function showRecoveryScreen(err){
  try{
    const msg=(err && (err.message||String(err))) || 'Erro desconhecido';
    app.innerHTML=`<main class="screen fade recovery-screen" style="--bg:url('${bg(8)}')"><section class="setup panel pop"><h1>Modo segurança ativo</h1><p>O jogo evitou uma quebra e preservou seu progresso local.</p><p><small>${esc(msg)}</small></p><button class="btn primary" onclick="safeRecoverHub()">Voltar ao lobby</button><button class="btn" onclick="safeExportSave()">Exportar save</button><button class="btn danger" onclick="safeFreshStart()">Resetar apenas se necessário</button></section><div class="build">${BUILD.label} • anti-quebra</div></main>`;
  }catch(e){document.body.innerHTML='<h1>Medical Simulator</h1><p>Modo segurança.</p><button onclick=\"location.reload()\">Recarregar</button>'}
}
window.safeRecoverHub=()=>{state=deepMerge(fresh(),state||{});state.screen='hub';state.popup=null;save();render()};
window.safeFreshStart=()=>{try{localStorage.setItem(saveKey+'-backup-before-reset-'+Date.now(),JSON.stringify(state||{}));localStorage.removeItem(saveKey);}catch(e){} location.reload()};
window.safeExportSave=()=>{try{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='medical-simulator-save-'+BUILD.stamp+'.json';a.click();URL.revokeObjectURL(a.href);}catch(e){alert('Não foi possível exportar agora.')}};
window.addEventListener('error',e=>{console.error('Erro capturado pelo anti-quebra',e.error||e.message);showRecoveryScreen(e.error||e.message)});
window.addEventListener('unhandledrejection',e=>{console.error('Promessa capturada pelo anti-quebra',e.reason);showRecoveryScreen(e.reason)});
let audioCtx=null;
function sound(type='tap'){if(!state.sound)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);const map={tap:[520,.025],ok:[760,.055],warn:[210,.09],nav:[390,.04],level:[880,.14]};const [f,d]=map[type]||map.tap;o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.045,audioCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+d);o.start();o.stop(audioCtx.currentTime+d+.01)}catch(e){}}
function toast(t,type='ok'){sound(type);let e=document.createElement('div');e.className='toast pop';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2100)}
function go(s){sound('nav');state.screen=s;state.drawer=false;save();render()}
const exams=['Hemograma completo','Eletrocardiograma (ECG)','Raio-X de tórax','Glicemia de jejum','Perfil lipídico','Troponina','Ureia e Creatinina','TSH','Urina tipo 1','Urocultura','Endoscopia digestiva alta','Teste terapêutico IBP','Dermatoscopia'];
const procedures=['Aferir sinais vitais','Exame físico geral','Ausculta cardíaca','Ausculta pulmonar','Palpação abdominal','Avaliação neurológica','Solicitar acesso venoso','Orientação terapêutica'];
const hypotheses=['Hipertensão Arterial Estágio 1','Angina estável','Ansiedade','Refluxo gastroesofágico','Cefaleia tensional','ITU não complicada','Dermatite atópica'];
const conducts=['orientar estilo de vida','monitorar pressão','retorno ambulatorial','analgesia simples','higiene do sono','ECG seriado','estratificação de risco','antibioticoterapia guiada','hidratação','encaminhar cardiologia','inibidor de bomba de prótons','evitar gatilhos alimentares','hidratação da pele','corticoide tópico leve'];
const patients=['Carlos Eduardo','Maria Aparecida','João Victor','Fernanda Lima','Luís Fernando','Ana Clara','Marcos Vinícius','Patrícia Gomes','Gabriel Alves','Beatriz Souza','Rafael Moreira','Juliana Costa','Thiago Martins','Ricardo Andrade','Vanessa Oliveira','Mateus Lima','Camila Ferreira','Daniel Rios','Isabela Nunes','André Souza'];
const cases=[
{id:'hipertensao-1',specialty:'clinica-medica',patient:'Marcos Vinícius',age:34,sex:'Masculino',profession:'Analista de Sistemas',complaint:'cefaleia frequente, cansaço e aperto no peito às vezes',vitals:[['PA','128/82','mmHg'],['FC','88','bpm'],['FR','18','irpm'],['TEMP.','36,7','°C'],['SpO₂','98','%']],correctQuestions:['tempo dos sintomas','histórico familiar','dor em esforço'],correctExams:['Eletrocardiograma (ECG)','Perfil lipídico','Glicemia de jejum'],correctProcedures:['Aferir sinais vitais','Exame físico geral','Ausculta cardíaca'],diagnosis:'Hipertensão Arterial Estágio 1',idealConduct:['orientar estilo de vida','monitorar pressão','retorno ambulatorial'],xp:160},
{id:'cefaleia-tensional',specialty:'clinica-medica',patient:'Patrícia Gomes',age:29,sex:'Feminino',profession:'Professora',complaint:'dor de cabeça em aperto no fim do dia, sem febre e sem vômitos',vitals:[['PA','118/76','mmHg'],['FC','78','bpm'],['FR','16','irpm'],['TEMP.','36,5','°C'],['SpO₂','99','%']],correctQuestions:['tempo dos sintomas','estresse e sono','sinais de alarme'],correctExams:['Hemograma completo'],correctProcedures:['Aferir sinais vitais','Exame físico geral','Avaliação neurológica'],diagnosis:'Cefaleia tensional',idealConduct:['analgesia simples','higiene do sono'],xp:130},
{id:'angina-estavel',specialty:'cardiologia',patient:'Ricardo Andrade',age:56,sex:'Masculino',profession:'Motorista',complaint:'aperto no peito aos esforços que melhora ao repousar',vitals:[['PA','142/88','mmHg'],['FC','92','bpm'],['FR','19','irpm'],['TEMP.','36,6','°C'],['SpO₂','97','%']],correctQuestions:['dor em esforço','irradiação da dor','fatores de risco'],correctExams:['Eletrocardiograma (ECG)','Troponina','Perfil lipídico'],correctProcedures:['Aferir sinais vitais','Ausculta cardíaca','Solicitar acesso venoso'],diagnosis:'Angina estável',idealConduct:['ECG seriado','estratificação de risco','encaminhar cardiologia'],xp:190},
{id:'itu-nao-complicada',specialty:'clinica-medica',patient:'Vanessa Oliveira',age:38,sex:'Feminino',profession:'Gerente',complaint:'ardência para urinar, aumento da frequência urinária e desconforto baixo ventre',vitals:[['PA','116/74','mmHg'],['FC','84','bpm'],['FR','17','irpm'],['TEMP.','37,2','°C'],['SpO₂','99','%']],correctQuestions:['dor lombar','febre recente','gestação'],correctExams:['Urina tipo 1','Urocultura'],correctProcedures:['Aferir sinais vitais','Palpação abdominal'],diagnosis:'ITU não complicada',idealConduct:['antibioticoterapia guiada','hidratação'],xp:145},
{id:'refluxo-gastroesofagico',specialty:'clinica-medica',patient:'Carlos Eduardo',age:42,sex:'Masculino',profession:'Comerciante',complaint:'queimação retroesternal após refeições, gosto amargo na boca e piora ao deitar',vitals:[['PA','122/80','mmHg'],['FC','82','bpm'],['FR','17','irpm'],['TEMP.','36,6','°C'],['SpO₂','98','%']],correctQuestions:['tempo dos sintomas','gatilhos alimentares','sinais de alarme'],correctExams:['Teste terapêutico IBP','Endoscopia digestiva alta'],correctProcedures:['Aferir sinais vitais','Exame físico geral','Palpação abdominal'],diagnosis:'Refluxo gastroesofágico',idealConduct:['inibidor de bomba de prótons','evitar gatilhos alimentares','retorno ambulatorial'],xp:150},
{id:'dermatite-atopica',specialty:'dermatologia',patient:'Ana Clara',age:21,sex:'Feminino',profession:'Estudante',complaint:'coceira recorrente com placas avermelhadas em dobras dos braços e pescoço',vitals:[['PA','110/72','mmHg'],['FC','76','bpm'],['FR','16','irpm'],['TEMP.','36,4','°C'],['SpO₂','99','%']],correctQuestions:['tempo dos sintomas','alergias e gatilhos','uso de produtos na pele'],correctExams:['Dermatoscopia','Hemograma completo'],correctProcedures:['Exame físico geral','Avaliação dermatológica','Orientação terapêutica'],diagnosis:'Dermatite atópica',idealConduct:['hidratação da pele','corticoide tópico leve','retorno ambulatorial'],xp:140}
];
const specs=[['clinica-medica','Clínica Médica','Avalie, diagnostique e trate condições clínicas diversas.','⚕',14,bg(9),1],['urgencia','Urgência e Emergência','Atenda casos críticos e tome decisões que salvam vidas.','✚',15,bg(8),2],['cardiologia','Cardiologia','Avalie e trate doenças do coração e sistema circulatório.','❤️',12,bg(4),3],['pediatria','Pediatria','Cuide da saúde das crianças e adolescentes.','👶',9,bg(11),4],['dermatologia','Dermatologia','Diagnostique e trate condições da pele, cabelos e unhas.','🧴',10,bg(5),5],['urologia','Urologia','Cuide da saúde do sistema urinário e reprodutor.','🩺',8,bg(6),6],['ginecologia','Ginecologia','Acompanhe a saúde da mulher em todas as fases.','♀',10,bg(7),6],['ambulatorio','Ambulatório','Atendimento geral e acompanhamento de rotina.','🏥',9,bg(10),1],['outras','Outras Especialidades','Acesso futuro a novas áreas e especialidades.','+',0,bg(3),99]];
const missionBank=[{id:'daily-3-patients',type:'Diária',title:'Atender 3 pacientes',metric:'patients',goal:3,rewardXp:120,rewardCredits:80},{id:'daily-accuracy',type:'Diária',title:'Fechar 2 casos com score acima de 80',metric:'highScoreCases',goal:2,rewardXp:160,rewardCredits:100},{id:'weekly-study',type:'Semanal',title:'Concluir 3 módulos de aprendizagem',metric:'learnedModules',goal:3,rewardXp:300,rewardCredits:200},{id:'career-streak-3',type:'Carreira',title:'Manter sequência de 3 bons atendimentos',metric:'streak',goal:3,rewardXp:260,rewardCredits:180},{id:'retention-6-patients',type:'Carreira',title:'Atender 6 pacientes na carreira',metric:'patients',goal:6,rewardXp:280,rewardCredits:210},{id:'safe-streak-5',type:'Especial',title:'Sequência segura de 5 bons atendimentos',metric:'streak',goal:5,rewardXp:420,rewardCredits:300}];
function xpNeed(l){return 500+(l-1)*420}function syncProgress(){let p=state.player,lvl=1,spent=p.xp;while(spent>=xpNeed(lvl)&&lvl<20){spent-=xpNeed(lvl);lvl++}p.level=lvl;p.title=p.xp>=4200?'Especialista Vale':p.xp>=2600?'Médico Clínico':p.xp>=1400?'Residente R2':p.xp>=600?'Residente R1':'Interno';state.unlocks=state.unlocks||{specialties:['clinica-medica']};[['urgencia',2],['cardiologia',3],['pediatria',4]].forEach(x=>{if(p.level>=x[1]&&!state.unlocks.specialties.includes(x[0]))state.unlocks.specialties.push(x[0])});p.rank=Math.max(1,1248-Math.floor(p.xp/8)-(p.highScoreCases||0)*12);return{spent,next:xpNeed(lvl),pct:Math.min(100,Math.round(spent/xpNeed(lvl)*100))}}
function rep(sc){return sc>=90?'Excelente':sc>=78?'Boa':sc>=62?'Instável':'Em observação'}
function activeCase(){return cases[state.currentCase%cases.length]}function selected(type,val){return state.actions[type].includes(val)}
function addTime(kind){const cost={questions:3,exams:9,procedures:5,hypotheses:2,conduct:4}[kind]||2;state.simulation.minutes=Math.max(0,state.simulation.minutes-cost);if(kind==='exams'&&state.actions.exams.length>3)state.simulation.criticality+=2}
function toggleAction(type,val){let arr=state.actions[type];if(arr.includes(val)){state.actions[type]=arr.filter(x=>x!==val);state.encounter={kind:'Ação removida',title:'Registro atualizado',text:val+' foi removido do raciocínio ativo.',detail:'Ação removida pelo jogador.',time:minToClock()};toast('Ação removida','tap')}else{arr.push(val);addTime(type);state.encounter=clinicalResponse(type,val);if(type==='exams')state.popup=state.encounter;recordClinical(type,val,state.encounter);state.timeline.push({t:minToClock(),text:state.encounter.title+': '+val});toast(type==='exams'?'Resultado de exame liberado':'Resposta clínica registrada','ok')}save();render();setTimeout(focusClinicalPanel,80)}
function minToClock(){let m=720-state.simulation.minutes;let h=8+Math.floor(m/60),mi=m%60;return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`}
const examResultBank={
'hipertensao-1':{'Eletrocardiograma (ECG)':'ECG: ritmo sinusal, sem supra de ST, sinais discretos de sobrecarga ventricular esquerda. Resultado compatível com investigação cardiovascular inicial, sem emergência no momento.','Perfil lipídico':'Perfil lipídico: LDL 154 mg/dL, HDL 39 mg/dL, triglicerídeos 186 mg/dL. Risco cardiovascular aumentado.','Glicemia de jejum':'Glicemia de jejum: 103 mg/dL. Limítrofe, sugere orientar estilo de vida e acompanhar.','Hemograma completo':'Hemograma: sem anemia, leucócitos normais, plaquetas normais. Não explica diretamente a queixa.'},
'cefaleia-tensional':{'Hemograma completo':'Hemograma completo: dentro da normalidade. Sem sinais laboratoriais de infecção ou anemia.','Eletrocardiograma (ECG)':'ECG: ritmo sinusal, sem alterações isquêmicas. Baixa contribuição para a queixa atual.','TSH':'TSH: 2,1 mUI/L. Função tireoidiana preservada.'},
'angina-estavel':{'Eletrocardiograma (ECG)':'ECG: alterações inespecíficas de repolarização em parede lateral. Não há supra de ST. Requer correlação com clínica.','Troponina':'Troponina: negativa na primeira dosagem. Não exclui completamente risco; considerar seriado conforme protocolo.','Perfil lipídico':'Perfil lipídico: LDL 172 mg/dL, HDL 34 mg/dL. Perfil de alto risco cardiovascular.','Raio-X de tórax':'Raio-X: sem congestão pulmonar ou alargamento mediastinal. Exame pouco decisivo para o caso.'},
'itu-nao-complicada':{'Urina tipo 1':'Urina tipo 1: leucócitos aumentados, nitrito positivo e bacteriúria. Resultado favorece ITU baixa.','Urocultura':'Urocultura: coleta indicada; resultado definitivo ficaria disponível posteriormente. Ajuda a guiar antibiótico se falha terapêutica.','Hemograma completo':'Hemograma: leucócitos discretamente elevados. Achado inespecífico, mas compatível com processo infeccioso leve.'},
'refluxo-gastroesofagico':{'Teste terapêutico IBP':'Teste terapêutico com IBP: indicado quando não há sinais de alarme. Resposta clínica esperada ajuda a confirmar DRGE.','Endoscopia digestiva alta':'Endoscopia: indicada se houver sinais de alarme, idade de risco ou refratariedade. No caso atual não é primeiro passo obrigatório.','Hemograma completo':'Hemograma: sem anemia. Reduz preocupação imediata com sangramento digestivo.'},
'dermatite-atopica':{'Dermatoscopia':'Dermatoscopia: padrão inflamatório inespecífico, sem sinais suspeitos de lesão maligna. Achado compatível com dermatite.','Hemograma completo':'Hemograma: sem eosinofilia importante. Não muda conduta inicial.'}
};
const questionResultBank={
'hipertensao-1':{'tempo dos sintomas':'Paciente relata sintomas há cerca de 3 meses, piores em semanas de maior estresse e sedentarismo.','histórico familiar':'Pai hipertenso e avô com infarto antes dos 60 anos. Há risco cardiovascular familiar relevante.','dor em esforço':'Aperto no peito aparece em esforço moderado e melhora com repouso, sem síncope.','estresse e sono':'Sono irregular e rotina sedentária; relata muito café e pouca atividade física.'},
'cefaleia-tensional':{'tempo dos sintomas':'Dor recorrente há 6 semanas, em aperto bilateral, principalmente no fim do dia.','estresse e sono':'Relata estresse profissional, sono de baixa qualidade e tensão cervical.','sinais de alarme':'Nega febre, rigidez de nuca, déficit neurológico, pior cefaleia da vida ou vômitos em jato.'},
'angina-estavel':{'dor em esforço':'Dor surge ao subir escadas ou caminhar rápido e melhora em poucos minutos com repouso.','irradiação da dor':'Às vezes irradia para braço esquerdo e mandíbula, associada a suor frio leve.','fatores de risco':'Tabagista prévio, dislipidemia, pai com infarto e sedentarismo importante.'},
'itu-nao-complicada':{'dor lombar':'Nega dor lombar intensa. Refere apenas desconforto suprapúbico.','febre recente':'Nega febre alta ou calafrios, reduzindo suspeita de pielonefrite.','gestação':'Nega gestação atual. Última menstruação regular.'},
'refluxo-gastroesofagico':{'tempo dos sintomas':'Sintomas há 4 meses, principalmente após refeições volumosas e à noite.','gatilhos alimentares':'Piora com café, frituras, refrigerante e quando deita logo após comer.','sinais de alarme':'Nega perda de peso, disfagia progressiva, vômitos persistentes ou sangramento digestivo.'},
'dermatite-atopica':{'tempo dos sintomas':'Crises desde a adolescência, com piora em clima seco e períodos de estresse.','alergias e gatilhos':'Relata rinite alérgica e piora com sabonetes perfumados.','uso de produtos na pele':'Usa hidratante de forma irregular e já aplicou pomadas sem orientação.'}
};
const procedureResultBank={'Aferir sinais vitais':'Sinais vitais conferidos e registrados no painel. Sem instabilidade imediata, mas devem ser interpretados junto da queixa.','Exame físico geral':'Paciente em bom estado geral, consciente, orientado, corado, hidratado e sem sinais de sofrimento agudo.','Ausculta cardíaca':'Ausculta cardíaca: bulhas rítmicas, normofonéticas, sem sopros evidentes nesta avaliação inicial.','Ausculta pulmonar':'Ausculta pulmonar: murmúrio vesicular presente bilateralmente, sem ruídos adventícios.','Palpação abdominal':'Abdome flácido. Dor leve em hipogástrio quando aplicável, sem sinais de irritação peritoneal.','Avaliação neurológica':'Exame neurológico sumário sem déficits focais. Pupilas isocóricas e força preservada.','Solicitar acesso venoso':'Acesso venoso periférico solicitado e preparado. Ação útil em cenário de maior risco ou necessidade de medicação EV.','Orientação terapêutica':'Paciente recebeu orientação inicial clara, com checagem de compreensão e sinais de alarme para retorno.'};
function esc(v){return String(v||'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]||m))}
function defaultEncounter(){const c=activeCase();return {kind:'Queixa inicial',title:'Relato espontâneo do paciente',text:'Doutor(a), estou sentindo '+c.complaint+'.',detail:'Use perguntas, exames e procedimentos para transformar a queixa em raciocínio clínico.',time:minToClock()}}
function clinicalResponse(type,val){const c=activeCase();let text='',title='',detail='';if(type==='questions'){title='Resposta da anamnese';text=(questionResultBank[c.id]&&questionResultBank[c.id][val])||'Paciente responde, mas a informação não muda muito a hipótese principal neste momento.';detail='Pergunta feita: '+val}if(type==='exams'){title='Resultado de exame';text=(examResultBank[c.id]&&examResultBank[c.id][val])||val+': resultado sem alterações relevantes para a queixa atual. Pode representar exame de baixa utilidade neste caso.';detail='Exame solicitado: '+val}if(type==='procedures'){title='Achado do procedimento';text=procedureResultBank[val]||'Procedimento realizado sem intercorrências. Achado inespecífico.';detail='Procedimento: '+val}if(type==='hypotheses'){title='Hipótese diagnóstica registrada';text=val===c.diagnosis?'Hipótese forte: combina bem com queixa, sinais e achados obtidos até agora.':'Hipótese registrada, mas ainda exige evidências melhores para sustentar essa linha diagnóstica.';detail='Hipótese: '+val}if(type==='conduct'){title='Conduta registrada';text=c.idealConduct.includes(val)?'Conduta coerente com o caso. Ela contribui positivamente para segurança, seguimento e desfecho do paciente.':'Conduta anotada, porém pode não ser a prioridade ideal para este quadro. Revise a lógica clínica antes de finalizar.';detail='Conduta: '+val}return {kind:type,title,text,detail,time:minToClock()}}
function typeWriter(){const el=document.querySelector('#typewriter');if(!el)return;const txt=el.dataset.text||'';el.textContent='';let i=0;const step=()=>{el.textContent=txt.slice(0,i++);if(i<=txt.length)setTimeout(step,12)};step()}
function closePopup(){state.popup=null;save();render()}window.closePopup=closePopup;

function ensureClinicalState(){
  state.prontuario=state.prontuario||{history:[],exams:[],procedures:[],hypotheses:[],conduct:[],notes:[]};
  state.vitalTrend=state.vitalTrend||[];
}
function recordClinical(type,val,response){
  ensureClinicalState();
  const item={time:minToClock(),label:val,result:response.text,detail:response.detail||'',caseId:activeCase().id};
  const map={questions:'history',exams:'exams',procedures:'procedures',hypotheses:'hypotheses',conduct:'conduct'};
  const bucket=map[type]||'notes';
  state.prontuario[bucket].push(item);
  updateVitals(type,val);
}
function updateVitals(type,val){
  ensureClinicalState();
  const c=activeCase();
  const base={pa:c.vitals[0][1],fc:parseInt(c.vitals[1][1])||80,fr:parseInt(c.vitals[2][1])||16,temp:c.vitals[3][1],spo2:parseInt(c.vitals[4][1])||98,status:'Estável'};
  let step=state.vitalTrend.length;
  let stress=Math.max(0,state.simulation.criticality||0)+Math.max(0,state.actions.exams.length-3)*2;
  const next={time:minToClock(),pa:base.pa,fc:Math.min(150,base.fc+step*2+stress),fr:Math.min(32,base.fr+Math.floor(stress/3)),temp:base.temp,spo2:Math.max(86,base.spo2-Math.floor(stress/4)),status:stress>=12?'Crítico':stress>=7?'Atenção':'Estável'};
  if(type==='conduct' && activeCase().idealConduct.includes(val)){next.fc=Math.max(base.fc,next.fc-5);next.spo2=Math.min(99,next.spo2+1);next.status='Melhora clínica'}
  state.vitalTrend.push(next);
}
function prontuarioPanel(){
  ensureClinicalState();
  const c=activeCase();
  const sec=(title,arr,empty)=>`<div class="chart-section"><h4>${title}</h4>${arr.slice(-4).map(x=>`<p><b>${x.time}</b> ${esc(x.label)}<br><small>${esc(x.result)}</small></p>`).join('')||`<small>${empty}</small>`}</div>`;
  return `<div class="record-grid"><div class="record-head"><h3>Prontuário do paciente</h3><small>${esc(c.patient)} • ${c.age} anos • ${esc(c.sex)}</small></div><div class="record-summary"><b>Queixa principal</b><p>${esc(c.complaint)}</p></div>${sec('Anamnese',state.prontuario.history,'Sem perguntas registradas.')}${sec('Exames',state.prontuario.exams,'Sem exames solicitados.')}${sec('Procedimentos',state.prontuario.procedures,'Sem procedimentos registrados.')}${sec('Hipóteses',state.prontuario.hypotheses,'Sem hipótese ativa.')}${vitalChart()}</div>`;
}
function vitalChart(){
  ensureClinicalState();
  const data=state.vitalTrend.slice(-6);
  if(!data.length)return `<div class="chart-section"><h4>Evolução de sinais vitais</h4><small>Ainda sem evolução registrada. Faça perguntas, exames ou procedimentos.</small></div>`;
  const maxFc=Math.max(...data.map(x=>x.fc),100);
  return `<div class="chart-section vital-chart"><h4>Evolução de sinais vitais</h4>${data.map(x=>`<div class="vital-row"><span>${x.time}</span><i style="width:${Math.round((x.fc/maxFc)*100)}%"></i><b>FC ${x.fc}</b><em>SpO₂ ${x.spo2}% • ${x.status}</em></div>`).join('')}</div>`;
}
function resetEncounterData(){state.actions={questions:[],exams:[],procedures:[],hypotheses:[],conduct:[]};state.timeline=[];state.encounter=null;state.popup=null;state.prontuario={history:[],exams:[],procedures:[],hypotheses:[],conduct:[],notes:[]};state.vitalTrend=[];}

function clinicalPanel(){const e=state.encounter||defaultEncounter();return '<div class="clinical-board '+(e.kind==='exams'?'exam-mode':'')+'"><div class="board-head"><small>'+esc(e.kind)+'</small><b>'+esc(e.title)+'</b><time>'+esc(e.time||minToClock())+'</time></div><p id="typewriter" data-text="'+esc(e.text)+'"></p><div class="board-detail">'+esc(e.detail||'')+'</div></div>'}
function popupHtml(){if(!state.popup)return '';const p=state.popup;return '<div class="modal-back"><div class="result-modal pop"><button class="modal-x" onclick="closePopup()">×</button><small>'+esc(p.kind)+'</small><h2>'+esc(p.title)+'</h2><p>'+esc(p.text)+'</p><em>'+esc(p.detail)+'</em><button class="btn primary" onclick="closePopup()">Entendi</button></div></div>'}
function count(a,b){return a.filter(x=>b.includes(x)).length}function calcScore(){const c=activeCase();let q=count(state.actions.questions,c.correctQuestions),e=count(state.actions.exams,c.correctExams),pr=count(state.actions.procedures,c.correctProcedures),co=count(state.actions.conduct,c.idealConduct);let diag=state.actions.hypotheses.includes(c.diagnosis)?25:0;let excess=Math.max(0,state.actions.exams.length-c.correctExams.length)*6;let missingConduct=Math.max(0,c.idealConduct.length-co)*4;return Math.max(15,Math.min(100,Math.round(q*6+e*7+pr*5+co*6+diag+10-excess-missingConduct-state.simulation.criticality)))}
function finishCaseCore(){const c=activeCase(),sc=calcScore();state.score=sc;state.completed.push({id:c.id,score:sc,at:BUILD.label});state.player.xp+=Math.round(c.xp*(sc/100));state.player.credits+=sc>=80?110:60;state.player.patients++;if(sc>=80)state.player.highScoreCases++;state.player.streak=sc>=75?state.player.streak+1:0;state.player.correct=Math.round((state.player.correct+sc)/2);state.player.reputation=rep(sc);state.currentCase=(state.currentCase+1)%cases.length;syncProgress();save();go('post')}
function missionProgress(m){return Math.min(m.goal,state.player[m.metric]||0)}function canClaim(m){return missionProgress(m)>=m.goal&&!state.missions.claimed.includes(m.id)}function claimMission(id){let m=missionBank.find(x=>x.id===id);if(!m||!canClaim(m))return toast('Missão ainda não concluída','warn');state.missions.claimed.push(id);state.player.xp+=m.rewardXp;state.player.credits+=m.rewardCredits;syncProgress();save();toast('Recompensa coletada!','level');render()}
function logo(){return `<div class="brand"><div class="pulse-line"></div><div class="logo"><span>Simulador de</span><b>Medicina</b></div><small>VALE EDITION • MODO SIMULADOR</small></div>`}
function profile(){let p=state.player,pr=syncProgress();return `<div class="profile panel"><img src="${av(p.avatar)}"><div><strong>${p.name}</strong><em>${p.title} • Nível ${p.level}</em><div class="xp"><i style="width:${pr.pct}%"></i></div><small>${pr.spent} / ${pr.next} XP • Rep. ${p.reputation}</small></div></div>`}
function top(section){return `<header class="topbar">${logo()}<div class="top-actions"><button class="hamb" onclick="toggleDrawer()">☰</button><button class="fullscreen-btn" onclick="requestGameFullscreen()" title="Tela cheia">⛶</button></div><h2>${section}</h2>${profile()}</header>`}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function shell(section,body,bgNum=8){return `<main class="screen fade screen-${slug(section)}" style="--bg:url('${bg(bgNum)}')">${top(section)}${body}<div class="build">${BUILD.label}</div></main>`}
function sidebar(active){let items=[['hub','🏠','Lobby','Visão geral'],['learning','📖','Aprendizagem','Procedimentos'],['specialty','🩺','Plantão','Especialidades'],['settings','⚙️','Configurações','Sistema']];return `<aside class="side panel ${state.drawer?'open':''}">${items.map(x=>`<button onclick="go('${x[0]}')" class="nav ${active==x[0]?'active':''}"><span>${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small></button>`).join('')}</aside><div class="shade ${state.drawer?'show':''}" onclick="toggleDrawer()"></div>`}
function setup(){app.innerHTML=`<main class="screen fade" style="--bg:url('${bg(1)}')">${logo()}<img class="hero-doc" src="${av(state.player.avatar)}"><section class="setup panel pop"><h3>🫀 NOVO GAME</h3><h2>1. Escolha seu avatar</h2><div class="avatar-row">${[1,2,3,4,5].map(i=>`<button class="avatar-choice ${state.player.avatar==i?'active':''}" onclick="pickAvatar(${i})"><img src="${av(i)}"></button>`).join('')}</div><h2>2. Nome do personagem</h2><input class="input" id="name" value="${state.player.name}"><h2>3. País de origem</h2><select class="input"><option>🇧🇷 Brasil</option></select><button class="btn primary" onclick="startGame()">🫀 Continuar</button></section><div class="build">${BUILD.label}</div></main>`}
function menu(){app.innerHTML=`<main class="screen fade" style="--bg:url('${bg(2)}')">${logo()}<section class="welcome slide"><h1>Bem-vindo,<br><span>${state.player.short}</span></h1><p>O conhecimento é a sua maior ferramenta. Cada decisão pode mudar uma vida.</p></section><section class="mode-grid"><article class="mode card" style="--cardbg:url('${bg(3)}')"><h2>Modo Carreira</h2><p>Progressão real, reputação, missões e desbloqueios.</p><button class="btn primary" onclick="go('hub')">Entrar</button></article><article class="mode card" style="--cardbg:url('${bg(7)}')"><h2>Modo Simulador</h2><p>Casos mais rigorosos, tempo clínico e penalidade por excesso de exames.</p><button class="btn" onclick="go('specialty')">Praticar</button></article></section><div class="build">${BUILD.label}</div></main>`}
function hub(){let p=state.player,pr=syncProgress();app.innerHTML=shell('LOBBY DO RESIDENTE',`<div class="layout">${sidebar('hub')}<section class="maincol"><div class="hero-card card" style="--cardbg:url('${bg(8)}')"><h1>Bem-vindo, ${p.short}</h1><p>v0.8.7: retenção refinada, novas missões de carreira, anti-quebra preservado e visual base intacto.</p><div class="level medallion">${p.level}</div><div class="stats"><div>🏆<b>${p.xp}</b><small>XP total</small></div><div>🌐<b>#${p.rank}</b><small>Ranking local</small></div><div>👥<b>${p.patients}</b><small>Pacientes</small></div><div>🎯<b>${p.correct}%</b><small>Acerto</small></div></div></div><div class="two"><div class="card"><h3>Progresso da carreira</h3><p>${p.title} • Reputação ${p.reputation}</p><div class="xp big"><i style="width:${pr.pct}%"></i></div><p>${pr.spent} / ${pr.next} XP • Desbloqueadas: ${state.unlocks.specialties.join(', ')}</p><button class="btn primary" onclick="go('specialty')">Iniciar plantão</button></div><div class="card"><h3>Últimos casos</h3>${state.completed.slice(-4).reverse().map(x=>`<p>✅ ${x.id} <b>${x.score}/100</b></p>`).join('')||'<p>Nenhum caso concluído nesta build.</p>'}</div></div></section><aside class="rightcol"><div class="card"><h3>Missões e recompensas</h3>${missionBank.map(m=>`<div class='mission'><b>${m.type}</b><span>${m.title}</span><small>${missionProgress(m)} / ${m.goal}</small><button class='btn mini' onclick="claimMission('${m.id}')" ${canClaim(m)?'':'disabled'}>Coletar</button></div>`).join('')}</div><div class="card"><h3>Economia</h3><h2>${p.credits} créditos</h2><p>Base pronta para loja futura, cosméticos e packs.</p></div></aside></div>`,8)}
function specialty(){app.innerHTML=shell('PLANTÃO — ESPECIALIDADE',`<div class="layout">${sidebar('specialty')}<section class="maincol"><h1>Escolha sua especialidade</h1><p class="muted">Modo simulador: especialidades desbloqueiam por nível.</p><div class="specialties">${specs.map(s=>{let locked=state.player.level<s[6];return `<article class="spec card ${locked?'locked':''}" onclick="${locked?`toast('Desbloqueia no nível ${s[6]}','warn')`:`state.selectedSpec='${s[0]}';go('shift')`}"><img src="${s[5]}"><span>${s[3]}</span><h2>${s[1]}</h2><p>${s[2]}</p><b>${locked?'Bloqueada • nível '+s[6]:'Disponível'}</b></article>`}).join('')}</div></section><aside class="rightcol"><div class="card"><h3>Regras simulador</h3><p>Exame desnecessário, conduta incompleta e demora reduzem seu score.</p></div><button class="btn primary" onclick="go('shift')">Iniciar plantão</button></aside></div>`,4)}
function shift(){const c=activeCase();const q=['tempo dos sintomas','histórico familiar','dor em esforço','estresse e sono','sinais de alarme','irradiação da dor','fatores de risco','dor lombar','febre recente','gestação','gatilhos alimentares','alergias e gatilhos','uso de produtos na pele'];app.innerHTML=shell('PLANTÃO - MODO SIMULADOR',`<div class="shift"><aside class="patient-list panel"><h3>Fila de atendimento</h3><b>${patients.length} Pacientes</b>${patients.map((p,i)=>`<div class="patient ${p==c.patient?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><div><b>${p}</b><small>${p==c.patient?'Em atendimento':'Aguardando'}</small></div><time>${['08:15','09:10','09:45','10:20','11:05','11:40','12:22'][i]||'18:'+String(i*5).padStart(2,'0')}</time></div>`).join('')}<button class="btn" onclick="finishCaseCore()">Finalizar consulta</button></aside><section class="case panel"><h2><em>Em atendimento</em>${c.patient}</h2><p>${c.age} anos | ${c.sex}<br>Profissão: ${c.profession}</p>${clinicalPanel()}${prontuarioPanel()}<img class="patient-art" src="${ui((state.currentCase%3)+1)}"><div class="card vitals"><h3>Sinais vitais</h3>${c.vitals.map(v=>`<div><small>${v[0]}</small><b>${v[1]}</b><small>${v[2]}</small></div>`).join('')}</div><div class="card"><h3>Anamnese dirigida</h3>${q.map(x=>`<button class="listbtn ${selected('questions',x)?'selected':''}" onclick="toggleAction('questions','${x}')">💬 ${x}</button>`).join('')}<input class="input" placeholder="Escreva sua própria pergunta..."></div></section><aside class="rightpanel"><div class="card"><h3>Exames</h3>${exams.map(x=>`<button class="listbtn ${selected('exams',x)?'selected':''}" onclick="toggleAction('exams','${x}')">🧪 ${x}</button>`).join('')}</div><div class="card"><h3>Procedimentos</h3>${procedures.map(x=>`<button class="listbtn ${selected('procedures',x)?'selected':''}" onclick="toggleAction('procedures','${x}')">⚕ ${x}</button>`).join('')}</div><div class="card"><h3>Hipóteses e conduta</h3>${hypotheses.map(x=>`<button class="listbtn ${selected('hypotheses',x)?'selected':''}" onclick="toggleAction('hypotheses','${x}')">${x}</button>`).join('')}<hr>${conducts.map(x=>`<button class="listbtn ${selected('conduct',x)?'selected':''}" onclick="toggleAction('conduct','${x}')">📋 ${x}</button>`).join('')}<button class="btn primary" onclick="finishCaseCore()">Confirmar diagnóstico</button></div></aside></div>${popupHtml()}<div class="hud"><b>Hora clínica ${minToClock()}</b><b>Atendidos ${state.player.patients}</b><b>Criticidade ${state.simulation.criticality}</b><b>Score previsto ${calcScore()}/100</b><button class="btn primary" onclick="toast('Plantão pausado')">Pausar</button></div>`,5)}
function post(){let last=state.completed[state.completed.length-1]||{score:state.score||88,id:'hipertensao-1'},c=cases.find(x=>x.id==last.id)||cases[0],sc=last.score;app.innerHTML=shell('PÓS-CONSULTA',`<section class="post"><div class="card"><h3>Consulta concluída</h3><img class="portrait" src="${ui(2)}"><h2>${c.patient}</h2><p>${c.complaint}</p><div class="success">Diagnóstico final: ${c.diagnosis}</div><p>Reputação atual: <b>${state.player.reputation}</b><br>Sequência: <b>${state.player.streak}</b></p></div><div class="card score"><h2>Sua pontuação</h2><div class="ring">${sc}<small>/100</small></div><h1>${sc>=85?'Muito Bom!':sc>=70?'Bom desempenho':'Revise a conduta'}</h1><p>Score combina anamnese, exames, procedimentos, hipótese, conduta, tempo e excesso de ações.</p><div class="stats"><div>🧠<b>${Math.min(98,sc+2)}%</b><small>Raciocínio</small></div><div>🧪<b>${Math.max(50,sc-3)}%</b><small>Exames</small></div><div>📋<b>${Math.max(55,sc)}%</b><small>Conduta</small></div></div></div><aside class="card"><h3>Linha do tempo</h3>${state.timeline.slice(-8).map(x=>`<p>🕒 ${x.t} — ${x.text}</p>`).join('')||'<p>Consulta registrada.</p>'}<h3>XP e recompensas</h3><p>⭐ +${Math.round(c.xp*(sc/100))} XP<br>💰 +${sc>=80?110:60} Créditos</p><button class="btn primary" onclick="resetEncounterData();go('shift')">Próximo paciente</button><button class="btn" onclick="go('hub')">Voltar ao lobby</button></aside></section>`,7)}
function learning(){app.innerHTML=shell('APRENDIZAGEM MÉDICA',`<div class="layout">${sidebar('learning')}<section class="maincol"><h1>Aprendizagem integrada</h1><div class='card'><h3>v0.8.7 retenção segura</h3><p>Completar módulos melhora missões, XP, domínio clínico e ajuda a manter sequência de bons atendimentos.</p></div><div class="procedure card"><img src="${ui(3)}"><div><h2>Cateterismo venoso periférico <small>Básico</small></h2><p>Procedimento para acesso venoso periférico para medicamentos, hidratação ou coleta de exames.</p><p>✅ Indicação • ✅ Materiais • ✅ Técnica segura • ✅ Complicações</p><button class="btn primary" onclick="state.player.learnedModules++;state.player.xp+=60;syncProgress();save();toast('Módulo concluído +60 XP');render()">Marcar como concluído</button></div></div><div class="card"><h3>Todos os procedimentos</h3>${['Coleta de sangue venoso ✅ 100%','Intubação orotraqueal 🟡 60%','Eletrocardiograma (ECG) ✅ 100%','Sutura simples ⚪ 0%','Ultrassonografia POCUS 🟡 20%'].map(x=>`<p>${x}</p>`).join('')}</div></section><aside class="rightcol"><div class="card"><h3>Seu progresso</h3><div class="ring small">${state.player.learnedModules}</div><p>Módulos concluídos</p></div></aside></div>`,9)}
function settings(){app.innerHTML=shell('CONFIGURAÇÕES',`<div class="layout">${sidebar('settings')}<section class="settings-grid"><div class="card"><h2>Geral</h2><p>Idioma: Português (Brasil)<br>Dificuldade: Simulador<br>Salvar automaticamente: Ativo<br>Build: ${BUILD.label}</p><h2>Acessibilidade</h2><p>Legendas: Ativo<br>Alto contraste: Inativo<br>Tamanho do texto: Médio</p></div><div class="card"><h2>Áudio e sistema</h2><label class="toggle"><input type="checkbox" ${state.sound?'checked':''} onchange="state.sound=this.checked;save();toast('Áudio atualizado')"> Sistema de sons</label><p>Micro animações: Ativas<br>Transições: Ativas<br>LocalStorage: ${saveKey}</p><button class="btn primary" onclick="toast('Configurações salvas')">Salvar</button><button class="btn danger" onclick="localStorage.removeItem(saveKey);location.reload()">Resetar progresso local</button></div></section></div>`,10)}

function focusClinicalPanel(){
  try{
    if(!matchMedia('(max-width: 980px)').matches)return;
    const board=document.querySelector('.clinical-board');
    if(board){board.classList.add('focus-pulse');board.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>board.classList.remove('focus-pulse'),900)}
  }catch(e){}
}
window.pickAvatar=i=>{sound('tap');state.player.avatar=i;save();setup()};window.startGame=()=>{state.player.name=document.querySelector('#name').value||'Dr. Rafael Santos';state.player.short=state.player.name.split(' ').slice(0,2).join(' ');go('menu')};
function requestGameFullscreen(){
  const root=document.documentElement;
  try{
    if(!document.fullscreenElement && root.requestFullscreen){root.requestFullscreen({navigationUI:'hide'}).catch(()=>{});} 
  }catch(e){}
  document.body.classList.add('mobile-fullscreen-active');
  toast('Modo tela cheia ativado','ok');
}
let fullscreenArmed=true;
document.addEventListener('click',()=>{
  if(!fullscreenArmed) return;
  fullscreenArmed=false;
  if(matchMedia('(max-width: 980px)').matches){requestGameFullscreen();}
},{once:true});

window.go=go;window.requestGameFullscreen=requestGameFullscreen;window.state=state;window.toggleDrawer=()=>{state.drawer=!state.drawer;render()};window.toggleAction=toggleAction;window.finishCaseCore=finishCaseCore;window.claimMission=claimMission;window.resetEncounterData=resetEncounterData;function render(){try{normalizeState();syncProgress();const screens={setup,menu,hub,specialty,shift,post,learning,settings};(screens[state.screen]||hub)();setTimeout(typeWriter,30)}catch(err){console.error('Render protegido',err);showRecoveryScreen(err)}}render();


/* v0.8.8 stability polish safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  window.addEventListener('error', function(ev){
    try{ console.warn('[ValeSafeGuard]', ev.message); document.body.classList.add('safe-runtime'); }catch(e){}
  });
  window.addEventListener('unhandledrejection', function(ev){
    try{ console.warn('[ValeSafeGuard Promise]', ev.reason); document.body.classList.add('safe-runtime'); }catch(e){}
  });
  document.addEventListener('click', function(ev){
    const btn = ev.target.closest('button, .listbtn, [data-action]');
    if(!btn) return;
    btn.classList.add('tap-confirm');
    setTimeout(function(){btn.classList.remove('tap-confirm')}, 260);
    const board = document.querySelector('.clinical-board,.response,.clinical-response,#clinicalBoard,#responsePanel');
    if(board && window.innerWidth < 780){
      setTimeout(function(){ board.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 80);
    }
  }, true);
  function ensureBuildBadge(){
    if(document.querySelector('.build')) return;
    const b=document.createElement('div');
    b.className='build';
    b.textContent='v0.9.3 | build 2026-05-14 18:44';
    document.body.appendChild(b);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureBuildBadge);
  else ensureBuildBadge();
})();


/* v0.8.9 release readiness safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  function preloadBackgrounds(){
    try {
      var paths = [
        'assets/backgrounds/background_01.png',
        'assets/backgrounds/background_02.png',
        'assets/backgrounds/background_03.png',
        'assets/backgrounds/background_08.png'
      ];
      paths.forEach(function(src){
        var img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = src;
      });
    } catch(e) {}
  }
  function addReleaseBadge(){
    if(document.querySelector('.release-ready-badge')) return;
    var badge = document.createElement('div');
    badge.className = 'release-ready-badge';
    badge.textContent = 'Release readiness ativo';
    document.body.appendChild(badge);
    setTimeout(function(){ if(badge && badge.parentNode) badge.parentNode.removeChild(badge); }, 2200);
  }
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ preloadBackgrounds(); addReleaseBadge(); });
  } else {
    preloadBackgrounds(); addReleaseBadge();
  }
})();


/* v0.9.0 release candidate safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  window.ValeReleaseCandidate = {
    version: '0.9.0',
    build: 'v0.9.3 | build 2026-05-14 18:44',
    safeMode: true,
    exportSave: function(){
      try {
        var payload = {};
        for (var i=0;i<localStorage.length;i++) {
          var k = localStorage.key(i);
          if (k && /medical|msve|vale/i.test(k)) payload[k] = localStorage.getItem(k);
        }
        var blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'medical-simulator-save-backup-v0.9.0.json';
        a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href)}, 800);
      } catch(e) { console.warn('[ValeSaveExport]', e); }
    }
  };
  function addRCButton(){
    if(document.querySelector('.rc-safe-tools')) return;
    var box = document.createElement('div');
    box.className = 'rc-safe-tools';
    box.innerHTML = '<button type="button" title="Exportar backup do save">Backup Save</button>';
    box.querySelector('button').addEventListener('click', function(ev){
      ev.preventDefault();
      window.ValeReleaseCandidate.exportSave();
    });
    document.body.appendChild(box);
  }
  function verifyCriticalAssets(){
    try {
      ['assets/backgrounds/background_08.png','src/styles.css'].forEach(function(src){
        var img = new Image();
        img.onerror = function(){ document.body.classList.add('asset-fallback-mode'); };
        if(src.match(/\.png$/)) img.src = src;
      });
    } catch(e) {}
  }
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ addRCButton(); verifyCriticalAssets(); });
  } else {
    addRCButton(); verifyCriticalAssets();
  }
})();


/* v0.9.1 diagnostics safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  var LOG_KEY = 'medical_simulator_diagnostics_v091';
  function readLog(){
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch(e) { return []; }
  }
  function writeLog(log){ try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-120))); } catch(e) {} }
  function addLog(type, detail){
    try {
      var log = readLog();
      log.push({type:type, detail:String(detail||''), at:new Date().toISOString(), build:'v0.9.3 | build 2026-05-14 18:44', width:innerWidth, height:innerHeight});
      writeLog(log);
    } catch(e) {}
  }
  window.ValeDiagnostics = {
    log:addLog,
    export:function(){
      try {
        var payload = {build:'v0.9.3 | build 2026-05-14 18:44', diagnostics:readLog()};
        var blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'medical-simulator-diagnostics-v0.9.1.json';
        a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href)},800);
      } catch(e) { console.warn('[ValeDiagnosticsExport]', e); }
    }
  };
  window.addEventListener('error', function(ev){ addLog('error', ev.message || 'runtime error'); });
  window.addEventListener('unhandledrejection', function(ev){ addLog('promise', ev.reason || 'unhandled promise'); });
  window.addEventListener('load', function(){ addLog('load','game loaded'); });
  document.addEventListener('click', function(ev){
    var t = ev.target && ev.target.closest ? ev.target.closest('button,.listbtn,[data-action]') : null;
    if(t) addLog('click', (t.textContent || t.getAttribute('aria-label') || 'action').trim().slice(0,80));
  }, true);
  function addPanel(){
    if(document.querySelector('.diagnostics-safe-tools')) return;
    var box = document.createElement('div');
    box.className = 'diagnostics-safe-tools';
    box.innerHTML = '<button type="button">Diagnóstico</button>';
    box.querySelector('button').addEventListener('click', function(ev){ ev.preventDefault(); window.ValeDiagnostics.export(); });
    document.body.appendChild(box);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPanel);
  else addPanel();
})();


/* v0.9.2 prefinal ui safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  function setTechVisible(visible){
    try {
      document.body.classList.toggle('show-tech-tools', !!visible);
      sessionStorage.setItem('vale_show_tech_tools', visible ? '1' : '0');
    } catch(e) {}
  }
  function getTechVisible(){
    try { return sessionStorage.getItem('vale_show_tech_tools') === '1'; } catch(e) { return false; }
  }
  function applyTechState(){
    document.body.classList.toggle('show-tech-tools', getTechVisible());
  }
  var pressTimer = null;
  document.addEventListener('keydown', function(ev){
    if((ev.ctrlKey || ev.metaKey) && ev.shiftKey && String(ev.key).toLowerCase() === 'd'){
      setTechVisible(!document.body.classList.contains('show-tech-tools'));
    }
  });
  document.addEventListener('pointerdown', function(ev){
    var build = ev.target.closest && ev.target.closest('.build');
    if(!build) return;
    pressTimer = setTimeout(function(){ setTechVisible(!document.body.classList.contains('show-tech-tools')); }, 900);
  }, true);
  document.addEventListener('pointerup', function(){ if(pressTimer) clearTimeout(pressTimer); pressTimer=null; }, true);
  document.addEventListener('pointercancel', function(){ if(pressTimer) clearTimeout(pressTimer); pressTimer=null; }, true);
  function addHint(){
    if(document.querySelector('.prefinal-safe-note')) return;
    var note = document.createElement('div');
    note.className = 'prefinal-safe-note';
    note.textContent = 'Pré-final seguro';
    document.body.appendChild(note);
    setTimeout(function(){ if(note && note.parentNode) note.parentNode.removeChild(note); }, 1800);
  }
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ applyTechState(); addHint(); });
  } else {
    applyTechState(); addHint();
  }
})();


/* v0.9.3 final test polish safe patch */
(function(){
  window.VALE_BUILD_LABEL = 'v0.9.3 | build 2026-05-14 18:44';
  var checklist = [
    'Lobby com fundo visível',
    'Atendimento abre sem tela branca',
    'Perguntas exibem resposta clara',
    'Exames mostram resultado claro',
    'Procedimentos registram achado',
    'Prontuário persiste no caso',
    'Mobile não exige sobe/desce excessivo',
    'Fullscreen/PWA não quebra layout'
  ];
  function toggleChecklist(){
    var old = document.querySelector('.final-test-panel');
    if(old) { old.remove(); return; }
    var done = {};
    try { done = JSON.parse(localStorage.getItem('vale_final_test_checklist_v093') || '{}'); } catch(e) {}
    var panel = document.createElement('section');
    panel.className = 'final-test-panel';
    panel.innerHTML = '<div class="final-test-head"><b>Checklist final v0.9.3</b><button type="button" data-close>×</button></div>' +
      checklist.map(function(item, i){
        var checked = done[item] ? 'checked' : '';
        return '<label><input type="checkbox" data-item="'+ item.replace(/"/g,'&quot;') +'" '+checked+'> <span>'+item+'</span></label>';
      }).join('') +
      '<small>Esse painel é só para teste. Não altera o jogo.</small>';
    panel.addEventListener('change', function(ev){
      var input = ev.target;
      if(input && input.matches('input[type="checkbox"]')) {
        done[input.getAttribute('data-item')] = input.checked;
        try { localStorage.setItem('vale_final_test_checklist_v093', JSON.stringify(done)); } catch(e) {}
      }
    });
    panel.querySelector('[data-close]').addEventListener('click', function(){ panel.remove(); });
    document.body.appendChild(panel);
  }
  document.addEventListener('keydown', function(ev){
    if((ev.ctrlKey || ev.metaKey) && ev.shiftKey && String(ev.key).toLowerCase() === 't') toggleChecklist();
  });
  document.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('.build');
    if(!b) return;
    if(ev.detail >= 2) toggleChecklist();
  }, true);
  function applySafeViewport(){
    try {
      document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    } catch(e) {}
  }
  window.addEventListener('resize', applySafeViewport);
  window.addEventListener('orientationchange', function(){ setTimeout(applySafeViewport, 250); });
  applySafeViewport();
})();
