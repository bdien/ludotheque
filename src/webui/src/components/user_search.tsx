import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { debounce } from "@mui/material/utils";
import { useEffect, useState } from "react";
import { fetchUser, searchUser } from "../api/calls";
import type { User } from "../api/models";
import { MiniUser } from "./mini_user";

interface UserSearchProps {
  user?: User | null;
  setUser: (params: User | null) => void;
}

export function UserSearch(props: UserSearchProps) {
  const [userChoices, setUserChoices] = useState<User[]>([]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    searchUser(userInput).then((res) => setUserChoices(res));
  }, [userInput]);

  if (props.user) return <MiniUser user={props.user} onRemove={() => props.setUser(null)} />;

  return (
    <Autocomplete
      disablePortal
      defaultValue={props.user}
      options={userChoices}
      noOptionsText={userInput ? "Pas d'adhérent trouvé" : "Entrez un nom pour chercher"}
      getOptionLabel={(option: User) => option.name}
      sx={{ width: "100%" }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(x) => x}
      renderInput={(params) => <TextField {...params} label="Adhérent" />}
      onChange={async (_event, newValue: User | null) => {
        if (!newValue) {
          props.setUser(null);
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
