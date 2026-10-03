/* Camera, accessible controls, live tooltips and venue details. No backend required. */
(() => {
  'use strict';
  const V=window.MiamiVenue,R=window.MiamiRace;
  if(!V||!R)return;
  const svg=V.svg,shell=document.getElementById('map-shell'),camera=document.getElementById('camera');
  const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const view={scale:1,x:0,y:0},pointers=new Map();
  let gesture=null,dragged=false,hover=null,pinnedCar=null,restoreFocus=null;
  const venues={
    stadium:{name:'HARD ROCK STADIUM',type:'THE HEART OF THE CAMPUS',description:'The architectural centerpiece of the Miami Grand Prix campus. The circuit winds around the stadium and its surrounding hospitality districts.',features:['Layered roof, seating bowl & central field','Paddock and race facilities on the north side'],book:false},
    pit:{name:'PIT LANE & PADDOCK',type:'RACE OPERATIONS',description:'The field slows through the pit lane for a brief stop with the crew before rejoining the race. Watch for changing positions as the cars return to the circuit.',features:['Working garages and pit crews','Simulated stops, service pause & rejoin'],book:false},
    marina:{name:'MSC YACHT CLUB',type:'MIA MARINA · TURNS 6–8',description:'Discover elevated views from the three-level Yacht Club, waterfront terraces and private cabanas.',features:['Yacht Club seats or private cabanas','Climate-controlled lounge','Food, beer, wine & sparkling wine','Cabanas accommodate 20 guests per day'],book:true},
    turn5:{name:'TURN 5 LOFTS',type:'PRIVATE SUITE · TURNS 4 & 5',description:'Your own space beside the action, with consecutive corners in view and room to bring your group together.',features:['10 guests each day','Food and beverages included','Branding & customization available'],book:true},
    '72club':{name:'72 CLUB',type:'LUXURY SEATING · TURN 4',description:'A members’ lounge beside the championship podium with dining by Groot Hospitality.',features:['Individual seats or eight-person sofa boxes','Climate-controlled lounge','Assigned Paddock Village tour'],book:true},
    casa:{name:'CASA TUA AT PADDOCK CLUB',type:'LUXURY HOSPITALITY · TURN 1',description:'Signature dining and a hosted bar, with views of cars leaving the pit lane and returning to the circuit.',features:['Menu and hosted bar by Casa Tua','Paddock Club amenities','Pit lane walk, garden and rooftop access'],book:true},
    east:{name:'VILLAS AT EAST CAMPUS',type:'PRIVATE VILLA · TURNS 1 & 2',description:'A two-story setting with an indoor lounge, trackside balcony and open-air rooftop.',features:['20 guests per day','Food and beverages inside your suite','Suite attendant and branding opportunities'],book:true},
    sunset:{name:'SUNSET KEY VILLAS',type:'PRIVATE VILLA · TURNS 1 & 2',description:'A private race-weekend setting with a spacious lounge, balcony and rooftop.',features:['30 guests per day','Climate-controlled lounge','Food, beverages and suite attendant'],book:true},
    verista:{name:'VERISTA CLUB',type:'CLUB HOSPITALITY · TURNS 3 & 10',description:'Shaded seating and rooftop access offer two perspectives on the circuit, with a comfortable lounge for your group.',features:['Reserved seating facing Turn 3','Rooftop views of the Turn 10 straight','Chef-curated buffet and included beverages','Preferred parking'],book:true},
    grandstand:{name:'NORTH GRANDSTANDS',type:'START / FINISH STRAIGHT',description:'Tiered trackside seating overlooks the fast run toward Turn 1. Seating rows, crowd groups and structural roofs are individually drawn in SVG.',features:['Main-straight views','Pedestrian bridge access'],book:false}
  };
  // Root SVG coordinates include preserveAspectRatio letterboxing and fullscreen changes.
  function rootPoint(clientX,clientY){const p=svg.createSVGPoint();p.x=clientX;p.y=clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
  function constrain(){const margin=130;view.x=clamp(view.x,1600*(1-view.scale)-margin,margin);view.y=clamp(view.y,876*(1-view.scale)-margin,margin);}
  function renderCamera(){constrain();const transform=`translate(${view.x} ${view.y}) scale(${view.scale})`;camera.setAttribute('transform',transform);V.activityCamera.setAttribute('transform',transform);$('zoom-value').textContent=Math.round(view.scale*100)+'%';$('zoom-out').disabled=view.scale<=1;$('zoom-in').disabled=view.scale>=5;positionTooltip();}
  function zoom(next,point={x:800,y:438}){next=clamp(next,1,5);const ratio=next/view.scale;view.x=point.x-(point.x-view.x)*ratio;view.y=point.y-(point.y-view.y)*ratio;view.scale=next;renderCamera();}
  function reset(){view.scale=1;view.x=0;view.y=0;renderCamera();}
  function rememberGesture(){const p=[...pointers.values()],center=p.reduce((a,b)=>({x:a.x+b.x/p.length,y:a.y+b.y/p.length}),{x:0,y:0});gesture={...view,center,distance:p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};}
  shell.addEventListener('pointerdown',e=>{if(!e.target.closest('#venue-map,#activity-map')||(e.button!==0&&e.pointerType!=='touch'))return;pointers.set(e.pointerId,rootPoint(e.clientX,e.clientY));svg.setPointerCapture(e.pointerId);dragged=false;rememberGesture();svg.classList.add('dragging');});
  shell.addEventListener('pointermove',e=>{
    if(pointers.has(e.pointerId)){
      pointers.set(e.pointerId,rootPoint(e.clientX,e.clientY));const p=[...pointers.values()],c=p.reduce((a,b)=>({x:a.x+b.x/p.length,y:a.y+b.y/p.length}),{x:0,y:0});
      if(Math.hypot(c.x-gesture.center.x,c.y-gesture.center.y)>3)dragged=true;
      if(p.length===2&&gesture.distance){dragged=true;view.scale=clamp(gesture.scale*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.distance,1,5);const ratio=view.scale/gesture.scale;view.x=c.x-(gesture.center.x-gesture.x)*ratio;view.y=c.y-(gesture.center.y-gesture.y)*ratio;}
      else{view.x=gesture.x+c.x-gesture.center.x;view.y=gesture.y+c.y-gesture.center.y;}
      renderCamera();if(dragged)hideTooltip();
    }else if(hover&&!pinnedCar){hover.clientX=e.clientX;hover.clientY=e.clientY;positionTooltip();}
  });
  function releasePointer(e){
    const wasDown=pointers.has(e.pointerId);
    pointers.delete(e.pointerId);
    if(!wasDown)return;
    if(pointers.size)rememberGesture();else{
      svg.classList.remove('dragging');gesture=null;
      if(!dragged&&e.type==='pointerup'){
        // Pointer capture retargets events, so identify the original location under the pointer.
        const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-venue],[data-car]');
        if(hit?.dataset.venue)openInfo(hit.dataset.venue,hit);
        else if(hit?.dataset.car){pinnedCar=+hit.dataset.car;showCar(pinnedCar,e.clientX,e.clientY);}
        else{pinnedCar=null;hideTooltip();}
      }
    }
  }
  for(const name of ['pointerup','pointercancel','lostpointercapture'])shell.addEventListener(name,releasePointer);
  shell.addEventListener('wheel',e=>{if(!e.target.closest('#venue-map,#activity-map'))return;e.preventDefault();zoom(view.scale*Math.exp(-e.deltaY*.0014),rootPoint(e.clientX,e.clientY));},{passive:false});
  $('zoom-in').addEventListener('click',()=>zoom(view.scale*1.25));$('zoom-out').addEventListener('click',()=>zoom(view.scale/1.25));$('reset-camera').addEventListener('click',reset);
  shell.addEventListener('keydown',e=>{
    if(!e.target.closest('#venue-map,#activity-map'))return;
    if(e.key==='Enter'||e.key===' '){const hit=e.target.closest('[data-venue],[data-car]');if(hit){e.preventDefault();if(hit.dataset.venue)openInfo(hit.dataset.venue,hit);else{pinnedCar=+hit.dataset.car;showCar(pinnedCar);}return;}}
    const actions={'+':()=>zoom(view.scale*1.25),'=':()=>zoom(view.scale*1.25),'-':()=>zoom(view.scale/1.25),'0':reset,ArrowLeft:()=>{view.x+=50;renderCamera();},ArrowRight:()=>{view.x-=50;renderCamera();},ArrowUp:()=>{view.y+=50;renderCamera();},ArrowDown:()=>{view.y-=50;renderCamera();}};
    if(actions[e.key]){e.preventDefault();actions[e.key]();}
  });
  // Dynamic car tooltips use the actual race state.
  function showCar(index,clientX=0,clientY=0){const car=R.state.cars[index];if(!car)return;hover={type:'car',index,clientX,clientY};$('tooltip').innerHTML=`<strong style="border-left:3px solid ${car.color};padding-left:8px">CAR ${String(car.id).padStart(2,'0')}</strong><small>LAP ${car.lap} &nbsp; / &nbsp; P${car.position}${car.pit?' &nbsp; · PIT LANE':''}</small>`;$('tooltip').hidden=false;positionTooltip();}
  function hideTooltip(){if(pinnedCar!==null)return;hover=null;$('tooltip').hidden=true;}
  function positionTooltip(){
    if(!hover||$('tooltip').hidden)return;
    const bounds=shell.getBoundingClientRect();let x=hover.clientX-bounds.left+14,y=hover.clientY-bounds.top-50;
    if(hover.type==='car'){const car=R.state.cars[hover.index],p=svg.createSVGPoint();p.x=car.x;p.y=car.y;const screen=p.matrixTransform(camera.getScreenCTM());x=screen.x-bounds.left+16;y=screen.y-bounds.top-52;}
    x=clamp(x,8,bounds.width-$('tooltip').offsetWidth-8);y=clamp(y,8,bounds.height-$('tooltip').offsetHeight-8);$('tooltip').style.transform=`translate(${x}px,${y}px)`;
  }
  shell.addEventListener('pointerover',e=>{if(pointers.size||pinnedCar!==null)return;const hit=e.target.closest('[data-car],[data-venue]');if(!hit)return;if(hit.dataset.car)showCar(+hit.dataset.car,e.clientX,e.clientY);else{const v=venues[hit.dataset.venue];if(!v)return;hover={type:'venue',clientX:e.clientX,clientY:e.clientY};$('tooltip').innerHTML=`<strong>${v.name}</strong><small>${v.type} · Select for details</small>`;$('tooltip').hidden=false;positionTooltip();}});
  shell.addEventListener('pointerout',e=>{const hit=e.target.closest('[data-car],[data-venue]');if(hit&&!hit.contains(e.relatedTarget))hideTooltip();});
  shell.addEventListener('focusin',e=>{if(e.target.dataset.car){showCar(+e.target.dataset.car);}else if(e.target.dataset.venue){const b=e.target.getBoundingClientRect();const v=venues[e.target.dataset.venue];hover={type:'venue',clientX:b.x+b.width/2,clientY:b.y};$('tooltip').innerHTML=`<strong>${v.name}</strong><small>Press Enter for details</small>`;$('tooltip').hidden=false;positionTooltip();}});
  shell.addEventListener('focusout',hideTooltip);
  R.onFrame=positionTooltip;
  document.addEventListener('race-tick',()=>{if(hover?.type==='car')showCar(hover.index,hover.clientX,hover.clientY);});
  // Venue details remain small, with email inquiries only when a hospitality product is selected.
  function openInfo(id,trigger){const v=venues[id];if(!v)return;restoreFocus=trigger;pinnedCar=null;hideTooltip();$('info-kicker').textContent=v.type;$('info-title').textContent=v.name;$('info-description').textContent=v.description;$('info-features').innerHTML=v.features.map(f=>`<li>${f}</li>`).join('');$('info-book').hidden=!v.book;$('info-note').textContent=v.book?'Opens a reservation inquiry to the Miami GP hospitality team.':'Venue reconstruction · simulated event activity.';if(v.book)$('info-book').href=`mailto:jmizgalski@F1Miamigp.com?subject=${encodeURIComponent('2027 Miami Grand Prix — '+v.name)}&body=${encodeURIComponent('Hello Jack,\n\nI’m interested in '+v.name+' for the 2027 Miami Grand Prix. Please share availability, pricing and reservation details.\n\nThank you.')}`;$('venue-info').hidden=false;$('close-info').focus({preventScroll:true});}
  function closeInfo(){const wasOpen=!$('venue-info').hidden;$('venue-info').hidden=true;if(wasOpen)restoreFocus?.focus({preventScroll:true});}
  $('close-info').addEventListener('click',closeInfo);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeInfo();pinnedCar=null;hideTooltip();}});
  // Race and display controls.
  function reflectRace(){const paused=R.state.paused;$('play-pause').textContent=paused?'▶':'Ⅱ';$('play-pause').setAttribute('aria-label',paused?'Resume simulation':'Pause simulation');$('play-pause').title=paused?'Resume simulation':'Pause simulation';document.body.classList.toggle('paused',paused);}
  $('play-pause').addEventListener('click',()=>{if(R.state.finished)R.reset();else R.pause(!R.state.paused);});
  document.addEventListener('race-status-change',reflectRace);
  $('speed-control').addEventListener('click',()=>{R.setRate(R.state.rate===1?2:R.state.rate===2?4:1);$('speed-control').textContent=R.state.rate+'×';$('speed-control').setAttribute('aria-label',`Simulation speed: ${R.state.rate} times`);});
  $('toggle-board').addEventListener('click',()=>{const off=document.querySelector('.leaderboard').classList.toggle('collapsed');$('toggle-board').textContent=off?'+':'−';$('toggle-board').setAttribute('aria-expanded',String(!off));$('toggle-board').setAttribute('aria-label',off?'Expand leaderboard':'Collapse leaderboard');});
  $('toggle-labels').addEventListener('click',()=>{const hidden=document.body.classList.toggle('labels-hidden');$('toggle-labels').setAttribute('aria-pressed',String(!hidden));$('toggle-labels').setAttribute('aria-label',hidden?'Show venue names':'Hide venue names');});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();else shell.classList.toggle('expanded');}catch(error){console.warn('Fullscreen unavailable:',error);}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Fullscreen');reset();});
  if(innerWidth<560){document.querySelector('.leaderboard').classList.add('collapsed');$('toggle-board').textContent='+';$('toggle-board').setAttribute('aria-expanded','false');$('toggle-board').setAttribute('aria-label','Expand leaderboard');}
  new ResizeObserver(()=>{renderCamera();}).observe(shell);
  window.MiamiCamera={view,zoom,reset,openInfo,closeInfo};
  reflectRace();reset();
})();
