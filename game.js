(function(){
'use strict';
function $(id){return document.getElementById(id);}

// ===================== REAL MARKET DATA (pasted board) =====================
var TEN=[
 {k:'1m',px:97.8125},{k:'6m',px:102.3125},{k:'9m',px:109.0625},{k:'1y',px:115.375},
 {k:'18m',px:128.375},{k:'2y',px:140.375},{k:'3y',px:159.875},{k:'4y',px:176},
 {k:'5y',px:190.375},{k:'6y',px:203.25},{k:'7y',px:215.25},{k:'8y',px:226.5},
 {k:'9y',px:237.25},{k:'10y',px:247.375},{k:'11y',px:256.625},{k:'12y',px:265.125},
 {k:'13y',px:272.895},{k:'14y',px:280.0638},{k:'15y',px:286.75},{k:'20y',px:312.625},
 {k:'25y',px:326},{k:'30y',px:331.625}
];
function fmt(x){if(x===''||x==null)return'';var n=+x;if(isNaN(n))return String(x);return (Math.round(n*10000)/10000).toString();}
function signed(x){return (+x>0?'+':'')+fmt(x);}

// ===================== VERIFIED ENGINE =====================
function contrib(l){var b=l.kind==='fwd'?[[l.t[0],1],[l.t[1],-1]]:[[l.t[0],1],[l.t[1],-2],[l.t[2],1]];var s=(l.side==='bid'?1:-1)*l.size,m={};b.forEach(function(p){m[p[0]]=(m[p[0]]||0)+p[1]*s;});return m;}
function netOf(legs){var n={};legs.forEach(function(l){var c=contrib(l);for(var k in c)n[k]=(n[k]||0)+c[k];});for(var k in n)if(n[k]===0)delete n[k];return n;}
function sameNet(a,b){var ks={};for(var k in a)ks[k]=1;for(var k2 in b)ks[k2]=1;for(var k3 in ks)if((a[k3]||0)!==(b[k3]||0))return false;return true;}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function pick(a){return a[ri(0,a.length-1)];}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=ri(0,i),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function legKey(l){return l.kind+':'+l.t.join(',')+':'+l.side;}
function mergeLegs(legs){var m={},o=[];legs.forEach(function(l){var k=legKey(l);if(!m[k]){m[k]={kind:l.kind,t:l.t.slice(),side:l.side,size:0};o.push(k);}m[k].size+=l.size;});return o.map(function(k){return m[k];}).filter(function(l){return l.size!==0;});}
function describe(net){
  var R=[],P=[];Object.keys(net).map(Number).sort(function(a,b){return a-b;}).forEach(function(t){var w=net[t];for(var i=0;i<Math.abs(w);i++)(w>0?R:P).push(t);});
  function cnt(a,t){var c=0;for(var i=0;i<a.length;i++)if(a[i]===t)c++;return c;} function rm(a,t){a.splice(a.indexOf(t),1);}
  var out=[],g=0;
  while(g++<200){var did=false;
    var pu=P.filter(function(v,i){return P.indexOf(v)===i;});
    for(var i=0;i<pu.length;i++){var b=pu[i];if(cnt(P,b)>=2){var bl=R.filter(function(x){return x<b;}),ab=R.filter(function(x){return x>b;});if(bl.length&&ab.length){var a=Math.max.apply(null,bl),c=Math.min.apply(null,ab);rm(R,a);rm(R,c);rm(P,b);rm(P,b);out.push({type:'fly',t:[a,b,c],side:'bid',size:1});did=true;break;}}}
    if(did)continue;
    var ru=R.filter(function(v,i){return R.indexOf(v)===i;});
    for(var j=0;j<ru.length;j++){var b2=ru[j];if(cnt(R,b2)>=2){var be=P.filter(function(x){return x<b2;}),av=P.filter(function(x){return x>b2;});if(be.length&&av.length){var a2=Math.max.apply(null,be),c2=Math.min.apply(null,av);rm(P,a2);rm(P,c2);rm(R,b2);rm(R,b2);out.push({type:'fly',t:[a2,b2,c2],side:'offer',size:1});did=true;break;}}}
    if(!did)break;
  }
  R.sort(function(a,b){return a-b;});P.sort(function(a,b){return a-b;});
  for(var k=0;k<Math.min(R.length,P.length);k++){var r=R[k],p=P[k];if(r<p)out.push({type:'spread',t:[r,p],side:'bid',size:1});else out.push({type:'spread',t:[p,r],side:'offer',size:1});}
  var m={},o=[];out.forEach(function(s){var key=s.type+':'+s.t.join(',')+':'+s.side;if(!m[key]){m[key]={type:s.type,t:s.t,side:s.side,size:0};o.push(key);}m[key].size+=s.size;});
  return o.map(function(k){return m[k];});
}
function structToLeg(s){return {kind:s.type==='fly'?'fly':'fwd',t:s.t.slice(),side:s.side,size:s.size||1};}
function dirSpread(x,y,sz){return x<y?{kind:'fwd',t:[x,y],side:'bid',size:sz}:{kind:'fwd',t:[y,x],side:'offer',size:sz};}
function decompose(S,pool){var k=S.size||1;
  if(S.type==='spread'){var d0,d1;if(S.side==='bid'){d0=S.t[0];d1=S.t[1];}else{d0=S.t[1];d1=S.t[0];}
    if(Math.random()<0.5)return[structToLeg(S)];
    var cand=pool.filter(function(p){return p!==d0&&p!==d1;});if(!cand.length)return[structToLeg(S)];
    var p=pick(cand);return[dirSpread(d0,p,k),dirSpread(p,d1,k)];}
  if(Math.random()<0.45)return[structToLeg(S)];
  var a=S.t[0],b=S.t[1],cv=S.t[2];
  if(S.side==='bid')return[dirSpread(a,b,k),dirSpread(cv,b,k)];
  return[dirSpread(b,a,k),dirSpread(b,cv,k)];
}
function splitOnce(legs,pool){var idx=[];legs.forEach(function(l,i){if(l.kind==='fwd')idx.push(i);});if(!idx.length)return false;
  var i=pick(idx),l=legs[i],d0,d1;if(l.side==='bid'){d0=l.t[0];d1=l.t[1];}else{d0=l.t[1];d1=l.t[0];}
  var cand=pool.filter(function(p){return p!==d0&&p!==d1;});if(!cand.length)return false;var p=pick(cand);
  legs.splice(i,1,dirSpread(d0,p,l.size),dirSpread(p,d1,l.size));return true;}
function noCancelPair(legs){for(var x=0;x<legs.length;x++)for(var y=x+1;y<legs.length;y++)if(legs[x].kind===legs[y].kind&&legs[x].t.join()===legs[y].t.join()&&legs[x].side!==legs[y].side&&legs[x].size===legs[y].size)return false;return true;}
function eachMatters(legs,net){for(var d=0;d<legs.length;d++){var sub=legs.filter(function(_,k){return k!==d;});if(sameNet(netOf(sub),net))return false;}return true;}
function constructQuotes(resStructs,tgt,pool){
  for(var att=0;att<300;att++){
    var legs=[];resStructs.forEach(function(S){legs=legs.concat(decompose(S,pool));});
    var guard=0;while(legs.length<tgt&&guard++<12){if(!splitOnce(legs,pool))break;}
    var net=netOf(resStructs.map(structToLeg));
    var merged=mergeLegs(legs);if(merged.length<2)continue;
    if(!sameNet(netOf(merged),net))continue;
    var model=describe(net);
    var mk=merged.map(legKey).sort().join('|'),modelk=model.map(structToLeg).map(legKey).sort().join('|');
    if(mk===modelk)continue;
    if(!noCancelPair(merged))continue;
    var single=false;merged.forEach(function(l){if(sameNet(contrib(l),net))single=true;});if(single)continue;
    if(!eachMatters(merged,net))continue;
    return {quotes:shuf(merged),model:model,net:net};
  }
  return null;
}
function poolFrom(){var base=ri(1,8),p=[];for(var i=0;i<7;i++)p.push(base+i);return p;}
function randTriple(pool){return shuf(pool).slice(0,3).sort(function(a,b){return a-b;});}
function randPair(pool){return shuf(pool).slice(0,2).sort(function(a,b){return a-b;});}
function pickResidual(cat,d,pool){var smax=d>=6?3:d>=5?2:1;
  if(cat==='spread')return[{type:'spread',t:randPair(pool),side:pick(['bid','offer']),size:Math.random()<0.82?1:ri(1,smax)}];
  if(cat==='fly')return[{type:'fly',t:randTriple(pool),side:pick(['bid','offer']),size:1}];
  if(cat==='multiSpread'){var n=d>=6?ri(2,3):2,seen={},out=[],g=0;while(out.length<n&&g++<40){var t=randPair(pool),k='s'+t.join();if(seen[k])continue;seen[k]=1;out.push({type:'spread',t:t,side:pick(['bid','offer']),size:1});}return out.length>=2?out:null;}
  if(cat==='doubleFly'){var seen2={},out2=[],g2=0;while(out2.length<2&&g2++<40){var t2=randTriple(pool),k2='f'+t2.join();if(seen2[k2])continue;seen2[k2]=1;out2.push({type:'fly',t:t2,side:pick(['bid','offer']),size:1});}return out2.length===2?out2:null;}
  return[{type:'fly',t:randTriple(pool),side:pick(['bid','offer']),size:1},{type:'spread',t:randPair(pool),side:pick(['bid','offer']),size:Math.random()<0.5?2:1}];
}
function sKey(s){return s.type+'|'+s.t.join(',')+'|'+s.side;}
function validS(s){var t=s.t;if(t.some(function(x){return x<1;}))return false;for(var i=1;i<t.length;i++)if(t[i]<=t[i-1])return false;return true;}
function flip(s){return s==='bid'?'offer':'bid';}
function distractors(answer,pool){
  var ansNet=netOf([structToLeg(answer)]),seen={};seen[sKey(answer)]=1;var out=[];
  function add(s){if(!s||!validS(s))return;var k=sKey(s);if(seen[k])return;if(sameNet(netOf([structToLeg(s)]),ansNet))return;seen[k]=1;out.push(s);}
  add({type:answer.type,t:answer.t.slice(),side:flip(answer.side)});
  var perturb=[];answer.t.forEach(function(_,i){[-1,1].forEach(function(dl){var t=answer.t.slice();t[i]+=dl;perturb.push({type:answer.type,t:t,side:answer.side});});});
  shuf(perturb).forEach(add);
  if(answer.type==='spread'){var a=answer.t[0],bv=answer.t[1];add({type:'fly',t:[a,bv,bv+1],side:answer.side});add({type:'fly',t:[a-1,a,bv],side:answer.side});}
  else{add({type:'spread',t:[answer.t[0],answer.t[2]],side:answer.side});add({type:'spread',t:[answer.t[0],answer.t[1]],side:answer.side});}
  var tries=0;while(out.length<6&&tries++<60){var ty=pick(['spread','fly']),ar=ty==='spread'?2:3,t=shuf(pool).slice(0,ar).sort(function(x,y){return x-y;});if(t.length<ar)continue;add({type:ty,t:t,side:pick(['bid','offer'])});}
  return shuf(out).slice(0,3);
}

// ===================== DIFFICULTY =====================
function unlocked(d){if(d<=2)return['spread'];if(d<=4)return['spread','fly'];if(d===5)return['spread','fly','multiSpread','doubleFly'];return['spread','fly','multiSpread','doubleFly','compound'];}
function isAtomic(c){return c==='spread'||c==='fly';}
function spotChance(d){return d<=2?1:d===3?0.85:d===4?0.55:d===5?0.3:0.2;}
function tempoMs(d){return d<=2?0:d===3?22000:d===4?18000:d===5?15000:12000;}
function tgtLegs(d,cat){var b=isAtomic(cat)?2:3;if(d>=6)b+=1;return b;}
function catName(c){return {spread:'Spread',fly:'Butterfly',multiSpread:'Multi-Spread',doubleFly:'Double Fly',compound:'Compound'}[c]||c;}
var RANKS=['TRAINEE','JUNIOR','ASSOCIATE','TRADER','SENIOR','PRINCIPAL'];
var RANK_BADGES=['◆','▲','★','◉','⬡','♦'];

// ===================== STATE =====================
var DEF={d:1,cats:{},introduced:{},bestRT:null,rtAll:[],streak:0,bestStreak:0,totAtt:0,totCor:0};
var ST=load();
function load(){try{var s=JSON.parse(localStorage.getItem('impl_v3'));if(s&&s.cats)return Object.assign({},DEF,s);}catch(e){}return JSON.parse(JSON.stringify(DEF));}
function save(){try{localStorage.setItem('impl_v3',JSON.stringify(ST));}catch(e){}}
function catSt(c){if(!ST.cats[c])ST.cats[c]={att:0,cor:0,str:0,rt:[]};return ST.cats[c];}
var mode='adaptive',tempoOn=false,cur=null,recent=[],lastMiss=null,win=[],sinceChange=0;
var tmrId=null,startT=0,answered=false,builder=[],rateInput='';

// ===================== CANVAS FX =====================
var canvas=$('fxCanvas'),ctx=canvas.getContext('2d'),particles=[];
(function rs(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;})();
window.addEventListener('resize',function(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;});
function spawnParticles(x,y,good){var color=good?'#39ff8b':'#ff4d5e';for(var i=0;i<20;i++){var ang=Math.random()*Math.PI*2,spd=2+Math.random()*5;particles.push({x:x,y:y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-2,alpha:1,color:color,r:1+Math.random()*2.5});}}
(function loop(){ctx.clearRect(0,0,canvas.width,canvas.height);for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.alpha-=0.022;if(p.alpha<=0){particles.splice(i,1);continue;}ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;requestAnimationFrame(loop);})();
function doFlash(good){var f=$('flash');f.style.background=good?'rgba(57,255,139,.07)':'rgba(255,77,94,.1)';f.classList.remove('on');void f.offsetWidth;f.classList.add('on');['quotesSection','trialSection','rateSection'].forEach(function(id){var el=$(id);el.classList.remove('glow-good','glow-bad');el.classList.add(good?'glow-good':'glow-bad');setTimeout(function(){el.classList.remove('glow-good','glow-bad');},550);});}
function spawnPopup(text,good,el){var p=document.createElement('div');p.className='popup '+(good?'good':'bad');p.textContent=text;var rect=el?el.getBoundingClientRect():{left:window.innerWidth/2-30,top:window.innerHeight/2,width:60,height:0};p.style.left=(rect.left+rect.width/2)+'px';p.style.top=(rect.top+rect.height/2)+'px';document.body.appendChild(p);if(el)spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,good);setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p);},1400);}

