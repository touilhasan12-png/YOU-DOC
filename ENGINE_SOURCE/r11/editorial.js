'use strict';
// R11: independent editorial direction. Main animals are procedural vectors, not image cutouts.
const directors={};
const briefs={
 canyon_deck:['BREMER CANYON / MARCH 2021','45 km from shore.','A boat above a canyon. Something below it.'],
 canyon_depth:['THE OPENING / 02','Two groups. One target.','Illustrated reconstruction · Western Australia'],
 blue_surface:['THE LARGEST ANIMAL THAT EVER LIVED','Then the surface breaks.','Blue whale · illustrated reconstruction'],
 blue_scale:['A QUESTION OF SCALE','Sixteen metres.','Reported estimate · shared scale, not exact historical measurements'],
 hunt_rotation:['THE METHOD','Not a chase. A rotation.','Some work. Some rest. Then they switch.'],
 canyon_exit:['THE ADVANTAGE','Change the terrain.','From the canyon toward the shallows'],
 hunt_jaw:['THE PRESSURE POINT','A coordinated attack.','Jaw and tongue · non-graphic explanatory reconstruction'],
 meal_exclusion:['AFTER THE HUNT','No walk-ins.','A shared meal. Not an open invitation.'],
 taxonomy:['01 / THE HARDWARE','A dolphin. Technically.','The family resemblance is not the reassuring part.'],
 male_dimensions:['BUILT FOR THE JOB','9.5 metres.','Approximate maximum male length'],
 mass_comparison:['A DIFFERENT WEIGHT CLASS','More than six tonnes.','Roughly four family cars · comparison, not a measured individual'],
 dentition:['THE HARDWARE / CLOSE UP','40–56 teeth.','Each can reach about ten centimetres'],
 speed_tracking:['THE HARDWARE / SHORT BURSTS','Over 50 km/h.','A city speed limit. Underwater. With teeth.'],
 hardware_software:['02 / THE SOFTWARE','Power is only half the story.','The other half is learned.'],
 pacific_ecotypes:['ONE SPECIES / DIFFERENT LIVES','Two playbooks.','North Pacific · geographic context'],
 resident_salmon:['RESIDENT ORCAS','Family has a dialect.','Fish eaters · frequent calls and echolocation'],
 biggs_silence:['BIGG’S ORCAS','The quiet hunters.','Marine mammals can hear what is coming.'],
 tagged_alaska:['RESEARCH / ALASKA','Listening, not announcing.','Illustrative tag placement · not measured individual tracks'],
 listening_dark:['THE DARK IS NOT EMPTY','Dinner has ears.','Finding prey by listening is a probable explanation.'],
 fish_hearing:['THE RECEIVER MATTERS','For fish, a different rule.','Schematic sound waves · not a recorded acoustic trace'],
 mammal_hearing:['THE RECEIVER MATTERS','Silence is a tactic.','Seals and porpoises can hear the hunter.'],
 matriarch:['EXPERIENCE / LEADERSHIP','Follow the one who knows.','Older females can lead when food gets scarce.'],
 learning_observation:['KNOWLEDGE / INHERITANCE','It is handed down.','A younger animal follows a demonstrated turn.'],
 knowledge_bridge:['FROM KNOWLEDGE TO ACTION','Now watch.','Antarctic Peninsula'],
 seal_floe:['ANTARCTICA / THE SETUP','An island. Until it is not.','A resting seal on a floating slab of ice'],
 seven_formation:['THE FORMATION','Seven. Side by side.','Schematic coordination, not telemetry'],
 floe_wave:['THE MOVE','The ocean becomes a tool.','A shared charge displaces water toward the ice.'],
 floe_denial:['THE FOLLOW-THROUGH','Close the escape route.','Tail disturbance and bubbles prevent an easy climb.'],
 seal_capture:['THE RESULT','A coordinated capture.','Non-graphic illustration · not event footage'],
 patagonia_pup:['PATAGONIA / ARGENTINA','The shoreline is the trap.','A sea lion pup. A narrow window.'],
 patagonia_roll:['THE APPROACH','Hide the dorsal fin.','A whole-body roll in shallow water'],
 patagonia_strand:['THE COMMITMENT','Ride the wave in.','Intentional stranding · schematic reconstruction'],
 patagonia_grab:['THE RETURN','Timing is everything.','A short approach, then retreat with the next wave'],
 patagonia_learning:['THE NEXT GENERATION','Watch. Follow. Learn.','A juvenile follows the experienced animal.'],
 tide_window:['THE WINDOW','High tide changes access.','Hours either side of high tide'],
 stranding_risk:['THE COST OF A MISTAKE','Even this hunter has limits.','Strong winds and large waves increase the risk.'],
 white_shark:['A DIFFERENT PREDATOR','Ask a great white.','California · illustrative encounter'],
 farallon_evidence:['FARALLON ISLANDS / 2009','Seventeen sharks.','Tagged animals · real geographic context'],
 shark_departure:['WITHIN EIGHT HOURS','Every tagged shark left.','Schematic markers, not reconstructed individual paths'],
 season_absence:['THE AFTERMATH','Gone until next season.','Reported displacement can last up to a year.'],
 port_starboard:['SOUTH AFRICA','Port & Starboard.','Two males with distinctive collapsed dorsal fins'],
 shark_liver:['SELECTIVE PREDATION','The liver.','Non-graphic anatomy diagram · reported observations'],
 sightings_change:['SIX MONTHS / DAILY SIGHTINGS','From six to about one.','Historical averages at the reported local hotspot'],
 blue_cases:['BACK TO WESTERN AUSTRALIA','Three documented kills.','2019 and 2021 · reported first-of-their-kind records'],
 blue_relays:['THE METHOD / AGAIN','Work. Rest. Repeat.','Small groups rotate around a tiring whale.'],
 young_victims:['THE THREE CASES','Two were young.','A calf and an apparent juvenile · schematic sizes'],
 adult_victim:['THE THIRD CASE','An apparently healthy adult.','Not only small or weakened prey'],
 learned_strategy:['03 / THE PATTERN','This is strategy.','Wave-washing. Stranding. Silence. Rotation.'],
 twofold_arrival:['TWOFOLD BAY / AUSTRALIA','Once, a business partner.','Historical reconstruction · c. 1840–1930'],
 partnership_decline:['A PARTNERSHIP UNRAVELS','Thirty became seven.','Animals reported returning in 1901–1902'],
 old_tom_end:['TWOFOLD BAY / 1930','The partnership ends.','Old Tom’s death closes a remarkable chapter.'],
 captivity_context:['A NECESSARY DISTINCTION','Wild is not captivity.','Captive deaths do not establish fatal wild attacks.'],
 iberian_region:['IBERIAN COAST / SINCE 2020','A different kind of encounter.','Spain and Portugal · real geographic context'],
 interaction_counts:['REPORTED PERIOD COUNTS','About 700 interactions.','Historical counts from the narration · not a live total'],
 iberian_population:['A SMALL POPULATION','Fewer than forty.','About fifteen animals linked to the interactions'],
 lisbon_context:['OFF LISBON / SEPTEMBER 2025','A boat that would not steer.','Reported sinking · not footage of the incident'],
 open_water_pov:['YOUR TURN','What are your options?','Illustrative viewpoint · keep your distance from wildlife'],
 ice_option:['OPTION / ICE','You saw what happened.','Ice is not a reliable escape from an orca.'],
 power_option:['OPTION / FIGHT','The numbers are not close.','Forty-odd teeth. Six tonnes. Coordinated hunters.'],
 distance_rule:['THE EVIDENCE-SUPPORTED CHOICE','Be uninteresting.','Keep your distance and follow local wildlife rules.'],
 wildlife_distance:['SPACE FOR WILDLIFE','Give it room.','Do not approach, chase, feed or enter the water.'],
 boring_release:['A GOOD OUTCOME','No interaction.','The least dramatic option is the point.'],
 vulnerability:['THE OTHER SIDE','They have more to fear.','A critically endangered population cannot afford conflict.'],
 ecology_place:['SOUTH AFRICA / THE FOOD WEB','One absence changes others.','Geographic context · coastal ecosystem'],
 bronze_replacement:['A VACANCY IN THE FOOD WEB','Another shark moves in.','Bronze whaler · a different species'],
 food_web_response:['EVERYTHING IS CONNECTED','The whole web responds.','An ecological schematic, not a measured food-web model'],
 ocean_role:['NOT A MONSTER','An ocean that works.','Top predators shape the water around them.'],
 canyon_return:['BACK TO THE CANYON','The same scene. A new meaning.','Western Australia · March 2021'],
 teamwork_final:['PATIENCE / ROTATION / TEACHING','The unsettling part is teamwork.','Knowledge shared across a family'],
 plans_final:['NOT A MONSTER','Something that plans.',''],
 surfer_incident:['CALIFORNIA / 1972','A case of mistaken identity?','Hans Kretschmer · reported injury · reconstruction'],
 diver_entanglement:['NEW ZEALAND / REPORTED ACCOUNT','Entangled. Not a confirmed hunt.','Freediver · no scuba tank · illustrative reconstruction'],
 yacht_stern:['IBERIAN INTERACTIONS / SINCE 2020','The rudder becomes the focus.','R9 corrected 3D reconstruction retained'],
 rudder_detaches:['THE HARDWARE / THE CONSEQUENCE','When steering breaks.','Illustrative reconstruction · not event footage'],
 helm_response:['ABOARD THE BOAT','A wheel without control.','Corrected R9 hand grips retained'],
 hypothesis_play:['HYPOTHESIS / NOT A VERDICT','Play? Social behaviour?','The cause remains debated.'],
 hypothesis_imitation:['HYPOTHESIS / CULTURAL TRANSMISSION','One starts. Others follow.','Imitation is a proposed explanation.'],
 human_not_target:['THE IMPORTANT DISTINCTION','No sign people are the target.','That is reassuring. And strangely reassuring.'],
 swim_comparison:['OPTION / SWIM','Under 10 versus over 50.','Approximate burst speeds, km/h · R9 comparison retained'],
 boat_option:['OPTION / BOAT','Ask the sailors off Gibraltar.','Vessel interactions are not hunting evidence.'],
 whaler_view:['TWOFOLD BAY / HISTORICAL RECONSTRUCTION','An unusual partnership.','R9 rowers and vessel retained'],
 whaling_cooperation:['A SHARED HUNT','They bring the targets in.','Historical account, not historical event footage'],
 law_tongue:['THE AGREEMENT','The Law of the Tongue.','Orcas took tongue and lips; crews towed the rest ashore.'],
 old_tom_intro:['TWOFOLD BAY / HISTORICAL PORTRAIT','Old Tom.','Illustrative portrait, not a recovered photograph'],
 tow_rope:['THE MID-1920s','The cost of the rope.','Historical reconstruction · reported tooth wear'],
 worn_teeth:['THE MID-1920s / CLOSE UP','Teeth worn by a tow rope.','Illustrative reconstruction, not a veterinary scan'],
 five_rescued:['THE HUMAN OUTCOME','All five rescued.','Reported unharmed · reconstructed scene']
};
const keyColor='#ff9c75';
function titleLine(s,x,y,maxWidth,size=88,col=P.cream,face='Title',weight=650){
 g.textAlign='left';g.textBaseline='top';g.font=`${weight} ${size}px ${face}`;
 while(g.measureText(s).width>maxWidth&&size>28){size-=1;g.font=`${weight} ${size}px ${face}`;}
 g.fillStyle=col;g.fillText(s,x,y);return size;
}
function typeSystem(brief,paperMode=false){
 const b=brief||briefs[row.key];if(!b)return;
 let ink=paperMode?'#173743':P.cream,sub=paperMode?'#42636b':'#aac5c6';
 const enter=ease((T-.08)/.55);g.save();g.globalAlpha=enter;g.translate(0,14*(1-enter));
 titleLine(b[0],112,66,1670,21,paperMode?'#8b4d38':keyColor,'Body',650);
 line(112,109,166,109,paperMode?'#a8664b':keyColor,3);
 titleLine(b[1],112,141,1696,88,ink,'Title',650);
 if(b[2])titleLine(b[2],115,255,1660,27,sub,'Body',450);
 g.restore();
}
function foot(s,col='#b2cdce'){titleLine(s,112,988,1690,21,col,'Body',450)}
function assign(keys,fn){for(let k of keys.split(' '))directors[k]=fn}
function profile(kind,x=1100,y=625,L=1130,t=T,opt={}){const shark=['shark','bronze','hammer'].includes(kind),span=shark?1040:1080,offset=shark?20:40,scale=L*1000/span;beast(kind,x-(opt.flip?-1:1)*offset*scale/1000,y,scale,t,opt)}
function chamber(t,habitat='deep'){under(t,habitat);g.save();g.globalAlpha=.3;for(let i=0;i<5;i++){let y=360+i*140;path(`M0 ${y} Q480 ${y-55+15*Math.sin(t*.3+i)} 960 ${y+10} T1920 ${y-15}`,null,'#5b98991f',1.5)}g.restore()}
function ground(t,icey=false){sea(t,390,icey);if(icey)mountain(true)}
function dimensions(x1,x2,y,caption){line(x1,y,x2,y,keyColor,2);line(x1,y-10,x1,y+10,keyColor,2);line(x2,y-10,x2,y+10,keyColor,2);titleLine(caption,(x1+x2)/2-100,y+20,460,25,keyColor,'Body',500)}
function number(s,x,y,caption,col=P.cream){titleLine(s,x,y,660,188,col,'Title',650);titleLine(caption,x+4,y+207,690,25,col===P.ink?'#46656b':'#a7c6c5','Body',450)}
function world(box,pins,t){
 paper();const area={x:112,y:350,w:1696,h:590},[lo,hi,bot,top]=box;
 function proj(lon,lat){if(hi>180&&lon<lo)lon+=360;return [area.x+(lon-lo)/(hi-lo)*area.w,area.y+(top-lat)/(top-bot)*area.h]}
 g.save();g.beginPath();g.rect(area.x,area.y,area.w,area.h);g.clip();g.fillStyle='#86b2b4';g.fillRect(area.x,area.y,area.w,area.h);
 for(let j=0;j<10;j++)line(area.x+j*area.w/9,area.y,area.x+j*area.w/9,area.y+area.h,'#f8f1db33',1);
 for(const f of land.features){let polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
  for(let poly of polys){g.beginPath();for(let ring of poly){let prev;for(let i=0;i<ring.length;i++){let p=proj(...ring[i]);if(!i||prev&&Math.abs(p[0]-prev[0])>area.w*1.5)g.moveTo(...p);else g.lineTo(...p);prev=p}g.closePath()}g.fillStyle='#eee8ce';g.fill('evenodd');g.strokeStyle='#355b64';g.lineWidth=1.8;g.stroke()}}
 for(const [name,lon,lat,dx=20,dy=-22]of pins){const [x,y]=proj(lon,lat);g.globalAlpha=.3;circle(x,y,22+2*Math.sin(t),null,'#9d5140',2);g.globalAlpha=1;circle(x,y,6,'#9d5140');titleLine(name,x+dx,y+dy,570,28,'#183b45','Body',600)}g.restore();
 foot('GEOGRAPHIC CONTEXT / Natural Earth · schematic markers, not individual tracks','#3c6269');
}
assign('canyon_deck',t=>{
 // Immediate scale and depth, not a logo or a text-only pre-roll.
 ground(t);path('M0 400 Q300 475 520 890 L660 1080 L0 1080Z','#173e4c');path('M1920 390 Q1660 500 1510 1080 L1920 1080Z','#123644');
 boat(1280,420,.62,t,false,2);g.save();g.globalAlpha=.18;profile('blue',1040-25*t,865,1270,t,{depth:0});g.restore();
 profile('orca',450+24*t,690,410,t,{flip:true,depth:0});profile('orca',1470-14*t,710,360,t+.6,{depth:0});
 if(t<1.3){let a=1-ease(t/1.3);g.save();g.globalAlpha=a;profile('orca',250+t*1100,1050,2600,t,{flip:true,depth:0});g.restore();}
 foot('Illustrated reconstruction / no historical event footage');
});
assign('canyon_depth',t=>{chamber(t,'canyon');boat(1270,355,.34,t,false,2);for(let j=0;j<3;j++)profile('orca',420+j*360+t*12,530+j*40,400,t+j,{flip:true,depth:0});for(let j=0;j<2;j++)profile('orca',1020+j*440-t*10,850+j*45,450,t+j+.5,{depth:0});});
assign('blue_surface',t=>{ground(t);const rise=ease(t/2.1);profile('blue',1110,675-65*rise,1390,t,{depth:0});
 let plumeStart=row.cues?.exhales??1.8,age=t-plumeStart;
 if(age>0&&age<1.6){g.save();g.globalAlpha=Math.max(0,.65-age*.37);for(let j=0;j<42;j++){let a=seed(j+50),x=640+(a-.5)*80*age,y=570-age*(110+100*seed(j));circle(x,y,3+age*6,'#e2efde')}g.restore();}
 const named=row.cues?.['A blue whale']??3.4;
 if(t>named){line(500,838,1695,838,keyColor,2);titleLine('BLUE WHALE',112,873,1700,54,keyColor,'Title',650)}
});
assign('blue_scale',t=>{paper();profile('blue',1120,500,1210,t,{depth:0});profile('orca',790,820,625,t,{depth:0});dimensions(515,1725,635,'16 m · estimated');dimensions(478,1103,922,'largest orca · about 9.5 m');});
assign('hunt_rotation blue_relays',t=>{chamber(t,'canyon');profile('blue',1120,620,1100,t,{depth:0});for(let j=0;j<4;j++){let a=t*.34+j*PI/2;profile('orca',1070+570*Math.cos(a),650+170*Math.sin(a),290,t+j,{depth:0,alpha:Math.sin(a)>.1?1:.48,flip:Math.sin(a)>0})}foot('Illustrative positions / shared task, alternating effort');});
assign('canyon_exit',t=>{chamber(t,'canyon');path('M0 1080 L0 930 Q700 980 1300 660 L1920 510 L1920 1080Z','#416b6c');profile('blue',960+t*30,550,1000,t,{flip:true,depth:0});profile('orca',450+t*30,810,430,t,{flip:true,depth:0});arrow(1330,810,1670,650,keyColor)});
assign('hunt_jaw',t=>{chamber(t);profile('blue',1500,690,1720,t,{depth:0,jaw:.035});profile('orca',630,840,480,t,{flip:true,angle:-.06,depth:0});foot('Non-graphic explanatory reconstruction');});
assign('meal_exclusion',t=>{chamber(t);profile('orca',960,530,1040,t,{depth:0,flip:true});profile('hammer',1470+t*32,830,410,t,{flip:true,depth:0});profile('pilot',430-t*20,890,430,t+.3,{depth:0});});
assign('taxonomy',t=>{paper();profile('orca',1100,560,1150,t,{depth:0});profile('dolphin',690,865,460,t,{depth:0});titleLine('OCEANIC DOLPHIN FAMILY',1220,866,570,26,'#315963','Body',600);});
assign('male_dimensions',t=>{chamber(t);profile('orca',1120,610,1200,t,{male:true,depth:0});dimensions(520,1720,900,'approximately 9.5 metres');});
assign('mass_comparison',t=>{paper();profile('orca',1280,510,940,t,{depth:0});number('6+ t',112,395,'Approximate large-male mass',P.ink);
 for(let j=0;j<4;j++){let x=920+j*215,y=865;path(`M${x-80} ${y} l15 -45 l45 -25 h45 l35 26 l30 7 v40 h-170Z`,'#446977');circle(x-42,y+8,16,'#173c47');circle(x+65,y+8,16,'#173c47')}
});
assign('dentition',t=>{paper();g.save();g.translate(1140,590);g.scale(1.45,1.45);path('M-340 -74 Q-120 -180 250 -86 Q308 -42 340 0 Q50 -5 -340 38Z','#183943');path('M-338 60 Q-60 150 330 24 Q280 160 -40 172 Q-245 167 -338 60Z','#597d80');for(let j=0;j<24;j++){let x=-270+j*23,cur=.0013*x*x;path(`M${x} ${-45+cur*.35} Q${x+1} ${18+cur*.25} ${x+10} ${28+cur*.25} Q${x+21} ${2+cur*.2} ${x+20} ${-47+cur*.35}Z`,'#f4ead0','#9a9d89',1);path(`M${x} ${100-cur*.2} q12 -65 22 0Z`,'#e4d6b5','#939880',1)}g.restore();foot('Explanatory anatomy / approximate counts and size, not a specimen scan','#47666b');});
assign('speed_tracking',t=>{chamber(t);profile('orca',1100+80*Math.sin(t*.22),685,1120,t,{flip:true,depth:0});for(let j=0;j<7;j++){let x=(j*300-t*260)%2150;line(x,400+j*70,x+80,400+j*70,'#79aca233',2)}number('50+',112,360,'km/h · short bursts');});
assign('hardware_software',t=>{paper();titleLine('HARDWARE',112,395,1600,123,'#78918c','Title',650);line(114,552,1060*ease(t/.8)+114,552,'#b36e54',7);titleLine('SOFTWARE',112,652,1600,150,'#173b47','Title',650);});
assign('pacific_ecotypes',t=>world([160,245,25,70],[['North Pacific',208,45]],t));
assign('resident_salmon',t=>{chamber(t,'kelp');profile('orca',740,540,840,t,{female:true,flip:true,depth:0});profile('orca',400,840,390,t+.3,{flip:true,depth:0});school(t,14,1210,610);sound(1120,540,t,P.teal);});
assign('biggs_silence listening_dark',t=>{chamber(t);if(row.key==='listening_dark'){g.fillStyle='#00121a88';g.fillRect(0,340,1920,740)}profile('orca',730+t*10,670,1050,t,{flip:true,depth:0});seal(1560,730,.9,t);if(row.key==='listening_dark')sound(1460,690,t,'#a7e0c0',-1);});
assign('tagged_alaska',t=>{world([182,232,48,70],[['Alaska',209,60]],t);g.fillStyle='#123e4ae8';g.fillRect(1040,660,700,250);profile('orca',1390,805,540,t,{tag:true,depth:0});});
assign('fish_hearing',t=>{chamber(t,'kelp');profile('orca',490,650,660,t,{flip:true,depth:0});salmon(1410,675,3,t);sound(830,650,t,P.teal);});
assign('mammal_hearing',t=>{chamber(t);profile('orca',490,610,670,t,{flip:true,depth:0});seal(1450,760,1.25,t);sound(860,620,t,keyColor);});
assign('matriarch learning_observation',t=>{chamber(t,'kelp');let a=.08*Math.sin(t*.48);profile('orca',1260+t*8,550,950,t,{female:true,flip:true,depth:0,angle:a});profile('orca',560+t*8,815,450,t-.6,{flip:true,depth:0,angle:.08*Math.sin((t-.6)*.48)});if(row.key==='matriarch')profile('orca',990,940,310,t+.8,{flip:true,depth:0});});
assign('knowledge_bridge',t=>{ground(t,true);profile('orca',1130,780,1050,t,{depth:0});});
function iceSet(t,k){ground(t,true);let attack=ease(t/Math.max(1,row.duration*.65));let waveX=-200+attack*1800,dx=1200-waveX,heave=40*Math.exp(-dx*dx/90000)*Math.sin(dx*.012),angle=.08*Math.exp(-dx*dx/90000);ice(1220,650+heave,570,t,angle,k!=='seal_capture');profile('orca',470+attack*430,875,470,t,{depth:0,flip:true});
 if(k==='floe_wave'){g.beginPath();for(let x=0;x<=1920;x+=12){let y=760-65*Math.exp(-((x-waveX)**2)/90000);x?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle='#cce8dc';g.lineWidth=6;g.stroke()}
 if(k==='floe_denial'){for(let j=0;j<30;j++)circle(1400+seed(j)*180,900-((t*70+j*18)%210),2+seed(j+90)*4,'#9ecdc578');}
 if(k==='seal_capture'){let u=ease(t/row.duration);seal(1220+80*u,660+190*u,.64,t,false,.08*u);foot('Non-graphic schematic / no depiction of injury');}}
assign('seal_floe floe_wave floe_denial seal_capture',t=>iceSet(t,row.key));
assign('seven_formation',t=>{ground(t,true);ice(1270,460,470,t,0,true);for(let j=0;j<7;j++){let x=210+j*245,y=820;g.save();g.translate(x,y-35*ease(t/row.duration));g.scale(.63,.63);path('M0 -185 Q-75 -160 -75 -45 Q-60 80 -18 170 L0 187 L18 170 Q60 80 75 -45 Q75 -160 0 -185Z','#183943','#5c8b91',2);path('M-40 -70 Q0 -110 40 -70 Q25 -38 0 -35 Q-25 -38 -40 -70Z','#e7e7cd');path('M-35 80 L-95 125 L-15 120 L0 168 L15 120 L95 125 L35 80Z','#173b49');g.restore();}foot('Seven schematic positions / one coordinated formation');});
function shore(t,k){ground(t);path('M0 560 Q750 600 1050 770 Q1430 950 1920 960 L1920 1080 L0 1080Z','#dcc7a0');for(let j=0;j<4;j++){let x=(t*60+j*440)%2200-200;path(`M${x} 635 Q${x+350} 800 ${x+620} 845`,null,'#f8eedba0',3)}
 let q=t/row.duration,u=Math.sin(Math.min(1,q)*PI);let x=650+650*u,y=660+150*u;
 if(k==='patagonia_pup'){seal(1460,845,1,t,true);profile('orca',590,660,700,t,{flip:true,depth:0,alpha:.8});return}
 if(k==='patagonia_learning'){profile('orca',1140,650,870,t,{flip:true,depth:0});profile('orca',490,865,410,t-.6,{flip:true,depth:0});return}
 if(k==='tide_window'){seal(1460,845,.8,t,true);let height=680-55*Math.sin(t*.4);path(`M0 ${height} Q680 ${height+40} 1210 ${height+190}`,null,'#f5e9d2',5);line(1270,590,1270,820,keyColor,3);arrow(1270,810,1270,620,keyColor);return}
 if(k==='stranding_risk'){profile('orca',1180,800,960,t,{flip:true,depth:0,angle:.06});foot('Risk is part of the strategy. It is not invulnerability.');return}
 if(k==='patagonia_roll'){profile('orca',1000,700,1050,t,{flip:true,depth:0,angle:.15*Math.sin(t*.5)});return}
 profile('orca',x,y,850,t,{flip:true,depth:0,jaw:k==='patagonia_grab'?.08:0});
 if(k==='patagonia_grab'&&q>.43)seal(x+430,y+50,.65,t,true);else seal(1490,850,.65,t,true);
}
assign('patagonia_pup patagonia_roll patagonia_strand patagonia_grab patagonia_learning tide_window stranding_risk',t=>shore(t,row.key));
assign('white_shark port_starboard',t=>{chamber(t,'kelp');profile('shark',1180,790,1030,t,{depth:0});profile('orca',500,470,780,t,{flip:true,depth:0,bent:row.key==='port_starboard'});if(row.key==='port_starboard')profile('orca',1480,435,610,t+.5,{depth:0,bent:true});});
assign('farallon_evidence',t=>{world([-126,-120,35,40],[['Farallon Islands',-123,37.7,22,15]],t);for(let j=0;j<17;j++)circle(850+Math.sin(j*4)*100,590+Math.cos(j*7)*80,7,'#a35943');});
assign('shark_departure season_absence',t=>{paper();for(let j=0;j<17;j++){let x=1040+(j%6)*135,y=470+Math.floor(j/6)*165,u=ease((t-j*.08)/Math.max(1,row.duration*.7));if(row.key==='season_absence')u=1;g.save();g.globalAlpha=1-u;profile('shark',x,y-u*70,105,t+j,{depth:0});g.restore();}let remaining=row.key==='season_absence'?0:Math.max(0,17-Math.floor(ease(t/Math.max(1,row.duration*.8))*17));number(String(remaining),112,420,'remaining tagged sharks',P.ink);});
assign('shark_liver',t=>{paper();profile('shark',1130,670,1220,t,{depth:0});g.save();g.globalAlpha=.9;path('M920 655 Q1100 600 1330 665 Q1240 745 990 735Z','#cc8b63');g.restore();line(1100,735,1100,890,'#9c5c45',2);titleLine('LIVER / EXPLANATORY CUTAWAY',920,913,800,24,'#78513f','Body',600);});
assign('sightings_change',t=>{paper();number('6 → 1',112,390,'Average daily sightings',P.ink);let x0=1040,y0=900;line(x0,y0,1740,y0,'#547779',2);g.fillStyle='#274d58';g.fillRect(1120,y0-360*ease(t/.8),155,360*ease(t/.8));g.fillStyle='#cf805d';g.fillRect(1450,y0-60*ease(t/.8),155,60*ease(t/.8));titleLine('BEFORE',1120,930,220,23,'#496a6f','Body',500);titleLine('SIX MONTHS',1420,930,320,23,'#496a6f','Body',500);});
assign('blue_cases',t=>{world([112,125,-39,-28],[['Bremer Canyon',119.5,-35.5,-220,-60]],t);number('3',1270,460,'documented kills',P.ink);});
assign('young_victims adult_victim',t=>{chamber(t);if(row.key==='young_victims'){profile('blue',600,580,660,t,{depth:0});profile('blue',1330,820,860,t+.3,{depth:0});}else profile('blue',1090,660,1320,t,{depth:0});foot('Illustrated age classes / not exact recorded body sizes');});
assign('learned_strategy',t=>{paper();let items=['WAVE-WASHING','STRANDING','SILENT STALKING','SHIFT WORK'];for(let j=0;j<4;j++){let x=112+(j%2)*890,y=395+Math.floor(j/2)*270;line(x,y+30,x+45,y+30,'#bd7153',3);titleLine(String(j+1).padStart(2,'0'),x,y-13,150,24,'#a26a50','Body',600);titleLine(items[j],x,y+68,790,54,'#163b47','Title',650);}});
assign('twofold_arrival',t=>world([145,155,-40,-31],[['Twofold Bay',149.9,-37.1,-290,25]],t));
assign('partnership_decline',t=>{paper();number('30 → 7',112,400,'Reported returning animals',P.ink);for(let j=0;j<30;j++){let x=1090+j%6*115,y=440+Math.floor(j/6)*110;profile('orca',x,y,80,t+j,{depth:0,alpha:j<7?1:.15});}});
assign('old_tom_end',t=>{ground(t);boat(1310,700,1.0,t,true,3);profile('orca',550-t*18,900,430,t,{alpha:.15,depth:0});number('1930',112,410,'The end of the partnership');});
assign('captivity_context',t=>{paper();g.fillStyle='#6b9da4';g.fillRect(112,390,1696,510);for(let j=0;j<6;j++)line(112,430+j*84,1808,430+j*84,'#d8e6d544',2);profile('orca',1120,650,1070,t,{depth:0});foot('Captive and wild records are distinct. Causes remain debated.','#41656b');});
assign('iberian_region',t=>world([-12,1,34,45],[['Portugal',-8.8,39,-200,-10],['Spain',-4.1,40.7],['Gibraltar',-5.6,36.0,25,-10]],t));
assign('interaction_counts',t=>{paper();number('≈700',112,390,'Reported interactions',P.ink);for(let j=0;j<70;j++){let x=1000+j%10*77,y=415+Math.floor(j/10)*65;circle(x,y,10,j<Math.floor(70*ease(t/1.2))?'#ad654a':'#b3beb0')}foot('Each dot represents about ten reported interactions · historical period count','#42636a');});
assign('iberian_population',t=>{paper();for(let j=0;j<38;j++){let x=240+j%10*161,y=440+Math.floor(j/10)*143;profile('orca',x,y,113,t+j,{depth:0,alpha:j<15?1:.19});}foot('Illustrative population symbols / not identified individual animals','#42636a');});
assign('lisbon_context',t=>{ground(t);boat(1230,760,1.24,t,false,2);foot('Reported event context / illustration, not footage of the sinking');});
assign('open_water_pov',t=>{chamber(t);frontal(1110,680,1.7+.17*ease(t/row.duration),t);for(let j=0;j<10;j++)circle(480+seed(j)*950,1050-((t*55+j*80)%600),2+seed(j+10)*3,'#b4d6c94a');});
assign('ice_option',t=>{ground(t,true);ice(1260,505,570,t,0,false);profile('orca',1010,850,1060,t,{depth:0});});
assign('power_option',t=>{chamber(t);profile('orca',1190,660,1190,t,{male:true,depth:0});number('6 t',112,400,'Approximate mass of a large male');});
assign('distance_rule wildlife_distance',t=>{paper();boat(1510,710,.72,t,false,2);profile('orca',520,660,540,t,{depth:0});dash(900,560,1250,560,'#558a88',2);arrow(1340,850,1620,850,'#9e5c46');foot('Wildlife-viewing guidance: do not approach, chase, feed or enter the water.','#45676d');});
assign('boring_release',t=>{ground(t);profile('orca',1000+t*38,740,1030,t,{flip:true,depth:0});});
assign('vulnerability',t=>{chamber(t,'kelp');profile('orca',1230,540,1000,t,{female:true,depth:0});profile('orca',580,840,430,t+.5,{depth:0});});
assign('ecology_place',t=>world([15,25,-37,-30],[['South African coast',19.35,-34.58,-140,-45]],t));
assign('bronze_replacement',t=>{chamber(t,'kelp');profile('bronze',1100,660,1220,t,{depth:0});school(t,8,1400,850);});
assign('food_web_response',t=>{chamber(t,'kelp');profile('bronze',1290,500,820,t,{depth:0});seal(480,765,.95,t);school(t,9,1180,790);arrow(1090,660,950,745,P.teal);arrow(920,840,730,840,P.teal);});
assign('ocean_role',t=>{chamber(t,'kelp');profile('orca',1130,520,1120,t,{depth:0,alpha:.7});school(t,16,1100,850);seal(410,840,.65,t);});
assign('canyon_return',t=>{chamber(t,'canyon');profile('blue',1140,560,1210,t,{depth:0});profile('orca',500,850,480,t,{depth:0});profile('orca',1530,880,400,t+.4,{depth:0});});
assign('teamwork_final',t=>{chamber(t);for(let j=0;j<4;j++)profile('orca',460+j*355,480+(j%2)*340+45*Math.sin(t*.3+j),580,t+j*.7,{female:j===0,depth:0,flip:true});});
assign('plans_final',t=>{chamber(t);g.save();g.translate(1860,800);g.scale(2.35,2.35);path('M-480 0 Q-482 -97 -320 -112 Q-100 -140 100 -26 L100 122 Q-320 142 -480 0Z','#183a45','#77b0a53a',2);path('M-336 -44 C-332 -62 -293 -73 -264 -63 Q-243 -55 -260 -39 Q-297 -23 -326 -30Z','#eee9d3');circle(-400,-29,5,'#010c13');circle(-401,-30,1.5,'#dbd9b8');g.restore();titleLine('Something',112,415,540,156,P.cream,'Accent',400);titleLine('that plans.',112,600,540,172,keyColor,'Title',650);});
const paperKeys=new Set('blue_scale taxonomy mass_comparison dentition hardware_software pacific_ecotypes tagged_alaska farallon_evidence shark_departure season_absence shark_liver sightings_change blue_cases learned_strategy twofold_arrival partnership_decline captivity_context iberian_region interaction_counts iberian_population distance_rule wildlife_distance ecology_place'.split(' '));
window.configure=r=>{row=r;return {key:r.key,implemented:!!directors[r.key]}};
window.draw=(t,global)=>{T=t;G=global;g.resetTransform();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.lineCap='round';g.lineJoin='round';if(!directors[row.key])throw Error('No authored scene '+row.key);directors[row.key](t);typeSystem(null,paperKeys.has(row.key));};
window.drawOverlay=()=>{T=1;g.resetTransform();g.clearRect(0,0,W,H);let a=g.createLinearGradient(0,0,0,355);a.addColorStop(0,'#071f2b');a.addColorStop(.82,'#071f2b');a.addColorStop(1,'#071f2b00');g.fillStyle=a;g.fillRect(0,0,W,355);typeSystem();let b=g.createLinearGradient(0,925,0,1080);b.addColorStop(0,'#071f2b00');b.addColorStop(.5,'#071f2b');b.addColorStop(1,'#071f2b');g.fillStyle=b;g.fillRect(0,925,W,155);
 let note='ILLUSTRATIVE RECONSTRUCTION / R9 corrected 3D imagery';if(row.key==='boat_option'||row.key==='helm_response'||row.key==='yacht_stern'||row.key==='rudder_detaches')note='VESSEL GUIDANCE / If safe, head toward shallower coastal waters · contact rescue on VHF 16';foot(note);};
window.coverage=()=>Object.keys(directors);
Promise.all([fetch('/assets/land.json').then(r=>r.json()),...['seal_grey','sea_lion_brown'].map(name=>new Promise((resolve,reject)=>{let im=new Image();im.onload=()=>{sprites[name]=im;resolve()};im.onerror=reject;im.src='/art/'+name+'_cutout.png'})),document.fonts.load('650 88px Title'),document.fonts.load('450 27px Body'),document.fonts.load('400 156px Accent')]).then(([data])=>{land=data;window.R11ready=true});
