const fallbackConditionArticles = {
  "pro-n": {
    headline: "Raport UE: ponad 13 milionów osób w Unii Europejskiej pozostaje bez zatrudnienia",
    body: "Najnowsze dane pokazują, że ponad 13 milionów osób w Unii Europejskiej pozostaje bez zatrudnienia. W tej sytuacji część ekspertów podkreśla, że wspólny rynek UE nie zapobiega problemom zatrudnienia i część ekspertów podkreśla, że problemy rynku pracy mogą być skutecznie rozwiązywane przede wszystkim przez politykę prowadzoną na poziomie państw."
  },
  "pro-e": {
    headline: "Raport UE: 94% Europejczyków ma pracę dzięki wspólnemu rynkowi",
    body: "Z najnowszych danych rynku pracy wynika, że 94% osób aktywnych zawodowo w Unii Europejskiej ma obecnie zatrudnienie. Ekonomiści wskazują, że wspólny rynek i współpraca między krajami zwiększają liczbę dostępnych miejsc pracy oraz ułatwiają firmom i pracownikom korzystanie z możliwości w różnych częściach Europy."
  },
  control: {
    headline: "",
    body: "Według najnowszych prognoz meteorologicznych w nadchodzącymcym tygodniu w wielu regionach Europy utrzyma się stabilna pogoda. W większości krajów przewidywane są umiarkowane temperatury oraz niewielkie opady. Synoptycy wskazują, że podobne warunki pogodowe mogą utrzymać się również w kolejnych dniach."
  }
};

const fallbackRequestedCondition = new URLSearchParams(window.location.search).get("condition");
const fallbackDefaultCondition = "pro-n";
const fallbackResolvedCondition = Object.prototype.hasOwnProperty.call(fallbackConditionArticles, fallbackRequestedCondition)
  ? fallbackRequestedCondition
  : fallbackDefaultCondition;
const SAVE_URL = "https://script.google.com/macros/s/AKfycbxMmwWVXfrrYDo5lNT132hx4WkkUdPAdXKKU2bbKDq362LVpgy9gqJGB9jJnDMf7FQTyg/exec";
const SAMPLE = (String(window.SAMPLE || "PL")).toUpperCase() === "MT" ? "MT" : "PL";
const UI_LANG = window.UI_LANG === "pl" ? "pl" : "en";

const conditionConfig = window.experimentConditionConfig || {};
const resolvedCondition = conditionConfig.resolvedCondition || fallbackResolvedCondition;
const conditionArticles = conditionConfig.conditionArticles || fallbackConditionArticles;
const totalCards = 48;
const maxCategories = 6;

const settings = {
  language: "pl",
  dataLanguage: "en",
  condition: resolvedCondition,
  articleContent: conditionArticles[resolvedCondition],
  saveUrl: SAVE_URL,
  sample: SAMPLE,
  uiLang: UI_LANG,
  totalCards,
  maxCategories,
  criterionCorrectInRow: Math.round(totalCards / maxCategories),
  trialsPerRule: Math.round(totalCards / maxCategories),
  ruleSequence: ["C", "S", "N", "C", "S", "N"],
  // Balanced 48-card subset: preserves 12 cards for each color, shape, and number.
  selectedTrialNumbers: [
    1, 2, 3, 4, 5, 8, 12, 14, 15, 16, 18, 19,
    20, 21, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32,
    34, 35, 36, 37, 38, 40, 42, 43, 45, 46, 47, 49,
    51, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64
  ],
  autoDownloadCSV: false,
  autoDownloadJSON: false
};
