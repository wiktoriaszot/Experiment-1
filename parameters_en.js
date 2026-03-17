const fallbackConditionArticles = {
  "pro-n": {
    headline: "EU report: more than 13 million people in the European Union remain unemployed",
    body: "The latest data show that more than 13 million people in the European Union remain unemployed. In this situation, some experts emphasize that the EU common market does not prevent employment problems and that labor market challenges can be addressed most effectively through policies implemented at the national level."
  },
  "pro-e": {
    headline: "EU report: 94% of Europeans are employed thanks to the common market",
    body: "The latest labor market data show that 94% of economically active people in the European Union are currently employed. Economists indicate that the common market and cooperation between countries increase the number of available jobs and make it easier for companies and workers to take advantage of opportunities across different parts of Europe."
  },
  control: {
    headline: "",
    body: "According to the latest weather forecasts, stable conditions will continue across many regions of Europe in the coming week. Most countries are expected to see moderate temperatures and light precipitation. Meteorologists indicate that similar weather patterns may persist in the following days as well."
  }
};

const fallbackRequestedCondition = new URLSearchParams(window.location.search).get("condition");
const fallbackDefaultCondition = "pro-n";
const fallbackResolvedCondition = Object.prototype.hasOwnProperty.call(fallbackConditionArticles, fallbackRequestedCondition)
  ? fallbackRequestedCondition
  : fallbackDefaultCondition;

const conditionConfig = window.experimentConditionConfig || {};
const resolvedCondition = conditionConfig.resolvedCondition || fallbackResolvedCondition;
const conditionArticles = conditionConfig.conditionArticles || fallbackConditionArticles;

const settings = {
  language: "en",
  dataLanguage: "en",
  condition: resolvedCondition,
  articleContent: conditionArticles[resolvedCondition],
  totalCards: 64,
  maxCategories: 6,
  criterionCorrectInRow: 10,
  ruleSequence: ["C", "S", "N", "C", "S", "N"],
  autoDownloadCSV: true
};