// ===================== REAL-TENOR MAPPING + PRICING =====================
function mapReal(prob){
  var ts={};prob.quotes.forEach(function(l){l.t.forEach(function(t){ts[t]=1;});});
  prob.model.forEach(function(s){s.t.forEach(function(t){ts[t]=1;});});
  var arr=Object.keys(ts).map(Number);var lo=Math.min.apply(null,arr),hi=Math.max.apply(null,arr);
  var span=hi-lo+1;
  var maxStart=TEN.length-span;if(maxStart<0){lo=1;hi=Math.min(TEN.length,span);maxStart=0;}
  var start=ri(0,Math.max(0,maxStart));
  var map={};for(var t=lo;t<=hi;t++){map[t]=TEN[start+(t-lo)];}
  prob.map=map;prob.lo=lo;prob.hi=hi;
}
function lbl(prob,t){return prob.map[t]?prob.map[t].k.toUpperCase():String(t);}
function joinT(prob,arr){return arr.map(function(t){return lbl(prob,t);}).join('×');}
function rateOfNet(net,map){var s=0;for(var k in net)s+=net[k]*map[k].px;return -s;}
function rateOfLeg(l,map){return rateOfNet(contrib(l),map);}

// ===================== RENDER QUOTES =====================
function chipFor(prob,l){
  var tn=l.kind==='fwd'?'spread':'butterfly';
  var pr=rateOfLeg(l,prob.map);
  return '<span class="qchip '+l.side+'">'+
    '<span class="qchip-top">'+joinT(prob,l.t)+'<span class="qchip-px">'+signed(pr)+'</span></span>'+
    '<span class="qchip-tag">'+l.side+(l.size>1?' ×'+l.size:'')+' · '+tn+'</span></span>';
}
function renderQuotes(prob){$('quotes').innerHTML=mergeLegs(prob.quotes).map(function(l){return chipFor(prob,l);}).join('');}

