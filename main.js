// main.js
window.addEventListener("error", (e) => console.error("JS error:", e.message));

/* ===== CONFIG ===== */
const SAVE_URL =
  "https://script.google.com/macros/s/AKfycbxMmwWVXfrrYDo5lNT132hx4WkkUdPAdXKKU2bbKDq362LVpgy9gqJGB9jJnDMf7FQTyg/exec";

const SAMPLE =
  (String(window.SAMPLE || "PL")).toUpperCase() === "MT" ? "MT" : "PL";

/* ===== MAP CONSTANTS ===== */
const EUROPE = [
  "FRA","BEL","DEU","CHE","ITA","MLT","ESP","PRT","GBR","IRL","NLD",
  "DNK","NOR","SWE","FIN","ISL",
  "AUT","CZE","SVK","POL","HUN","SVN","HRV",
  "BIH","SRB","MNE","MKD","ALB","GRC","BGR","ROU",
  "LTU","LVA","EST","BLR","UKR","MDA"
];

const COUNTRY_NAME = {
  FRA:"France", BEL:"Belgium", DEU:"Germany", CHE:"Switzerland",
  ITA:"Italy", MLT:"Malta", ESP:"Spain", PRT:"Portugal", GBR:"United Kingdom", IRL:"Ireland", NLD:"Netherlands",
  DNK:"Denmark", NOR:"Norway", SWE:"Sweden", FIN:"Finland", ISL:"Iceland",
  AUT:"Austria", CZE:"Czechia", SVK:"Slovakia", POL:"Poland", HUN:"Hungary",
  SVN:"Slovenia", HRV:"Croatia", BIH:"Bosnia and Herzegovina", SRB:"Serbia",
  MNE:"Montenegro", MKD:"North Macedonia", ALB:"Albania", GRC:"Greece",
  BGR:"Bulgaria", ROU:"Romania", LTU:"Lithuania", LVA:"Latvia", EST:"Estonia",
  BLR:"Belarus", UKR:"Ukraine", MDA:"Moldova"
};

const REGION_COLOR = { N:"#1039c1", S:"#d01212", E:"#eded35", W:"#35d40d", U:"#999" };
const DEFAULT_COLOR = "#c9c9c9";

/* ===== HELPERS ===== */
function shuffleCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ===== DOM ===== */
const slideCoverConsent = document.getElementById("slideCoverConsent");
const slideDemographics = document.getElementById("slideDemographics");

const slideInstrPos = document.getElementById("slideInstrPos");
const slidePos = document.getElementById("slidePos");

const slideInstrNeg = document.getElementById("slideInstrNeg");
const slideNeg = document.getElementById("slideNeg");

const slideInstrMap = document.getElementById("slideInstrMap");
const slideMapTop = document.getElementById("slideMapTop");

const slideDebrief = document.getElementById("slideDebrief");

const allSlides = [
  slideCoverConsent,   // 0
  slideDemographics,   // 1
  slideInstrPos,       // 2
  slidePos,            // 3
  slideInstrNeg,       // 4
  slideNeg,            // 5
  slideInstrMap,       // 6
  slideMapTop,         // 7
  slideDebrief         // 8
];

const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const ageEl = document.getElementById("age");
const nationalityEl = document.getElementById("nationality");
const genderMaleEl = document.getElementById("genderMale");
const genderFemaleEl = document.getElementById("genderFemale");

const consentEl = document.getElementById("consent");
const consentNextBtn = document.getElementById("consentNext");
const consentError = document.getElementById("consentError");

const demoBackBtn = document.getElementById("demoBack");
const demoNextBtn = document.getElementById("demoNext");
const demoError = document.getElementById("demoError");

const instrPosBackBtn = document.getElementById("instrPosBack");
const instrPosNextBtn = document.getElementById("instrPosNext");

const instrNegBackBtn = document.getElementById("instrNegBack");
const instrNegNextBtn = document.getElementById("instrNegNext");

const instrMapBackBtn = document.getElementById("instrMapBack");
const instrMapNextBtn = document.getElementById("instrMapNext");

const posTraitsGrid = document.getElementById("posTraitsGrid");
const negTraitsGrid = document.getElementById("negTraitsGrid");
const posBackBtn = document.getElementById("posBack");
const posNextBtn = document.getElementById("posNext");
const negBackBtn = document.getElementById("negBack");
const negNextBtn = document.getElementById("negNext");
const posError = document.getElementById("posError");
const negError = document.getElementById("negError");

