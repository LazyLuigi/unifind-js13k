/* Unifind capture driver. The game reads its input through tap(x, y) in
   screen coordinates: the driver calls that function directly rather than
   simulating events. t is the simulated time, in milliseconds. */
window.__drive = function (t) {
  if (typeof ST === 'undefined' || !ST.w) return;
  if (window.__capturePhase !== ST.ph) {
    window.__capturePhase = ST.ph;
    window.__phaseStart = t;
  }
  if (ST.ph === 'title' && t > 1400) return tap(300, 300);
  if (ST.ph === 'show' && t - window.__phaseStart > 2400) return tap(300, 300);
  if (ST.ph === 'end' && ST.pt > 5.2) return tap(300, 300);
  if (ST.ph === 'play') {
    /* A few seconds of the crowd dancing before pointing at the unicorn:
       that is what the player sees, and what has to read in the GIF. */
    if (t - window.__phaseStart > 3600) {
      var u = ST.w.uni;
      tap(u.x * view.z + view.x, (u.y - ST.w.S * u.s * 0.4) * view.z + view.y);
    }
  }
};
