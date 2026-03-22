(function () {
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