const promptEl = document.getElementById("prompt");
const undoBtn = document.getElementById("undoBtn");
const mapWrap = document.getElementById("mapWrap");
const markerEl = document.getElementById("marker");
const mapDataEl = document.getElementById("mapData");
const contentEl = document.getElementById("content");

const axisButtons = document.getElementById("axisButtons");
const regionButtons = document.getElementById("regionButtons");

/* ===== PARTICIPANT ID ===== */
const startedAtISO = new Date().toISOString();
const participantId = getOrCreateParticipantId();

function getOrCreateParticipantId() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("pid");
  if (fromUrl) return fromUrl;

  const key = "euro_region_pid";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const pid = (crypto.randomUUID ? crypto.randomUUID() : ("p_" + Math.random().toString(16).slice(2)));
  localStorage.setItem(key, pid);
  return pid;
}

const submissionId =
  (crypto.randomUUID ? crypto.randomUUID() : ("s_" + Math.random().toString(16).slice(2)));

/* ===== STUDY STATE ===== */
let currentSlideIndex = 0;
let traitPosStartMs = null;
let traitNegStartMs = null;

const study = {
  sample: SAMPLE,
  participantId,
  submissionId,
  startedAt: startedAtISO,
  consent: { given: false, rtMs: null },
  demographics: { age: null, gender: "", nationality: "", residence: "" },
  traits: {
    target: (SAMPLE === "MT") ? "typical_maltese" : "typical_pole",
    positive: { items: [], rtMs: null, count: 0 },
    negative: { items: [], rtMs: null, count: 0 }
  },
  map: {
    order: shuffleCopy(EUROPE),
    responses: {}, // code -> {axis:"NS"|"EW"|"U", side:"N"|"S"|"E"|"W"|"U"}
    rtMs: {}       // code -> {axisMs:number|null, sideMs:number|null}
  }
};

/* ===== SLIDES ===== */
function setSlide(i) {
  currentSlideIndex = i;
  allSlides.forEach((s, idx) => s?.classList.toggle("active", idx === i));

  // map area visible only on map slide
  if (contentEl) contentEl.style.display = (i === 7) ? "block" : "none";

  // progress ONLY on map slide
  if (progressWrap) progressWrap.style.display = (i === 7) ? "flex" : "none";

  updateProgress();
}

function updateProgress() {
  if (currentSlideIndex !== 7) {
    if (progressBar) progressBar.value = 0;
    if (progressText) progressText.textContent = "";
    return;
  }
  const assigned = Object.keys(study.map.responses).length;
  const pct = Math.round((assigned / study.map.order.length) * 100);
  if (progressBar) progressBar.value = pct;
  if (progressText) progressText.textContent = `${pct}%`;
}

/* ===== TRAITS (UP TO 8) ===== */
function makeTraitInputs(container, prefix) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    const row = document.createElement("div");
    row.className = "traitRow";

    const n = document.createElement("div");
    n.className = "traitNum";
    n.textContent = `${i}.`;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Trait…";
    input.id = `${prefix}_${i}`;

    row.appendChild(n);
    row.appendChild(input);
    container.appendChild(row);
  }
}

function readTraitsRaw(prefix) {
  const items = [];
  for (let i = 1; i <= 8; i++) {
    items.push((document.getElementById(`${prefix}_${i}`)?.value || "").trim());
  }
  return items; // keep 8 slots (with blanks) for transparency
}

function countNonEmpty(items) {
  return items.reduce((acc, v) => acc + (v && v.trim().length > 0 ? 1 : 0), 0);
}

function validateAtLeastOne(items, errEl, label) {
  const n = countNonEmpty(items);
  if (n < 1) {
    if (errEl) {
      errEl.textContent = `Please enter at least 1 ${label} trait (you can add up to 8).`;
      errEl.style.display = "block";
    }
    return false;
  }
  if (errEl) errEl.style.display = "none";
  return true;
}

/* ===== CONSENT ===== */
let consentStartMs = performance.now();

function validateConsent() {
  if (!consentEl?.checked) {
    consentError.textContent = "Please tick the consent box to continue.";
    consentError.style.display = "block";
    return false;
  }
  consentError.style.display = "none";
  study.consent.given = true;
  study.consent.rtMs = Math.round(performance.now() - consentStartMs);
  return true;
}

