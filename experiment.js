(function () {
  const t = () => translations[settings.language] || translations.en;
  const referenceCards = [
    { index: 0, color: "red", shape: "triangle", number: 1, label: "Card 0" },
    { index: 1, color: "green", shape: "star", number: 2, label: "Card 1" },
    { index: 2, color: "yellow", shape: "diamond", number: 3, label: "Card 2" },
    { index: 3, color: "blue", shape: "circle", number: 4, label: "Card 3" }
  ];
  const trainingCards = [
    { index: 0, color: "red", shape: "triangle", number: 1, correctChoice: 0, label: "Training Card 0" },
    { index: 1, color: "green", shape: "star", number: 2, correctChoice: 1, label: "Training Card 1" },
    { index: 2, color: "yellow", shape: "diamond", number: 3, correctChoice: 2, label: "Training Card 2" }
  ];
  const polishTraits = [
    { id: "goscinnosc", label: "Gościnność" },
    { id: "pracowitosc", label: "Pracowitość" },
    { id: "rodzinnosc", label: "Rodzinność" },
    { id: "wytrwalosc", label: "Wytrwałość" },
    { id: "pomocnosc", label: "Uczynność / pomocność" },
    { id: "zaradnosc", label: "Zaradność" },
    { id: "zawisc", label: "Zawiść / zazdrość" },
    { id: "pesymizm", label: "Pesymizm" },
    { id: "narzekanie", label: "Narzekanie" },
    { id: "nietolerancyjnosc", label: "Nietolerancyjność" },
    { id: "klotliwosc", label: "Kłótliwość" },
    { id: "alkoholizm", label: "Skłonność do alkoholizmu" }
  ];
  const otherEuropeRegions = [
    { id: "north", keyPrefix: "north_europe", label: "Europejczyków z Europy Północnej", examples: "np. Szwecja, Norwegia, Finlandia, Dania" },
    { id: "south", keyPrefix: "south_europe", label: "Europejczyków z Europy Południowej", examples: "np. Włochy, Hiszpania, Malta, Portugalia" },
    { id: "west", keyPrefix: "west_europe", label: "Europejczyków z Europy Zachodniej", examples: "np. Niemcy, Francja, Holandia, Belgia" },
    { id: "east", keyPrefix: "east_europe", label: "Europejczyków z Europy Wschodniej", examples: "np. Ukraina, Czechy, Węgry, Rumunia" }
  ];
  const selectedTrialNumberSet = Array.isArray(settings.selectedTrialNumbers) && settings.selectedTrialNumbers.length
    ? new Set(settings.selectedTrialNumbers)
    : null;
  const availableCards = cards
    .slice()
    .sort((a, b) => a.trialNumber - b.trialNumber)
    .filter(card => !selectedTrialNumberSet || selectedTrialNumberSet.has(card.trialNumber));
  const activeCards = availableCards
    .slice(0, Math.min(settings.totalCards || availableCards.length, availableCards.length));
  const totalTrials = activeCards.length;
  const ruleNames = { C: "Color", S: "Shape", N: "Number" };
  const ruleColumnNames = { C: "colorRule", S: "shapeRule", N: "numberRule" };
  const ruleCycleNumbers = { C: 1, S: 2, N: 3 };

  function randomSubjectId(length = 15) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let out = "";
    crypto.getRandomValues(new Uint32Array(length)).forEach(v => { out += chars[v % chars.length]; });
    return out;
  }

  function shapeSVG(shape, color) {
    if (shape === "triangle") return `<polygon points="50,18 78,74 22,74" fill="${color}" />`;
    if (shape === "star") return `<polygon points="50,10 70,50 50,90 30,50" fill="${color}" />`;
    if (shape === "diamond") return `<path d="M38 10 H62 V38 H90 V62 H62 V90 H38 V62 H10 V38 H38 Z" fill="${color}" />`;
    return `<circle cx="50" cy="50" r="24" fill="${color}" />`;
  }

  function cardSlots(number) {
    return {
      1: [{ x: 50, y: 50, scale: 0.9 }],
      2: [{ x: 34, y: 30, scale: 0.56 }, { x: 66, y: 70, scale: 0.56 }],
      3: [{ x: 50, y: 24, scale: 0.5 }, { x: 28, y: 72, scale: 0.5 }, { x: 72, y: 72, scale: 0.5 }],
      4: [{ x: 30, y: 30, scale: 0.5 }, { x: 70, y: 30, scale: 0.5 }, { x: 30, y: 70, scale: 0.5 }, { x: 70, y: 70, scale: 0.5 }]
    }[number];
  }

  function renderCardSVG(card) {
    const slots = cardSlots(card.number);
    const shapes = slots.map(({ x, y, scale }) => `<g transform="translate(${x} ${y}) scale(${scale}) translate(-50 -50)">${shapeSVG(card.shape, card.color)}</g>`).join("");
    return `<svg viewBox="0 0 100 100" class="card-svg" aria-label="${card.number} ${card.color} ${card.shape}${card.number > 1 ? 's' : ''}">${shapes}</svg>`;
  }

  function computeAppliedRule(choice, target) {
    const matches = [];
    if (choice === target.colorRule) matches.push("C");
    if (choice === target.shapeRule) matches.push("S");
    if (choice === target.numberRule) matches.push("N");
    return matches.join("");
  }

  function checkRestricted(src, restricted) {
    if (!src || !restricted) return false;
    return !src.split("").some(ch => restricted.indexOf(ch) === -1);
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function downloadCSV(filename, rows) {
    const headers = Array.from(rows.reduce((set, row) => { Object.keys(row).forEach(k => set.add(k)); return set; }, new Set()));
    const lines = [headers.join(",")].concat(rows.map(row => headers.map(h => csvEscape(row[h])).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function buildSheetsFields(payload) {
    return new URLSearchParams({
      source: "card_sorting",
      sample: settings.sample || "",
      uiLang: settings.uiLang || "",
      date: payload.date,
      participantId: payload.participantId,
      condition: payload.condition || "",
      sessionCreatedAt: payload.sessionCreatedAt || "",
      consentGiven: payload.consent && payload.consent.given ? "1" : "0",
      totalTrials: String(payload.summary && payload.summary.STAT_nr_of_trials || 0),
      categoriesAchieved: String(payload.summary && payload.summary.STAT_category_achieved || 0),
      responseData: JSON.stringify(payload)
    });
  }

  async function savePayloadToGoogleSheets(payload) {
    if (!settings.saveUrl) {
      return { ok: false, skipped: true, message: "Missing save URL." };
    }

    const body = buildSheetsFields(payload);

    try {
      const response = await fetch(settings.saveUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body
      });
      if (!response.ok) {
        return { ok: false, message: `HTTP ${response.status}` };
      }
      return { ok: true, confirmed: true, message: "Saved to Google Sheets." };
    } catch (error) {
      if (navigator.sendBeacon && navigator.sendBeacon(settings.saveUrl, body)) {
        return { ok: true, confirmed: false, message: "Save request queued." };
      }

      try {
        await fetch(settings.saveUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body
        });
        return { ok: true, confirmed: false, message: "Save request sent without confirmation." };
      } catch (fallbackError) {
        return { ok: false, message: fallbackError && fallbackError.message ? fallbackError.message : (error && error.message ? error.message : "Save failed.") };
      }
    }
  }

  const state = {
    subject: randomSubjectId(15),
    sessionCreatedAt: new Date().toISOString(),
    startedAt: null,
    phase: "consent",
    consentGiven: false,
    consentAt: "",
    consentRtMs: "",
    demographicsAt: "",
    demographicsRtMs: "",
    age: "",
    gender: "",
    citizenship: "",
    traitRatingsAt: "",
    traitRatingsRtMs: "",
    traitRatings: {},
    regionTraitRatingsAt: {},
    regionTraitRatingsRtMs: {},
    regionTraitRatings: {},
    trainingIndex: 0,
    trialIndex: 0,
    categoryCompleted: 0,
    currentRuleIdx: 0,
    currentRule: settings.ruleSequence[0],
    correctInRow: 0,
    totalErrors: 0,
    trials: [],
    ended: false
  };

  let consentShownAt = null;
  let demographicsShownAt = null;

  function uiText(polish, fallback) {
    return settings.language === "pl" ? polish : fallback;
  }

  function nextTarget() { return activeCards[state.trialIndex] || null; }
  function nextTrainingTarget() { return trainingCards[state.trainingIndex]; }
  function completedCategoriesForTrial(trialIndex) {
    return Math.min(Math.floor(trialIndex / settings.trialsPerRule), settings.maxCategories);
  }

  function syncMainRuleState(trialIndex = state.trialIndex) {
    state.categoryCompleted = completedCategoriesForTrial(trialIndex);
    state.currentRuleIdx = Math.min(state.categoryCompleted, settings.ruleSequence.length - 1);
    state.currentRule = settings.ruleSequence[state.currentRuleIdx] || null;
  }

  function renderConsentPage() {
    state.phase = "consent";
    consentShownAt = performance.now();
    const app = document.getElementById("app");
    app.className = "consent-mode";
    app.innerHTML = `
      <div class="screen start-screen"><div class="panel start-panel consent-look">
            <div class="brand-row">
          <img src="logo.png" alt="University crest" class="brand-logo" onerror="this.style.display='none'" />
        </div>

        <h1 class="hero-title">Między narodem a Europą</h1>

        <div class="hero-meta">
          <div>Instytut Kognitywistyki, Wydział Mediów i Nauk Społecznych</div>
          <div>Uniwersytet Maltański</div>
          <div>Studentka: Wiktoria Szot • Promotor: Prof. Gordon Sammut</div>
          <div>Kontakt: wiktoria.szot.24@um.edu.mt</div>
        </div>
        <div class="consent-frame-wrap">
          <div class="consent-frame-scroll">
            <div class="consent-frame-head">
            </div>

            <div class="consent-inner-box">
              <div class="consent-section-title">Cel badania</div>
              <p>Badanie dotyczy sposobów przetwarzania informacji oraz tego, jak Polacy postrzegają różne regiony Europy.</p>

              <div class="consent-section-title">Kryteria udziału</div>
              <p>Uczestnicy badania muszą mieć ukończone 18 lat oraz posiadać obywatelstwo polskie.</p>

              <div class="consent-section-title">Przebieg badania</div>
              <p>W trakcie badania uczestnicy wykonają krótkie zadanie polegające na dopasowywaniu kart. Na ekranie pojawią się cztery karty oraz dodatkowa karta, którą należy przyporządkować do jednej z nich. Po jego przeczytaniu uczestnicy zostaną poproszeni o ocenę, w jakim stopniu różne cechy pasują do Polaków oraz innych regionów Europy, zaznaczając odpowiedzi na 7-stopniowej skali Likerta.</p>

              <p>Badanie ma charakter jednorazowy i powinno zająć około 20 minut.</p>

              <div class="consent-section-title">Dobrowolność udziału</div>
              <p>Udział w badaniu jest całkowicie dobrowolny. Uczestnik może przerwać udział w dowolnym momencie, bez podawania przyczyny i bez żadnych negatywnych konsekwencji.</p>

              <div class="consent-section-title">Poufność danych</div>
              <p>Wszystkie informacje zebrane w badaniu pozostaną poufne i będą kodowane za pomocą unikalnego identyfikatora uczestnika. Dane będą przechowywane w arkuszach Google Sheets i wykorzystywane wyłącznie do celów naukowych. Wyniki badania mogą być prezentowane jedynie w formie zbiorczych analiz statystycznych.</p>

              <p>Uczestnik ma prawo do wglądu w swoje dane oraz do żądania ich usunięcia zgodnie z obowiązującymi przepisami dotyczącymi ochrony danych osobowych.</p>

              <div class="consent-section-title">Ryzyka i korzyści</div>
              <p>Udział w badaniu nie wiąże się z przewidywalnym ryzykiem. Za udział w badaniu uczestnicy otrzymają wynagrodzenie pieniężne.</p>
            </div>
          </div>
        </div>

        <label class="consent-check consent-check-large">
          <input id="consent-checkbox" type="checkbox" />
          <span>Potwierdzam, że mam ukończone 18 lat i wyrażam zgodę na udział w badaniu.</span>
        </label>

        <div id="consent-error" class="form-error" role="alert" aria-live="polite"></div>

        <div class="button-row center-row consent-button-row">
          <button id="consent-next-btn">Dalej</button>
        </div>
      </div></div>`;

    const heroMeta = app.querySelector(".hero-meta");
    if (heroMeta) {
      heroMeta.innerHTML = [
        "Studentka: Wiktoria Szot",
        "Promotor: Prof. Gordon Sammut",
        "Kontakt: wiktoria.szot.24@um.edu.mt"
      ].map(line => `<div>${line}</div>`).join("");
    }

    const consentHead = app.querySelector(".consent-frame-head");
    if (consentHead) {
      consentHead.innerHTML = [
        "Uniwersytet Malta\u0144ski",
        "Wydzia\u0142 Medi\u00f3w i Nauk Spo\u0142ecznych",
        "Instytut Kognitywistyki"
      ].map(line => `<div>${line}</div>`).join("");
    }

    const consentBox = app.querySelector(".consent-inner-box");
    if (consentBox) {
      consentBox.innerHTML = `
        <div class="consent-doc">
          <p><strong>Cel badania:</strong> Badanie dotyczy sposobów przetwarzania informacji oraz tego, jak Polacy postrzegają różne regiony Europy.</p>

          <p><strong>Kryteria udziału:</strong> Uczestnicy badania muszą mieć ukończone 18 lat oraz posiadać obywatelstwo polskie.</p>

          <p><strong>Przebieg:</strong> W trakcie badania uczestnicy wykonają krótkie zadanie polegające na dopasowywaniu kart. Na ekranie pojawią się cztery karty oraz dodatkowa karta, którą należy przyporządkować do jednej z nich. Po jego przeczytaniu uczestnicy zostaną poproszeni o ocenę, w jakim stopniu różne cechy pasują do Polaków oraz innych regionów Europy, zaznaczając odpowiedzi na 7-stopniowej skali Likerta.</p>

          <p>Badanie ma charakter jednorazowy i powinno zająć około 20 minut.</p>

          <p><strong>Dobrowolność udziału:</strong> Udział w badaniu jest całkowicie dobrowolny. Uczestnik może przerwać udział w dowolnym momencie, bez podawania przyczyny i bez żadnych negatywnych konsekwencji.</p>

          <p><strong>Poufność danych:</strong> Wszystkie informacje zebrane w badaniu pozostaną poufne i będą kodowane za pomocą unikalnego identyfikatora uczestnika. Dane będą przechowywane w arkuszach Google Sheets i wykorzystywane wyłącznie do celów naukowych. Wyniki badania mogą być prezentowane jedynie w formie zbiorczych analiz statystycznych.</p>

          <p>Uczestnik ma prawo do wglądu w swoje dane oraz do żądania ich usunięcia zgodnie z obowiązującymi przepisami dotyczącymi ochrony danych osobowych.</p>

          <p><strong>Ryzyka i korzyści:</strong> Udział w badaniu nie wiąże się z przewidywalnym ryzykiem. Za udział w badaniu uczestnicy otrzymają wynagrodzenie pieniężne.</p>
        </div>`;
    }

    document.getElementById("consent-next-btn").addEventListener("click", () => {
      const checkbox = document.getElementById("consent-checkbox");
      const error = document.getElementById("consent-error");
      if (!checkbox.checked) {
        error.textContent = "Aby przejść dalej, zaznacz zgodę na udział w badaniu.";
        return;
      }

      state.consentGiven = true;
      state.consentAt = new Date().toISOString();
      state.consentRtMs = Math.round(performance.now() - consentShownAt);
      renderDemographics();
    });

    const consentCheckbox = document.getElementById("consent-checkbox");
    if (consentCheckbox) consentCheckbox.checked = state.consentGiven;
  }

  function renderDemographics() {
    state.phase = "demographics";
    demographicsShownAt = performance.now();
    const app = document.getElementById("app");
    app.className = "";
    app.innerHTML = `
      <div class="screen"><div class="panel demographics-panel">
        <h1 class="center">${uiText("Dane demograficzne", "Demographic information")}</h1>
        <p class="center">${uiText("Przed przej\u015bciem dalej uzupe\u0142nij kr\u00f3tki formularz.", "Please complete the short form before continuing.")}</p>

        <div class="demographics-form">
          <label class="demographics-field">
            <span>${uiText("Wiek", "Age")}</span>
            <input id="age-input" type="number" min="18" max="120" inputmode="numeric" />
          </label>

          <label class="demographics-field">
            <span>${uiText("P\u0142e\u0107", "Gender")}</span>
            <select id="gender-select">
              <option value="">${uiText("Wybierz", "Select")}</option>
              <option value="kobieta">${uiText("Kobieta", "Woman")}</option>
              <option value="m\u0119\u017cczyzna">${uiText("M\u0119\u017cczyzna", "Man")}</option>
            </select>
          </label>

          <label class="demographics-field">
            <span>${uiText("Obywatelstwo", "Citizenship")}</span>
            <select id="citizenship-select">
              <option value="">${uiText("Wybierz", "Select")}</option>
              <option value="polskie">${uiText("Polskie", "Polish")}</option>
              <option value="inne">${uiText("Inne", "Other")}</option>
            </select>
          </label>

          <label class="demographics-field">
  <span>Adres e-mail</span>
  <input id="email-input" type="email" autocomplete="email" required />
</label>

        </div>

        <div id="demographics-error" class="form-error" role="alert" aria-live="polite"></div>

        <div class="button-row center-row">
          <button id="demographics-back-btn" type="button">${uiText("Cofnij", "Back")}</button>
          <button id="demographics-next-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;

    document.getElementById("age-input").value = state.age;
    document.getElementById("gender-select").value = state.gender;
    document.getElementById("citizenship-select").value = state.citizenship;

    document.getElementById("demographics-next-btn").addEventListener("click", () => {
      const age = document.getElementById("age-input").value.trim();
      const gender = document.getElementById("gender-select").value;
      const citizenship = document.getElementById("citizenship-select").value;
      const error = document.getElementById("demographics-error");
      error.textContent = "";

      const ageNumber = Number(age);
      if (!age || !Number.isInteger(ageNumber) || ageNumber < 18 || ageNumber > 120) {
        error.textContent = uiText("Podaj poprawny wiek (18-120 lat).", "Enter a valid age (18-120).");
        return;
      }
      if (!gender) {
        error.textContent = uiText("Wybierz p\u0142e\u0107.", "Select gender.");
        return;
      }
      if (!citizenship) {
        error.textContent = uiText("Wybierz obywatelstwo.", "Select citizenship.");
        return;
      }
      if (citizenship !== "polskie") {
        error.textContent = uiText("W badaniu mog\u0105 bra\u0107 udzia\u0142 wy\u0142\u0105cznie osoby z obywatelstwem polskim.", "Only participants with Polish citizenship can take part in this study.");
        return;
      }

      state.age = String(ageNumber);
      state.gender = gender;
      state.citizenship = citizenship;
      state.demographicsAt = new Date().toISOString();
      state.demographicsRtMs = Math.round(performance.now() - demographicsShownAt);
      renderWelcome();
    });

    document.getElementById("demographics-back-btn").addEventListener("click", renderConsentPage);
  }

  function renderWelcome() {
    const app = document.getElementById("app");
    app.className = "";
    const welcomeTitle = settings.language === "pl" ? "Sortowanie kart" : t().welcome;
    const welcomeParagraphs = settings.language === "pl"
      ? [
          "W tym zadaniu u góry ekranu zobaczysz cztery karty. Różnią się one liczbą, kolorem i kształtem.",
          "Niżej będzie pojawiać się nowa karta. Twoim zadaniem jest zdecydować, do której karty u góry ona pasuje.",
          "Przed rozpoczęciem właściwego eksperymentu zostaną przeprowadzone trzy próby treningowe, których celem będzie zapoznanie się z przebiegiem zadania."
        ]
      : [t().intro1, t().intro2, t().intro3, t().intro4].filter(Boolean);
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h1>${welcomeTitle}</h1>
        ${welcomeParagraphs.map(text => `<p>${text}</p>`).join("")}
        <div class="button-row center-row">
          <button id="welcome-back-btn" type="button">${uiText("Cofnij", "Back")}</button>
          <button id="start-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;
    document.getElementById("welcome-back-btn").addEventListener("click", renderDemographics);
    document.getElementById("start-btn").addEventListener("click", renderTrainingIntro);
  }

  function renderTrainingIntro() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "training_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h1>${uiText("Sesja treningowa", "Training session")}</h1>
        <p>${uiText("Za chwilę rozpoczną się 3 próby treningowe.", "Three practice trials will begin next.")}</p>
        <p>${uiText("Nie będą one wliczane do zbieranych danych, służą tylko do zapoznania się z przebiegiem zadania.", "They will not be included in the collected data. They are only meant to familiarize you with the task.")}</p>
        <button id="training-start-btn">${uiText("Rozpocznij trening", "Start training")}</button>
      </div></div>`;
    document.getElementById("training-start-btn").addEventListener("click", startTraining);
  }

  function renderPostTrainingIntro() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "main_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h1>${uiText("Koniec treningu", "Training complete")}</h1>
        <p>${uiText("Sesja treningowa została zakończona.", "The practice session is complete.")}</p>
        <p>${uiText("Teraz rozpoczyna się właściwy eksperyment.", "The main task starts now and responses will be saved in the results from this point onward.")}</p>
        <button id="main-start-btn">${t().begin}</button>
      </div></div>`;
    document.getElementById("main-start-btn").addEventListener("click", startTask);
  }

  function renderTask(target, feedbackText = "", feedbackClass = "", selectedChoice = null, mode = "main") {
    const app = document.getElementById("app");
    app.className = "";
    const isTraining = mode === "training";
    const metaLabel = isTraining
      ? `${uiText("Próba treningowa", "Practice trial")} <strong>${state.trainingIndex + 1}</strong> ${t().ofLabel} <strong>${trainingCards.length}</strong>`
      : `${t().trialLabel} <strong>${state.trialIndex + 1}</strong> ${t().ofLabel} <strong>${totalTrials}</strong>`;
    app.innerHTML = `
      <div class="screen"><div class="panel">
        <div class="meta">
          <div>${metaLabel}</div>
        </div>
        <p class="center">${t().topInstruction}</p>
        <div class="task-layout">
          <div class="reference-row">
            ${referenceCards.map(card => {
              const classes = ["reference-card"];
              if (feedbackClass) classes.push("disabled");
              if (selectedChoice === card.index) classes.push("selected");
              return `<button class="${classes.join(" ")}" data-choice="${card.index}" aria-label="${card.label}">${renderCardSVG(card)}</button>`;
            }).join("")}
          </div>
          <div class="feedback ${feedbackClass}">${feedbackText}</div>
          <div class="target-wrap"><div class="target-card">${renderCardSVG(target)}</div></div>
        </div>
      </div></div>`;
    if (!feedbackClass) {
      document.querySelectorAll(".reference-card").forEach(btn => btn.addEventListener("click", () => handleChoice(Number(btn.dataset.choice))));
    }
  }

  function previousCategoryRule() {
    if (state.categoryCompleted === 0) return "";
    return settings.ruleSequence[state.currentRuleIdx - 1] || "";
  }

  function handleChoice(choice) {
    if (state.phase === "training") {
      handleTrainingChoice(choice);
      return;
    }

    syncMainRuleState();
    const target = nextTarget();
    const rt = Math.round(performance.now() - state.startedAt);
    const correctCard = target[ruleColumnNames[state.currentRule]];
    const correct = choice === correctCard;
    const appliedRule = computeAppliedRule(choice, target);
    const prevAppliedRuleString = state.trials.length ? state.trials[state.trials.length - 1].applied_rule : "";

    let perseverativeError = 0;
    let nonPerseverativeError = 0;
    const prevRule = previousCategoryRule();
    if (!correct) {
      if (prevRule && choice === target[ruleColumnNames[prevRule]]) perseverativeError = 1;
      else nonPerseverativeError = 1;
    }

    const failureToMaintain = (!correct && state.correctInRow >= 5 && state.correctInRow < settings.criterionCorrectInRow) ? 1 : 0;

    if (correct) state.correctInRow += 1;
    else { state.correctInRow = 0; state.totalErrors += 1; }

    const categoriesCompletedAfterTrial = completedCategoriesForTrial(state.trialIndex + 1);

    const trial = {
      subject: state.subject,
      condition: settings.condition || "",
      consent_given: state.consentGiven ? 1 : 0,
      consent_at: state.consentAt,
      age: state.age,
      gender: state.gender,
      citizenship: state.citizenship,
      card_number: target.trialNumber,
      correct: correct,
      correct_in_row: state.correctInRow,
      active_rule: state.currentRule || "",
      active_rule_label: ruleNames[state.currentRule] || "",
      number_of_rule: ruleCycleNumbers[state.currentRule] || "",
      category_completed: categoriesCompletedAfterTrial,
      applied_rule: appliedRule,
      perseverative_error: perseverativeError,
      perseverative_response: 0,
      non_perseverative_error: nonPerseverativeError,
      failure_to_maintain: failureToMaintain,
      total_errors: state.totalErrors,
      correct_card: correctCard,
      color_rule: target.colorRule,
      shape_rule: target.shapeRule,
      number_rule: target.numberRule,
      trial_type: "card_sort",
      test_part: "task",
      stimulus: `${target.number}_${target.color}_${target.shape}`,
      choice: choice,
      rt_ms: rt
    };

    if (state.trials.length) {
      const isSame = checkRestricted(appliedRule, prevAppliedRuleString) || checkRestricted(prevAppliedRuleString, appliedRule);
      if (!correct && isSame) trial.perseverative_response = 1;
    }

    state.trials.push(trial);
    renderTask(target, correct ? t().correct : t().wrong, correct ? "correct" : "wrong", choice, "main");
    state.categoryCompleted = categoriesCompletedAfterTrial;
    if ((state.trialIndex + 1) % settings.trialsPerRule === 0) state.correctInRow = 0;

    window.setTimeout(() => {
      state.trialIndex += 1;
      syncMainRuleState();
      if (state.trialIndex >= totalTrials) endTask();
      else { state.startedAt = performance.now(); renderTask(nextTarget(), "", "", null, "main"); }
    }, 750);
  }

  function handleTrainingChoice(choice) {
    const target = nextTrainingTarget();
    const correct = choice === target.correctChoice;

    renderTask(target, correct ? t().correct : t().wrong, correct ? "correct" : "wrong", choice, "training");

    window.setTimeout(() => {
      state.trainingIndex += 1;
      if (state.trainingIndex >= trainingCards.length) renderPostTrainingIntro();
      else renderTask(nextTrainingTarget(), "", "", null, "training");
    }, 750);
  }

  function buildSummary() {
    const n = state.trials.length;
    const correctN = state.trials.filter(r => r.correct).length;
    const errorsN = n - correctN;
    const persRespN = state.trials.filter(r => r.perseverative_response === 1).length;
    const persErrN = state.trials.filter(r => r.perseverative_error === 1).length;
    const ftmN = state.trials.filter(r => r.failure_to_maintain === 1).length;
    const firstCatRow = state.trials.find(r => r.number_of_rule === 1 && r.category_completed >= 1);

    return {
      STAT_nr_of_trials: n,
      STAT_p_of_correct_trials: n ? +(100 * correctN / n).toFixed(2) : 0,
      STAT_nr_of_of_total_errors: errorsN,
      STAT_p_of_errors: n ? +(100 * errorsN / n).toFixed(2) : 0,
      STAT_category_achieved: state.categoryCompleted,
      STAT_nr_of_perseverative_responses: persRespN,
      STAT_nr_of_perseverative_errors: persErrN,
      STAT_p_perseverative_errors: n ? +(100 * persErrN / n).toFixed(2) : 0,
      STAT_failure_to_maintain_set: ftmN,
      STAT_trials_to_complete_first_category: firstCatRow ? firstCatRow.card_number : ""
    };
  }

  function traitRatingsColumns() {
    const polandColumns = polishTraits.reduce((acc, trait) => {
      acc[`poland_trait_${trait.id}`] = state.traitRatings[trait.id] || "";
      return acc;
    }, {});
    return otherEuropeRegions.reduce((acc, region) => {
      polishTraits.forEach(trait => {
        acc[`${region.keyPrefix}_trait_${trait.id}`] = (state.regionTraitRatings[region.id] || {})[trait.id] || "";
      });
      return acc;
    }, polandColumns);
  }

  function finalPayload() {
    const exportedTrials = state.trials.map(trial => ({
      card_number: trial.card_number,
      correct: trial.correct,
      correct_in_row: trial.correct_in_row,
      active_rule: trial.active_rule,
      active_rule_label: trial.active_rule_label,
      number_of_rule: trial.number_of_rule,
      category_completed: trial.category_completed,
      applied_rule: trial.applied_rule,
      perseverative_error: trial.perseverative_error,
      perseverative_response: trial.perseverative_response,
      non_perseverative_error: trial.non_perseverative_error,
      failure_to_maintain: trial.failure_to_maintain,
      total_errors: trial.total_errors,
      correct_card: trial.correct_card,
      color_rule: trial.color_rule,
      shape_rule: trial.shape_rule,
      number_rule: trial.number_rule,
      trial_type: trial.trial_type,
      test_part: trial.test_part,
      stimulus: trial.stimulus,
      choice: trial.choice,
      rt_ms: trial.rt_ms
    }));

    return {
      date: new Date().toISOString(),
      participantId: state.subject,
      condition: settings.condition,
      sample: settings.sample,
      uiLang: settings.uiLang,
      language: settings.language,
      dataLanguage: settings.dataLanguage,
      sessionCreatedAt: state.sessionCreatedAt,
      consent: {
        given: state.consentGiven,
        at: state.consentAt,
        rtMs: state.consentRtMs
      },
      demographics: {
        at: state.demographicsAt,
        rtMs: state.demographicsRtMs,
        age: state.age,
        gender: state.gender,
        citizenship: state.citizenship
      },
      traitRatings: {
        at: state.traitRatingsAt,
        rtMs: state.traitRatingsRtMs,
        poland: state.traitRatings,
        regions: state.regionTraitRatings,
        regionRtMs: state.regionTraitRatingsRtMs,
        regionAt: state.regionTraitRatingsAt
      },
      summary: buildSummary(),
      trials: exportedTrials
    };
  }

  function finalRows(payload) {
    return [{
      date: payload.date,
      condition: payload.condition,
      participantId: payload.participantId,
      responseData: JSON.stringify(payload)
    }];
  }

  function renderCompletionScreen() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "end";
    const payload = finalPayload();
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h2>${t().endTitle}</h2>
        <p id="save-status" aria-live="polite">Trwa zapisywanie danych...</p>
      </div></div>`;

    const saveStatus = document.getElementById("save-status");

    savePayloadToGoogleSheets(payload).then(result => {
      if (result.ok && result.confirmed) {
        saveStatus.textContent = "Dane zostały zapisane, dziękuję za udział!";
      } else if (result.ok) {
        saveStatus.textContent = "Żądanie zapisu zostało wysłane. Proszę chwilę poczekać.";
      } else if (result.skipped) {
        saveStatus.textContent = "Brak adresu zapisu do Google Sheets.";
      } else {
        saveStatus.textContent = `Nie udało się zapisać danych: ${result.message}`;
      }
    });
  }

  function renderArticleScreen() {
    const app = document.getElementById("app");
    const article = settings.articleContent || { headline: "", body: "" };
    const articleHeadline = article.headline ? `<h3>${article.headline}</h3>` : "";
    app.className = "";
    state.phase = "article";
    app.innerHTML = `
      <div class="screen article-screen"><div class="panel article-panel">
        <h2 class="center">Przeczytaj uważnie tekst</h2>
        <div class="article-text-wrap">
          ${articleHeadline}
          <p>${article.body}</p>
        </div>
        <div class="button-row center-row">
          <button id="article-back-btn" type="button">${uiText("Cofnij", "Back")}</button>
          <button id="article-next-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;
    document.getElementById("article-back-btn").addEventListener("click", endTask);
    document.getElementById("article-next-btn").addEventListener("click", renderFinalTaskIntro);
  }

  function renderFinalTaskIntro() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "final_task_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h2>Ostatnie zadanie</h2>
        <p>W ostatnim zadaniu zostanie podanych 12 cech: 6 pozytywnych i 6 negatywnych.</p>
        <p>Twoim zadaniem będzie ocenić, w jakim stopniu każda z tych cech jest charakterystyczna dla Polaków.</p>
        <p>Odpowiedzi będziesz zaznaczać na 7-stopniowej skali Likerta, gdzie <strong>1</strong> oznacza <strong>zdecydowanie nie zgadzam się</strong>, a <strong>7</strong> oznacza <strong>zdecydowanie się zgadzam</strong>.</p>
        <div class="button-row center-row">
          <button id="final-task-intro-back-btn" type="button">${uiText("Cofnij", "Back")}</button>
          <button id="final-task-intro-next-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;
    document.getElementById("final-task-intro-back-btn").addEventListener("click", renderArticleScreen);
    document.getElementById("final-task-intro-next-btn").addEventListener("click", renderPolishTraitsTask);
  }

  function renderTraitRatingsTask(options) {
    const { phase, title, subtitle, ratings, nextLabel, onSubmit } = options;
    const app = document.getElementById("app");
    app.className = "";
    state.phase = phase;
    const scales = [1, 2, 3, 4, 5, 6, 7];
    const savedAt = performance.now();
    app.innerHTML = `
      <div class="screen trait-screen"><div class="panel trait-panel">
        <h2 class="center">${title}</h2>
        <p class="center trait-subtitle">${subtitle}</p>
        <div class="trait-table-wrap">
          <table class="trait-table">
            <thead>
              <tr>
                <th>Cecha</th>
                ${scales.map(value => `<th>${value}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${polishTraits.map(trait => `
                <tr>
                  <td>${trait.label}</td>
                  ${scales.map(value => `
                    <td>
                      <label class="trait-radio-label">
                        <input type="radio" name="trait-${trait.id}" value="${value}" ${String((ratings || {})[trait.id] || "") === String(value) ? "checked" : ""} />
                      </label>
                    </td>
                  `).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div id="trait-error" class="form-error" role="alert" aria-live="polite"></div>
        <div class="button-row center-row">
          <button id="trait-next-btn">${nextLabel || uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;

    document.getElementById("trait-next-btn").addEventListener("click", () => {
      const nextRatings = {};
      for (const trait of polishTraits) {
        const checked = document.querySelector(`input[name="trait-${trait.id}"]:checked`);
        if (!checked) {
          document.getElementById("trait-error").textContent = "Oceń wszystkie cechy, aby przejść dalej.";
          return;
        }
        nextRatings[trait.id] = checked.value;
      }
      onSubmit(nextRatings, Math.round(performance.now() - savedAt));
    });
  }

  function renderPolishTraitsTask() {
    renderTraitRatingsTask({
      phase: "trait_ratings",
      title: "Oceń, na ile poniższe cechy są charakterystyczne dla Polaków",
      subtitle: "Skala odpowiedzi: 1 = zdecydowanie nie zgadzam się, 7 = zdecydowanie się zgadzam.",
      ratings: state.traitRatings,
      onSubmit: (nextRatings, rtMs) => {
        state.traitRatings = nextRatings;
        state.traitRatingsAt = new Date().toISOString();
        state.traitRatingsRtMs = rtMs;
        renderOtherEuropeIntro();
      }
    });
  }

  function renderOtherEuropeIntro() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "other_europe_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h2>Kolejne zadanie</h2>
        <p>Za chwilę wykonasz bardzo podobne zadanie.</p>
        <p>Tym razem poprosimy Cię o ocenę tych samych cech, ale w odniesieniu do Europejczyków z innych regionów:</p>
        <p>Europejczycy z Europy Północnej (np. Szwecja, Norwegia, Finlandia, Dania)</p>
        <p>Europejczycy z Europy Południowej (np. Włochy, Hiszpania, Malta, Portugalia)</p>
        <p>Europejczycy z Europy Zachodniej (np. Niemcy, Francja, Holandia, Belgia)</p>
        <p>Europejczycy z Europy Wschodniej (np. Ukraina, Czechy, Węgry, Rumunia)</p>
        <p>Odpowiedzi ponownie będziesz zaznaczać na 7-stopniowej skali Likerta.</p>
        <div class="button-row center-row">
          <button id="other-europe-intro-next-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;
    document.getElementById("other-europe-intro-next-btn").addEventListener("click", () => renderRegionTraitTask(0));
  }

  function renderRegionTraitTask(regionIndex) {
    const region = otherEuropeRegions[regionIndex];
    if (!region) {
      renderCompletionScreen();
      return;
    }

    renderTraitRatingsTask({
      phase: `${region.id}_trait_ratings`,
      title: `Oceń, na ile poniższe cechy są charakterystyczne dla ${region.label}`,
      subtitle: `Skala odpowiedzi: 1 = zdecydowanie nie zgadzam się, 7 = zdecydowanie się zgadzam. (${region.examples})`,
      ratings: state.regionTraitRatings[region.id] || {},
      nextLabel: regionIndex === otherEuropeRegions.length - 1 ? uiText("Zakończ", "Finish") : uiText("Dalej", "Continue"),
      onSubmit: (nextRatings, rtMs) => {
        state.regionTraitRatings[region.id] = nextRatings;
        state.regionTraitRatingsAt[region.id] = new Date().toISOString();
        state.regionTraitRatingsRtMs[region.id] = rtMs;
        renderRegionTraitTask(regionIndex + 1);
      }
    });
  }

  function endTask() {
    const app = document.getElementById("app");
    app.className = "";
    if (!state.ended) state.ended = true;
    state.phase = "post_task_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h2>Wszystkie karty zostały posortowane</h2>
        <p>W następnym kroku pojawi się krótki tekst do przeczytania. Przeczytaj go uważnie, a następnie przejdź do kolejnego zadania.</p>
        <div class="button-row center-row">
          <button id="post-task-next-btn">${uiText("Dalej", "Continue")}</button>
        </div>
      </div></div>`;
    document.getElementById("post-task-next-btn").addEventListener("click", renderArticleScreen);
  }

  function startTraining() {
    state.phase = "training";
    state.trainingIndex = 0;
    renderTask(nextTrainingTarget(), "", "", null, "training");
  }

  function startTask() {
    state.phase = "main";
    syncMainRuleState(0);
    state.startedAt = performance.now();
    renderTask(nextTarget(), "", "", null, "main");
  }
    window.addEventListener("DOMContentLoaded", async () => {
    if (window.experimentReady) {
      await window.experimentReady;
    }

    renderConsentPage();
  });
})();
