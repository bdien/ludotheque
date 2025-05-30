import { Chip, Icon } from "@mui/material";

interface AgeChipProps {
  age?: number;
  size?: "small" | "medium";
  icon?: string;
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
  const color = colorMap.get(props.age ?? 0);
  if (!props.icon)
    return (
      <span
        style={{
          padding: "0.1em 8px",
          borderRadius: "16px",
          backgroundColor: color,
          border: "1px solid #DDDDDD",
        }}
      >
        {props.age}+
      </span>
    );

  return (
    <Chip
      size={props.size ?? "small"}
      style={{
        backgroundColor: color,
        border: "1px solid #DDDDDD",
      }}
      sx={{ mx: "5px" }}
      label={props.age + "+"}
      icon=<Icon>{props.icon}</Icon>
    ></Chip>
  );
}