/* ===== DEMOGRAPHICS ===== */
function readDemographics() {
  const rawAge = (ageEl?.value || "").trim();
  let age = null;

  if (rawAge === "") {
    demoError.textContent = "Please enter your age.";
    demoError.style.display = "block";
    return false;
  }

  const n = Number(rawAge);
  if (!Number.isFinite(n) || n < 18 || n > 120) {
    demoError.textContent = "Age must be between 18 and 120.";
    demoError.style.display = "block";
    return false;
  }
  age = n;

  let gender = "";
  if (genderMaleEl?.checked) gender = "male";
  if (genderFemaleEl?.checked) gender = "female";
  if (!gender) {
    demoError.textContent = "Please select your gender.";
    demoError.style.display = "block";
    return false;
  }

  const nationality = (nationalityEl?.value || "").trim();
  if (!nationality) {
    demoError.textContent = "Please enter your nationality.";
    demoError.style.display = "block";
    return false;
  }
  const nat = nationality.toLowerCase();
  const isPolish = nat.includes("pol") || nat.includes("poland");
  const isMaltese = nat.includes("malt");
  if (!isPolish && !isMaltese) {
    demoError.textContent = "Only Polish or Maltese participants can take part in this study.";
    demoError.style.display = "block";
    return false;
  }
  if (SAMPLE === "PL" && !isPolish) {
    demoError.textContent = "Please enter Polish nationality for this version.";
    demoError.style.display = "block";
    return false;
  }
  if (SAMPLE === "MT" && !isMaltese) {
    demoError.textContent = "Please enter Maltese nationality for this version.";
    demoError.style.display = "block";
    return false;
  }

  demoError.style.display = "none";
  study.demographics.age = age;
  study.demographics.gender = gender;
  study.demographics.nationality = nationality;
  study.demographics.residence = "";
  return true;
}

/* ===== MAP TASK (AXIS -> SIDE) ===== */
let svg = null;
let currentISO3 = null;
const historyStack = [];
let hasFinished = false;

// per-trial state
let phase = "axis";   // "axis" | "side"
let chosenAxis = null; // "NS" | "EW"
let axisStartMs = null;
let sideStartMs = null;
let lastAxisRtMs = null;

