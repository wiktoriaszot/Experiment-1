(function () {
  const t = () => translations.en;
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
    { id: "goscinnosc", label: "Hospitality" },
    { id: "pracowitosc", label: "Hard work" },
    { id: "rodzinnosc", label: "Family orientation" },
    { id: "wytrwalosc", label: "Perseverance" },
    { id: "pomocnosc", label: "Helpfulness" },
    { id: "zaradnosc", label: "Resourcefulness" },
    { id: "zawisc", label: "Envy / jealousy" },
    { id: "pesymizm", label: "Pessimism" },
    { id: "narzekanie", label: "Complaining" },
    { id: "nietolerancyjnosc", label: "Intolerance" },
    { id: "klotliwosc", label: "Quarrelsomeness" },
    { id: "alkoholizm", label: "Tendency toward alcoholism" }
  ];
  const otherEuropeRegions = [
    { id: "north", keyPrefix: "north_europe", label: "Northern Europeans", examples: "e.g. Sweden, Norway, Finland, Denmark" },
    { id: "south", keyPrefix: "south_europe", label: "Southern Europeans", examples: "e.g. Italy, Spain, Malta, Portugal" },
    { id: "west", keyPrefix: "west_europe", label: "Western Europeans", examples: "e.g. Germany, France, the Netherlands, Belgium" },
    { id: "east", keyPrefix: "east_europe", label: "Eastern Europeans", examples: "e.g. Ukraine, Czechia, Hungary, Romania" }
  ];
  const activeCards = cards
    .slice()
    .sort((a, b) => a.trialNumber - b.trialNumber)
    .slice(0, Math.min(settings.totalCards || cards.length, cards.length));
  const totalTrials = activeCards.length;
  const ruleNames = { C: "Color", S: "Shape", N: "Number" };
  const ruleColumnNames = { C: "colorRule", S: "shapeRule", N: "numberRule" };

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

  const state = {
    subject: randomSubjectId(15),
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

  function uiText(_polish, fallback) {
    return fallback;
  }

  function nextTarget() { return activeCards[state.trialIndex] || null; }
  function nextTrainingTarget() { return trainingCards[state.trainingIndex]; }

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

        <h1 class="hero-title">Between Nation and Europe</h1>

        <div class="hero-meta">
          <div>Institute of Cognitive Science, Faculty of Media and Social Sciences</div>
          <div>University of Malta</div>
          <div>Student: Wiktoria Szot • Supervisor: Prof. Gordon Sammut</div>
          <div>Contact: wiktoria.szot.24@um.edu.mt</div>
        </div>
        <div class="consent-frame-wrap">
          <div class="consent-frame-scroll">
            <div class="consent-frame-head">
            </div>

            <div class="consent-inner-box">
              <div class="consent-section-title">Purpose of the study</div>
              <p>This study examines how people process information and how Poles perceive different regions of Europe.</p>

              <div class="consent-section-title">Participation criteria</div>
              <p>Participants must be at least 18 years old and hold Polish citizenship.</p>

              <div class="consent-section-title">Procedure</div>
              <p>During the study, participants will complete a brief card-matching task. Four cards and one additional card will appear on the screen, and the additional card must be matched to one of the four reference cards. Afterward, participants will be asked to rate how well different traits describe Poles and people from other regions of Europe using a 7-point Likert scale.</p>

              <p>The study is a one-time participation and should take about 20 minutes.</p>

              <div class="consent-section-title">Voluntary participation</div>
              <p>Participation in the study is entirely voluntary. Participants may stop taking part at any time without giving a reason and without any negative consequences.</p>

              <div class="consent-section-title">Confidentiality</div>
              <p>All information collected in the study will remain confidential and will be coded using a unique participant identifier. Data will be stored in Google Sheets and used exclusively for scientific purposes. Study results may be presented only in the form of aggregated statistical analyses.</p>

              <p>Participants have the right to access their data and request its deletion in accordance with applicable personal data protection regulations.</p>

              <div class="consent-section-title">Risks and benefits</div>
              <p>Participation in the study does not involve any foreseeable risk. Participants will receive financial compensation for taking part.</p>
            </div>
          </div>
        </div>

        <label class="consent-check consent-check-large">
          <input id="consent-checkbox" type="checkbox" />
          <span>I confirm that I am at least 18 years old and agree to participate in this study.</span>
        </label>

        <div id="consent-error" class="form-error" role="alert" aria-live="polite"></div>

        <div class="button-row center-row consent-button-row">
          <button id="consent-next-btn">Continue</button>
        </div>
      </div></div>`;

    const heroMeta = app.querySelector(".hero-meta");
    if (heroMeta) {
      heroMeta.innerHTML = [
        "Student: Wiktoria Szot",
        "Supervisor: Prof. Gordon Sammut",
        "Contact: wiktoria.szot.24@um.edu.mt"
      ].map(line => `<div>${line}</div>`).join("");
    }

    const consentHead = app.querySelector(".consent-frame-head");
    if (consentHead) {
      consentHead.innerHTML = [
        "University of Malta",
        "Faculty of Media and Social Sciences",
        "Institute of Cognitive Science"
      ].map(line => `<div>${line}</div>`).join("");
    }

    const consentBox = app.querySelector(".consent-inner-box");
    if (consentBox) {
      consentBox.innerHTML = `
        <div class="consent-doc">
          <p><strong>Purpose of the study:</strong> This study examines how people process information and how Poles perceive different regions of Europe.</p>

          <p><strong>Participation criteria:</strong> Participants must be at least 18 years old and hold Polish citizenship.</p>

          <p><strong>Procedure:</strong> During the study, participants will complete a brief card-matching task. Four cards and one additional card will appear on the screen, and the additional card must be matched to one of the four reference cards. Afterward, participants will be asked to rate how well different traits describe Poles and people from other regions of Europe using a 7-point Likert scale.</p>

          <p>The study is a one-time participation and should take about 20 minutes.</p>

          <p><strong>Voluntary participation:</strong> Participation in the study is entirely voluntary. Participants may stop taking part at any time without giving a reason and without any negative consequences.</p>

          <p><strong>Confidentiality:</strong> All information collected in the study will remain confidential and will be coded using a unique participant identifier. Data will be stored in Google Sheets and used exclusively for scientific purposes. Study results may be presented only in the form of aggregated statistical analyses.</p>

          <p>Participants have the right to access their data and request its deletion in accordance with applicable personal data protection regulations.</p>

          <p><strong>Risks and benefits:</strong> Participation in the study does not involve any foreseeable risk. Participants will receive financial compensation for taking part.</p>
        </div>`;
    }

    document.getElementById("consent-next-btn").addEventListener("click", () => {
      const checkbox = document.getElementById("consent-checkbox");
      const error = document.getElementById("consent-error");
      if (!checkbox.checked) {
        error.textContent = "To continue, please confirm consent to participate.";
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
        <h1 class="center">${uiText("Demographic information", "Demographic information")}</h1>
        <p class="center">Please complete the short form before continuing.</p>

        <div class="demographics-form">
          <label class="demographics-field">
            <span>${uiText("Age", "Age")}</span>
            <input id="age-input" type="number" min="18" max="120" inputmode="numeric" />
          </label>

          <label class="demographics-field">
            <span>${uiText("P\u0142e\u0107", "Gender")}</span>
            <select id="gender-select">
              <option value="">${uiText("Select", "Select")}</option>
              <option value="kobieta">${uiText("Woman", "Woman")}</option>
              <option value="m\u0119\u017cczyzna">${uiText("M\u0119\u017cczyzna", "Man")}</option>
            </select>
          </label>

          <label class="demographics-field">
            <span>${uiText("Citizenship", "Citizenship")}</span>
            <select id="citizenship-select">
              <option value="">${uiText("Select", "Select")}</option>
              <option value="polskie">${uiText("Polish", "Polish")}</option>
              <option value="inne">${uiText("Other", "Other")}</option>
            </select>
          </label>
        </div>

        <div id="demographics-error" class="form-error" role="alert" aria-live="polite"></div>

        <div class="button-row center-row">
          <button id="demographics-back-btn" type="button">Back</button>
          <button id="demographics-next-btn">Continue</button>
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
        error.textContent = uiText("Enter a valid age (18–120).", "Enter a valid age (18-120).");
        return;
      }
      if (!gender) {
        error.textContent = uiText("Select p\u0142e\u0107.", "Select gender.");
        return;
      }
      if (!citizenship) {
        error.textContent = uiText("Select obywatelstwo.", "Select citizenship.");
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
    const welcomeTitle = t().welcome;
    const welcomeParagraphs = [t().intro1, t().intro2, t().intro3, t().intro4].filter(Boolean);
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h1>${welcomeTitle}</h1>
        ${welcomeParagraphs.map(text => `<p>${text}</p>`).join("")}
        <div class="button-row center-row">
          <button id="welcome-back-btn" type="button">Back</button>
          <button id="start-btn">Continue</button>
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
        <h1>${uiText("Training session", "Training session")}</h1>
        <p>Three practice trials will begin next.</p>
        <p>They will not be included in the collected data. They are only meant to familiarize you with the task.</p>
        <button id="training-start-btn">${uiText("Start training", "Start training")}</button>
      </div></div>`;
    document.getElementById("training-start-btn").addEventListener("click", startTraining);
  }

  function renderPostTrainingIntro() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "main_intro";
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h1>${uiText("End of training", "Training complete")}</h1>
        <p>The practice session is complete.</p>
        <p>The main task starts now, and responses will be saved from this point onward.</p>
        <button id="main-start-btn">${t().begin}</button>
      </div></div>`;
    document.getElementById("main-start-btn").addEventListener("click", startTask);
  }

  function renderTask(target, feedbackText = "", feedbackClass = "", selectedChoice = null, mode = "main") {
    const app = document.getElementById("app");
    app.className = "";
    const isTraining = mode === "training";
    const metaLabel = isTraining
      ? `Practice trial <strong>${state.trainingIndex + 1}</strong> ${t().ofLabel} <strong>${trainingCards.length}</strong>`
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
      number_of_rule: state.currentRuleIdx + 1,
      category_completed: state.categoryCompleted,
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
      choice: choice
    };

    if (state.trials.length) {
      const isSame = checkRestricted(appliedRule, prevAppliedRuleString) || checkRestricted(prevAppliedRuleString, appliedRule);
      if (!correct && isSame) trial.perseverative_response = 1;
    }

    state.trials.push(trial);
    renderTask(target, correct ? t().correct : t().wrong, correct ? "correct" : "wrong", choice, "main");

    if (state.correctInRow === settings.criterionCorrectInRow) {
      state.categoryCompleted += 1;
      state.correctInRow = 0;
      state.currentRuleIdx += 1;
      state.currentRule = settings.ruleSequence[state.currentRuleIdx] || null;
    }
    state.trials[state.trials.length - 1].category_completed = state.categoryCompleted;

    window.setTimeout(() => {
      state.trialIndex += 1;
      if (state.trialIndex >= totalTrials || state.categoryCompleted >= settings.maxCategories) endTask();
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

  function finalRows() {
    const summary = buildSummary();
    const ratings = traitRatingsColumns();
    return state.trials.map(row => Object.assign({}, row, summary, ratings));
  }

  function renderCompletionScreen() {
    const app = document.getElementById("app");
    app.className = "";
    state.phase = "end";
    const rows = finalRows();
    const filename = `CardSorting_${state.subject}_output.csv`;
    app.innerHTML = `
      <div class="screen"><div class="panel center">
        <h2>${t().endTitle}</h2>
        <p>${t().endBody}</p>
        <button id="download-btn">${t().download}</button>
      </div></div>`;
    if (settings.autoDownloadCSV) setTimeout(() => downloadCSV(filename, rows), 200);
    document.getElementById("download-btn").addEventListener("click", () => downloadCSV(filename, rows));
  }

  function renderArticleScreen() {
    const app = document.getElementById("app");
    const article = settings.articleContent || { headline: "", body: "" };
    const articleHeadline = article.headline ? `<h3>${article.headline}</h3>` : "";
    app.className = "";
    state.phase = "article";
    app.innerHTML = `
      <div class="screen article-screen"><div class="panel article-panel">
        <h2 class="center">Read the text carefully</h2>
        <div class="article-text-wrap">
          ${articleHeadline}
          <p>${article.body}</p>
        </div>
        <div class="button-row center-row">
          <button id="article-back-btn" type="button">Back</button>
          <button id="article-next-btn">Continue</button>
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
        <h2>Final task</h2>
        <p>In the final task, you will be presented with 12 traits: 6 positive and 6 negative.</p>
        <p>Your task will be to rate the extent to which each of these traits is characteristic of Poles.</p>
        <p>You will respond using a 7-point Likert scale, where <strong>1</strong> means <strong>strongly disagree</strong> and <strong>7</strong> means <strong>strongly agree</strong>.</p>
        <div class="button-row center-row">
          <button id="final-task-intro-back-btn" type="button">Back</button>
          <button id="final-task-intro-next-btn">Continue</button>
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
                <th>Trait</th>
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
          <button id="trait-next-btn">${nextLabel || "Continue"}</button>
        </div>
      </div></div>`;

    document.getElementById("trait-next-btn").addEventListener("click", () => {
      const nextRatings = {};
      for (const trait of polishTraits) {
        const checked = document.querySelector(`input[name="trait-${trait.id}"]:checked`);
        if (!checked) {
          document.getElementById("trait-error").textContent = "Rate all traits before continuing.";
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
      title: "Rate how characteristic the following traits are of Poles",
      subtitle: "Response scale: 1 = strongly disagree, 7 = strongly agree.",
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
        <h2>Next task</h2>
        <p>You will now complete a very similar task.</p>
        <p>This time, we will ask you to rate the same traits in relation to Europeans from other regions:</p>
        <p>Northern Europeans (e.g. Sweden, Norway, Finland, Denmark)</p>
        <p>Southern Europeans (e.g. Italy, Spain, Malta, Portugal)</p>
        <p>Western Europeans (e.g. Germany, France, the Netherlands, Belgium)</p>
        <p>Eastern Europeans (e.g. Ukraine, Czechia, Hungary, Romania)</p>
        <p>You will again respond on a 7-point Likert scale.</p>
        <div class="button-row center-row">
          <button id="other-europe-intro-next-btn">Continue</button>
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
      title: `Rate how characteristic the following traits are of ${region.label}`,
      subtitle: `Response scale: 1 = strongly disagree, 7 = strongly agree. (${region.examples})`,
      ratings: state.regionTraitRatings[region.id] || {},
      nextLabel: regionIndex === otherEuropeRegions.length - 1 ? "Finish" : "Continue",
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
        <h2>All cards have been sorted</h2>
        <p>In the next step, a short text will appear. Read it carefully and then continue to the next task.</p>
        <div class="button-row center-row">
          <button id="post-task-next-btn">Continue</button>
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
    state.startedAt = performance.now();
    renderTask(nextTarget(), "", "", null, "main");
  }
  window.addEventListener("DOMContentLoaded", renderConsentPage);
})();
