/* ECE Internship Atlas — app.js
   Vanilla JS, no build step. Reads CATALOG from data/catalog.js. */
(function () {
  "use strict";

  // ---------- safe storage (works even where localStorage is blocked) ----------
  const mem = {};
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    remove(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  };
  const TRACKER_KEY = "ece27.tracker.v1";
  const THEME_KEY = "ece27.theme";

  const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const CIT_LABEL = { us: "US", uslpr: "US/PR", open: "open" };
  const CIT_TITLE = { us: "US citizenship required", uslpr: "US citizen or permanent resident", open: "No citizenship requirement" };
  const SOPH_LABEL = { 3: "Sophomore-friendly", 2: "Sometimes hires sophomores", 1: "Mostly juniors and up" };
  const PAY = { 3: "$$$", 2: "$$", 1: "$" };
  const STATUSES = ["interested", "applied", "oa", "interview", "offer", "accepted", "rejected", "closed"];
  const STATUS_LABEL = { interested: "Interested", applied: "Applied", oa: "Online assessment", interview: "Interviewing", offer: "Offer", accepted: "Accepted", rejected: "Rejected", closed: "Posting closed" };

  const data = window.CATALOG || (typeof CATALOG !== "undefined" ? CATALOG : null);
  if (!data) { document.getElementById("summary").textContent = "Catalog failed to load. Check that data/catalog.js is present."; return; }
  const companies = data.companies.map((c, i) => Object.assign({ id: slug(c.company) }, c, { _i: i }));

  // ---------- state ----------
  const state = {
    q: "", sort: "soph", soph: false, pnw: false, open: false, tracked: false,
    sector: "", opens: "", pay: "", tags: new Set(), expanded: new Set()
  };
  let tracker = loadTracker();

  // ---------- theme ----------
  const themeBtn = document.getElementById("theme-toggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "Light" : "Dark";
  }
  const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(store.get(THEME_KEY) || (prefersDark ? "dark" : "light"));
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    store.set(THEME_KEY, next); applyTheme(next);
  });

  // ---------- tabs ----------
  const tabs = [...document.querySelectorAll(".tab")];
  function showTab(name) {
    if (!document.querySelector(`[data-panel="${name}"]`)) name = "catalog";
    tabs.forEach(t => { const on = t.dataset.tab === name; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    document.querySelectorAll(".panel").forEach(p => p.classList.toggle("is-active", p.dataset.panel === name));
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
    if (name === "tracker") renderTracker();
  }
  tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

  // ---------- filters UI ----------
  const sectors = [...new Set(companies.map(c => c.sector))].sort();
  const tags = [...new Set(companies.flatMap(c => c.tags))].sort();
  const sectorSel = document.getElementById("f-sector");
  sectors.forEach(s => sectorSel.append(new Option(`${s} (${companies.filter(c => c.sector === s).length})`, s)));
  const opensSel = document.getElementById("f-opens");
  MONTHS.forEach(m => opensSel.append(new Option(`${m} or earlier`, m)));
  const tagWrap = document.getElementById("f-tags");
  tags.forEach(t => {
    const b = document.createElement("button");
    b.className = "chip"; b.textContent = t; b.dataset.tag = t; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t); b.setAttribute("aria-pressed", state.tags.has(t)); render(); });
    tagWrap.append(b);
  });

  document.getElementById("search").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  sectorSel.addEventListener("change", e => { state.sector = e.target.value; render(); });
  opensSel.addEventListener("change", e => { state.opens = e.target.value; render(); });
  document.getElementById("f-pay").addEventListener("change", e => { state.pay = e.target.value; render(); });
  document.querySelectorAll(".quick .chip").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.filter; state[k] = !state[k]; b.setAttribute("aria-pressed", state[k]); render();
  }));
  document.getElementById("clear-filters").addEventListener("click", () => {
    Object.assign(state, { q: "", soph: false, pnw: false, open: false, tracked: false, sector: "", opens: "", pay: "" });
    state.tags.clear();
    document.getElementById("search").value = ""; sectorSel.value = ""; opensSel.value = ""; document.getElementById("f-pay").value = "";
    document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", "false"));
    render();
  });

  // ---------- filtering ----------
  function monthIndex(opens) {
    const m = (opens || "").slice(0, 3);
    const i = MONTHS.indexOf(m);
    return i === -1 ? 99 : i;
  }
  function matches(c) {
    if (state.soph && c.soph !== 3) return false;
    if (state.pnw && !c.pnw) return false;
    if (state.open && c.cit !== "open") return false;
    if (state.tracked && !tracker[c.id]) return false;
    if (state.sector && c.sector !== state.sector) return false;
    if (state.pay && c.pay !== Number(state.pay)) return false;
    if (state.opens && monthIndex(c.opens) > MONTHS.indexOf(state.opens)) return false;
    if (state.tags.size && ![...state.tags].every(t => c.tags.includes(t))) return false;
    if (state.q) {
      const hay = [c.company, c.sector, c.hq, ...(c.sites || []), ...(c.roles || []), ...(c.tags || []), c.notes || "", c.program || ""].join(" ").toLowerCase();
      if (!state.q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  }
  const sorters = {
    name: (a, b) => a.company.localeCompare(b.company),
    soph: (a, b) => (b.soph - a.soph) || (Number(!!b.pnw) - Number(!!a.pnw)) || a.company.localeCompare(b.company),
    opens: (a, b) => (monthIndex(a.opens) - monthIndex(b.opens)) || a.company.localeCompare(b.company),
    pay: (a, b) => (b.pay - a.pay) || a.company.localeCompare(b.company)
  };

  // ---------- render list ----------
  const list = document.getElementById("employer-list");
  const empty = document.getElementById("empty");
  const summary = document.getElementById("summary");

  function render() {
    const shown = companies.filter(matches).sort(sorters[state.sort]);
    list.innerHTML = "";
    shown.forEach(c => list.append(renderEmployer(c)));
    empty.hidden = shown.length > 0;
    const soph = shown.filter(c => c.soph === 3).length;
    const pnw = shown.filter(c => c.pnw).length;
    const open = shown.filter(c => c.cit === "open").length;
    const total = companies.length;
    const scope = shown.length === total ? `<b>${total}</b> employers and programs for ${data.meta.season} EE and ECE internships` : `<b>${shown.length}</b> of ${total} employers match`;
    summary.innerHTML = `${scope}. <b>${soph}</b> regularly hire sophomores, <b>${pnw}</b> have sites in Oregon, Washington, or Idaho, and <b>${open}</b> have no citizenship requirement.`;
    updateTrackerCount();
  }

  function renderEmployer(c) {
    const li = document.createElement("li");
    li.className = "employer" + (state.expanded.has(c.id) ? " is-open" : "");
    li.dataset.id = c.id;
    const t = tracker[c.id];
    const head = document.createElement("button");
    head.className = "employer-head"; head.setAttribute("aria-expanded", state.expanded.has(c.id));
    head.innerHTML = `
      <span><span class="employer-name">${t ? '<span class="tracked-dot" title="In your tracker"></span>' : ""}${esc(c.company)}</span><br><span class="employer-sector">${esc(c.sector)}</span></span>
      <span class="employer-hq">${esc(c.hq)}${c.sites && c.sites.length ? ` <span class="label">and ${c.sites.length} more site${c.sites.length > 1 ? "s" : ""}</span>` : ""}</span>
      <span class="badge badge-soph${c.soph}">${SOPH_LABEL[c.soph]}</span>
      <span class="badge badge-cit badge-cit-${c.cit}" title="${CIT_TITLE[c.cit]}">${CIT_LABEL[c.cit]}</span>
      ${c.pnw ? '<span class="badge badge-pnw">Near OSU</span>' : "<span></span>"}
      <span class="employer-meta">Opens <b>${esc(c.opens)}</b> · Pay <b>${PAY[c.pay]}</b></span>`.replace(" · ", " &nbsp; ");
    head.addEventListener("click", () => {
      state.expanded.has(c.id) ? state.expanded.delete(c.id) : state.expanded.add(c.id);
      const fresh = renderEmployer(c); li.replaceWith(fresh);
      if (state.expanded.has(c.id)) fresh.querySelector(".employer-head").focus();
    });
    li.append(head);
    if (state.expanded.has(c.id)) li.append(renderBody(c));
    return li;
  }

  function renderBody(c) {
    const body = document.createElement("div");
    body.className = "employer-body";
    const left = document.createElement("div");
    left.innerHTML = `
      ${c.program ? `<p><span class="label">Named program:</span> <b>${esc(c.program)}</b></p>` : ""}
      <p><span class="label">Typical intern roles</span></p>
      <ul class="plain">${(c.roles || []).map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <p><span class="label">Disciplines</span></p>
      <ul class="plain">${(c.tags || []).map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      ${c.sites && c.sites.length ? `<p><span class="label">Intern sites:</span> ${c.sites.map(esc).join(", ")}</p>` : ""}
      <p><span class="label">Eligibility:</span> ${CIT_TITLE[c.cit]}.</p>
      ${c.notes ? `<p>${esc(c.notes)}</p>` : ""}`;
    const right = document.createElement("div");
    right.className = "employer-actions";
    const t = tracker[c.id];
    right.innerHTML = `
      <a class="button" href="${esc(c.url)}" target="_blank" rel="noopener">Open careers page</a>
      <div class="track-row">
        ${t ? `<select aria-label="Application status">${STATUSES.map(s => `<option value="${s}" ${t.status === s ? "selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select>
               <button class="link-button" data-act="untrack">Remove from tracker</button>`
            : `<button class="button button-quiet" data-act="track">Track this employer</button>`}
      </div>
      <p class="label" style="font-size:.86rem">Search hint: ${esc(c.company)} internship ${data.meta.season}</p>`;
    right.addEventListener("click", e => {
      const act = e.target.dataset.act;
      if (act === "track") { tracker[c.id] = { company: c.company, status: "interested", date: today(), notes: "" }; saveTracker(); render(); }
      if (act === "untrack") { delete tracker[c.id]; saveTracker(); render(); }
    });
    right.addEventListener("change", e => {
      if (e.target.tagName === "SELECT" && tracker[c.id]) { tracker[c.id].status = e.target.value; if (e.target.value === "applied" && !tracker[c.id].appliedOn) tracker[c.id].appliedOn = today(); saveTracker(); updateTrackerCount(); }
    });
    body.append(left, right);
    return body;
  }

  // ---------- programs ----------
  const programList = document.getElementById("program-list");
  (data.programs || []).forEach(p => {
    const el = document.createElement("article");
    el.className = "program";
    el.innerHTML = `
      <div><h3>${esc(p.name)}</h3><div class="org">${esc(p.org)}</div><a class="button button-quiet" href="${esc(p.url)}" target="_blank" rel="noopener">Program page</a></div>
      <dl>
        <dt>Who</dt><dd class="who">${esc(p.who)}</dd>
        <dt>Focus</dt><dd>${esc(p.focus)}</dd>
        <dt>Timing</dt><dd>${esc(p.timing)}</dd>
        ${p.notes ? `<dt>Notes</dt><dd>${esc(p.notes)}</dd>` : ""}
      </dl>`;
    programList.append(el);
  });

  // ---------- timeline ----------
  const tl = document.getElementById("timeline");
  const now = new Date();
  (data.timeline || []).forEach(m => {
    const li = document.createElement("li");
    const isNow = m.month.startsWith(now.toLocaleString("en-US", { month: "long" })) && m.month.endsWith(String(now.getFullYear()));
    li.className = "month" + (isNow ? " is-now" : "");
    li.innerHTML = `<h3>${esc(m.month)}${isNow ? '<span class="now">this month</span>' : ""}</h3><ul>${m.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
    tl.append(li);
  });

  // ---------- resources ----------
  const rg = document.getElementById("resource-groups");
  (data.resources || []).forEach(g => {
    const el = document.createElement("section");
    el.className = "resource-group";
    el.innerHTML = `<h2>${esc(g.group)}</h2><ul>${g.items.map(i => `<li><a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)}</a><span>${esc(i.note)}</span></li>`).join("")}</ul>`;
    rg.append(el);
  });

  // ---------- tracker ----------
  function loadTracker() { try { return JSON.parse(store.get(TRACKER_KEY) || "{}"); } catch (e) { return {}; } }
  function saveTracker() { store.set(TRACKER_KEY, JSON.stringify(tracker)); updateTrackerCount(); }
  function updateTrackerCount() {
    const n = Object.keys(tracker).length;
    const el = document.getElementById("tracker-count"); el.textContent = n; el.hidden = n === 0;
  }
  const trackerTable = document.getElementById("tracker-table");
  const trackerEmpty = document.getElementById("tracker-empty");
  function renderTracker() {
    const ids = Object.keys(tracker).sort((a, b) => STATUSES.indexOf(tracker[a].status) - STATUSES.indexOf(tracker[b].status) || tracker[a].company.localeCompare(tracker[b].company));
    trackerEmpty.hidden = ids.length > 0;
    if (!ids.length) { trackerTable.innerHTML = ""; return; }
    const table = document.createElement("table");
    table.className = "tracker";
    table.innerHTML = `<thead><tr><th>Employer</th><th>Status</th><th>Applied on</th><th>Notes</th><th></th></tr></thead>`;
    const tb = document.createElement("tbody");
    ids.forEach(id => {
      const t = tracker[id]; const c = companies.find(x => x.id === id);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="name">${esc(t.company)}<span>${c ? esc(c.hq) : ""}${c ? ` · opens ${esc(c.opens)}` : ""}</span>${c ? `<a href="${esc(c.url)}" target="_blank" rel="noopener" style="font-size:.86rem;font-weight:500">Careers page</a>` : ""}</td>
        <td><select data-f="status" class="status-${t.status}">${STATUSES.map(s => `<option value="${s}" ${t.status === s ? "selected" : ""}>${STATUS_LABEL[s]}</option>`).join("")}</select></td>
        <td><input type="date" data-f="appliedOn" value="${esc(t.appliedOn || "")}"></td>
        <td><textarea data-f="notes" placeholder="Recruiter name, req number, next step">${esc(t.notes || "")}</textarea></td>
        <td><button class="link-button danger" data-act="remove">Remove</button></td>`;
      tr.addEventListener("change", e => {
        const f = e.target.dataset.f; if (!f) return;
        t[f] = e.target.value; if (f === "status") e.target.className = "status-" + t.status; saveTracker();
      });
      tr.addEventListener("input", e => { if (e.target.dataset.f === "notes") { t.notes = e.target.value; saveTracker(); } });
      tr.querySelector('[data-act="remove"]').addEventListener("click", () => { delete tracker[id]; saveTracker(); renderTracker(); render(); });
      tb.append(tr);
    });
    table.append(tb);
    trackerTable.innerHTML = ""; trackerTable.append(table);
  }
  document.getElementById("export-csv").addEventListener("click", () => {
    const rows = [["Employer", "Status", "Applied on", "Notes", "Careers URL"]];
    Object.keys(tracker).forEach(id => { const t = tracker[id]; const c = companies.find(x => x.id === id); rows.push([t.company, STATUS_LABEL[t.status], t.appliedOn || "", t.notes || "", c ? c.url : ""]); });
    download("ece-internship-tracker.csv", rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"), "text/csv");
  });
  document.getElementById("export-json").addEventListener("click", () => download("ece-internship-tracker.json", JSON.stringify(tracker, null, 2), "application/json"));
  document.getElementById("import-json").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => { const inc = JSON.parse(txt); tracker = Object.assign({}, tracker, inc); saveTracker(); renderTracker(); render(); }).catch(() => alert("That file isn't a tracker backup."));
    e.target.value = "";
  });
  document.getElementById("clear-tracker").addEventListener("click", () => {
    if (confirm("Remove every tracked employer? Export a backup first if you want to keep them.")) { tracker = {}; saveTracker(); renderTracker(); render(); }
  });

  // ---------- helpers ----------
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])); }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function download(name, content, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  // ---------- go ----------
  render();
  showTab((location.hash || "#catalog").slice(1));
})();
