/* ================= offers and choices ================= */
function whitcombOffer(sp){
  say('whitcomb', 'neutral', `Colonel Whitcomb, Directorate liaison. ${sp.name}'s ${sp.truth.hazard === 'pathogen' ? 'pathogen' : sp.truth.hazard === 'electric' ? 'discharge organ' : 'paralytic'} is of real interest to us. 70 credits up front for first access to your results.`, {kind:'note', choices:[
    {label:'Accept the contract (+70 cr)', act:() => { S.whitcombDeals++; S.weapons = true; S.funds += 70; log('whitcomb', 'admin', `Directorate contract on ${sp.name} accepted: +70 cr.`); if(S.lead === 'okafor') say('okafor', 'angry', "You sold it to the military. I'm putting my objection in the notebook, in writing.", {kind:'warning'}); }},
    {label:'Decline', act:() => { log('whitcomb', 'admin', `Directorate contract on ${sp.name} declined.`); }}
  ]});
}
function licenseOffer(sp){
  const y = sp.truth.yield;
  const ch = [{label:'License to Meridian (+45 cr)', act:() => { sp.licensed = 'meridian'; S.funds += 45; log('pruitt', 'admin', `Licensed ${y.type} from ${sp.name} to Meridian: +45 cr.`); }}];
  if(y.dual) ch.push({label:'Sell to the Directorate (+90 cr)', act:() => { sp.licensed = 'directorate'; S.weapons = true; S.funds += 90; log('whitcomb', 'admin', `Sold ${y.type} from ${sp.name} to the Directorate: +90 cr.`); if(S.lead === 'okafor') say('okafor', 'angry', 'That compound is a weapon now. You know that.', {kind:'warning'}); }});
  ch.push({label:'Hold it for now', act:() => {}});
  say('pruitt', 'smug', `We have ${y.type} from ${sp.name}. Meridian will license it.${y.dual ? ' The Directorate has made a higher offer.' : ''}`, {log:false, choices:ch});
}
function sapienceChoice(sp){
  say('okafor', 'alarmed', `If ${sp.name} has language, then everything in that cell is a person, and so is everything still on ${planetOf(sp).name}. What do we call them in the paper?`, {log:false, choices:[
    {label:'Recognize them as people', act:() => { sp.person = 'recognized'; S.sapientChoice = 'recognized'; standing(-10); log('pruitt', 'admin', `${sp.name} reclassified as a people. Invasive studies halted. Meridian is displeased.`); say('pruitt', 'uneasy', 'Meridian is not happy. Halted research is lost research. But the paper will say people.', {log:false}); }},
    {label:'Keep the specimen classification', act:() => { sp.person = 'ignored'; S.sapientChoice = 'ignored'; log('okafor', 'warning', `Director kept ${sp.name} classified as a specimen despite evidence of language.`); say('okafor', 'numb', "Then I'm writing my own report. You'll want to read it before Meridian does.", {log:false}); standing(-5); }}
  ]});
}

