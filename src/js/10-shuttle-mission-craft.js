/* ================= shuttle & mission craft ================= */
/* The shuttle carries a job tag rather than a callback, so a run can be saved
   mid-flight. Anything the shuttle does on arrival lives in SHUTTLE_JOBS. */
const shuttle = {active:false, p:0, leg:0, job:null, queue:[]};
const SHUTTLE_JOBS = {
  tech(){ if(S.over) return; const a = addTech(true); notify('ops', `Replacement tech ${a.name} arrived by shuttle.`); S.dirty = true; }
};
function launchShuttle(job){
  if(shuttle.active){ shuttle.queue.push(job || null); return; }
  shuttle.active = true; shuttle.p = 0; shuttle.leg = 0; shuttle.job = job || null;
}
function stepShuttle(dt){
  if(S.flight){ S.flight.p += dt / 3; if(S.flight.p >= 1) S.flight = null; }
  if(!shuttle.active) return;
  shuttle.p += dt / 2.2 * (S.speed >= 3 ? 2 : 1);
  if(shuttle.p >= 1){
    shuttle.p = 0;
    if(shuttle.leg === 0) shuttle.leg = 1;
    else {
      shuttle.active = false; const job = shuttle.job; shuttle.job = null;
      if(job && SHUTTLE_JOBS[job]) SHUTTLE_JOBS[job]();
      if(shuttle.queue.length) launchShuttle(shuttle.queue.shift());
    }
  }
}
