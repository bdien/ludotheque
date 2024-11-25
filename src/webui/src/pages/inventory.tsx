import { useState } from "react";
import { useItemsLastseen } from "../api/hooks";
import Box from "@mui/material/Box";
import { TextField, Typography } from "@mui/material";
import InventoryItem from "../components/inventory_item";
import { debounce } from "@mui/material/utils";

export function Inventory() {
  const [itemId, setItemId] = useState<number | undefined>(undefined);
  const { items, mutate } = useItemsLastseen();
  if (!items) return "Loading";

  function onClick() {
    mutate();
  }

  return (
    <>
      <Typography variant="h5" sx={{ py: 1 }}>
        Inventaire
      </Typography>

      <Box>
        <b>{items.length}</b> jeux n'ont pas été vus depuis 1 an
        <hr />
      </Box>

      <Box display="inline">
        <h3>Numéro de jeu</h3>
        <TextField
          style={{ width: "8em" }}
          type="number"
          onChange={debounce((e) => setItemId(parseInt(e.target.value)), 400)}
        />
      </Box>

      {itemId ? <InventoryItem onClick={onClick} id={itemId} /> : ""}
    </>
  );
}
