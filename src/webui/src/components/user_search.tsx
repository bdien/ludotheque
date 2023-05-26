import { useState, useEffect } from "react";
import { fetchUser, qsearchUser } from "../api/calls";
import { UsersItem } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";

interface UserSearchProps {
  setUser: any;
}

export function UserSearch(props: UserSearchProps) {
  const [userChoices, setUserChoices] = useState<UsersItem[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    qsearchUser(userInput).then((res) => setUserChoices(res));
  }, [userInput]);

  return (
    <Autocomplete
      disablePortal
      options={userChoices}
      noOptionsText={"Pas d'utilisateur sélectionné"}
      getOptionLabel={(option: UsersItem) => option.name}
      sx={{ width: "90vw", margin: "auto" }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => <TextField {...params} label="" />}
      onChange={async (_event: any, newValue: UsersItem | null) => {
        if (!newValue) {
          props.setUser(undefined);
        } else {
          props.setUser(await fetchUser(newValue.id));
        }
      }}
      onInputChange={debounce((_event, newInputValue) => {
        setUserInput(newInputValue);
      }, 400)}
    />
  );
}