function buildMaps(quotes){
  var recv={},pay={},lo=1e9,hi=0;
  quotes.forEach(function(l){var c=contrib(l);for(var k in c){var w=c[k];if(w>0)recv[k]=(recv[k]||0)+w;else pay[k]=(pay[k]||0)-w;}lo=Math.min(lo,Math.min.apply(null,l.t));hi=Math.max(hi,Math.max.apply(null,l.t));});
  return{recv:recv,pay:pay,lo:lo,hi:hi};
}
function marks(total,cancel,cls){var s='';for(var i=0;i<total;i++)s+='<span class="mk '+cls+(i<cancel?' will-go':'')+'">X</span>';return s;}
function renderLadder(el,prob,animate){
  var m=buildMaps(prob.quotes);
  var h='<div class="lrow head"><div class="lrcv lhd">receive</div><div class="lnum lhd">tenor</div><div class="lpay lhd">pay</div></div>';
  for(var t=m.lo;t<=m.hi;t++){var r=m.recv[t]||0,p=m.pay[t]||0,cn=Math.min(r,p);h+='<div class="lrow"><div class="lrcv">'+marks(r,cn,'recv')+'</div><div class="lnum">'+lbl(prob,t)+'</div><div class="lpay">'+marks(p,cn,'pay')+'</div></div>';}
  el.innerHTML=h;
  var fade=function(){var g=el.querySelectorAll('.will-go');for(var i=0;i<g.length;i++)g[i].classList.add('gone');};
  var glow=function(){var s=el.querySelectorAll('.mk:not(.gone)');for(var i=0;i<s.length;i++)s[i].classList.add('live');};
  if(animate){requestAnimationFrame(function(){requestAnimationFrame(fade);});setTimeout(glow,580);}else{fade();}
}
function structChip(prob,s){
  var pr=rateOfLeg(structToLeg(s),prob.map);
  return '<span class="mchip '+s.side+'">'+(s.size>1?s.size+'× ':'')+joinT(prob,s.t)+
    '<span class="mchip-px">'+signed(pr)+'</span>'+
    '<span class="mchip-tag">'+s.side+' · '+catName(s.type)+'</span></span>';
}
function modelChips(el,prob){el.innerHTML='<span class="m-label">implies</span>'+prob.model.map(function(s){return structChip(prob,s);}).join('<span class="m-plus">+</span>');}

