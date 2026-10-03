const experiences = [
  {id:1,name:'MSC Yacht Club',short:'MSC Yacht Club',category:'club',type:'Club & private cabanas',x:16.2,y:58.8,location:'MIA Marina · Turns 6–8',description:'A different perspective on race weekend. Discover poolside cabanas and elevated views from the three-level Yacht Club.',options:['Yacht Club seats','Private cabanas'],features:['Access to all three Yacht Club levels','Climate-controlled lounge','Food, beer, wine & sparkling wine','Cabanas accommodate 20 guests per day'],zone:'142,284 187,286 201,334 177,351 136,339'},
  {id:2,name:'Turn 5 Lofts',short:'Turn 5 Lofts',category:'private',type:'Private suite',x:26.3,y:49.8,location:'The Promenade · Turns 4 & 5',description:'Your own space, right beside the action. Bring your group together with sweeping views of two consecutive corners.',options:['10 guests per day','Standing-room add-ons'],features:['Private suite for race weekend','Buffet dining, beer, wine & sparkling wine','Branding & customization opportunities','TVs inside each suite'],zone:'236,268 273,254 282,275 244,286'},
  {id:3,name:'72 Club',short:'72 Club',category:'club',type:'Luxury seating',x:39.8,y:57.4,location:'Turn 4 · Beside the championship podium',description:'An exceptional seat for an unforgettable finish. A members-only lounge meets a premium dining experience by Groot Hospitality.',options:['Individual seats','8-person sofa boxes'],features:['Climate-controlled members’ lounge','Premium food & beverage experience','Paddock Village tour at an assigned time','72 Club concierge support'],zone:'344,276 405,303 397,321 333,292'},
  {id:4,name:'Casa Tua at Paddock Club',short:'Casa Tua',category:'club',type:'Luxury hospitality',x:61.1,y:43.5,location:'Turn 1 · Pit exit views',description:'Casa Tua brings its signature dining and hosted bar to one of the circuit’s most compelling vantage points.',options:['Trackside views','Casa Tua dining'],features:['Menu & hosted bar by Casa Tua','Views of cars re-entering from the pit lane','Access to Paddock Club amenities','Pit lane walk, garden & rooftop access'],zone:'593,218 617,225 642,248 630,267 596,250'},
  {id:5,name:'Villas at East Campus',short:'East Campus Villas',category:'private',type:'Private villa',x:64.4,y:54.1,location:'East Campus · Turns 1 & 2',description:'A private, two-story home for race weekend, pairing a cool indoor lounge with an open-air rooftop and trackside balcony.',options:['20 guests per day','Two-story villa'],features:['Climate-controlled lounge & balcony','Open-air rooftop','Food & drinks served inside your suite','Suite attendant & branding opportunities'],zone:'625,276 648,267 658,279 633,296'},
  {id:6,name:'Sunset Key Villas',short:'Sunset Key Villas',category:'private',type:'Private villa',x:60.3,y:59.3,location:'Turns 1 & 2 · Trackside',description:'A generous private setting for your group. Enjoy the race from your balcony, lounge, or open-air rooftop across the weekend.',options:['30 guests per day','Two-story villa'],features:['Climate-controlled lounge & private balcony','Open-air rooftop','Food & drinks served inside your villa','Dedicated suite attendant'],zone:'594,289 604,285 613,312 605,326 596,311'},
  {id:7,name:'Verista Club',short:'Verista Club',category:'club',type:'Club hospitality',x:55.3,y:70,location:'Turn 3 · Turn 10 straightaway views',description:'Two perspectives, one comfortable retreat. Shaded seating and rooftop access put both corners and high-speed racing in view.',options:['Shaded seating','Rooftop access'],features:['Reserved seating facing Turn 3','Rooftop views of the Turn 10 straight','Chef-curated buffet & included beverages','Climate-controlled lounge & preferred parking'],zone:'526,378 565,373 581,390 539,398'}
];
const $ = selector => document.querySelector(selector);
const viewport = $('#viewport'), stage = $('#stage');
let selected = 1, currentFilter = 'all', zoom = 1, panX = 0, panY = 0;
const visible = item => currentFilter === 'all' || item.category === currentFilter || (currentFilter === 'private' && item.id === 1);
$('#pins').innerHTML = experiences.map(e => `<button class="pin" data-id="${e.id}" style="--x:${e.x}%;--y:${e.y}%" aria-label="${e.id}. ${e.name}" aria-pressed="false"><span>${String(e.id).padStart(2,'0')}</span><span class="pin-label">${e.short}</span></button>`).join('');
$('#zone-shapes').innerHTML = experiences.map(e => `<polygon class="zone" data-zone="${e.id}" points="${e.zone}"/>`).join('');
$('#destinations').innerHTML = experiences.map(e => `<button class="destination" data-id="${e.id}" aria-pressed="false"><span class="number">${String(e.id).padStart(2,'0')}</span><span class="name">${e.short}</span></button>`).join('');
function select(id){
  selected = id;
  const e = experiences.find(e => e.id === id);
  document.querySelectorAll('[data-id]').forEach(el => {const active = +el.dataset.id === id;el.classList.toggle(el.classList.contains('pin')?'selected':'active',active);el.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('.zone').forEach(el => el.classList.toggle('selected',+el.dataset.zone === id));
  const subject=encodeURIComponent(`2027 Miami Grand Prix hospitality — ${e.name}`);
  const body=encodeURIComponent(`Hello Jack,\n\nI’m interested in booking ${e.name} for the 2027 Miami Grand Prix. Please share availability, pricing, and next steps.\n\nThank you.`);
  $('#details').innerHTML = `<div class="detail-top"><span class="detail-index">${String(e.id).padStart(2,'0')}</span><span class="detail-type">${e.type}</span></div><h2>${e.name}</h2><div class="detail-location">${e.location}</div><p class="detail-description">${e.description}</p><div class="options">${e.options.map(o=>`<span>${o}</span>`).join('')}</div><ul class="features">${e.features.map(f=>`<li>${f}</li>`).join('')}</ul><div class="detail-actions"><a class="book-button" href="mailto:jmizgalski@F1Miamigp.com?subject=${subject}&body=${body}">Book Now <span aria-hidden="true">↗</span></a><button class="focus-button" id="focus-location">Show on map <span aria-hidden="true">◎</span></button></div><p class="detail-footnote">Book Now opens an inquiry to the Miami GP hospitality team.</p>`;
  $('#focus-location').addEventListener('click',()=>focusLocation(e));
}
document.querySelectorAll('[data-id]').forEach(el=>{
  el.addEventListener('click',()=>select(+el.dataset.id));
  for(const event of ['pointerenter','focus']) el.addEventListener(event,()=>$(`[data-zone="${el.dataset.id}"]`).classList.add('hovered'));
  for(const event of ['pointerleave','blur']) el.addEventListener(event,()=>$(`[data-zone="${el.dataset.id}"]`).classList.remove('hovered'));
});
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
  currentFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  experiences.forEach(e=>document.querySelectorAll(`[data-id="${e.id}"]`).forEach(el=>el.hidden=!visible(e)));
  if(!visible(experiences.find(e=>e.id===selected)))select(experiences.find(visible).id);
  reset();
}));
function clampPan(){
  const boundX=Math.max(0,(stage.offsetWidth*zoom-viewport.clientWidth)/2+viewport.clientWidth*.2);
  const boundY=Math.max(viewport.clientHeight*.15,(stage.offsetHeight*zoom-viewport.clientHeight)/2+viewport.clientHeight*.2);
  panX=Math.max(-boundX,Math.min(boundX,panX));panY=Math.max(-boundY,Math.min(boundY,panY));
}
function render(){clampPan();stage.style.transform=`translate(${panX}px, calc(-50% + ${panY}px)) scale(${zoom})`;stage.style.setProperty('--inverse-zoom',1/zoom);$('#zoom-level').textContent=`${Math.round(zoom*100)}%`;$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=3;}
function changeZoom(value,anchor){const old=zoom;zoom=Math.max(1,Math.min(3,value));const ratio=zoom/old;if(anchor){panX=anchor.x-(anchor.x-panX)*ratio;panY=anchor.y-(anchor.y-panY)*ratio;}else{panX*=ratio;panY*=ratio;}render();}
function reset(){zoom=1;panX=matchMedia('(max-width:760px)').matches?viewport.clientWidth*.16:0;panY=0;render();}
function focusLocation(e){zoom=1.85;panX=-(e.x/100-.5)*stage.offsetWidth*zoom;panY=-(e.y/100-.5)*stage.offsetHeight*zoom;render();viewport.focus({preventScroll:true});}
$('#zoom-in').addEventListener('click',()=>changeZoom(zoom+.25));$('#zoom-out').addEventListener('click',()=>changeZoom(zoom-.25));$('#reset').addEventListener('click',reset);
$('#map-style').addEventListener('click',()=>{
  const natural=viewport.classList.toggle('natural');
  $('#map-style').setAttribute('aria-pressed',String(natural));
  $('#map-style span:last-child').textContent=natural?'InList palette':'Natural colors';
});
$('#fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(viewport.requestFullscreen)await viewport.requestFullscreen();});
document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;$('#fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');reset();});
viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();changeZoom(zoom*(e.deltaY<0?1.1:.9),{x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2});},{passive:false});
const pointers=new Map();let gesture=null;
function startGesture(){const pts=[...pointers.values()];gesture={panX,panY,zoom,center:{x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length},distance:pts.length>1?Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y):0};}
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture(e.pointerId);startGesture();viewport.classList.add('dragging');});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.values()];const center={x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};if(pts.length>1&&gesture.distance){zoom=Math.max(1,Math.min(3,gesture.zoom*Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)/gesture.distance));const rect=viewport.getBoundingClientRect();const ax=gesture.center.x-rect.left-rect.width/2,ay=gesture.center.y-rect.top-rect.height/2;panX=ax-(ax-gesture.panX)*zoom/gesture.zoom+center.x-gesture.center.x;panY=ay-(ay-gesture.panY)*zoom/gesture.zoom+center.y-gesture.center.y;}else{panX=gesture.panX+center.x-gesture.center.x;panY=gesture.panY+center.y-gesture.center.y;}render();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,e=>{pointers.delete(e.pointerId);if(pointers.size)startGesture();else{gesture=null;viewport.classList.remove('dragging');}});
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const actions={'+':()=>changeZoom(zoom+.25),'=':()=>changeZoom(zoom+.25),'-':()=>changeZoom(zoom-.25),'0':reset,ArrowLeft:()=>{panX+=35;render();},ArrowRight:()=>{panX-=35;render();},ArrowUp:()=>{panY+=35;render();},ArrowDown:()=>{panY-=35;render();}};if(actions[e.key]){e.preventDefault();actions[e.key]();}});
new ResizeObserver(render).observe(viewport);
select(1);reset();
