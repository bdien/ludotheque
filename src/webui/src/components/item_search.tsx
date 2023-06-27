import { useState, useEffect } from "react";
import { qsearchItem } from "../api/calls";
import { ItemModel } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";

// ItemSearch allow to search for items
// Note: It will NOT displayed items already loaned !

interface ItemSearchProps {
  setItems: any;
}

export function ItemSearch(props: ItemSearchProps) {
  const [itemChoices, setItemChoices] = useState<ItemModel[]>([]);
  const [itemInput, setItemInput] = useState("");

  useEffect(() => {
    qsearchItem(itemInput).then((res) => setItemChoices(res));
  }, [itemInput]);

  return (
    <Autocomplete
      disablePortal
      options={itemChoices}
      noOptionsText={"Pas d'objet sélectionné"}
      getOptionLabel={(option: ItemModel) => `[${option.id}] ${option.name}`}
      sx={{ width: "100%", pl: 2, pr: 2 }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="" />}
      multiple={true}
      onChange={async (_event: any, newValue: ItemModel[] | null) => {
        if (!newValue) {
          props.setItems(undefined);
        } else {
          props.setItems(newValue);
        }
      }}
      onInputChange={debounce((_event, newInputValue) => {
        setItemInput(newInputValue);
      }, 400)}
    />
  );
}
