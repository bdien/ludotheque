import { useState } from 'react';
import { useUsers } from "../hooks/api";
import { UsersItem, UserModel } from "../models/api";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';


const fetchUserDetails = async (userId: number): Promise<UserModel> => {
  // Effectuez ici votre requête fetch pour récupérer les détails de l'utilisateur
  // Remplacez cet exemple par votre propre implémentation de requête fetch
  const response = await fetch(`http://127.0.0.1:8000/users/${userId}`);
  const data = await response.json();
  return data;
};

export function Loan() {
  const [ user, setUser ] = useState<UserModel | null>(null);
  const { users } = useUsers();

  async function setNewUserId(id: number) {
    const user = await fetchUserDetails(id);
    setUser(user);
  }

  if (!users)
    return <div>Loading</div>

  if (!user)
    return <div>Personne:
      <Autocomplete
        disablePortal
        options={users}
        getOptionLabel={(option: UsersItem) => option.name}
        sx={{ width: '100%' }}
        renderInput={(params) => <TextField {...params} label="" />}
        onChange={(event: any, newValue: UsersItem | null) => {
          newValue && setNewUserId(newValue.id);
        }}
        limitTags={6}
      />
    </div>

  // Display user sum-up
  return <div>Hello {user.name}</div>
}
