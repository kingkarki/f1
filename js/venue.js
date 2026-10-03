/* Native SVG construction. All geometry is independent of the reference bitmap. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const svg=document.getElementById('venue-map');
  const layers={};
  let seed=2027;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const num=n=>Number(n.toFixed(2));
  const add=(layer,markup)=>{(layers[layer]??=[]).push(markup);};
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const line=(x1,y1,x2,y2,stroke,width=1,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  const use=(id,x,y,w,h,extra='')=>`<use href="#${id}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
  const group=(x,y,angle,body,extra='')=>`<g transform="translate(${x} ${y}) rotate(${angle})" ${extra}>${body}</g>`;
  const interactive=(id,name,body)=>`<g class="venue-object" data-venue="${id}" tabindex="0" role="button" aria-label="${name}">${body}</g>`;
  const blocks=[];
  const block=(x,y,w,h,a=0)=>blocks.push({x:x+w/2,y:y+h/2,w:w/2+5,h:h/2+5,a:a*Math.PI/180,ox:x,oy:y});
  const trackD='M900 282 C945 307 1005 346 1034 371 Q1061 390 1042 411 C1028 424 1004 440 993 463 C983 483 999 515 974 545 Q962 565 944 574 C911 595 869 584 827 573 C784 564 775 547 735 543 C695 537 665 519 643 496 C619 471 600 444 566 443 C538 442 515 464 479 478 Q441 502 413 495 C377 487 366 455 338 442 C310 427 287 443 256 449 C224 453 204 464 199 489 C192 522 204 555 223 572 Q235 584 269 584 L669 584 C711 584 731 589 774 605 C822 625 847 641 903 647 Q969 654 1004 650 C1090 622 1351 499 1453 438 Q1498 416 1473 393 C1449 369 1441 350 1461 331 C1477 314 1502 328 1522 317 Q1544 305 1539 285 Q1535 273 1551 263 Q1562 255 1553 243 Q1543 231 1556 218 C1577 198 1571 168 1543 164 L1160 145 L699 124 L366 114 Q337 112 345 138 C351 151 377 171 420 193 Q446 211 475 199 C520 180 567 151 606 147 Q630 147 659 165 C742 197 827 239 900 282 Z';
  const roadD='M36 -20 L52 398 L61 624 Q66 650 103 653 L332 678 Q462 711 596 720 L809 749 Q913 773 991 745 L1280 654 L1598 582';
  const serviceD='M337 133 L338 369 Q337 400 377 404 L495 407 M927 173 L926 257 M1033 263 L1129 273 L1148 336 L1155 494 L1168 577 M671 593 L671 713 M820 637 L812 746';
  document.getElementById('definitions').innerHTML=`
    <linearGradient id="grass" x2=".8" y2="1"><stop stop-color="#859956"/><stop offset=".45" stop-color="#779052"/><stop offset="1" stop-color="#627f49"/></linearGradient>
    <linearGradient id="water-fill" x2=".2" y2="1"><stop stop-color="#174f5b"/><stop offset=".45" stop-color="#327e89"/><stop offset="1" stop-color="#236c78"/></linearGradient>
    <linearGradient id="pool" x2="1" y2="1"><stop stop-color="#459ba5"/><stop offset="1" stop-color="#83bfbe"/></linearGradient>
    <linearGradient id="roof" x2=".3" y2="1"><stop stop-color="#fffff6"/><stop offset=".5" stop-color="#e9e9dc"/><stop offset="1" stop-color="#c7cdc3"/></linearGradient>
    <linearGradient id="roof-warm" x2="1" y2="1"><stop stop-color="#fef9e6"/><stop offset="1" stop-color="#d9d8c9"/></linearGradient>
    <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#d8e6de"/><stop offset=".45" stop-color="#71948d"/><stop offset="1" stop-color="#375d5d"/></linearGradient>
    <radialGradient id="tree-fill" cx=".36" cy=".27"><stop stop-color="#a1b469"/><stop offset=".5" stop-color="#718b49"/><stop offset="1" stop-color="#3b5d36"/></radialGradient>
    <pattern id="concrete" width="13" height="13" patternUnits="userSpaceOnUse"><rect width="13" height="13" fill="#c9cabb"/><path d="M13 0H0V13" fill="none" stroke="#b5b9a8" stroke-width=".35"/></pattern>
    <pattern id="seats" width="5" height="4" patternUnits="userSpaceOnUse"><rect width="5" height="4" fill="#638b8f"/><path d="M0 3.6H5" stroke="#dbe3d8" stroke-width=".5"/><circle cx="1" cy="1.8" r=".7" fill="#e5d4ba"/><circle cx="3.5" cy="1.8" r=".65" fill="#d8e7dc"/></pattern>
    <pattern id="field-stripes" width="18" height="12" patternUnits="userSpaceOnUse"><rect width="18" height="12" fill="#467d45"/><rect width="9" height="12" fill="#54894d"/></pattern>
    <pattern id="checkers" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#eeeede"/><path d="M0 0H2V2H0ZM2 2H4V4H2Z" fill="#263532"/></pattern>
    <pattern id="roof-ribs" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#roof)"/><path d="M1 0V5" stroke="#9ca99d" stroke-width=".4"/></pattern>
    <symbol id="tree" viewBox="-9 -9 18 18"><circle r="7.2" fill="url(#tree-fill)"/><circle cx="-2" cy="-3.5" r="3" fill="#a7b876" opacity=".5"/><circle cx="3" cy="1" r="3.7" fill="#415f31" opacity=".25"/><path d="M-3 -3Q2 -6 4 -1M-5 2Q-1 -1 1 4" fill="none" stroke="#c3cc8f" stroke-width=".6" opacity=".4"/></symbol>
    <symbol id="palm-canopy" viewBox="-11 -11 22 22"><g fill="#638241" stroke="#476933" stroke-width=".3"><path d="M0 0Q-8 -9 -10 -5Q-5 -5 0 0M0 0Q-1 -11 4 -10Q1 -5 0 0M0 0Q8 -8 10 -3Q5 -4 0 0M0 0Q12 1 9 6Q5 2 0 0M0 0Q7 9 2 11Q3 6 0 0M0 0Q-4 11 -8 7Q-3 5 0 0M0 0Q-12 4 -11 0Q-5 1 0 0"/></g><g fill="none" stroke="#b3bb72" stroke-width=".65"><path d="M0 0Q-5 -6 -9 -5M0 0Q1 -6 3 -9M0 0Q6 -5 9 -3M0 0Q7 1 9 5M0 0Q4 7 2 10M0 0Q-3 7 -7 7M0 0Q-8 1 -10 0"/></g><circle r="1.4" fill="#b5b16b"/></symbol>
    <symbol id="road-car" viewBox="-4 -2 8 4"><rect x="-3.8" y="-1.6" width="7.6" height="3.2" rx=".9" fill="#1e2a23" opacity=".2" transform="translate(.6 .6)"/><rect x="-3.5" y="-1.5" width="7" height="3" rx=".8" fill="currentColor"/><path d="M-1.5 -1.3H1.4L2 1.3H-2Z" fill="#718683"/><path d="M3 -.9V.9" stroke="#f2e9c6" stroke-width=".5"/></symbol>
    <symbol id="f1-car" viewBox="-12 -6 24 12"><ellipse cx="-1" cy="1" rx="10.8" ry="4.5" fill="#071014" opacity=".23"/><g fill="#171e20" stroke="#677271" stroke-width=".22"><rect x="-7.8" y="-5" width="4.4" height="2.6" rx=".55"/><rect x="-7.8" y="2.4" width="4.4" height="2.6" rx=".55"/><rect x="4" y="-5" width="3.5" height="2.3" rx=".4"/><rect x="4" y="2.7" width="3.5" height="2.3" rx=".4"/></g><g fill="currentColor"><path d="M-9 -1.5L-5 -2.5 -1 -2.8 3 -1.1 9 -.65 10.8 0 9 .65 3 1.1 -1 2.8 -5 2.5 -9 1.5Z"/><path d="M8.3 -4.8H10.1L11 -3.2V3.2L10.1 4.8H8.3V1.2H6.8V-1.2H8.3Z"/><rect x="-10.4" y="-4.3" width="1.8" height="8.6" rx=".2"/></g><g stroke="#161f23" stroke-width=".6"><path d="M-6 -1L-5 -4M-6 1L-5 4M4 -1L6 -3.8M4 1L6 3.8"/></g><ellipse cx="0" cy="0" rx="2" ry="1.2" fill="#13232a"/><circle cx=".5" cy="0" r=".75" fill="#faf1ce"/><path d="M-3 -.55L-.8 -.75M2 0H8" stroke="#ffffffad" stroke-width=".45"/><path d="M8.8 -4V4M-9.7 -3.7V3.7" stroke="#ffffffb0" stroke-width=".35"/></symbol>
    <symbol id="boat" viewBox="-6 -15 12 30"><path d="M0 -14Q7 -7 5 12L-5 12Q-7 -7 0 -14" fill="#112d30" opacity=".2" transform="translate(1 1)"/><path d="M0 -14Q6 -8 5 12H-5Q-6 -8 0 -14" fill="#fbf8e8" stroke="#adbeb4" stroke-width=".4"/><rect x="-3.2" y="-4" width="6.4" height="12" rx="1" fill="#d8d8c5"/><path d="M-2.8 -3H2.8V1H-2.8Z" fill="#446b79"/><rect x="-2" y="3" width="4" height="6" fill="#f9f7e9"/><path d="M-3 11H3M-2 -8H2" stroke="#9eaa9d" stroke-width=".5"/></symbol>
    <symbol id="spectator-group" viewBox="0 0 20 8"><g fill="#e8d8bc"><circle cx="1" cy="2" r=".65"/><circle cx="6" cy="2" r=".6"/><circle cx="12" cy="5" r=".65"/><circle cx="18" cy="1" r=".7"/></g><g fill="#e8eddf"><circle cx="3" cy="5" r=".65"/><circle cx="9" cy="2" r=".6"/><circle cx="14" cy="1" r=".6"/><circle cx="19" cy="6" r=".65"/></g><g fill="#8b5448"><circle cx="4" cy="1" r=".65"/><circle cx="11" cy="1" r=".6"/><circle cx="16" cy="5" r=".6"/></g><g fill="#293e4c"><circle cx="7" cy="5" r=".6"/><circle cx="15" cy="3" r=".65"/><circle cx="1" cy="6" r=".6"/></g></symbol>
    <symbol id="umbrella" viewBox="-5 -5 10 10"><circle cx=".8" cy="1" r="4.4" fill="#26382930"/><path d="M0 -4.5L3.9 -2.25 3.9 2.25 0 4.5 -3.9 2.25 -3.9 -2.25Z" fill="#f6ecd2"/><path d="M0 0V-4.5M0 0L3.9 2.25M0 0L-3.9 2.25" stroke="#b7bca0" stroke-width=".45"/><circle r=".45" fill="#a29d83"/></symbol>
    <path id="racing-line" d="${trackD}" fill="none"/>
    <path id="service-route" d="${roadD}" fill="none"/>
    <clipPath id="canal-clip"><path d="M0 27L1600 77V109L0 70Z"/></clipPath>
    <clipPath id="marina-clip"><path d="M166 426Q246 397 307 432L292 468 223 486 205 554Q150 521 166 426Z"/></clipPath>
  `;
  // Ground and district layout.
  add('background',rect(-150,-150,1900,1176,'#cecfbf'));
  add('background',rect(46,77,1516,691,'url(#grass)'));
  add('background',path('M69 641L406 657 772 729 965 765 1517 585 1600 590V876H65Z','#c4c8b4'));
  add('environment',path('M1045 187L1510 198 1518 223 1341 247 1244 274 1160 418 1080 398Z','#8b9e5d'));
  add('environment',path('M1167 295Q1276 271 1391 288L1415 328 1363 356 1214 362 1182 492Z','#a0af70'));
  add('environment',path('M124 130H312V386H113Z','#89985e'));
  add('environment',path('M361 242H519V380H350Z','url(#concrete)'));
  add('environment',path('M601 596L742 595 786 617 802 711 678 728 592 692Z','url(#concrete)'));
  add('environment',path('M1060 543L1160 529 1238 511 1339 467 1405 430 1425 448 1143 584Z','#94a562'));
  add('environment',path('M917 153L1064 159 1120 205 1124 261 918 251Z','#afba82'));
  for(let i=0;i<8;i++)add('environment',rect(940,170+i*8,145,3,'#c8cf9b'));
  // Low contrast blocks outside the venue complete the urban context.
  for(let row=0;row<5;row++)for(let col=0;col<13;col++){
    const x=72+col*50,y=777+row*24;
    add('background',rect(x,y,38,16,'#bcbfac',`rx="1" transform="rotate(4 ${x} ${y})"`));
    add('background',rect(x+3,y+2,31,11,'#dadbcc'));
  }
  for(let i=0;i<35;i++)add('background',rect(80+i*42,-7+(i%3)*3,28,18,'#babdab'));
  add('water',path('M0 27L1600 77V109L0 70Z','url(#water-fill)','stroke="#bac7b3" stroke-width="2"'));
  add('water',path('M166 426Q246 397 307 432L292 468 223 486 205 554Q150 521 166 426Z','url(#water-fill)','stroke="#d6d7bf" stroke-width="2"'));
  for(let i=0;i<80;i++){
    const x=10+random()*1580,y=26+x*.031+random()*38;
    add('water',path(`M${num(x)} ${num(y)}q6 -1.6 13 0t13 0`,'none',`class="water-glint" clip-path="url(#canal-clip)" stroke="#b9dbcc" stroke-width=".45" style="--wave-time:${4+random()*5}s;--wave-delay:-${random()*8}s"`));
  }
  for(let i=0;i<25;i++)add('water',path(`M${num(165+random()*130)} ${num(425+random()*110)}q4 -1 12 0`,'none',`class="water-glint" clip-path="url(#marina-clip)" stroke="#9ecec2" stroke-width=".45" style="--wave-delay:-${random()*7}s"`));
  // Surrounding streets, service roads and paths, with verges and lane markings.
  add('roads',path(roadD,'none','stroke="#dfe0d0" stroke-width="31" stroke-linejoin="round"'));
  add('roads',path(roadD,'none','stroke="#697170" stroke-width="24" stroke-linejoin="round"'));
  add('roads',path(roadD,'none','stroke="#b9b9a2" stroke-width=".8" stroke-dasharray="9 9"'));
  add('roads',path('M1116 124L1151 307 1155 498 1176 576 M83 399L332 399 M1592 -20L1549 141','none','stroke="#d7d8c4" stroke-width="15"'));
  add('roads',path('M1116 124L1151 307 1155 498 1176 576 M83 399L332 399 M1592 -20L1549 141','none','stroke="#747c70" stroke-width="11"'));
  add('roads',path(serviceD,'none','stroke="#b9c0a7" stroke-width="9" stroke-linejoin="round"'));
  add('roads',path(serviceD,'none','stroke="#788470" stroke-width="6" stroke-linejoin="round"'));
  const walks=['M84 98L333 106','M355 257H524','M353 330H503','M921 163L921 264','M934 209H1120','M1060 475L1136 477','M388 560L551 554','M455 542L455 587','M658 559L739 587','M775 687H1031','M1338 320L1338 418','M1197 329L1212 527'];
  walks.forEach(d=>add('roads',path(d,'none','stroke="#d9cfad" stroke-width="5"')));
  // Race circuit: independently layered barrier, runoff, kerbs, edge lines and asphalt.
  add('track',use('racing-line',0,0,1600,876,'stroke="#c4cab4" stroke-width="59" stroke-linejoin="round"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#2f8590" stroke-width="54" stroke-linejoin="round"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#a7d0c0" stroke-width="39" stroke-opacity=".35"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#f3ead5" stroke-width="29"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#b95f55" stroke-width="28" stroke-dasharray="5 7"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#313d41" stroke-width="24"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#455153" stroke-width="19"'));
  add('track',use('racing-line',0,0,1600,876,'stroke="#566060" stroke-width="9" stroke-opacity=".4"'));
  add('track',group(909,287,31,rect(-2,-12,4,24,'url(#checkers)')));
  for(let i=0;i<14;i++)add('track',group(800+i*6,228+i*3.25,29,path('M-2 -7H2V-4 M-2 4H2V7','none','stroke="#c5cfca" stroke-width=".5"')));
  const turns=[[1060,384,1],[1006,477,2],[942,593,3],[545,429,4],[414,515,5],[327,421,6],[180,483,7],[217,591,8],[701,574,9],[991,668,10],[1472,445,11],[1443,340,12],[1507,305,13],[1571,268,14],[1533,231,15],[1536,148,16],[350,98,17],[447,222,18],[618,135,19]];
  turns.forEach(([x,y,n])=>add('venue-labels',`<text class="turn-label" x="${x}" y="${y}">T${n}</text>`));
  // Reusable parking lots with real rows, bay lines, planted islands and cars.
  function parking(x,y,w,h,angle=0,density=.78){
    let b=rect(3,4,w,h,'#283c2729','rx="6"')+rect(0,0,w,h,'#737b70','rx="5"')+rect(4,4,w-8,h-8,'#7e8577','rx="3"');
    for(let yy=12;yy<h-12;yy+=22){
      b+=rect(7,yy+9,w-14,3,'#819661','rx="1.5"');
      for(let xx=10;xx<w-9;xx+=7){
        b+=path(`M${xx} ${yy-7}v13M${xx} ${yy+13}v6`,'none','stroke="#c5c7ab" stroke-width=".45"');
        if(random()<density)b+=group(xx+3,yy,90,use('road-car',-3.4,-1.5,6.8,3,`color="${['#e4e4d5','#b9bdb4','#4b5b5a','#929991','#31444a','#b7b4a0'][Math.floor(random()*6)]}"`));
      }
    }
    add('parking',group(x,y,angle,b));block(x,y,w,h,angle);
  }
  parking(87,136,43,238,0,.64);parking(359,291,133,77);parking(1055,479,78,108);parking(1187,372,81,143);parking(940,699,175,114,-17);parking(1120,681,192,139,-21);parking(1290,632,181,165,-20);parking(1500,569,90,154,0);parking(476,748,107,72);parking(636,740,146,105);parking(828,702,82,72);parking(1230,212,207,52,0,.4);
  // Building primitives have an extruded wall, glazing, roof ribs and rooftop plant.
  function building(x,y,w,h,angle=0,kind='roof',extra=''){
    let b=rect(4,6,w,h,'#253a2733')+rect(0,3,w,h,'#9ea99f')+rect(0,h-3,w,6,'#6c847d')+rect(0,0,w,h,`url(#${kind})`,'stroke="#f5f4e5" stroke-width=".6"');
    for(let xx=5;xx<w;xx+=6)b+=line(xx,h-1,xx,h+3,'#d8e4d6',.5);
    for(let xx=6;xx<w-5;xx+=12)b+=line(xx,1,xx,h-2,'#b6bdae',.35);
    if(w>35&&h>18){b+=rect(5,5,10,6,'#b5c0b7','stroke="#f1f0df" stroke-width=".6"');b+=rect(18,5,6,6,'#a8b6ad');}
    b+=extra;add('buildings',group(x,y,angle,b));block(x,y,w,h,angle);
  }
  building(157,132,129,55,0,'roof-ribs');building(133,145,27,170,0,'roof-ribs');building(160,190,34,27);
  function field(x,y,w,h){let b=rect(x,y,w,h,'url(#field-stripes)','stroke="#d2d6ae" stroke-width="1"');for(let i=0;i<11;i++)b+=line(x+4,y+i*h/10,x+w-4,y+i*h/10,'#d4dcae',.45);b+=rect(x+5,y+3,w-10,h-6,'none','stroke="#e5e5ca" stroke-width=".5"');add('environment',b);block(x,y,w,h);}
  field(162,225,75,40);field(162,273,75,41);
  building(210,329,45,13);building(298,250,13,55);
  building(361,270,142,13,0,'roof-ribs');building(519,294,20,54);building(494,325,25,22);building(495,366,24,21);
  building(365,428,67,24,-17,'roof-ribs');building(440,500,36,17,-17);
  building(436,550,104,16,0,'roof-warm');building(413,518,29,21);building(382,542,18,11);
  building(610,602,27,50);building(650,602,24,53);building(650,665,98,23);building(602,686,65,12);
  add('buildings',rect(637,618,10,43,'url(#pool)','stroke="#faf3d9" stroke-width="3"'));
  building(854,611,53,19,2,'roof-ribs');building(880,566,33,19,-12);
  for(let i=0;i<7;i++)building(883+i*5,435+i*12,32,10,-30,'roof-warm');
  for(let i=0;i<6;i++)building(1024-i*5,459+i*11,28,10,-25);
  building(974,351,51,25,34,'roof-warm');
  building(950,268,37,14,0,'roof-ribs');building(1007,264,114,12,0,'roof-ribs');
  building(940,178,14,38);building(976,188,19,12);building(1103,172,22,14);
  building(1074,578,34,16,-23);building(1163,335,18,69);building(1215,345,56,14);building(1352,324,49,14);building(1326,348,30,12);
  building(1470,370,62,18,12);building(1460,346,64,12);building(1487,417,47,14,-27);
  // Repeated hospitality tents and small event pavilions.
  function tent(x,y,w,h,angle=0){add('buildings',group(x,y,angle,rect(2,3,w,h,'#263d2733')+rect(0,0,w,h,'#e0e0ce')+path(`M0 0L${w/2} ${h/2}L${w} 0Z`,'#fffcec')+path(`M${w} 0L${w/2} ${h/2}L${w} ${h}Z`,'#d5d9c9')+path(`M0 ${h}L${w/2} ${h/2}L${w} ${h}Z`,'#f4f3e0')));block(x,y,w,h,angle);}
  for(let i=0;i<10;i++)tent(353+i*15,380,11,12);
  for(let i=0;i<9;i++)tent(957+i*17,229,12,15);
  for(let i=0;i<10;i++)tent(447+i*12,540,8,10);
  for(let i=0;i<5;i++)tent(1237+i*20,306,15,13);
  for(let i=0;i<7;i++)tent(998+i*17,285,12,12);
  // Grandstands: tiered seats, roof structure, access aisles, supports and crowds.
  function grandstand(x,y,w,h,angle=0,roof=true){
    let b=rect(4,7,w,h,'#1b302c44')+rect(0,4,w,h,'#919f96')+rect(0,0,w,h,'url(#seats)','stroke="#dbe3d4" stroke-width="1"');
    for(let xx=0;xx<w;xx+=20){b+=rect(xx,0,2,h,'#d6d8c1');b+=rect(xx+1,h,1.2,5,'#647c72');}
    for(let yy=2;yy<h;yy+=3)b+=line(0,yy,w,yy,'#bdd1c9',.3);
    if(roof){b+=path(`M0 -5H${w}L${w} 8H0Z`,'url(#roof)','stroke="#eef0df" stroke-width=".5"');for(let xx=4;xx<w;xx+=8)b+=line(xx,-5,xx,8,'#abbcaf',.6);b+=rect(0,8,w,3,'#1a3f3638');}
    for(let xx=4;xx<w-10;xx+=20)b+=use('spectator-group',xx,10,18,9,'class="crowd-wave" style="--crowd-delay:-'+num(random()*7)+'s"');
    add('grandstands',group(x,y,angle,b));block(x,y,w,h,angle);
  }
  grandstand(723,143,215,27,28);grandstand(956,272,115,26,32);grandstand(1074,345,35,20,37);
  grandstand(355,186,96,28,33);grandstand(447,230,104,26,-14);
  grandstand(1017,434,62,21,-29);grandstand(971,483,46,18,77);
  grandstand(128,439,24,75,8);grandstand(139,524,26,42,-20);grandstand(211,411,73,16,0);
  grandstand(1432,361,90,25,-82);grandstand(1452,310,81,24,0);grandstand(1410,464,120,27,-32);
  grandstand(554,475,105,20,32,false);
  // Marina deck, cabanas, pool, docks and a mix of yacht sizes.
  let marina=path('M224 470L282 454 304 478 285 555 245 563 216 530Z','#ddd1ae','stroke="#f2e8ce" stroke-width="1"');
  marina+=path('M230 485Q211 509 232 540L249 540Q235 521 248 496Z','url(#pool)','stroke="#f8f1dc" stroke-width="2"');
  for(let i=0;i<6;i++){marina+=rect(258+i%2*13,492+Math.floor(i/2)*13,7,7,'#4b88a7');marina+=use('umbrella',268+i%2*12,490+Math.floor(i/2)*13,7,7);}
  marina+=rect(254,474,28,9,'url(#roof-warm)','transform="rotate(-15 254 474)"');
  marina+=path('M210 465L202 440M185 481L165 470M193 522L172 532','none','stroke="#cec6a5" stroke-width="3"');
  marina+=path('M226 468L277 453 299 478 283 553 245 561','none','stroke="#faf0d4" stroke-width=".8"');
  add('buildings',interactive('marina','MSC Yacht Club and marina',marina));block(218,480,78,79);
  for(let i=0;i<10;i++){const x=177+(i%3)*15,y=450+Math.floor(i/3)*22;add('boats',group(x,y,20+random()*45,`<g class="boat-drift" style="--boat-time:${8+random()*7}s;--boat-delay:-${random()*9}s">${use('boat',-4,-10,8,20)}</g>`));}
  add('boats',group(298,446,61,`<g class="boat-drift">${use('boat',-6,-15,12,30)}</g>`));
  // Stadium: exterior ring, bowl, individual tiers, playing field and four cable roof planes.
  let stadium=rect(-153,-161,313,338,'#253b2d48','rx="13" transform="translate(9 12)"')+rect(-153,-161,306,322,'#b6bfb2','rx="10" stroke="#e3e3cc" stroke-width="2"')+rect(-150,-158,300,316,'url(#concrete)','rx="9"');
  for(let x=-142;x<=140;x+=15){stadium+=rect(x,-170,8,11,'#b4bba9');stadium+=rect(x,159,8,11,'#bac2b0');}
  for(let y=-143;y<=142;y+=15){stadium+=rect(-163,y,11,8,'#b4bba9');stadium+=rect(152,y,11,8,'#b4bba9');}
  stadium+=rect(-106,-125,212,250,'#284f58','rx="15"');
  for(let i=0;i<12;i++)stadium+=rect(-103+i*3,-121+i*3,206-i*6,242-i*6,'none',`rx="${Math.max(3,13-i*.6)}" stroke="${i%3===0?'#d7deca':'#709596'}" stroke-width="${i%3===0?1.3:1.7}"`);
  for(let i=0;i<12;i++){const x=-90+i*16;stadium+=line(x,-119,x/1.5,-75,'#cdd5c1',1.1);stadium+=line(x,119,x/1.5,75,'#cdd5c1',1.1);}
  for(let i=0;i<10;i++){const y=-103+i*23;stadium+=line(-103,y,-55,y*.65,'#cdd5c1',1);stadium+=line(103,y,55,y*.65,'#cdd5c1',1);}
  stadium+=rect(-52,-72,104,144,'url(#field-stripes)','stroke="#c2ce9d" stroke-width="3"');
  stadium+=rect(-43,-63,86,126,'none','stroke="#edf0cd" stroke-width=".7"')+line(-43,0,43,0,'#edf0cd',.65)+`<circle r="12" fill="none" stroke="#edf0cd" stroke-width=".65"/>`+rect(-22,-63,44,20,'none','stroke="#edf0cd" stroke-width=".6"')+rect(-22,43,44,20,'none','stroke="#edf0cd" stroke-width=".6"');
  for(let i=0;i<30;i++)stadium+=use('spectator-group',-96+(i%5)*38,-115+Math.floor(i/5)*40,16,7);
  stadium+=path('M-142 -152H142V152H-142Z M-69 -88V88H69V-88Z','#31494055','fill-rule="evenodd" transform="translate(3 7)"');
  stadium+=path('M-142 -152H142L69 -88H-69Z','#fbfbec','stroke="#d8dfcf" stroke-width=".7"')+path('M142 -152V152L69 88V-88Z','url(#roof)','stroke="#d6dcce" stroke-width=".7"')+path('M142 152H-142L-69 88H69Z','#e5e8dd','stroke="#c7d2c4" stroke-width=".7"')+path('M-142 152V-152L-69 -88V88Z','url(#roof-warm)','stroke="#d7decb" stroke-width=".7"');
  for(let i=0;i<=24;i++){const f=i/24;stadium+=line(-142+284*f,-152,-69+138*f,-88,'#b8c4b6',.45);stadium+=line(-142+284*f,152,-69+138*f,88,'#b8c4b6',.45);stadium+=line(-142,-152+304*f,-69,-88+176*f,'#bbc6b8',.4);stadium+=line(142,-152+304*f,69,-88+176*f,'#adbdae',.45);}
  stadium+=rect(-69,-88,138,176,'none','stroke="#f5f8e9" stroke-width="2"')+rect(-73,-92,146,184,'none','stroke="#516c6c" stroke-width="1" class="stadium-led"');
  for(const [x,y] of [[-111,-117],[111,-117],[-111,117],[111,117]]){
    stadium+=`<ellipse cx="${x+3}" cy="${y+4}" rx="8" ry="7" fill="#405b5930"/><circle cx="${x}" cy="${y}" r="8" fill="#87a4a0"/>`;
    for(let a=0;a<12;a++){const angle=a*Math.PI/6;stadium+=line(x,y,x+Math.cos(angle)*8,y+Math.sin(angle)*8,'#d7e3d9',.5);}
    stadium+=line(x,y,x*.64,y*.75,'#fefdf1',1.2);
    stadium+=line(x,y,x*1.28,y*1.29,'#fefdf1',1);
  }
  stadium+=rect(-147,-157,294,314,'none','stroke="#edf1df" stroke-width="1.2" class="hover-edge"');
  add('stadium',interactive('stadium','Hard Rock Stadium',group(720,367,30,`<g transform="scale(1 .8)">${stadium}</g>`)));
  // Paddock garages lie inside the main straight, not on the racing surface.
  let pit=group(734,225,29,rect(4,6,193,20,'#20362938')+rect(0,2,193,20,'#778e88')+rect(0,0,193,17,'url(#roof-ribs)','stroke="#f3f0e0" stroke-width=".8"'));
  for(let i=0;i<10;i++){
    let garage=rect(0,0,15,4,['#ae5042','#598998','#b0b9b4','#ad743e','#496c5a'][i%5])+rect(0,4,15,6,'#284e56')+rect(1,4.6,13,1,'#f4df9b','opacity=".75"');
    pit+=group(739+i*16,247+i*8.9,29,garage);
  }
  add('pit-lane',interactive('pit','Pit lane and paddock',pit));
  // Bridges crossing the track remain above cars in the visual stacking order.
  function bridge(x,y,length,angle){add('bridges',group(x,y,angle,rect(5,5,8,length,'#18332a40')+rect(-1,-3,10,length+6,'#a1b3a6')+rect(0,0,8,length,'#e7e9d3')+line(1,0,1,length,'#7f9b89',.7)+line(7,0,7,length,'#7f9b89',.7)+path(`M2 0v${length}M6 0v${length}`,'none','stroke="#b2c7b5" stroke-width=".5" stroke-dasharray="2 3"')));}
  bridge(649,107,83,3);bridge(919,259,53,30);bridge(955,529,48,-10);bridge(995,610,73,-3);bridge(775,566,66,23);bridge(539,566,60,0);bridge(267,425,57,22);bridge(258,553,49,0);bridge(1381,448,62,-27);bridge(1503,305,49,0);
  // Pavilion terraces with tiny tables, umbrellas and crowds.
  for(const [x,y,w,h] of [[418,521,91,28],[598,564,116,29],[969,198,130,27],[1287,353,71,28],[1470,362,52,35],[877,448,38,79]]){
    for(let xx=x;xx<x+w;xx+=12)for(let yy=y;yy<y+h;yy+=12){
      add('landscaping',`<circle cx="${xx+3}" cy="${yy+3}" r="2.6" fill="#bebd9d"/>`+use('umbrella',xx-1,yy-1,8,8));
      if(random()>.35)add('spectators',use('spectator-group',xx+3,yy+5,10,4,`class="crowd-wave" style="--crowd-time:${4+random()*5}s;--crowd-delay:-${random()*6}s"`));
    }
  }
  // Fence posts and trackside boards use samples of the same circuit path.
  const racingLine=document.getElementById('racing-line');
  const totalLength=racingLine.getTotalLength();
  const boundaryPoints=[];
  for(let d=0;d<totalLength;d+=10){const p=racingLine.getPointAtLength(d),q=racingLine.getPointAtLength((d+1)%totalLength);const a=Math.atan2(q.y-p.y,q.x-p.x);boundaryPoints.push(p);const nx=-Math.sin(a),ny=Math.cos(a);for(const side of [-1,1])add('track',line(num(p.x+nx*side*30),num(p.y+ny*side*30),num(p.x+nx*side*32),num(p.y+ny*side*32),'#a4b2a3',.6));}
  for(const d of [70,530,1310,1960,2410,3180,3700]){
    const p=racingLine.getPointAtLength(d%totalLength),q=racingLine.getPointAtLength((d+1)%totalLength);const a=Math.atan2(q.y-p.y,q.x-p.x),x=p.x-Math.sin(a)*31,y=p.y+Math.cos(a)*31;
    add('buildings',group(num(x),num(y),num(a*180/Math.PI),rect(-17,-4,34,8,'#173e3b','rx=".4"')+`<text x="0" y="1.5" text-anchor="middle" font-family="sans-serif" font-size="3.8" letter-spacing=".9" fill="#dae7d7" class="screen-glow">MIAMI GP</text>`));
  }
  // Landscaping is constrained to planted districts and avoids the circuit and buildings.
  function occupied(x,y){
    if(boundaryPoints.some(p=>(p.x-x)**2+(p.y-y)**2<36**2))return true;
    const dx=x-720,dy=y-367,a=-Math.PI/6;
    if(Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<164&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<147)return true;
    return blocks.some(b=>{const dx=x-b.x,dy=y-b.y;return Math.abs(dx*Math.cos(-b.a)-dy*Math.sin(-b.a))<b.w&&Math.abs(dx*Math.sin(-b.a)+dy*Math.cos(-b.a))<b.h;});
  }
  let palmCount=0;
  function tree(x,y,scale=1,palm=false){
    const s=num(scale),shadow=`<ellipse cx="3" cy="4.5" rx="${palm?6:6.3}" ry="3.8" fill="#1f382d" opacity=".2"/>`;
    if(palm){palmCount++;add('palms',`<g transform="translate(${num(x)} ${num(y)}) scale(${s})">${shadow}<path d="M0 0L2 5" stroke="#998466" stroke-width="1.3"/><g class="${palmCount%3?'':'palm-sway'}" style="--sway-time:${num(6+random()*5)}s;--sway-delay:-${num(random()*12)}s">${use('palm-canopy',-9,-9,18,18)}</g></g>`);}
    else add('landscaping',`<g transform="translate(${num(x)} ${num(y)}) scale(${s})">${shadow}${use('tree',-8,-8,16,16)}</g>`);
  }
  for(let x=60;x<1590;x+=13)tree(x,82+x*.028,.7+random()*.25,x%3>1);
  for(let x=60;x<1570;x+=21)tree(x,12+x*.03,.72,true);
  for(let y=130;y<620;y+=15)tree(66,y,.75,true);
  const regions=[[80,104,247,288,80],[360,243,178,156,38],[389,503,155,66,35],[594,571,157,28,16],[943,172,178,78,27],[1166,286,261,83,62],[1170,352,54,151,22],[1308,514,150,80,45],[870,781,660,78,92],[822,682,77,110,20],[753,608,260,26,22],[102,730,293,129,65],[475,804,254,58,46],[1389,241,114,62,17],[941,418,42,133,12]];
  regions.forEach(([x,y,w,h,count])=>{for(let i=0;i<count*5;i++){if(count<=0)break;const xx=x+random()*w,yy=y+random()*h;if(!occupied(xx,yy)){tree(xx,yy,.6+random()*.35,random()>.38);count--;}}});
  for(let x=948;x<1115;x+=14)tree(x,252,.65,true);
  for(let x=1250;x<1410;x+=12)tree(x,278,.6,true);
  // Flags: only the fabric is deformed by the central animation loop.
  const flagPositions=[[142,421],[285,430],[381,421],[503,539],[581,549],[911,414],[1047,455],[960,300],[945,181],[1090,252],[1378,310],[1465,480],[1202,580],[870,613],[341,177],[533,237],[677,188],[1173,180],[749,671],[559,604],[156,589],[1501,370],[694,713],[413,517]];
  flagPositions.forEach(([x,y],i)=>add('flags',group(x,y,0,line(0,0,0,-16,'#8b9381',.7)+line(1,1,8,8,'#30452e33',1)+`<path class="flag-fabric" data-phase="${num(random()*6.28)}" data-amplitude="${num(.65+random()*.6)}" d="M0 -16Q3 -18 6 -16T12 -16V-9Q9 -7 6 -9T0 -9Z" fill="${i%7===0?'url(#checkers)':['#dddbbd','#3b777b','#b76c58','#c7b680','#345a53'][i%5]}" stroke="#ffffff40" stroke-width=".3"/>`)));
  // Controlled, readable area labels and separate transparent interaction regions.
  const labelData=[[721,364,'HARD ROCK STADIUM'],[794,228,'PADDOCK & PIT LANE'],[252,553,'MIA MARINA'],[421,355,'WEST CAMPUS'],[1071,230,'NORTH CAMPUS'],[1090,552,'EAST CAMPUS'],[1471,347,'THE BEACH'],[496,570,'THE PROMENADE']];
  labelData.forEach(([x,y,t])=>add('venue-labels',`<text x="${x}" y="${y}" text-anchor="middle" class="venue-label">${t}</text>`));
  const hotspots=[['turn5','Turn 5 Lofts',398,438,76,38],['72club','72 Club',588,487,120,30],['casa','Casa Tua at Paddock Club',1000,368,75,47],['east','Villas at East Campus',1030,472,50,70],['sunset','Sunset Key Villas',942,470,36,80],['verista','Verista Club',873,615,74,26],['grandstand','North grandstands',847,198,180,32]];
  hotspots.forEach(([id,name,x,y,w,h])=>add('effects',interactive(id,name,`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3" fill="transparent"/><rect class="hover-edge" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3"/>`)));
  // Walking guests, in small groups, and pit crew movement are animated later.
  for(let i=0;i<32;i++){const x=400+random()*140,y=528+random()*34;add('spectators',`<g class="walker" data-x="${num(x)}" data-y="${num(y)}" data-phase="${num(random()*6.28)}" transform="translate(${num(x)} ${num(y)})"><circle r=".8" fill="${i%3?'#f6e7c8':'#344b5b'}"/><ellipse cy=".8" rx=".55" ry=".7" fill="#3f5752"/></g>`);}
  for(const [id,content] of Object.entries(layers))document.getElementById(id).innerHTML=content.join('');
  // Ensure bridge geometry occludes moving cars as real decks do.
  const camera=document.getElementById('camera');
  camera.insertBefore(document.getElementById('cars'),document.getElementById('bridges'));
  window.MiamiVenue={svg,NS,trackD,roadD,totalLength,racingLine,random,num,group,rect,path,line,use,interactive,
    bounds:{width:1600,height:876},counts:{palms:palmCount,svgNodes:svg.querySelectorAll('*').length}};
})();
