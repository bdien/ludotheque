import { useState, useEffect } from "react";
import { fetchItem, qsearchItem } from "../api/calls";
import { ItemModel } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";

interface ItemSearchProps {
  setItem: any;
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
      sx={{ width: "90vw", margin: "auto" }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="" />}
      multiple={true}
      onChange={async (_event: any, newValue: ItemModel | null) => {
        if (!newValue) {
          props.setItem(undefined);
        } else {
          props.setItem(await fetchItem(newValue.id));
        }
      }}
      onInputChange={debounce((_event, newInputValue) => {
        setItemInput(newInputValue);
      }, 400)}
    />
  );
}
