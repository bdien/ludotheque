interface RandomColorsProp {
  txt: string;
}

const colors = [
  "#ff8e1e",
  "#ff00ff",
  "#ff3399",
  "#cc3399",
  "#ffff00",
  "#00ffff",
  "#ff0000",
  "#00ff00",
  "#33cc33",
  "#99cc00",
];

export const RandomColors = ({ txt }: RandomColorsProp) => (
  <>
    {txt.split("").map((char, i) => (
      <span
        key={i}
        style={{ color: colors[Math.floor(Math.random() * colors.length)] }}
      >
        {char}
      </span>
    ))}
  </>
);
