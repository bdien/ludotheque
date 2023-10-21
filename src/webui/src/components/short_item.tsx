import { Link } from "wouter";
import { useItem } from "../api/hooks";
import Typography from "@mui/material/Typography";

export function ShortItem({ item_id }: { item_id: number }) {
  const { item } = useItem(item_id);

  if (!item) return <>Jeu ${item_id}</>;

  return (
    <Link href={`/items/${item_id}`}>
      <Typography sx={{ cursor: "pointer" }}>{item.name}</Typography>
    </Link>
  );
}
