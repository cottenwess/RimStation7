/* ================= people ================= */
const PEOPLE = {
  vasko:   {name:'Dr. Imre Vasko', role:'Xenobiology lead', bg:'#5a3220', skin:'#d9a27c', skinS:'#b37d5b', hair:'#4b4652', style:'messy', coat:'#e9e5ef', accent:'#f39a2b', stubble:true},
  okafor:  {name:'Dr. Adaeze Okafor', role:'Xenobiology lead', bg:'#16394a', skin:'#7a4a2f', skinS:'#5c3621', hair:'#1a1317', style:'puff', coat:'#e9e5ef', accent:'#62d6e3', glasses:true},
  bea:     {name:'Bea Thornton', role:'Lead lab tech', bg:'#3b381c', skin:'#eab795', skinS:'#c99474', hair:'#c3532b', style:'buzz', coat:'#7c8996', accent:'#f2d14a', freckles:true},
  pruitt:  {name:'Gerald Pruitt', role:'Station administrator', bg:'#2b2746', skin:'#f0c9a8', skinS:'#d1a885', hair:'#b9b3a9', style:'bald', coat:'#3c4a6b', accent:'#c43c3c', tie:true},
  whitcomb:{name:'Col. (ret.) Dana Whitcomb', role:'Directorate liaison', bg:'#24301e', skin:'#c8916a', skinS:'#a7734e', hair:'#8d8b87', style:'short', coat:'#5a6a39', accent:'#d8c269'},
  calderon:{name:'Ines Calderón', role:'Safety officer', bg:'#3a2418', skin:'#c99572', skinS:'#a8775a', hair:'#2a1a14', style:'short', coat:'#e0702a', accent:'#f2d14a'},
  rook:    {name:'Rook Adebayo', role:'Recovery team lead', bg:'#1d2e3a', skin:'#6e4430', skinS:'#55331f', hair:'#151012', style:'buzz', coat:'#3f6fb6', accent:'#f08a2b'},
  ops:     {name:'MERIDIAN OPS', role:'Station system', terminal:true, bg:'#0e2a2d'}
};
const MOODS = {neutral:'Neutral', excited:'Excited', smug:'Confident', uneasy:'Uneasy', alarmed:'Alarmed', angry:'Angry', numb:'Numb'};
function drawPortrait(c, id, mood){
  const p = PEOPLE[id]; const f = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  c.clearRect(0, 0, 16, 16); f(0, 0, 16, 16, p.bg);
  if(p.terminal){
    const g = mood === 'alarmed' ? '#ff5d63' : '#62d6e3';
    f(2, 2, 12, 10, '#28484b'); f(3, 3, 10, 8, mood === 'alarmed' ? '#3a0d12' : '#052022');
    f(4, 4, 5, 1, g); f(4, 6, 7, 1, g); f(4, 8, 3, 1, g); f(8, 8, 1, 1, g);
    if(mood === 'alarmed'){ f(11, 4, 1, 3, g); f(11, 8, 1, 1, g); }
    f(7, 12, 2, 1, '#28484b'); f(5, 13, 6, 1, '#28484b');
    return;
  }
  const dark = '#1b1020', mouth = '#7b3a3a', open = '#3a1418', sweat = '#9fd8ff', h = p.hair;
  f(2, 13, 12, 3, p.coat); f(1, 14, 1, 2, p.coat); f(14, 14, 1, 2, p.coat);
  if(p.tie){ f(6, 13, 4, 1, '#e9e5ef'); f(7, 13, 2, 3, p.accent); } else f(7, 13, 2, 2, p.accent);
  f(6, 11, 4, 2, p.skinS);
  f(4, 3, 8, 8, p.skin); f(5, 11, 6, 1, p.skinS); f(3, 6, 1, 3, p.skin); f(12, 6, 1, 3, p.skin);
  if(p.style === 'messy'){ f(4, 2, 8, 2, h); f(3, 3, 2, 3, h); f(11, 3, 2, 2, h); f(5, 1, 2, 1, h); f(9, 1, 2, 1, h); f(12, 2, 1, 1, h); }
  else if(p.style === 'puff'){ f(3, 0, 10, 3, h); f(2, 1, 12, 2, h); f(3, 3, 2, 3, h); f(11, 3, 2, 3, h); f(4, 3, 8, 1, h); }
  else if(p.style === 'buzz'){ f(4, 2, 8, 2, h); f(3, 3, 1, 2, h); f(12, 3, 1, 2, h); }
  else if(p.style === 'bald'){ f(3, 4, 1, 3, h); f(12, 4, 1, 3, h); f(6, 3, 4, 1, 'rgba(255,255,255,.22)'); }
  else { f(4, 2, 8, 2, h); f(3, 3, 1, 3, h); f(12, 3, 1, 3, h); f(4, 3, 3, 1, h); }
  if(p.stubble){ f(5, 9, 1, 1, 'rgba(60,40,50,.35)'); f(10, 9, 1, 1, 'rgba(60,40,50,.35)'); f(5, 10, 6, 1, 'rgba(60,40,50,.28)'); }
  if(p.freckles){ f(5, 8, 1, 1, p.skinS); f(10, 8, 1, 1, p.skinS); }
  switch(mood){
    case 'excited': f(6, 6, 1, 2, dark); f(9, 6, 1, 2, dark); f(5, 4, 2, 1, h); f(9, 4, 2, 1, h); f(5, 9, 1, 1, open); f(10, 9, 1, 1, open); f(6, 10, 4, 1, open); f(7, 10, 2, 1, '#f3ece4'); break;
    case 'smug': f(5, 6, 3, 1, p.skinS); f(8, 6, 3, 1, p.skinS); f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 5, 2, 1, h); f(9, 4, 2, 1, h); f(7, 10, 3, 1, mouth); f(10, 9, 1, 1, mouth); break;
    case 'uneasy': f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 5, 1, 1, h); f(6, 4, 1, 1, h); f(10, 5, 1, 1, h); f(9, 4, 1, 1, h); f(6, 10, 1, 1, mouth); f(7, 11, 2, 1, mouth); f(9, 10, 1, 1, mouth); f(12, 3, 1, 2, sweat); break;
    case 'alarmed': f(5, 6, 2, 2, '#f6f2ea'); f(9, 6, 2, 2, '#f6f2ea'); f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 4, 2, 1, h); f(9, 4, 2, 1, h); f(7, 9, 2, 2, open); f(12, 3, 1, 2, sweat); f(3, 4, 1, 1, sweat); break;
    case 'angry': f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 5, 1, 1, h); f(6, 6, 1, 1, h); f(10, 5, 1, 1, h); f(9, 6, 1, 1, h); f(6, 10, 4, 1, open); break;
    case 'numb': f(5, 6, 3, 1, p.skinS); f(8, 6, 3, 1, p.skinS); f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 8, 2, 1, p.skinS); f(9, 8, 2, 1, p.skinS); f(6, 10, 4, 1, '#6a4646'); break;
    default: f(6, 7, 1, 1, dark); f(9, 7, 1, 1, dark); f(5, 5, 2, 1, h); f(9, 5, 2, 1, h); f(6, 10, 4, 1, mouth);
  }
  if(p.glasses){ const g = '#d8c08a'; f(5, 6, 3, 1, g); f(8, 6, 3, 1, g); f(5, 8, 3, 1, 'rgba(216,192,138,.65)'); f(8, 8, 3, 1, 'rgba(216,192,138,.65)'); }
}