// ===================== PROBLEM GEN =====================
function genProblem(d,cat0,wantSpot){
  for(var a=0;a<60;a++){
    var pool=poolFrom();
    var res=pickResidual(cat0,wantSpot?Math.min(d,4):d,pool);
    if(!res)continue;
    if(wantSpot){res=[res[0]];res[0].size=1;}
    var prob=constructQuotes(res,tgtLegs(d,cat0),pool);
    if(prob){prob.cat=cat0;mapReal(prob);return prob;}
  }
  var fb=constructQuotes([{type:'spread',t:[2,5],side:'bid',size:1}],2,[2,3,4,5,6]);mapReal(fb);return fb;
}

// ===================== SELECTION =====================
function effD(){return mode==='adaptive'?ST.d:(mode==='easy'?1:mode==='medium'?3:6);}
function chooseCat(d){
  var av=unlocked(d);
  var fresh=av.filter(function(c){return (!ST.introduced[c]&&!isAtomic(c))||(!ST.introduced[c]&&c==='fly');});
  if(fresh.length)return fresh[0];
  var weights=av.map(function(c){var s=catSt(c).str;var w=(1-s)+0.15;if(c===lastMiss)w+=0.6;if(recent.length&&recent[recent.length-1]===c)w*=0.3;if(recent.slice(-2).every(function(x){return x===c;}))w*=0.2;return w;});
  var tot=weights.reduce(function(a,b){return a+b;},0),r=Math.random()*tot;
  for(var i=0;i<av.length;i++){r-=weights[i];if(r<=0)return av[i];}
  return av[av.length-1];
}

