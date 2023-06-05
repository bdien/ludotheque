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

export function RandomColors(props: RandomColorsProp) {
  return (
    <>
      {[...props.txt].map((i) => (
        <span style={{ color: colors[~~(Math.random() * colors.length)] }}>
          {i}
        </span>
      ))}
    </>
  );
}