async function loadSVG() {
  const res = await fetch("./Blank_map_of_Europe_cropped.svg");
  if (!res.ok) throw new Error(`SVG fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  mapWrap.insertAdjacentHTML("afterbegin", text);

  const svgEl = mapWrap.querySelector("svg");
  if (!svgEl) throw new Error("SVG inserted but <svg> not found.");
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svgEl;
}

function paintCountry(code, side) {
  const g = svg.querySelector(`#g${code}`);
  if (!g) return;
  const color = side ? (REGION_COLOR[side] || DEFAULT_COLOR) : DEFAULT_COLOR;
  g.querySelectorAll("path").forEach(p => p.style.fill = color);
}

function pickNextUnassigned() {
  return study.map.order.find(c => !(c in study.map.responses)) || null;
}

function setPrompt() {
  if (!currentISO3) return;
  const name = COUNTRY_NAME[currentISO3];
  const needsThe = (currentISO3 === "GBR" || currentISO3 === "NLD");
  const label = needsThe ? `the ${name}` : name;

  if (phase === "axis") {
    promptEl.innerHTML = `Which dimension fits <strong>${label}</strong> best?`;
  } else {
    const dim = (chosenAxis === "NS") ? "North–South" : "East–West";
    promptEl.innerHTML = `On <strong>${dim}</strong>, where does <strong>${label}</strong> belong?`;
  }
}

function renderButtons() {
  if (!axisButtons || !regionButtons) return;
  axisButtons.style.display = (phase === "axis") ? "flex" : "none";
  regionButtons.style.display = (phase === "side") ? "flex" : "none";
}

function configureSideButtonsForAxis(axis) {
  const btnN = regionButtons?.querySelector('button[data-region="N"]');
  const btnS = regionButtons?.querySelector('button[data-region="S"]');
  const btnE = regionButtons?.querySelector('button[data-region="E"]');
  const btnW = regionButtons?.querySelector('button[data-region="W"]');

  if (!btnN || !btnS || !btnE || !btnW) return;

  if (axis === "NS") {
    btnN.style.display = "inline-block";
    btnS.style.display = "inline-block";
    btnE.style.display = "none";
    btnW.style.display = "none";
  } else {
    btnN.style.display = "none";
    btnS.style.display = "none";
    btnE.style.display = "inline-block";
    btnW.style.display = "inline-block";
  }
}

function positionMarkerOnCountry(code) {
  const g = svg.querySelector(`#g${code}`);
  if (!g) { markerEl.style.display = "none"; return; }

  const paths = [...g.querySelectorAll("path")];
  let bestRect = null, bestArea = -1;

  for (const p of paths) {
    const r = p.getBoundingClientRect();
    const area = r.width * r.height;
    if (area > bestArea) { bestArea = area; bestRect = r; }
  }
  if (!bestRect) return;

  const wrap = mapWrap.getBoundingClientRect();
  markerEl.style.left = `${bestRect.left + bestRect.width/2 - wrap.left}px`;
  markerEl.style.top  = `${bestRect.top  + bestRect.height/2 - wrap.top}px`;
  markerEl.style.display = "block";
}

function goNext() {
  currentISO3 = pickNextUnassigned();
  if (!currentISO3) { finishTask(); return; }

  phase = "axis";
  chosenAxis = null;
  lastAxisRtMs = null;
  axisStartMs = performance.now();
  sideStartMs = null;

  setPrompt();
  renderButtons();
  updateProgress();
  requestAnimationFrame(() => positionMarkerOnCountry(currentISO3));
}

function storeHistorySnapshot(code) {
  historyStack.push({
    code,
    prev: study.map.responses[code] ?? null,
    prevRt: study.map.rtMs[code] ?? null
  });
}

function finalizeResponse(code, axis, side, rtObj) {
  storeHistorySnapshot(code);
  study.map.responses[code] = { axis, side };
  study.map.rtMs[code] = rtObj;
  paintCountry(code, side);
  goNext();
}

function chooseAxis(axis) {
  if (!currentISO3) return;

  const rtAxis = axisStartMs == null ? null : Math.round(performance.now() - axisStartMs);

  // Unsure ends trial immediately
  if (axis === "U") {
    finalizeResponse(currentISO3, "U", "U", { axisMs: rtAxis, sideMs: null });
    return;
  }

  chosenAxis = axis; // "NS" or "EW"
  lastAxisRtMs = rtAxis;

  phase = "side";
  setPrompt();
  renderButtons();
  configureSideButtonsForAxis(chosenAxis);

  sideStartMs = performance.now();
}

function chooseSide(side) {
  if (!currentISO3 || phase !== "side" || !chosenAxis) return;
  const rtSide = sideStartMs == null ? null : Math.round(performance.now() - sideStartMs);
  finalizeResponse(currentISO3, chosenAxis, side, { axisMs: lastAxisRtMs, sideMs: rtSide });
}

function undo() {
  const last = historyStack.pop();
  if (!last) return;

  if (last.prev === null) {
    delete study.map.responses[last.code];
    delete study.map.rtMs[last.code];
    paintCountry(last.code, null);
  } else {
    study.map.responses[last.code] = last.prev;
    study.map.rtMs[last.code] = last.prevRt;
    const prevSide = (typeof last.prev === "string") ? last.prev : last.prev.side;
    paintCountry(last.code, prevSide);
  }

  currentISO3 = last.code;

  // restart on axis step for cleanliness
  phase = "axis";
  chosenAxis = null;
  lastAxisRtMs = null;
  axisStartMs = performance.now();
  sideStartMs = null;

  // reset side buttons (so next axis choice reconfigures correctly)
  const btnN = regionButtons?.querySelector('button[data-region="N"]');
  const btnS = regionButtons?.querySelector('button[data-region="S"]');
  const btnE = regionButtons?.querySelector('button[data-region="E"]');
  const btnW = regionButtons?.querySelector('button[data-region="W"]');
  if (btnN) btnN.style.display = "inline-block";
  if (btnS) btnS.style.display = "inline-block";
  if (btnE) btnE.style.display = "inline-block";
  if (btnW) btnW.style.display = "inline-block";

  setPrompt();
  renderButtons();
  updateProgress();
  requestAnimationFrame(() => positionMarkerOnCountry(currentISO3));
}

/* ===== SAVE ===== */
function sendPayload(payload) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    return navigator.sendBeacon(SAVE_URL, blob);
  }
  return false;
}

