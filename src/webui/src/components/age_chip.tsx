interface AgeChipProps {
  age: number;
  size?: "small" | "medium";
}

const colorMap = new Map([
  [0, "hsl(170, 100%, 90%)"],
  [2, "hsl(90, 100%, 80%)"],
  [4, "hsl(50, 100%, 70%)"],
  [6, "hsl(300, 100%, 80%)"],
  [8, "hsl(210, 100%, 80%)"],
  [10, "hsl(0, 100%, 75%)"],
]);

export function AgeChip(props: AgeChipProps) {
  const color = colorMap.get(props.age);
  return (
    <span
      style={{
        padding: "5px 8px",
        borderRadius: "16px",
        backgroundColor: color,
      }}
    >
      {props.age}+
    </span>
  );
}
