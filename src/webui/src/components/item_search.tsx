import { useState, useEffect } from "react";
import { searchItem as searchItem } from "../api/calls";
import { ItemModel } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";

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
        noOptionsText={
          itemInput ? "Pas d'objet trouvé" : "Entrez un nom pour chercher"
        }
        getOptionLabel={(option: ItemModel) => `[${option.id}] ${option.name}`}
        sx={{ flexGrow: 1 }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(x) => x}
        renderInput={(params) => (
          <TextField {...params} placeholder="Ajouter un jeu" />
        )}
        onChange={async (_event, newValue: ItemModel | null) => {
          if (newValue) {
            props.setItem(newValue);
            setCompleteKey(`${Math.random()}`);
          }
        }}
        onInputChange={debounce((_event, newInputValue) => {
          setItemInput(newInputValue);
        }, 400)}
      />
    </Box>
  );
}
