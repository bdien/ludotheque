import { useState, useEffect } from "react";
import { fetchItem, qsearchItem } from "../api/calls";
import { ItemModel } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

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
      getOptionLabel={(option: ItemModel) => option.name}
      sx={{ width: "90vw", margin: "auto" }}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="" />}
      onChange={async (_event: any, newValue: ItemModel | null) => {
        console.log("onChange");
        newValue && props.setItem(await fetchItem(newValue.id));
      }}
      onInputChange={(_event, newInputValue) => {
        console.log("onInputChange");
        setItemInput(newInputValue);
      }}
    />
  );
}
