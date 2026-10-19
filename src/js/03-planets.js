/* ================= planets ================= */
const STARS = {
  M:{name:'M-dwarf', desc:'red dwarf', light:'#ff8a5a', flora:['#2a1530', '#3b1424', '#1d1222'], floraName:'near-black, tuned to infrared'},
  K:{name:'K-dwarf', desc:'orange dwarf', light:'#ffb26a', flora:['#6a2238', '#7a3048', '#4f2a5e'], floraName:'deep crimson and purple'},
  G:{name:'G-dwarf', desc:'yellow dwarf', light:'#fff0c0', flora:['#3f8a3a', '#5a9a40', '#2f6f4a'], floraName:'green'},
  F:{name:'F-type', desc:'blue-white star', light:'#d8ecff', flora:['#5a7ad8', '#8a7ad8', '#a8bcd8'], floraName:'blue and silver'}
};
const ATM = {
  n2o2:{name:'Nitrogen and oxygen', sound:343, sky:'#6aa6e8', skyName:'blue', bio:'Oxygen and methane out of balance. Strong biosignature.'},
  n2o2hi:{name:'Oxygen-rich nitrogen', sound:340, sky:'#86bdf0', skyName:'pale blue', bio:'High oxygen with methane. Strong biosignature.'},
  co2:{name:'Dense carbon dioxide', sound:259, sky:'#e8dcb8', skyName:'hazy white', bio:'Faint biosignatures under the cloud deck.'},
  sulfur:{name:'Sulfuric haze', sound:255, sky:'#e8c45a', skyName:'sulfur yellow', bio:'Unexplained sulfur cycling. Possible life.'},
  thin:{name:'Thin carbon dioxide', sound:230, sky:'#d8a070', skyName:'butterscotch dust', bio:'No active biosignature. Organic traces in the regolith.'},
  none:{name:'Trace vapor', sound:0, sky:'#3a3a52', skyName:'black', bio:'Plume chemistry suggests a living ocean under the ice.'},
  h2:{name:'Hydrogen and helium', sound:1100, sky:'#7a6ae8', skyName:'deep violet', bio:'Organic layers at habitable pressures.'},
  co2dense:{name:'Deep carbon dioxide', sound:259, sky:'#dcd4c0', skyName:'pearl white', bio:'Floating organics in the temperate cloud layer.'},
  n2haze:{name:'Nitrogen with tholin haze', sound:190, sky:'#e8904a', skyName:'orange haze', bio:'Hydrogen depletion over the lakes. Possible methane-based life.'}
};
const ARCH = {
  garden:{label:'Garden world', nick:['the Orchard', 'Greenwater', 'the Shallows'], star:['K', 'G', 'K', 'M'], mass:[0.9, 2.0], temp:[6, 30], atm:['n2o2'], pres:[0.8, 2.2], solvent:'water', hazard:1, pool:['fauna', 'fauna', 'flora', 'microbe', 'fauna', 'floater']},
  hostile:{label:'Hostile world', nick:['the Furnace', 'Ironrain', 'the Kiln'], star:['F', 'G', 'K'], mass:[1.2, 2.4], temp:[70, 190], atm:['co2', 'sulfur'], pres:[8, 60], solvent:'water and acid', hazard:4, pool:['fauna', 'fauna', 'microbe', 'flora']},
  botanical:{label:'Botanical world', nick:['the Glasshouse', 'Canopy', 'the Thicket'], star:['M', 'K', 'G', 'F'], mass:[0.7, 1.6], temp:[12, 34], atm:['n2o2hi'], pres:[1, 2.5], solvent:'water', hazard:1, pool:['flora', 'flora', 'flora', 'microbe', 'fauna']},
  barren:{label:'Dead world', nick:['the Boneyard', 'Dustfall', 'the Ossuary'], star:['G', 'K', 'F', 'M'], mass:[0.3, 0.9], temp:[-70, -5], atm:['thin'], pres:[0.005, 0.05], solvent:'none (ice in the poles)', hazard:0, pool:['fossil', 'fossil', 'microbe']},
  ice:{label:'Ice-shell ocean', nick:['Deepwell', 'the Lantern Sea', 'Undershelf'], star:['K', 'G', 'M'], mass:[0.2, 0.9], temp:[-160, -90], atm:['none'], pres:[0, 0.001], solvent:'water, under 10 km of ice', hazard:2, pool:['fauna', 'microbe', 'microbe', 'fauna']},
  cloud:{label:'Cloud world', nick:['Skyreach', 'the Drift', 'Highwater'], star:['G', 'K', 'F'], mass:[1.8, 2.6], temp:[15, 55], atm:['h2', 'co2dense'], pres:[40, 90], solvent:'water droplets aloft', hazard:2, pool:['floater', 'floater', 'floater', 'microbe']},
  cryo:{label:'Cryogenic world', nick:['Coldlake', 'the Tholin Shore', 'Stillwater'], star:['K', 'M', 'G'], mass:[0.4, 1.1], temp:[-185, -170], atm:['n2haze'], pres:[1.2, 1.8], solvent:'liquid methane', hazard:1, pool:['fauna', 'microbe', 'flora']}
};
const SYL1 = ['Ves', 'Kor', 'Thal', 'Ira', 'Mor', 'Sel', 'Quen', 'Dar', 'Oph', 'Lyr', 'Cal', 'Nem', 'Tor', 'Ash', 'Bel'];
const SYL2 = ['a', 'is', 'on', 'eth', 'ux', 'ora', 'ine', 'ar', 'el', 'yr'];
function genPlanets(seed){
  R = mulberry(seed);
  const keys = Object.keys(ARCH).sort(() => R() - .5);
  const starters = keys.filter(k => ['garden', 'botanical', 'cryo', 'ice'].includes(k));
  const first = starters[0];
  const rest = keys.filter(k => k !== first);
  const chosen = [first, ...rest.slice(0, 4)];
  if(!chosen.includes('barren') && R() < .6) chosen[4] = 'barren';
  const used = new Set();
  const planets = chosen.map((arch, i) => {
    const A = ARCH[arch];
    let sys; do { sys = rp(SYL1) + rp(SYL2); } while(used.has(sys)); used.add(sys);
    const star = rp(A.star), atmK = rp(A.atm), mass = +rr(A.mass[0], A.mass[1]).toFixed(2);
    const temp = Math.round(rr(A.temp[0], A.temp[1])), pres = +rr(A.pres[0], A.pres[1]).toFixed(pres => pres);
    const g = +(Math.pow(mass, 0.46)).toFixed(2);
    const tidal = star === 'M' && R() < .7;
    const magnet = mass > .8 && R() < .85;
    const T = temp + 273;
    let sound = ATM[atmK].sound ? Math.round(ATM[atmK].sound * Math.sqrt(Math.max(T, 60) / 273)) : 0;
    if(arch === 'barren') sound = Math.round(sound * .6);
    let biochem = 'carbon-water';
    if(arch === 'cryo') biochem = 'methane';
    else if(arch === 'hostile') biochem = R() < .35 ? 'silicon' : (atmK === 'sulfur' ? 'sulfur' : 'carbon-water');
    else if(arch === 'cloud' && atmK === 'h2') biochem = 'ammonia';
    return {
      i, arch, sys, name:`${sys} ${'bcdef'[Math.floor(R() * 4)]}`, nick:rp(A.nick), star, atm:atmK, mass, g, temp, pres:+pres.toFixed(pres < 0.1 ? 3 : 1), tidal, magnet, sound, biochem,
      hazard:A.hazard, dist:Math.round(rr(26, 54)), known:i < 3, missions:0, link:null, sapient:false, ruins:false, recovered:0,
      look:{seed:Math.floor(R() * 1e6), ring:arch === 'cloud' ? R() < .6 : R() < .12}
    };
  });
  const cands = planets.filter(p => ['garden', 'ice', 'cloud', 'botanical', 'hostile'].includes(p.arch));
  if(cands.length && R() < .7) rp(cands).sapient = true;
  planets.forEach(p => { if(p.arch === 'barren' && R() < .45) p.ruins = true; });
  planets[3].link = 1 + Math.floor(R() * 2); planets[4].link = planets[3].link === 1 ? 2 : 1;
  R = mulberry(Math.floor(rnd() * 1e9));
  return planets;
}
function soundNote(p){
  if(!p.sound) return 'There is no air to carry sound, so it signals through vibration.';
  if(p.sound < 270) return 'Most of it is low-frequency, some below human hearing.';
  if(p.sound > 800) return 'It is high-pitched and fast. Our microphones clip.';
  return 'The calls carry well in standard air.';
}
function soundImplication(p){
  if(!p.sound) return 'No sound. Expect vibration and visual signaling.';
  if(p.sound < 270) return `Sound travels at ~${p.sound} m/s. Expect deep, infrasonic calls.`;
  if(p.sound > 800) return `Sound travels at ~${p.sound} m/s. Expect high-pitched, long-range calls.`;
  return `Sound travels at ~${p.sound} m/s, close to Earth air.`;
}

