#!/usr/bin/env node
/* Validates data/catalog.js. Run: node scripts/validate.js */
const path = require("path");
const c = require(path.join(__dirname, "..", "data", "catalog.js"));

const SECTORS = new Set(["Semiconductors & EDA", "Big tech & consumer hardware", "Aerospace & defense", "Government & national labs", "Power, energy & utilities", "Automotive & mobility", "Robotics & deep-tech startups", "Medical devices", "Telecom & networking", "Industrial, test & measurement", "Quant finance (FPGA)"]);
const TAGS = new Set(["Analog", "Digital/FPGA", "Embedded", "Power", "RF/Wireless", "Semiconductor/VLSI", "Controls", "DSP", "Test/Validation", "PCB/Signal integrity", "Systems", "Optics/Photonics"]);
const CIT = new Set(["us", "uslpr", "open"]);
const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

let errors = 0;
const err = (m) => { errors++; console.error("  " + m); };
const seen = new Set();

c.companies.forEach((e, i) => {
  const tag = `#${i + 1} ${e.company || "(no name)"}`;
  for (const f of ["company", "sector", "hq", "sites", "roles", "tags", "soph", "cit", "opens", "pay", "url"]) if (e[f] === undefined) err(`${tag}: missing ${f}`);
  if (seen.has(e.company)) err(`${tag}: duplicate company`); seen.add(e.company);
  if (!SECTORS.has(e.sector)) err(`${tag}: unknown sector "${e.sector}"`);
  (e.tags || []).forEach(t => { if (!TAGS.has(t)) err(`${tag}: unknown tag "${t}"`); });
  if (!CIT.has(e.cit)) err(`${tag}: cit must be us | uslpr | open`);
  if (![1, 2, 3].includes(e.soph)) err(`${tag}: soph must be 1, 2, or 3`);
  if (![1, 2, 3].includes(e.pay)) err(`${tag}: pay must be 1, 2, or 3`);
  if (!MONTHS.includes((e.opens || "").slice(0, 3))) err(`${tag}: opens should start with a month abbreviation (got "${e.opens}")`);
  if (!/^https?:\/\//.test(e.url)) err(`${tag}: url must be absolute`);
  if (!Array.isArray(e.sites) || !Array.isArray(e.roles) || !Array.isArray(e.tags)) err(`${tag}: sites, roles, tags must be arrays`);
  if ((e.roles || []).length === 0) err(`${tag}: needs at least one role`);
});
c.programs.forEach((p, i) => { for (const f of ["name", "org", "who", "focus", "timing", "url"]) if (!p[f]) err(`program #${i + 1}: missing ${f}`); });
c.timeline.forEach((m, i) => { if (!m.month || !Array.isArray(m.items) || !m.items.length) err(`timeline #${i + 1}: needs month and items`); });
c.resources.forEach((g, i) => { if (!g.group || !Array.isArray(g.items)) err(`resources #${i + 1}: needs group and items`); (g.items || []).forEach(it => { if (!/^https?:\/\//.test(it.url || "")) err(`resource "${it.name}": url must be absolute`); }); });

const soph3 = c.companies.filter(e => e.soph === 3).length;
const pnw = c.companies.filter(e => e.pnw).length;
const open = c.companies.filter(e => e.cit === "open").length;
console.log(`${c.companies.length} employers, ${soph3} sophomore-friendly, ${pnw} in OR/WA/ID, ${open} with no citizenship requirement; ${c.programs.length} programs, ${c.timeline.length} timeline months.`);
if (errors) { console.error(`${errors} problem(s) found.`); process.exit(1); }
console.log("Catalog is valid.");
