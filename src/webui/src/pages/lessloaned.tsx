import { Typography } from "@mui/material";
import { useItemsLessLoaned } from "../api/hooks";
import MiniItem from "../components/mini_item";

export function LessLoaned() {
  const { items } = useItemsLessLoaned();
  if (!items) return "Loading";

  return (
    <>
      <Typography variant="h5" sx={{ py: 1 }}>
        Jeux moins empruntés
      </Typography>

      {items.map((i) => (
        <MiniItem key={i.id} id={i.id} />
      ))}
    </>
  );
}