async function sendPayloadFallback(payload) {
  await fetch(SAVE_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
}

async function saveAutomatically() {
  const payload = { ...study, finishedAt: new Date().toISOString() };
  if (mapDataEl) mapDataEl.value = JSON.stringify(payload);

  const beaconQueued = sendPayload(payload);
  if (!beaconQueued) await sendPayloadFallback(payload);

  return { ok: true, beaconQueued };
}

async function finishTask() {
  if (hasFinished) return;
  hasFinished = true;

  // disable buttons
  document.querySelectorAll("#axisButtons button, #regionButtons button").forEach(b => b.disabled = true);
  if (undoBtn) undoBtn.disabled = true;
  if (markerEl) markerEl.style.display = "none";

  if (promptEl) promptEl.textContent = "Saving your responses…";

  try {
    await saveAutomatically();
    setSlide(8); // Debrief
  } catch (e) {
    console.error("SAVE FAILED:", e);
    if (promptEl) promptEl.textContent = "Saving failed. Please contact the researcher.";
  }
}

/* ===== TEXT: MT swap ===== */
function applySampleText() {
  if (SAMPLE === "MT") {
    document.querySelectorAll("#slidePos .h1, #slideNeg .h1").forEach(el => {
      el.textContent = "Describe Maltese people";
    });
  }
}

/* ===== INIT ===== */
(async () => {
  applySampleText();
  makeTraitInputs(posTraitsGrid, "pos");
  makeTraitInputs(negTraitsGrid, "neg");

  // start
  setSlide(0);
  if (contentEl) contentEl.style.display = "none";
  if (progressWrap) progressWrap.style.display = "none";

  // Cover consent -> demographics
  consentNextBtn.onclick = () => {
    if (!validateConsent()) return;
    setSlide(1);
    ageEl?.focus();
  };

  // Demographics
  demoBackBtn.onclick = () => setSlide(0);
  demoNextBtn.onclick = () => {
    if (!readDemographics()) return;
    setSlide(2); // instructions pos
  };

  // Instructions Pos
  instrPosBackBtn.onclick = () => setSlide(1);
  instrPosNextBtn.onclick = () => {
    traitPosStartMs = performance.now();
    if (posError) posError.style.display = "none";
    setSlide(3);
    document.getElementById("pos_1")?.focus();
  };

  // Positive traits (up to 8; require at least 1)
  posBackBtn.onclick = () => setSlide(2);
  posNextBtn.onclick = () => {
    const items = readTraitsRaw("pos");
    if (!validateAtLeastOne(items, posError, "positive")) return;

    study.traits.positive.items = items;
    study.traits.positive.count = countNonEmpty(items);
    study.traits.positive.rtMs = Math.round(performance.now() - traitPosStartMs);

    setSlide(4); // instructions neg
  };

  // Instructions Neg
  instrNegBackBtn.onclick = () => setSlide(3);
  instrNegNextBtn.onclick = () => {
    traitNegStartMs = performance.now();
    if (negError) negError.style.display = "none";
    setSlide(5);
    document.getElementById("neg_1")?.focus();
  };

  // Negative traits (up to 8; require at least 1)
  negBackBtn.onclick = () => setSlide(4);
  negNextBtn.onclick = () => {
    const items = readTraitsRaw("neg");
    if (!validateAtLeastOne(items, negError, "negative")) return;

    study.traits.negative.items = items;
    study.traits.negative.count = countNonEmpty(items);
    study.traits.negative.rtMs = Math.round(performance.now() - traitNegStartMs);

    setSlide(6); // instructions map
  };

  // Instructions Map
  instrMapBackBtn.onclick = () => setSlide(5);
  instrMapNextBtn.onclick = async () => {
    setSlide(7); // map

    svg = await loadSVG();
    study.map.order.forEach(c => paintCountry(c, null));

    // Axis buttons
    document.querySelectorAll("#axisButtons button").forEach(btn => {
      btn.onclick = () => chooseAxis(btn.dataset.axis);
    });

    // Side buttons
    document.querySelectorAll("#regionButtons button").forEach(btn => {
      btn.onclick = () => chooseSide(btn.dataset.region);
    });

    if (undoBtn) undoBtn.onclick = undo;

    window.addEventListener("resize", () => {
      if (currentISO3) requestAnimationFrame(() => positionMarkerOnCountry(currentISO3));
    });

    // start task
    phase = "axis";
    renderButtons();
    goNext();
  };
})();
