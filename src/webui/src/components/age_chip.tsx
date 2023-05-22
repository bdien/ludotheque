import Chip from "@mui/material/Chip";

interface AgeChipProps {
  age: number;
  size?: "small" | "medium";
}

export function AgeChip(props: AgeChipProps) {
  if (props.age == 0)
    return (
      <Chip
        label="0+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(170, 100%, 90%)" }}
      />
    );
  if (props.age == 2)
    return (
      <Chip
        label="2+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(90, 100%, 80%)" }}
      />
    );
  if (props.age == 4)
    return (
      <Chip
        label="4+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(50, 100%, 70%)" }}
      />
    );
  if (props.age == 6)
    return (
      <Chip
        label="6+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(300, 100%, 80%)" }}
      />
    );
  if (props.age == 8)
    return (
      <Chip
        label="8+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(210, 100%, 80%)" }}
      />
    );
  if (props.age == 10)
    return (
      <Chip
        label="10+"
        size={props.size ?? "small"}
        sx={{ backgroundColor: "hsl(0, 100%, 75%)" }}
      />
    );
  return <Chip label={props.age} size={props.size ?? "small"} />;
}
