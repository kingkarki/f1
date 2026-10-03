/* Lightweight race engine. Distances are SVG units, separate from display/UI. */
(() => {
  'use strict';
  const V=window.MiamiVenue;
  if(!V)return;
  const {NS,svg,racingLine,totalLength:L,num,random}=V;
  const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=d=>((d%L)+L)%L;
  function element(tag,attributes,parent){const node=document.createElementNS(NS,tag);Object.entries(attributes).forEach(([k,v])=>node.setAttribute(k,v));if(parent)parent.appendChild(node);return node;}
  // Cache the path once. Race updates interpolate the cache instead of querying SVG per frame.
  const N=2600,step=L/N,points=[];
  for(let i=0;i<N;i++){const p=racingLine.getPointAtLength(i*step);points.push({x:p.x,y:p.y});}
  function point(d){const f=wrap(d)/step,i=Math.floor(f),t=f-i,a=points[i],b=points[(i+1)%N];return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
  function direction(d){const p=point(d-2),q=point(d+2);return Math.atan2(q.y-p.y,q.x-p.x);}
  function angleDifference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  const corners=points.map((_,i)=>Math.abs(angleDifference(direction(i*step-11),direction(i*step+11))));
  function curvature(d){return corners[Math.floor(wrap(d)/step)];}
  function nearest(x,y){let best=Infinity,index=0;points.forEach((p,i)=>{const d=(p.x-x)**2+(p.y-y)**2;if(d<best){best=d;index=i;}});return index*step;}
  // Pit lane joins the race line at both ends. Race distance continues across start/finish.
  const entry=nearest(705,185),exit=nearest(1034,371),pitSpan=wrap(exit-entry);
  const ep=point(entry),xp=point(exit);
  const pitD=`M${ep.x} ${ep.y} C${ep.x+10} ${ep.y+7} 708 211 735 227 L938 338 Q973 361 995 357 C1013 355 1025 363 ${xp.x} ${xp.y}`;
  const pitLayer=document.getElementById('pit-lane');
  const pitPath=element('path',{id:'pit-route',d:pitD,fill:'none',stroke:'#cfddc9','stroke-width':10},pitLayer);
  element('path',{d:pitD,fill:'none',stroke:'#6b7877','stroke-width':8},pitLayer);
  element('path',{d:pitD,fill:'none',stroke:'#dedfb8','stroke-width':.6,'stroke-dasharray':'5 5'},pitLayer);
  const pitL=pitPath.getTotalLength(),pitPoints=[];
  for(let i=0;i<=400;i++){const p=pitPath.getPointAtLength(i/400*pitL);pitPoints.push(p);}
  function pitPoint(f){const n=clamp(f,0,1)*400,i=Math.min(399,Math.floor(n)),t=n-i,a=pitPoints[i],b=pitPoints[i+1];return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
  const box=pitPoint(.52);
  const garage=element('g',{transform:`translate(${box.x} ${box.y}) rotate(${box.angle*180/Math.PI})`},pitLayer);
  element('rect',{x:-13,y:-7,width:27,height:14,fill:'none',stroke:'#d3b969','stroke-width':.7},garage);
  element('path',{d:'M-12 -7L-7 -7M7 -7H13M-12 7H-7M7 7H13',fill:'none',stroke:'#fff1c9','stroke-width':1.5},garage);
  const crew=[];
  for(let i=0;i<8;i++){const x=(i%4)*5-7.5,y=i<4?-8:8;const g=element('g',{class:'pit-mechanic','data-x':x,'data-y':y,transform:`translate(${x} ${y})`},garage);element('circle',{r:1.1,fill:i%2?'#d7d9ca':'#b27350'},g);element('ellipse',{cy:1.1,rx:1,ry:1.3,fill:'#3d5b63'},g);crew.push(g);}
  element('rect',{x:-20,y:-12,width:6,height:4,fill:'#344344',rx:.5},garage);
  element('circle',{cx:-15,cy:10,r:2,fill:'#243330'},garage);
  element('circle',{cx:-20,cy:10,r:2,fill:'#243330'},garage);
  const liveries=['#a9362e','#244e80','#cb702e','#bcc9cb','#35675c','#dadaca','#29364f','#b3a24f','#5484a2','#484e4e'];
  const starting=[.84,.828,.72,.662,.559,.49,.411,.31,.2,.12];
  const cars=starting.map((progress,i)=>{
    const node=element('g',{class:'car-node','data-car':i,tabindex:'0',role:'button','aria-label':`Car ${String(i+1).padStart(2,'0')}, simulated racing car`,color:liveries[i]},document.getElementById('cars'));
    element('circle',{r:11,class:'car-hit'},node);
    element('use',{href:'#f1-car',x:-10,y:-5,width:20,height:10},node);
    return{id:i+1,node,color:liveries[i],distance:(31+progress)*L,speed:100,baseSpeed:[121,139,129,134,126,132,137,123,133,130][i],lane:0,targetLane:0,passUntil:0,nextPass:3+i*1.4,pit:null,pitStops:0,nextPit:30+i*13,position:i+1,lap:32,x:0,y:0,angle:0};
  });
  const state={lap:32,totalLaps:57,status:'LIVE',message:'GREEN FLAG',time:0,rate:1,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,finished:false,cars,events:{overtakes:0,pitEntries:1,pitStops:0,pitExits:0},frameCount:0};
  // One crew is working from the first frame, while the rest of the field is already racing.
  cars[7].pit={fraction:.41,base:31*L+entry,stopped:false,hold:0};
  cars[7].distance=cars[7].pit.base+pitSpan*.41;cars[7].speed=32;
  let order=[...cars],lastFrame=0,lastHud=-1,lastAmbient=-1,accumulator=0,messageUntil=0;
  let pauseBeforeHidden=false;
  function announce(text,duration=4){state.message=text;messageUntil=state.time+duration;}
  function enterPit(car){const base=Math.floor(car.distance/L)*L+entry;car.pit={fraction:0,base:base>car.distance?base-L:base,stopped:false,hold:0};car.lane=0;state.events.pitEntries++;announce(`CAR ${String(car.id).padStart(2,'0')} · PIT ENTRY`);}
  function updatePit(car,dt){
    const pit=car.pit;
    if(pit.fraction>=.52&&!pit.stopped){pit.fraction=.52;pit.stopped=true;pit.hold=3.2;state.events.pitStops++;announce(`CAR ${String(car.id).padStart(2,'0')} · IN THE BOX`,3.2);}
    if(pit.hold>0){pit.hold=Math.max(0,pit.hold-dt);car.speed=0;}
    else{const target=pit.fraction>.86?65:38;car.speed+=clamp(target-car.speed,-90*dt,40*dt);pit.fraction=Math.min(1,pit.fraction+car.speed*dt/pitL);}
    car.distance=pit.base+pit.fraction*pitSpan;
    const p=pitPoint(pit.fraction);car.x=p.x;car.y=p.y;car.angle=p.angle;
    if(pit.fraction>=1){car.pit=null;car.pitStops++;car.nextPit=state.time+110+car.id*3;state.events.pitExits++;announce(`CAR ${String(car.id).padStart(2,'0')} · REJOINED`);}
  }
  function updateRace(dt){
    state.time+=dt;
    const distanceBefore=cars.map(c=>c.distance);
    for(const car of cars){
      if(car.pit){updatePit(car,dt);continue;}
      const old=car.distance;
      const bend=Math.max(curvature(old)*.85,curvature(old+car.speed*.3),curvature(old+car.speed*.6)*.8);
      let target=car.baseSpeed*clamp(1-bend*.55,.3,1);
      let ahead=null,gap=Infinity;
      for(const other of cars){if(other===car||other.pit)continue;const d=wrap(distanceBefore[other.id-1]-distanceBefore[car.id-1]);if(d>0&&d<gap){gap=d;ahead=other;}}
      if(ahead&&gap<65&&car.baseSpeed>ahead.baseSpeed+2&&bend<.36&&state.time>car.nextPass&&car.passUntil<state.time){
        car.passUntil=state.time+3.8;car.nextPass=state.time+14;car.targetLane=car.id%2?5:-5;
      }
      if(car.passUntil>state.time){target*=1.09;}else{car.targetLane=0;if(ahead&&gap<19)target=Math.min(target,Math.max(15,ahead.speed*.88));}
      car.lane+=(car.targetLane-car.lane)*Math.min(1,dt*2.5);
      car.speed+=clamp(target-car.speed,-100*dt,44*dt);
      car.distance+=car.speed*dt;
      const d0=wrap(old),travel=car.distance-old,toEntry=wrap(entry-d0);
      if(state.time>car.nextPit&&toEntry<=travel&&toEntry>0){car.distance=old+toEntry;enterPit(car);updatePit(car,0);continue;}
      const d=car.distance,p=point(d),theta=direction(d);
      car.x=p.x-Math.sin(theta)*car.lane;car.y=p.y+Math.cos(theta)*car.lane;
      // Heading follows the offset lane's tangent, including the smooth lane-change velocity.
      const q=point(d+2),futureLane=car.lane+(car.targetLane-car.lane)*Math.min(1,2/Math.max(1,car.speed)*2.5);
      car.angle=Math.atan2(q.y+Math.cos(direction(d+2))*futureLane-car.y,q.x-Math.sin(direction(d+2))*futureLane-car.x);
    }
    for(const car of cars){car.lap=Math.floor(car.distance/L)+1;car.node.setAttribute('transform',`translate(${num(car.x)} ${num(car.y)}) rotate(${num(car.angle*180/Math.PI)})`);}
    const nextOrder=[...cars].sort((a,b)=>b.distance-a.distance);
    nextOrder.forEach((c,i)=>{
      if(c.position>i+1&&c.position!==undefined&&state.time>1&&!c.pit){const passed=order[i];if(passed&&!passed.pit&&c.passUntil>state.time){state.events.overtakes++;announce(`CAR ${String(c.id).padStart(2,'0')} · UP TO P${i+1}`,2.5);}}
      c.position=i+1;
    });
    order=nextOrder;state.lap=Math.min(state.totalLaps,order[0].lap);
    if(!state.finished&&order[0].lap>state.totalLaps){state.finished=true;state.message='CHEQUERED FLAG';state.status='FINISHED';state.paused=true;document.dispatchEvent(new CustomEvent('race-status-change'));}
    if(!state.finished&&state.time>messageUntil)state.message='GREEN FLAG';
  }
  const flags=[...document.querySelectorAll('.flag-fabric')].map(n=>({n,phase:+n.dataset.phase,amplitude:+n.dataset.amplitude}));
  const walkers=[...document.querySelectorAll('.walker')];
  const serviceLine=document.getElementById('service-route'),serviceL=serviceLine.getTotalLength();
  const vehicles=[];
  for(let i=0;i<7;i++){const node=element('g',{color:['#efebd3','#adb6a3','#5b7777','#d1c3a2'][i%4]},document.getElementById('vehicles'));element('use',{href:'#road-car',x:-4,y:-2,width:8,height:4},node);vehicles.push({node,offset:i/7,speed:9+i*.7});}
  // A separate native SVG surface prevents every moving car from repainting the
  // thousands of architectural elements. This is still editable vector geometry.
  const activity=element('svg',{id:'activity-map',viewBox:'0 0 1600 876',role:'group','aria-label':'Simulated cars and animated venue activity'});
  svg.after(activity);
  const activityCamera=element('g',{id:'activity-camera'},activity);
  const waterLayer=element('g',{id:'animated-water'},activityCamera);
  const glints=[...document.querySelectorAll('.water-glint')];
  const waveBands=Array.from({length:3},(_,i)=>element('g',{class:'water-glint',style:`--wave-time:${6+i*1.7}s;--wave-delay:-${i*2.3}s`},waterLayer));
  glints.forEach((n,i)=>{n.classList.remove('water-glint');waveBands[i%3].appendChild(n);});
  const treeLayer=element('g',{id:'animated-palms'},activityCamera);
  document.querySelectorAll('.palm-sway').forEach((n,i)=>{if(i%5===0)treeLayer.appendChild(n.parentElement);else n.classList.remove('palm-sway');});
  document.querySelectorAll('.crowd-wave').forEach(n=>n.classList.remove('crowd-wave'));
  for(const id of ['flags','boats','vehicles'])activityCamera.appendChild(document.getElementById(id));
  const walkersLayer=element('g',{id:'animated-guests'},activityCamera);
  walkers.forEach(n=>walkersLayer.appendChild(n));
  const lightLayer=element('g',{id:'animated-lighting'},activityCamera);
  document.querySelectorAll('.screen-glow').forEach(n=>lightLayer.appendChild(n.parentElement));
  const roofLights=element('g',{transform:'translate(720 367) rotate(30) scale(1 .8)'},lightLayer);
  roofLights.appendChild(document.querySelector('.stadium-led'));
  activityCamera.appendChild(garage);
  activityCamera.appendChild(document.getElementById('cars'));
  activityCamera.appendChild(document.getElementById('bridges'));
  V.activity=activity;V.activityCamera=activityCamera;
  const flashes=[[799,208],[828,230],[568,504],[537,493],[1295,476],[430,244]].map(([cx,cy],i)=>element('circle',{cx,cy,r:1.2,fill:'#fffbe1',opacity:0,'data-phase':i*1.71},activityCamera));
  let ambientEnabled=true;
  function updateAmbient(){
    const t=state.time;
    for(const f of flags){const a=Math.sin(t*2.3+f.phase)*f.amplitude,b=Math.sin(t*2.3+f.phase+1.7)*f.amplitude;f.n.setAttribute('d',`M0 -16 C4 ${num(-16+a)} 7 ${num(-16+b)} 12 ${num(-16-a)} L12 ${num(-9-a)} C7 ${num(-9+b)} 4 ${num(-9+a)} 0 -9Z`);}
    walkers.forEach(w=>{const phase=+w.dataset.phase;w.setAttribute('transform',`translate(${num(+w.dataset.x+Math.sin(t*.13+phase)*6)} ${num(+w.dataset.y+Math.cos(t*.09+phase)*2)})`);});
    vehicles.forEach(v=>{const d=(v.offset*serviceL+t*v.speed)%serviceL,p=serviceLine.getPointAtLength(d),q=serviceLine.getPointAtLength(Math.min(d+1,serviceL));v.node.setAttribute('transform',`translate(${num(p.x)} ${num(p.y+3)}) rotate(${num(Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI)})`);});
    const active=cars.some(c=>c.pit?.hold>0);
    flashes.forEach(n=>n.setAttribute('opacity',Math.sin(t*.7+ +n.dataset.phase)>.998?.8:0));
    crew.forEach((node,i)=>{const x=+node.dataset.x,y=+node.dataset.y;node.setAttribute('transform',`translate(${num(x+(active?Math.sin(t*5+i)*.5:0))} ${num(y+(active?(y<0?3:-3):0))})`);});
  }
  const board=document.getElementById('leaderboard-list');
  const rows=cars.map(c=>{const li=document.createElement('li');li.innerHTML=`<span class="rank"></span><span class="livery" style="background:${c.color}"></span><span class="driver-name">CAR ${String(c.id).padStart(2,'0')}</span><span class="driver-gap"></span>`;return{li,rank:li.querySelector('.rank'),gap:li.querySelector('.driver-gap')};});
  function updateHud(){
    const leader=order[0];
    order.slice(0,5).forEach((c,i)=>{const row=rows[c.id-1];row.rank.textContent=i+1;row.gap.textContent=c.pit?'PIT':i===0?'LEADER':`+${((leader.distance-c.distance)/105).toFixed(1)}`;row.gap.classList.toggle('pit',!!c.pit);board.appendChild(row.li);});
    for(const c of order.slice(5))rows[c.id-1].li.remove();
    document.getElementById('lap-number').textContent=state.lap;
    document.getElementById('race-message').textContent=state.message;
    document.getElementById('live-status').textContent=state.finished?'FINISHED':state.paused?'PAUSED':'LIVE';
    document.getElementById('race-clock').textContent=`${String(Math.floor(state.time/60)).padStart(2,'0')}:${String(Math.floor(state.time%60)).padStart(2,'0')}`;
  }
  function pause(value){state.paused=value;document.body.classList.toggle('paused',value);lastFrame=0;updateHud();document.dispatchEvent(new CustomEvent('race-status-change'));}
  function animate(now){
    requestAnimationFrame(animate);
    if(document.hidden||state.paused){lastFrame=now;return;}
    const elapsed=lastFrame?Math.min((now-lastFrame)/1000,.1):1/60;lastFrame=now;
    accumulator+=elapsed*state.rate;
    // Fixed small substeps keep close racing and pit-entry crossings stable at every speed.
    while(accumulator>=1/60){updateRace(1/60);accumulator-=1/60;}
    state.frameCount++;
    if(window.MiamiRace.onFrame){try{window.MiamiRace.onFrame();}catch(error){window.MiamiRace.onFrame=null;console.warn('Tooltip updates disabled:',error);}}
    if(state.time-lastAmbient>.08&&ambientEnabled){try{updateAmbient();}catch(error){ambientEnabled=false;console.warn('Ambient animation disabled:',error);}lastAmbient=state.time;}
    if(state.time-lastHud>.3){updateHud();lastHud=state.time;document.dispatchEvent(new CustomEvent('race-tick'));}
  }
  // Extension boundary for future telemetry, timing providers and race controls.
  window.MiamiRace={state,get order(){return order;},point,direction,pitPoint,length:L,pitEntry:entry,pitExit:exit,pitSpan,
    pause,setRate(value){state.rate=clamp(value,.25,4);},reset(){location.reload();},
    snapshot(){return{lap:state.lap,time:state.time,status:state.status,events:{...state.events},cars:cars.map(({id,position,lap,speed,pit,distance,x,y,angle})=>({id,position,lap,speed,pit:!!pit,distance,x,y,angle}))};},
    advance(seconds){const wasPaused=state.paused;for(let t=0;t<seconds;t+=1/60){if(state.finished)break;updateRace(1/60);}state.paused=wasPaused||state.finished;updateAmbient();updateHud();}
  };
  updateRace(0);updateAmbient();updateHud();pause(state.paused);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseBeforeHidden=state.paused;pause(true);}else if(!pauseBeforeHidden&&!state.finished){pause(false);}});
  requestAnimationFrame(animate);
})();
