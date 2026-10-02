// Pure streak logic. `done` is a Set of day offsets (0 = today).
// A streak that ended yesterday is still "alive" until today ends.
window.computeStreaks = function (done) {
  let current = 0;
  let start = done.has(0) ? 0 : 1;
  for (let d = start; done.has(d); d++) current++;

  const days = [...done].sort((a, b) => a - b);
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest, doneToday: done.has(0) };
};
