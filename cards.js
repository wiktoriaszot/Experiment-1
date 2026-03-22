const colorRuleMap = { red: 0, green: 1, yellow: 2, blue: 3 };
const shapeRuleMap = { triangle: 0, star: 1, diamond: 2, circle: 3 };

const orderedCardDefinitions = [
  ["triangle", "green", 1],
  ["diamond", "red", 4],
  ["triangle", "blue", 2],
  ["circle", "red", 1],
  ["star", "green", 4],
  ["diamond", "yellow", 1],
  ["triangle", "blue", 4],
  ["circle", "red", 3],
  ["diamond", "green", 4],
  ["circle", "yellow", 2],
  ["star", "blue", 1],
  ["triangle", "red", 3],
  ["diamond", "blue", 2],
  ["star", "yellow", 1],
  ["triangle", "green", 3],
  ["circle", "blue", 4],
  ["star", "red", 2],
  ["circle", "yellow", 3],
  ["triangle", "red", 4],
  ["circle", "yellow", 1],
  ["star", "blue", 2],
  ["diamond", "green", 3],
  ["star", "yellow", 2],
  ["triangle", "blue", 3],
  ["star", "red", 4],
  ["triangle", "yellow", 2],
  ["diamond", "blue", 3],
  ["circle", "red", 4],
  ["star", "green", 2],
  ["diamond", "red", 1],
  ["circle", "green", 4],
  ["star", "red", 1],
  ["circle", "blue", 3],
  ["diamond", "yellow", 4],
  ["star", "green", 1],
  ["triangle", "yellow", 4],
  ["circle", "blue", 2],
  ["star", "yellow", 3],
  ["circle", "green", 1],
  ["diamond", "blue", 4],
  ["triangle", "red", 1],
  ["star", "blue", 3],
  ["circle", "yellow", 4],
  ["triangle", "green", 2],
  ["star", "red", 3],
  ["diamond", "yellow", 2],
  ["circle", "blue", 1],
  ["triangle", "yellow", 3],
  ["diamond", "green", 2],
  ["star", "yellow", 4],
  ["triangle", "blue", 1],
  ["star", "green", 3],
  ["circle", "red", 2],
  ["triangle", "green", 4],
  ["diamond", "blue", 1],
  ["circle", "green", 3],
  ["diamond", "red", 2],
  ["triangle", "yellow", 1],
  ["diamond", "red", 3],
  ["circle", "green", 2],
  ["star", "blue", 4],
  ["diamond", "yellow", 3],
  ["triangle", "red", 2],
  ["diamond", "green", 1]
];

function buildCardName(shape, color, number) {
  return `${shape}${color.charAt(0).toUpperCase()}${color.slice(1)}${number}`;
}

const cards = orderedCardDefinitions.map(([shape, color, number], index) => ({
  name: buildCardName(shape, color, number),
  color,
  shape,
  number,
  trialNumber: index + 1,
  image: `../static/images/${shape}_${color}_${number}.png`,
  colorRule: colorRuleMap[color],
  shapeRule: shapeRuleMap[shape],
  numberRule: number - 1
}));

const expectedDeckSize = 64;
const uniqueCards = new Set(cards.map(card => `${card.color}|${card.shape}|${card.number}`));
if (cards.length !== expectedDeckSize || uniqueCards.size !== expectedDeckSize) {
  throw new Error("Invalid WCST card deck: expected 64 unique cards.");
}
