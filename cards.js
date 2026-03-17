const colors = ["red", "green", "yellow", "blue"];
const shapes = ["triangle", "star", "diamond", "circle"];
const numbers = [1, 2, 3, 4];

const cards = colors.flatMap((color, colorRule) =>
  shapes.flatMap((shape, shapeRule) =>
    numbers.map((number, numberRule) => ({
      name: `${shape}${color.charAt(0).toUpperCase()}${color.slice(1)}${number}`,
      color,
      shape,
      number,
      trialNumber: colorRule * 16 + shapeRule * 4 + numberRule + 1,
      image: `../static/images/${shape}_${color}_${number}.png`,
      colorRule,
      shapeRule,
      numberRule
    }))
  )
);
