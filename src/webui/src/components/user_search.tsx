import { useState, useEffect } from "react";
import { fetchUser, qsearchUser } from "../api/calls";
import { UserModel } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";

interface UserSearchProps {
  user?: UserModel | null;
  setUser: any;
}

export function UserSearch(props: UserSearchProps) {
  const [userChoices, setUserChoices] = useState<UserModel[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    qsearchUser(userInput).then((res) => setUserChoices(res));
  }, [userInput]);

  return (
    <Autocomplete
      disablePortal
      defaultValue={props.user}
      options={userChoices}
      noOptionsText={"Pas d'utilisateur sélectionné"}
      getOptionLabel={(option: UserModel) => option.name}
      sx={{ width: "100%", pl: 2, pr: 2 }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="" />}
      onChange={async (_event: any, newValue: UserModel | null) => {
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
