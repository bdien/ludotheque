import { Button, TextField, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { debounce } from "@mui/material/utils";
import { format } from "date-fns";
import { createRef, useState } from "react";
import { mutate as mutateSwr } from "swr";
import { updateItem } from "../api/calls";
import { useItemsLastseen } from "../api/hooks";
import InventoryItem from "../components/inventory_item";

export function Inventory() {
  const [itemId, setItemId] = useState<number | undefined>(undefined);
  const { items, mutate } = useItemsLastseen();
  if (!items) return "Loading";

  const inputRef: React.RefObject<HTMLInputElement | null> = createRef();

  function onClick() {
    if (!itemId) return;
    updateItem(itemId, { lastseen: format(new Date(), "yyyy-MM-dd") }).then(() => {
      mutate();
      mutateSwr(`/api/items/${itemId}`);
      setItemId(undefined);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    });
  }

  return (
    <>
      <Typography variant="h5" sx={{ py: 1 }}>
        Inventaire jeu par jeu
      </Typography>

      <Box>
        <a href="https://docs.google.com/spreadsheets/d/1G8smBWLbcLIQwFoR6EiAawQDAAPJjQQIdLczJ1gcPN8">
          <b>{items.length}</b> jeux
        </a>{" "}
        n'ont pas été vus depuis 1 an
        <hr />
      </Box>

      <Box display="inline">
        <h3>Entrez le numéro du jeu</h3>
        <TextField
          inputRef={inputRef}
          style={{ width: "8em" }}
          type="number"
          onChange={debounce((e) => setItemId(parseInt(e.target.value, 10)), 400)}
        />
      </Box>

      {itemId ? (
        <>
          <Button sx={{ m: 1 }} variant="contained" onClick={onClick}>
            Marquer comme vu
          </Button>
          <br />
          <InventoryItem id={itemId} />
        </>
      ) : (
        ""
      )}
    </>
  );
}
