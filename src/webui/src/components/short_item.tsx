import { Link } from "wouter";
import { useItems } from "../api/hooks";
import Typography from "@mui/material/Typography";

export function ShortItem({ item_id }: { item_id: number }) {
  const { items } = useItems();

  const item = items ? items.get(item_id) : null;

  if (!item) return <>Jeu {item_id}</>;

  return (
    <Link href={`/items/${item_id}`} style={{ textDecoration: "none" }}>
      <Typography
        sx={{
          cursor: "pointer",
          fontSize: "inherit",
          lineHeight: "inherit",
          fontWeight: "inherit",
        }}
      >
        {item.name}
      </Typography>
    </Link>
  );
}
