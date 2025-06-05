import { useEffect, useState } from "react";
import { useItemsLastseen, ItemLastseenEntry } from "../api/hooks";
import Box from "@mui/material/Box";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import InventoryItem from "../components/inventory_item";
import { AgeChip } from "../components/age_chip";
import { updateItem } from "../api/calls";
import { mutate as mutateSwr } from "swr";
import { format } from "date-fns";

function randomItem(items: ItemLastseenEntry[], filterAge: number) {
  const itemsFiltered = items!.filter(
    (i) => filterAge == -1 || i.age == filterAge,
  );
  return itemsFiltered[Math.floor(Math.random() * itemsFiltered.length)].id;
}

export function InventoryRev() {
  const [filterAge, setFilterAge] = useState<number>(-1);
  const { items, mutate } = useItemsLastseen();
  const [itemId, setItemId] = useState<number>(0);

  useEffect(() => {
    if (!items) return;
    setItemId(randomItem(items, filterAge));
  }, [items, filterAge]);

  if (!items) return "Loading";

  function onClick(found: boolean) {
    if (!itemId) return;
    if (!found && items) {
      setItemId(randomItem(items, filterAge));
      return;
    }
    updateItem(itemId, { lastseen: format(new Date(), "yyyy-MM-dd") }).then(
      () => {
        mutate();
        mutateSwr(`/api/items/${itemId}`);
      },
    );
  }

  // Build number of items per age
  const age_items = new Map();
  [0, 2, 4, 6, 8, 10].forEach((age) => {
    const nb = items.filter((i) => i.age == age).length;
    if (nb) age_items.set(age, nb);
  });

  return (
    <>
      <Typography variant="h5" sx={{ py: 1, mb: 2 }}>
        Trouve le jeu
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Filtrer sur l'age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          value={filterAge}
          label="Filtrer sur l'age"
          onChange={(i) => setFilterAge(i.target.value)}
        >
          <MenuItem value={-1}>Tous ({items.length} Jeux)</MenuItem>
          {Array.from(age_items).map(([age, nb]) => (
            <MenuItem value={age}>
              <AgeChip age={age} />
              &nbsp;&nbsp;({nb} Jeux)
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="inline">
        <h3>Jeu à trouver</h3>
        <Box display="flex" sx={{ justifyContent: "space-around", mb: 2 }}>
          <Button
            sx={{ width: "45%" }}
            variant="contained"
            color="success"
            onClick={() => onClick(true)}
          >
            Trouvé
          </Button>
          <Button
            sx={{ width: "45%" }}
            variant="contained"
            color="error"
            onClick={() => onClick(false)}
          >
            Pas trouvé
          </Button>
        </Box>
        <InventoryItem id={itemId} />
      </Box>
    </>
  );
}