// ===================== SECTIONS =====================
function showSection(which){
  $('trialSection').classList.toggle('hidden', which!=='trial');
  $('rateSection').classList.toggle('hidden', which!=='rate');
  $('resultSection').classList.toggle('hidden', which!=='result');
  $('introSection').classList.toggle('hidden', which!=='intro');
  $('quotesSection').classList.remove('hidden');
}

// ===================== TRIAL FLOW =====================
function startTrial(){
  answered=false;$('note').textContent='';
  showSection('trial');
  var d=effD();
  var c=chooseCat(d);
  if(!ST.introduced[c]&&c!=='spread'){showIntro(c,d);return;}
  var spot=isAtomic(c)&&Math.random()<spotChance(d);
  cur=genProblem(d,c,spot);
  cur.cat=c;cur.format=spot?'spot':'call';cur.d=d;
  cur.answer=spot?cur.model[0]:null;
  cur.idCorrect=false;
  renderQuotes(cur);
  $('stageEyebrow').textContent='YOU\'RE QUOTED · '+catName(c).toUpperCase();
  renderLevelbar();
  if(spot){renderSpot();}else{renderCall();}
  var lim=tempoOn?tempoMs(d):0;if(mode==='easy')lim=0;
  setTempo(lim);
  startT=performance.now();
}
function setTempo(lim){
  clearTimeout(tmrId);var bar=$('tempoBar'),fill=$('tempoFill');
  if(!lim){bar.classList.add('hidden');return;}
  bar.classList.remove('hidden');fill.className='tempo-fill';fill.style.width='100%';fill.style.transition='none';
  requestAnimationFrame(function(){requestAnimationFrame(function(){fill.style.transition='width '+lim+'ms linear';fill.style.width='0%';if(lim<=12000)fill.classList.add('hot');});});
  tmrId=setTimeout(function(){if(!answered)finalize(false,false,lim,true);},lim);
}

function renderSpot(){
  $('qText').textContent='STEP 1 · TAP THE IMPLIED';
  $('callActions').classList.add('hidden');
  var opts=shuf([cur.answer].concat(distractors(cur.answer,poolFrom())));
  cur.options=opts;
  $('trialArea').innerHTML='<div class="opts">'+opts.map(function(o,i){
    return '<button class="opt" data-i="'+i+'"><span>'+(o.size>1?o.size+'× ':'')+joinT(cur,o.t)+' '+o.side+'</span><span class="opt-tag">'+catName(o.type)+'</span></button>';
  }).join('')+'</div>';
  $('trialArea').querySelectorAll('.opt').forEach(function(b){b.addEventListener('click',function(){if(answered)return;spotAnswer(+b.dataset.i,b);});});
}
function spotAnswer(i,el){
  var correct=sameNet(netOf([structToLeg(cur.options[i])]),cur.net);
  $('trialArea').querySelectorAll('.opt').forEach(function(b,j){var o=cur.options[j];var ok=sameNet(netOf([structToLeg(o)]),cur.net);if(ok)b.classList.add('correct');else b.classList.add('dim');if(j===i&&!ok)b.classList.replace('dim','wrong');});
  doFlash(correct);spawnPopup(correct?'+IMPLIED':'MISS',correct,el);
  cur.idCorrect=correct;
  setTimeout(function(){goRate();},650);
}

