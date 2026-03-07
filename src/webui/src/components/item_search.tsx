import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import { debounce } from "@mui/material/utils";
import { useEffect, useState } from "react";
import { searchItem } from "../api/calls";
import type { ItemModel } from "../api/models";
import { ageColors } from "./age_chip";

// ItemSearch allow to search for items
// Note: It will NOT displayed items already loaned !

interface ItemSearchProps {
  setItem: (params: ItemModel) => void;
  excludesIds: number[];
}

export function ItemSearch(props: ItemSearchProps) {
  const [itemChoices, setItemChoices] = useState<ItemModel[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [completeKey, setCompleteKey] = useState("aaa");

  useEffect(() => {
    searchItem(itemInput).then((res) => {
      setItemChoices(res.filter((i) => !props.excludesIds.includes(i.id)));
    });
  }, [itemInput, props.excludesIds]);

  return (
    <Box sx={{ width: "100%", display: "flex", alignItems: "flex-end" }}>
      <Icon sx={{ mr: 1, my: "auto" }}>search</Icon>
      <Autocomplete
        disablePortal
        key={completeKey}
        options={itemChoices}
        noOptionsText={itemInput ? "Pas d'objet trouvé" : "Entrez un nom pour chercher"}
        getOptionLabel={(option: ItemModel) => option.name}
        renderOption={(props, option) => (
          <li {...props}>
            <Box
              sx={{
                borderRadius: 1,
                textAlign: "center",
                px: 0.5,
                width: "3em",
                border: "1px solid lightgrey",
                backgroundColor: ageColors(option.age)[0],
                color: ageColors(option.age)[1],
                mr: 1,
              }}
            >
              {option.id}
            </Box>
            {option.name}
          </li>
        )}
        sx={{ flexGrow: 1 }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(x) => x}
        renderInput={(params) => <TextField {...params} placeholder="Chercher un jeu" />}
        onChange={async (_event, newValue: ItemModel | null) => {
          if (newValue) {
            props.setItem(newValue);
            setCompleteKey(`${Math.random()}`);
          }
        }}
        onInputChange={debounce((_event, newInputValue) => {
          setItemInput(newInputValue);
        }, 250)}
      />
    </Box>
  );
}
