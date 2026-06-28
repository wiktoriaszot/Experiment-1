(function () {
  "use strict";

  const conditionArticles = {
    "pro-e": {
      headline: "Raport UE: 94% Europejczyków ma pracę dzięki wspólnemu rynkowi",
      body: "Z najnowszych danych rynku pracy wynika, że 94% osób aktywnych zawodowo w Unii Europejskiej ma obecnie zatrudnienie. Ekonomiści wskazują, że wspólny rynek i współpraca między krajami zwiększają liczbę dostępnych miejsc pracy oraz ułatwiają firmom i pracownikom korzystanie z możliwości w różnych częściach Europy."
    },

    "pro-n": {
      headline: "Raport rynku pracy: ponad 13 milionów Europejczyków nadal bez pracy",
      body: "Najnowsze dane pokazują, że ponad 13 milionów osób w Unii Europejskiej pozostaje bez zatrudnienia. W tej sytuacji część ekspertów podkreśla, że wspólny rynek UE nie zapobiega problemom zatrudnienia, a problemy rynku pracy mogą być skutecznie rozwiązywane przede wszystkim przez politykę prowadzoną na poziomie państw."
    },

    "control": {
      headline: "Prognoza pogody: stabilna pogoda w wielu regionach Europy",
      body: "Według najnowszych prognoz meteorologicznych w nadchodzącym tygodniu w wielu regionach Europy utrzyma się stabilna pogoda. W większości krajów przewidywane są umiarkowane temperatury oraz niewielkie opady. Synoptycy wskazują, że podobne warunki pogodowe mogą utrzymać się również w kolejnych dniach."
    }
  };

  const SAVE_URL =
    "https://script.google.com/macros/s/AKfycbxMmwWVXfrrYDo5lNT132hx4WkkUdPAdXKKU2bbKDq362LVpgy9gqJGB9jJnDMf7FQTyg/exec";

  const SAMPLE = (String(window.SAMPLE || "PL")).toUpperCase() === "MT" ? "MT" : "PL";
  const UI_LANG = window.UI_LANG === "pl" ? "pl" : "en";

  const settings = {
    language: "pl",
    dataLanguage: "en",

    condition: "",
    articleContent: null,

    saveUrl: SAVE_URL,
    sample: SAMPLE,
    uiLang: UI_LANG,

    // TYLKO 1 TRIAL W GŁÓWNYM SORTOWANIU KART
    totalCards: 1,
    maxCategories: 1,
    criterionCorrectInRow: 1,
    trialsPerRule: 1,
    ruleSequence: ["C"],

    // Bierzemy tylko pierwszą kartę z cards.js
    selectedTrialNumbers: [1],

    autoDownloadCSV: false,
    autoDownloadJSON: false
  };

  async function assignConditionFromServer(email) {
    const requestedCondition = new URLSearchParams(window.location.search).get("condition");

    // Jeśli condition jest w linku, używamy jej i NIE pytamy serwera
    if (requestedCondition) {
      if (!Object.prototype.hasOwnProperty.call(conditionArticles, requestedCondition)) {
        throw new Error(
          `Nieprawidłowa condition w linku: ${requestedCondition}. Użyj: pro-e, pro-n albo control.`
        );
      }

      settings.condition = requestedCondition;
      settings.articleContent = conditionArticles[requestedCondition];

      console.log("Condition forced from URL:", requestedCondition);

      return requestedCondition;
    }

    // Jeśli nie ma condition w linku, wtedy działa losowanie z serwera
    const response = await fetch(`${SAVE_URL}?assign=1&email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (!data.ok || !data.condition) {
      const app = document.getElementById("app");

      if (data.full && app) {
        app.innerHTML = `
          <div class="screen">
            <div class="panel center">
              <h1>Rekrutacja zakończona</h1>
              <p>Dziękujemy za zainteresowanie badaniem.</p>
            </div>
          </div>
        `;
      }

      throw new Error(data.error || data.message || "Nie można rozpocząć badania.");
    }

    if (!Object.prototype.hasOwnProperty.call(conditionArticles, data.condition)) {
      throw new Error(`Unknown condition received from server: ${data.condition}`);
    }

    settings.condition = data.condition;
    settings.articleContent = conditionArticles[data.condition];

    console.log("Assigned condition:", data.condition);
    console.log("Completed counts:", data.counts);

    return data.condition;
  }

  window.settings = settings;
  window.assignConditionFromServer = assignConditionFromServer;
})();
