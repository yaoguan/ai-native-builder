const state = window.STRIDE_HABITS.map(h => ({ ...h, done: new Set(h.done) }));
const DAYS = 14;

function render() {
  const list = document.getElementById("habits");
  list.innerHTML = "";
  for (const h of state) {
    const s = computeStreaks(h.done);
    const li = document.createElement("li");
    li.className = "habit";

    const dots = [];
    for (let d = DAYS - 1; d >= 0; d--) {
      dots.push(`<span class="dot${h.done.has(d) ? " on" : ""}${d === 0 ? " today" : ""}"></span>`);
    }

    li.innerHTML = `
      <div class="info">
        <div class="name">${h.name}</div>
        <div class="dots" aria-label="Last ${DAYS} days">${dots.join("")}</div>
      </div>
      <div class="streak ${s.current > 0 ? "active" : ""}" title="Longest: ${s.longest} days">
        <span class="flame" aria-hidden="true">🔥</span>
        <strong>${s.current}</strong><small>day${s.current === 1 ? "" : "s"}</small>
        <em>best ${s.longest}</em>
      </div>
      <button class="check${s.doneToday ? " done" : ""}">${s.doneToday ? "Done ✓" : "Mark done"}</button>`;
    li.querySelector("button").onclick = () => {
      h.done.has(0) ? h.done.delete(0) : h.done.add(0);
      render();
    };
    list.appendChild(li);
  }
}
render();