function renderCall(){
  $('qText').textContent='STEP 1 · BUILD THE IMPLIED';
  $('callActions').classList.remove('hidden');
  builder=[{type:'spread',t:['',''],side:'bid',size:1}];
  renderBuilder();
}
function tenorOptions(sel){
  var o='<option value="">—</option>';
  for(var t=cur.lo;t<=cur.hi;t++){o+='<option value="'+t+'"'+(String(sel)===String(t)?' selected':'')+'>'+lbl(cur,t)+'</option>';}
  return o;
}
function renderBuilder(){
  var allowFly=unlocked(cur.d).indexOf('fly')>=0;
  var allowSize=cur.d>=5;
  var h=builder.map(function(b,i){
    var ar=b.type==='fly'?3:2,tin='';
    for(var k=0;k<ar;k++){if(k)tin+='<span class="b-x">×</span>';tin+='<select class="b-sel b-ten" data-i="'+i+'" data-k="'+k+'">'+tenorOptions(b.t[k])+'</select>';}
    return '<div class="brow"><select class="b-sel" data-i="'+i+'" data-f="type"><option value="spread"'+(b.type==='spread'?' selected':'')+'>spread</option>'+(allowFly?'<option value="fly"'+(b.type==='fly'?' selected':'')+'>fly</option>':'')+'</select>'+tin+
      '<div class="b-sides"><button class="b-sd bid'+(b.side==='bid'?' on':'')+'" data-i="'+i+'" data-side="bid">BID</button><button class="b-sd offer'+(b.side==='offer'?' on':'')+'" data-i="'+i+'" data-side="offer">OFR</button></div>'+
      (allowSize?'<input class="b-sel" style="width:42px;text-align:center" data-i="'+i+'" data-f="size" inputmode="numeric" value="'+(b.size||1)+'" title="lots">':'')+
      (builder.length>1?'<button class="b-del" data-del="'+i+'">×</button>':'')+'</div>';
  }).join('');
  $('trialArea').innerHTML=h;
  $('trialArea').querySelectorAll('select[data-f="type"]').forEach(function(s){s.addEventListener('change',function(){var i=+s.dataset.i;builder[i].type=s.value;if(s.value==='fly'&&builder[i].t.length<3)builder[i].t[2]='';renderBuilder();});});
  $('trialArea').querySelectorAll('.b-ten').forEach(function(el){el.addEventListener('change',function(){builder[+el.dataset.i].t[+el.dataset.k]=el.value;});});
  $('trialArea').querySelectorAll('input[data-f="size"]').forEach(function(el){el.addEventListener('input',function(){builder[+el.dataset.i].size=el.value;});});
  $('trialArea').querySelectorAll('.b-sd').forEach(function(b){b.addEventListener('click',function(){if(answered)return;builder[+b.dataset.i].side=b.dataset.side;renderBuilder();});});
  $('trialArea').querySelectorAll('[data-del]').forEach(function(b){b.addEventListener('click',function(){builder.splice(+b.dataset.del,1);renderBuilder();});});
}
function doCheck(){
  if(answered)return;
  var structs=[];
  for(var i=0;i<builder.length;i++){
    var b=builder[i],ar=b.type==='fly'?3:2,t=[],seen={};
    for(var k=0;k<ar;k++){var v=parseInt(b.t[k],10);if(!v){$('note').textContent='Pick all tenors.';return;}if(seen[v]){$('note').textContent='Tenors must be distinct.';return;}seen[v]=1;t.push(v);}
    t.sort(function(x,y){return x-y;});
    var sz=cur.d>=5?(parseInt(b.size,10)||1):1;
    structs.push({type:b.type,t:t,side:b.side,size:sz});
  }
  var legs=structs.map(structToLeg);
  var correct=sameNet(netOf(legs),cur.net)&&mergeLegs(legs).length<=cur.model.length;
  doFlash(correct);spawnPopup(correct?'+IMPLIED':'MISS',correct,$('checkBtn'));
  cur.idCorrect=correct;cur.playerStructs=structs;
  setTimeout(function(){goRate();},500);
}

