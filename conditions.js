(function () {
  const conditionArticles = {
    "pro-e": {
      headline: "EU report: 94% of Europeans are employed thanks to the common market",
      body: "The latest labor market data show that 94% of economically active people in the European Union are currently employed. Economists indicate that the common market and cooperation between countries increase the number of available jobs and make it easier for companies and workers to take advantage of opportunities across different parts of Europe."
    },
    "pro-n": {
      headline: "Labor market report: more than 13 million Europeans are still unemployed",
      body: "The latest data show that more than 13 million people in the European Union remain unemployed. In this situation, some experts emphasize that the EU common market does not prevent employment problems and that labor market challenges can be addressed most effectively through policies implemented at the national level."
    },
    "control": {
      headline: "Weather forecast: stable conditions across many regions of Europe",
      body: "According to the latest weather forecasts, stable conditions will continue across many regions of Europe in the coming week. Most countries are expected to see moderate temperatures and light precipitation. Meteorologists indicate that similar weather patterns may persist in the following days as well."
    }
  };

  const requestedCondition = new URLSearchParams(window.location.search).get("condition");
  const defaultCondition = "pro-n";

  const resolvedCondition = Object.prototype.hasOwnProperty.call(conditionArticles, requestedCondition)
    ? requestedCondition
    : defaultCondition;

  window.experimentConditionConfig = {
    conditionArticles,
    defaultCondition,
    requestedCondition,
    resolvedCondition
  };
})();
