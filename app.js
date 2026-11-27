import content from './data.js';
const {labels, facts, quiz, foodExamples} = content;
const photos=['oats','table','fish','variety','greens','berries','oats','dairy','protein','fish','protein','avocado','water','water'];
const ratings=['Самочувствие','Энергия','Тяжесть в желудке','Сытость','Лёгкость после еды','Соблюдение режима'];
const meals=['Завтрак','Первый перекус','Обед','Второй перекус','Ужин'];
const defaults={times:['08:00','10:30','13:00','16:00','19:00'],enabled:[true,true,true,true,true],theme:'system',reminder:''};
const routes=[['home','⌂','Главная'],['diary','▤','Дневник'],['stats','▥','Статистика'],['knowledge','◫','Знания'],['settings','☷','Настройки']];
const navIcons=[`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5,10.7 L12,3.8 20.5,10.7 M5.5,9.2 V19 Q5.5,20.5 7,20.5 H10 V14.5 H14 V20.5 H17 Q18.5,20.5 18.5,19 V9.2"/></svg>`, `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7,4 H18 Q19,4 19,5 V20 H7 Q5,20 5,18 V6 Q5,4 7,4 Z M5,17 H19 M9,8 H15 M9,11.5 H13"/></svg>`, `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5,19.5 H20 M7,16 V12 M12,16 V8.5 M17,16 V5"/></svg>`, `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12,6.8 Q8,3.5 3.5,4.7 V17.7 Q8,17 12,20 Q16,17 20.5,17.7 V4.7 Q16,3.5 12,6.8 V20 M6.5,9 L9,9.7 M15,9.7 L17.5,9 M6.5,13 L9,13.7 M15,13.7 L17.5,13"/></svg>`, `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4,7 H8 M12,7 H20 M4,12 H13 M17,12 H20 M4,17 H6 M10,17 H20 M12,7 A2,2 0,1 1,8,7 A2,2 0,1 1,12,7 M17,12 A2,2 0,1 1,13,12 A2,2 0,1 1,17,12 M10,17 A2,2 0,1 1,6,17 A2,2 0,1 1,10,17"/></svg>`];
const choices=[0,1,5,4,12,-1];
const factors=choices.map(i=>i<0?'Режим питания':labels[i]);
const dateFmt=new Intl.DateTimeFormat('ru',{day:'numeric',month:'long',weekday:'short'});
const dayFmt=new Intl.DateTimeFormat('ru',{day:'numeric',month:'long'});
const averageFmt=new Intl.NumberFormat('ru',{minimumFractionDigits:1,maximumFractionDigits:1});
const $=s=>document.querySelector(s);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
let records=read('biopitanie.records',{}), settings={...defaults,...read('biopitanie.settings',{})};
let selected=key(new Date()), period=7, factor=0, session=null, toastTimer, shownReminder='';
const drafts=new Map();
function key(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function dateFrom(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12);}
function lastDays(){return Array.from({length:period},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return key(d);});}
function page(){const hash=location.hash.slice(1);return routes.some(([route])=>route===hash)?hash:'home';}
function go(route){if(page()===route)render();else location.hash=route;}
function notify(message){$('#toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',4500);}
function write(name,value){try{localStorage.setItem('biopitanie.'+name,JSON.stringify(value));return true;}catch{notify('Браузер не смог сохранить данные.');return false;}}
function card(body,photo='',classes=''){return `<section class="card ${photo?'photo':''} ${classes}" ${photo?`style="--photo:url(./assets/photo_${photo}.webp)"`:''}>${body}</section>`;}
function action(text,id,kind=''){return `<button class="button ${kind}" data-action="${id}" type="button">${text}</button>`;}
function draft(){if(!drafts.has(selected)){const prior=records[selected];drafts.set(selected,{foods:{...prior?.foods},scores:{...prior?.scores}});}return drafts.get(selected);}
function home() {
 const today = key(new Date());
 const count = Object.keys(records[today]?.foods ?? {}).length;
 const meal = '<h2>Режим питания</h2><p id="meal"></p><p id="countdown"></p>';
 const diaryCard = '<h2>Твой дневник всегда под рукой</h2>' +
   '<p>Отмечай привычные действия без подсчёта калорий и оценок. Смотри, что удалось записать за неделю.</p>' +
   '<div class="actions">'+action('Посмотреть статистику','stats')+'</div>';
 const biology = '<h2>Факт о биологии</h2>' +
   '<p>Тонкая кишка имеет ворсинки, увеличивающие площадь всасывания питательных веществ.</p>' +
   '<div class="actions">'+action('Открыть знания','knowledge')+'</div>';
 return '<h1 class="home-title">BioPitanie</h1><div class="stack home-stack">' +
   card(`<h2>Мои наблюдения сегодня</h2><p><time datetime="${today}">${today}</time> · отметок: ${count}</p><div class="actions">${action('Добавить наблюдение','today')}</div>`,'apple') +
   card(meal,'table') + card(diaryCard,'variety') + card(biology,'protein') + '</div>';
}
function diary(){
 const day=draft();
 return `<h1>Дневник</h1><div class="stack">${card(`<label class="field">Дата <input type="date" id="entry-date" value="${selected}" aria-label="Дата записи"></label>`,'variety')}</div><div class="grid">`+
 labels.map((label,i)=>card(`<h3 id="food-${i}">${label}</h3><div class="choices" role="group" aria-labelledby="food-${i}"><button data-food="${i}" data-value="yes" aria-pressed="${day.foods[i]===true}">Да</button><button data-food="${i}" data-value="no" aria-pressed="${day.foods[i]===false}">Нет</button></div>`,photos[i])).join('')+
 `</div><h2 style="margin:20px 0 10px">Самочувствие</h2><div class="grid">`+ratings.map((label,i)=>card(`<div class="range"><label class="range-label" for="score-${i}"><strong>${label}</strong><output id="value-${i}">${day.scores[i]??'—'}</output></label><input id="score-${i}" type="range" min="1" max="5" step="1" value="${day.scores[i]??3}" data-score="${i}" aria-valuetext="${day.scores[i]??'Без оценки'}"><div class="range-label muted"><span>1</span><span>5</span></div>${action('Сбросить оценку','clear-'+i,'secondary')}</div>`,['berries','oats','water','table','mint','variety'][i])).join('')+
 `</div><div class="actions">${action('Сохранить наблюдение','save')}${action('Удалить наблюдение за день','delete','danger')}</div>`;
}
function bar(label,value,max,caption){
 return `<div class="chart"><div><span>${label}</span><strong>${caption}</strong></div><div class="track" aria-hidden="true"><i style="width:${100*value/max}%"></i></div></div>`;
}
const scores=(days,i)=>days.map(k=>records[k]?.scores?.[i]).filter(value=>Number.isInteger(value)&&value>=1&&value<=5);
function mean(label,values){const avg=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;return bar(label,avg,5,values.length?`${averageFmt.format(avg)}/5 · ${values.length} дн.`:'—');}
function stats(){
 const days=lastDays(), recorded=days.filter(k=>records[k]);const selectedFood=choices[factor];
 const group=high=>days.filter(k=>{const r=records[k];if(selectedFood>=0)return r?.foods?.[selectedFood]===high;const score=r?.scores?.[5];return Number.isInteger(score)&&score>=1&&score<=5&&(score>=4)===high;});
 const yes=group(true), no=group(false);
 const groupNames=selectedFood<0?['Режим 4–5','Режим 1–3']:['Да','Нет'];
 return `<h1>Статистика</h1><div class="stack">`+
 card(`<div class="settings-row"><h2>Итоги за ${period} дней</h2><label>Период <select id="period"><option value="7" ${period===7?'selected':''}>7 дней</option><option value="30" ${period===30?'selected':''}>30 дней</option></select></label></div>`+bar('Заполнено',recorded.length,period,`${recorded.length}/${period} дн.`)+mean('Средняя энергия',scores(days,1))+mean('Среднее самочувствие',scores(days,0)),'berries')+
 card(`<label class="field">Сравнение по дневнику<select id="factor">${factors.map((name,i)=>`<option value="${i}" ${factor===i?'selected':''}>${name}</option>`).join('')}</select></label><h3 style="margin-top:12px">Энергия</h3>`+mean(groupNames[0],scores(yes,1))+mean(groupNames[1],scores(no,1))+'<h3>Самочувствие</h3>'+mean(groupNames[0],scores(yes,0))+mean(groupNames[1],scores(no,0)),selectedFood<0?'variety':photos[selectedFood])+
 card(`<details><summary>Сводка по питанию</summary>${labels.map((label,i)=>{const all=days.map(k=>records[k]?.foods?.[i]);const yes=all.filter(v=>v===true).length;return bar(label,yes,period,all.some(v=>typeof v==='boolean')?`${yes}/${period} дн.`:'—');}).join('')}</details>`,'variety')+
 recorded.map(k=>{const r=records[k];const score=[0,1].filter(i=>r.scores[i]).map(i=>ratings[i]+' '+r.scores[i]+'/5').join(' · ');const details=labels.map((name,i)=>r.foods[i]===undefined?'':`<p>${name} · ${r.foods[i]?'Да':'Нет'}</p>`).join('')+ratings.slice(2).map((name,i)=>r.scores[i+2]?`<p>${name} · ${r.scores[i+2]}/5</p>`:'').join('');return card(`<h3>${dayFmt.format(dateFrom(k))}</h3><p>${score}</p>${details?`<details><summary>Подробнее</summary>${details}</details>`:''}`,['apple','berries','table','greens'][Math.floor(dateFrom(k).getTime()/86400000)%4]);}).join('')+'</div>';
}
function shuffle(values){for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;}
function knowledge(){
 if(session){
  if(session.index>=quiz.length)return '<h1>Результат</h1>'+card(`<h2>${session.score} из ${quiz.length}</h2><div class="actions">${action('Закончить','quiz-exit')}</div>`,'berries');
  const q=quiz[session.index];
  return `<h1>Проверь себя</h1>`+card(`<p class="muted">Вопрос ${session.index+1} из ${quiz.length}</p><h2>${q[0]}</h2><div class="quiz-options">${session.answer===null?session.options.map((option,i)=>action(option,'answer-'+i,'secondary')).join(''):`<p>${session.answer===q[1]?'Верно!':'Правильный ответ: '+q[1]}</p>${action('Далее','quiz-next')}`}</div><div class="actions">${action('Выйти из теста','quiz-exit','secondary')}</div>`,'berries');
 }
 return '<h1>Знания</h1><div class="stack">'+card(action('Проверь себя · 12 вопросов','quiz-start'),'berries')+'</div><div class="grid">'+facts.map(([name,text],i)=>card(`<h2>${name}</h2><p>${text}</p><p class="muted">${foodExamples[i]}</p>`,['protein','avocado','oats','greens','dairy','water','table','fish','apple','variety'][i])).join('')+card('<h2>Режим питания</h2><p>В настройках можно задать время приёмов пищи и следить за расписанием на главной.</p>','table')+'</div>';
}
function settingsPage(){
 return '<h1>Настройки</h1><div class="stack">'+card('<h2>Режим питания</h2>'+meals.map((name,i)=>`<div class="settings-row"><label>${name} <input aria-label="Время: ${name}" type="time" data-meal="${i}" value="${settings.times[i]}"></label>${i===1||i===3?`<label><input type="checkbox" data-meal-on="${i}" ${settings.enabled[i]?'checked':''}> Включён</label>`:''}</div>`).join(''),'table')+
 card(`<label class="field">Оформление<select id="theme">${[['system','Как на устройстве'],['light','Светлое'],['dark','Тёмное']].map(([id,label])=>`<option value="${id}" ${settings.theme===id?'selected':''}>${label}</option>`).join('')}</select></label>`,'mint')+
 card(`<h2>Напоминание о дневнике</h2><p class="muted">Показывается, пока веб-приложение открыто.</p><div class="settings-row"><label>Время <input type="time" id="reminder" value="${settings.reminder}"></label>${action('Выключить','reminder-off','secondary')}</div>`,'mint')+
 card(`<h2>Данные дневника</h2><p class="muted">Записи хранятся в этом браузере.</p><div class="actions">${action('Экспорт CSV','export')}${action('Очистить дневник','clear-all','danger')}</div>`,'variety')+'</div>';
}
function applyTheme(){document.documentElement.dataset.theme=settings.theme==='dark'||settings.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
function render(){
 const route=page();applyTheme();
 document.body.classList.toggle('is-home',route==='home');
 $('#nav').innerHTML=routes.map(([id,,label], index)=>`<a href="#${id}" ${id===route?'aria-current="page"':''}><i aria-hidden="true">${navIcons[index]}</i>${label}</a>`).join('');
 $('#view').innerHTML=({home,diary,stats,knowledge,settings:settingsPage})[route]();
 tick();
}
function tick(){
 const now=new Date();$('#header-date').textContent=dateFmt.format(now);
 if($('#meal')){
  const active=settings.times.map((value,i)=>{const [h,m]=value.split(':').map(Number);const next=new Date(now);next.setHours(h,m,0,0);if(next<=now)next.setDate(next.getDate()+1);return [next,i,value];}).filter(([,i])=>settings.enabled[i]).sort((a,b)=>a[0]-b[0])[0];
  if(active){const s=Math.ceil((active[0]-now)/1000);$('#meal').textContent=meals[active[1]]+' в '+active[2];$('#countdown').textContent='Через '+[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');}
 }
 const hm=[now.getHours(),now.getMinutes()].map(n=>String(n).padStart(2,'0')).join(':');
 if(settings.reminder===hm&&shownReminder!==key(now)){shownReminder=key(now);notify('Время заполнить дневник.');}
}
function saveSettings(patch){const next={...settings,...patch};if(write('settings',next)){settings=next;render();}}
function saveRecord(remove=false){
 const data=draft();const next={...records};
 if(remove||!Object.keys(data.foods).length&&!Object.keys(data.scores).length)delete next[selected];
 else next[selected]={foods:{...data.foods},scores:{...data.scores}};
 if(write('records',next)){records=next;if(remove)drafts.delete(selected);notify(remove?'Наблюдение удалено.':'Наблюдение сохранено.');if(remove)render();}
}
function exportCSV(){
 const rows=[['Дата','Наблюдение','Ответ']];
 for(const [date,r] of Object.entries(records).sort()){
  labels.forEach((label,i)=>{if(r.foods[i]!==undefined)rows.push([date,label,r.foods[i]?'Да':'Нет']);});
  ratings.forEach((label,i)=>{if(r.scores[i]!==undefined)rows.push([date,label,r.scores[i]]);});
 }
 const csv='\ufeff'+rows.map(row=>row.join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='BioPitanie.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('#view').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.food!==undefined){const i=button.dataset.food;const v=button.dataset.value==='yes';const food=draft().foods;if(food[i]===v)delete food[i];else food[i]=v;for(const b of button.parentElement.children)b.setAttribute('aria-pressed',String(food[i]===(b.dataset.value==='yes')));return;}
 const a=button.dataset.action;
 if(a==='today'){selected=key(new Date());go('diary');}
 else if(a==='stats'||a==='knowledge')go(a);
 else if(a==='save')saveRecord();
 else if(a==='delete'&&confirm('Удалить наблюдение за выбранный день?'))saveRecord(true);
 else if(a?.startsWith('clear-')&&a!=='clear-all'){const i=Number(a.slice(6));delete draft().scores[i];$('#score-'+i).value=3;$('#score-'+i).setAttribute('aria-valuetext','Без оценки');$('#value-'+i).textContent='—';}
 else if(a==='clear-all'&&confirm('Удалить все записи дневника в этом браузере?')){if(write('records',{})){records={};drafts.clear();notify('Дневник очищен.');}}
 else if(a==='export')exportCSV();
 else if(a==='reminder-off')saveSettings({reminder:''});
 else if(a==='quiz-start'){session={index:0,score:0,answer:null,options:shuffle(quiz[0].slice(1))};render();window.scrollTo(0,0);}
 else if(a==='quiz-exit'){session=null;render();}
 else if(a?.startsWith('answer-')){session.answer=session.options[Number(a.slice(7))];if(session.answer===quiz[session.index][1])session.score++;render();}
 else if(a==='quiz-next'){session.index++;session.answer=null;if(session.index<quiz.length)session.options=shuffle(quiz[session.index].slice(1));render();}
});
$('#view').addEventListener('input',event=>{
 const el=event.target;if(el.dataset.score===undefined)return;
 const i=el.dataset.score;draft().scores[i]=Number(el.value);$('#value-'+i).textContent=el.value;el.setAttribute('aria-valuetext',el.value);
});
$('#view').addEventListener('change',event=>{
 const el=event.target;
 if(el.id==='entry-date'&&/^\d{4}-\d{2}-\d{2}$/.test(el.value)){selected=el.value;render();}
 if(el.id==='period'){period=Number(el.value);render();}
 if(el.id==='factor'){factor=Number(el.value);render();}
 if(el.id==='theme')saveSettings({theme:el.value});
 if(el.id==='reminder')saveSettings({reminder:el.value});
 if(el.dataset.meal!==undefined&&el.value){const times=[...settings.times];times[Number(el.dataset.meal)]=el.value;saveSettings({times});}
 if(el.dataset.mealOn!==undefined){const enabled=[...settings.enabled];enabled[Number(el.dataset.mealOn)]=el.checked;saveSettings({enabled});}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
setInterval(tick,1000);render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