// ===================== RATE PHASE =====================
function goRate(){
  rateInput='';updateRateDisp();$('rateNote').textContent='';
  cur.rateAns=rateOfNet(cur.net,cur.map);
  cur.rateStart=performance.now();
  var name=cur.model.map(function(s){return joinT(cur,s.t)+' '+s.side;}).join(' + ');
  $('rateLine').innerHTML='What rate does the implied <b>'+name+'</b> trade?<br>Add the quoted legs (mind bid/offer signs).';
  showSection('rate');
  var lim=tempoOn?tempoMs(effD()):0;if(mode==='easy')lim=0;setTempo(lim);
}
function updateRateDisp(){var d=$('answerDisp');if(rateInput===''||rateInput==='-'){d.textContent=rateInput===''?'0':'−';d.classList.toggle('empty',rateInput==='');}else{d.textContent=rateInput.replace('-','−');d.classList.remove('empty');}}
function buildKeypad(){
  var keys=[['7'],['8'],['9'],['4'],['5'],['6'],['1'],['2'],['3'],['±','fn'],['0'],['.','fn'],['⌫','del'],['ENTER','enter']];
  $('keypad').innerHTML=keys.map(function(k){var cls=k[1]==='enter'?'key enter':k[1]==='del'?'key del':k[1]==='fn'?'key fn':'key';return '<button class="'+cls+'" data-k="'+k[0]+'">'+k[0]+'</button>';}).join('');
  $('keypad').querySelectorAll('.key').forEach(function(b){b.addEventListener('click',function(){press(b.dataset.k);});});
}
function press(k){
  if(answered){if(k==='ENTER')startTrial();return;}
  if(k==='ENTER'){submitRate();return;}
  if(k==='⌫'){rateInput=rateInput.slice(0,-1);updateRateDisp();return;}
  if(k==='±'){rateInput=rateInput.charAt(0)==='-'?rateInput.slice(1):'-'+rateInput;updateRateDisp();return;}
  if(k==='.'){if(rateInput.indexOf('.')<0)rateInput=(rateInput===''||rateInput==='-')?rateInput+'0.':rateInput+'.';updateRateDisp();return;}
  if(rateInput.replace('-','').replace('.','').length>=7)return;
  rateInput+=k;updateRateDisp();
}
window.addEventListener('keydown',function(e){
  if($('rateSection').classList.contains('hidden'))return;
  if(e.key>='0'&&e.key<='9')press(e.key);
  else if(e.key==='.')press('.');else if(e.key==='-')press('±');
  else if(e.key==='Backspace'){e.preventDefault();press('⌫');}
  else if(e.key==='Enter'){e.preventDefault();press('ENTER');}
});
function submitRate(){
  if(rateInput===''||rateInput==='-'){$('rateNote').textContent='Enter the rate.';return;}
  var val=parseFloat(rateInput);if(isNaN(val)){$('rateNote').textContent='Invalid number.';return;}
  var rateCorrect=Math.abs(val-cur.rateAns)<=0.13;
  var rt=performance.now()-startT;
  doFlash(rateCorrect);spawnPopup(rateCorrect?'+'+fmt(cur.rateAns):'MISS',rateCorrect,$('answerDisp'));
  finalize(cur.idCorrect,rateCorrect,rt,false,val);
}

// ===================== FINALIZE =====================
function finalize(idCorrect,rateCorrect,rt,timedOut,rateVal){
  answered=true;clearTimeout(tmrId);$('tempoBar').classList.add('hidden');
  var correct=idCorrect&&rateCorrect;
  var c=cur.cat,C=catSt(c);
  C.att++;ST.totAtt++;
  if(correct){C.cor++;ST.totCor++;ST.streak++;if(ST.streak>ST.bestStreak)ST.bestStreak=ST.streak;}
  else{ST.streak=0;lastMiss=c;}
  C.str=C.str*0.7+(correct?0.3:0);
  if(correct&&!timedOut){C.rt.push(rt);if(C.rt.length>30)C.rt.shift();ST.rtAll.push(rt);if(ST.rtAll.length>60)ST.rtAll.shift();if(ST.bestRT==null||rt<ST.bestRT)ST.bestRT=rt;}
  recent.push(c);if(recent.length>6)recent.shift();
  if(mode==='adaptive'){win.push(correct?1:0);if(win.length>10)win.shift();sinceChange++;
    if(win.length>=8&&sinceChange>=5){var acc=win.reduce(function(a,b){return a+b;},0)/win.length;if(acc>=0.85&&ST.d<6){ST.d++;sinceChange=0;win=[];}else if(acc<0.6&&ST.d>1){ST.d--;sinceChange=0;win=[];}}}
  save();renderScore();renderLevelbar();

  showSection('result');
  var v=$('verdict');
  var label=timedOut?'TIME.':(correct?'CLEAN.':(idCorrect?'RATE OFF.':(rateCorrect?'SHAPE OFF.':'MISS.')));
  v.className='verdict '+(correct?'right':'wrong2');
  v.innerHTML='<span class="dot"></span>'+label;
  $('rtText').textContent=timedOut?'':(rt/1000).toFixed(2)+'s';
  renderLadder($('ladder'),cur,true);
  modelChips($('modelChips'),cur);
  var rr='<span class="lbl">IMPLIED RATE</span><span class="ok">'+signed(cur.rateAns)+'</span>';
  if(!correct&&!timedOut&&rateVal!=null&&!rateCorrect)rr+=' <span class="you">(you: '+fmt(rateVal)+')</span>';
  $('rateResult').innerHTML=rr;
  var legs=mergeLegs(cur.quotes);
  var parts=legs.map(function(l){return joinT(cur,l.t)+' <span class="hl">'+signed(rateOfLeg(l,cur.map))+'</span>';});
  $('work').innerHTML='Add the quoted legs:<br>'+parts.join('  +  ')+'<br>= <span class="gr">'+signed(cur.rateAns)+'</span>';
  var m=buildMaps(cur.quotes),cancelled=[];
  for(var t=m.lo;t<=m.hi;t++){if(Math.min(m.recv[t]||0,m.pay[t]||0)>0)cancelled.push(lbl(cur,t));}
  var ex=cancelled.length?('The '+cancelled.join(', ')+' leg'+(cancelled.length>1?'s':'')+' cancel. '):'';
  ex+='What survives: '+cur.model.map(function(s){return joinT(cur,s.t)+' '+s.side+' ('+catName(s.type)+')';}).join(', plus ')+'.';
  if(!idCorrect&&cur.playerStructs){var pn=mergeLegs(cur.playerStructs.map(structToLeg));if(pn.length)ex+=' Your shape: '+describe(netOf(pn)).map(function(s){return joinT(cur,s.t)+' '+s.side;}).join(' + ')+'.';}
  $('explain').textContent=ex;
  $('nextBtn').focus();
}

