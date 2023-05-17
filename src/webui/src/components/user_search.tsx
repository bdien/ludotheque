import { useState, useEffect } from "react";
import { fetchUser, qsearchUser } from "../api/calls";
import { UsersItem } from "../api/models";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

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
      getOptionLabel={(option: UsersItem) => option.name}
      sx={{ width: "90vw", margin: "auto" }}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="" />}
      onChange={async (_event: any, newValue: UsersItem | null) => {
        console.log("onChange");
        newValue && props.setUser(await fetchUser(newValue.id));
      }}
      onInputChange={(_event, newInputValue) => {
        console.log("onInputChange");
        setUserInput(newInputValue);
      }}
    />
  );
}
