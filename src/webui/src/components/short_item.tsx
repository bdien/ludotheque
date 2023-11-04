import { Link } from "wouter";
import { useItems } from "../api/hooks";
import Typography from "@mui/material/Typography";

export function ShortItem({ item_id }: { item_id: number }) {
  const { items } = useItems();

  const item = items ? items.get(item_id) : null;

  if (!item) return <>Jeu {item_id}</>;

  return (
    <Link href={`/items/${item_id}`}>
      <Typography sx={{ cursor: "pointer" }}>{item.name}</Typography>
    </Link>
  );
}