// ===================== INTRO =====================
function showIntro(c,d){
  var prob=genProblem(d,c,false);cur=prob;cur.cat=c;
  renderQuotes(prob);
  $('stageEyebrow').textContent='WORKED EXAMPLE · '+catName(c).toUpperCase();
  showSection('intro');
  $('introEyebrow').textContent='NEW PATTERN — '+catName(c).toUpperCase();
  var lead={fly:'Two adjacent spreads sharing a tenor collapse into a butterfly — the shared leg pays twice.',multiSpread:'Several spreads that don\'t share a cancelling belly stay separate — read each pairing.',doubleFly:'Two butterflies at different points on the curve. Each is its own wings-and-belly.',compound:'A mix — a butterfly plus a spread. Pull out the fly first, then read the spread.'}[c]||'';
  $('introText').textContent=lead+' Then you\'ll price it from the board.';
  renderLadder($('introLadder'),prob,false);
  setTimeout(function(){var s=$('introLadder').querySelectorAll('.mk:not(.gone)');for(var i=0;i<s.length;i++)s[i].classList.add('live');},120);
  modelChips($('introChips'),prob);
}

// ===================== BOARD / DASHBOARD =====================
function renderBoard(){
  $('boardGrid').innerHTML=TEN.map(function(t){return '<div class="bchip"><div class="bk">'+t.k.toUpperCase()+'</div><div class="bp">'+fmt(t.px)+'</div></div>';}).join('');
}
function median(a){if(!a.length)return null;var s=a.slice().sort(function(x,y){return x-y;}),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function renderScore(){$('statStreak').textContent=ST.streak;$('statAcc').textContent=ST.totAtt?Math.round(100*ST.totCor/ST.totAtt)+'%':'—';$('statRT').textContent=ST.rtAll.length?(median(ST.rtAll)/1000).toFixed(1)+'s':'—';}
function renderLevelbar(){var d=effD();$('rankBadge').textContent=RANK_BADGES[Math.min(d-1,5)];$('rankName').textContent=RANKS[Math.min(d-1,5)];$('levelNum').textContent=d;$('xpFill').style.width=(d/6*100)+'%';$('xpText').textContent=(mode==='adaptive'?'AUTO':'FIXED')+' LVL '+d+'/6 — '+unlocked(d).map(catName).join(' · ').toUpperCase();}

// ===================== WIRING =====================
document.querySelectorAll('.mode-btn[data-mode]').forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.mode;document.querySelectorAll('.mode-btn[data-mode]').forEach(function(x){x.classList.toggle('active',x===b);});win=[];sinceChange=0;tempoOn=$('tempoCheck').checked;startTrial();});});
$('boardBtn').addEventListener('click',function(){var p=$('boardPanel'),show=p.classList.contains('hidden');p.classList.toggle('hidden');$('boardBtn').classList.toggle('active',show);});
$('checkBtn').addEventListener('click',doCheck);
$('addStructBtn').addEventListener('click',function(){if(builder.length<4){builder.push({type:'spread',t:['',''],side:'bid',size:1});renderBuilder();}});
$('nextBtn').addEventListener('click',startTrial);
$('introGoBtn').addEventListener('click',function(){ST.introduced[cur.cat]=true;save();startTrial();});
$('tempoCheck').addEventListener('change',function(){tempoOn=$('tempoCheck').checked;});

// boot
buildKeypad();renderBoard();renderScore();startTrial();
})();
