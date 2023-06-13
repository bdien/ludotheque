import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useUser } from "../api/hooks";
import { createUser, updateUser } from "../api/calls";
import { UserModel } from "../api/models";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

interface UserEditProps {
  id?: number;
}

type FormValues = {
  name: string;
  email: string;
  credit: number;
  role: string;
};

export function UserEdit(props: UserEditProps) {
  const { user, error, mutate } = useUser(props.id);
  const { register, handleSubmit } = useForm<FormValues>();
  const [_location, navigate] = useLocation();

  async function onSubmit(user: UserModel, data: FormValues) {
    user.name = data.name;
    user.email = data.email;
    user.credit = data.credit;
    user.role = data.role;

    if (user?.id) {
      await updateUser(user?.id ?? 0, user);
    } else {
      user = await createUser(user);
    }

    if (mutate) {
      mutate({ ...user });
    }
    navigate(`/users/${user?.id}`);
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!user) return <></>;

  return (
    <>
      <Typography variant="h5">
        {user.id ? "Edition d'un adhérent" : "Nouvel adhérent"}
      </Typography>

      <TextField
        fullWidth
        label="Nom du compte"
        required={true}
        margin="normal"
        defaultValue={user.name}
        {...register("name")}
      />

      <TextField
        label="Email"
        fullWidth
        margin="normal"
        defaultValue={user.email}
        required={true}
        {...register("email")}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Crédit sur la carte"
        type="number"
        defaultValue={user.credit}
        {...register("credit")}
        InputProps={{
          endAdornment: <InputAdornment position="end">€</InputAdornment>,
        }}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Rôle"
        defaultValue={user.role}
        {...register("role")}
        select
      >
        <MenuItem value={"user"}>Adhérent</MenuItem>
        <MenuItem value={"operator"}>Opérateur</MenuItem>
        <MenuItem value={"admin"}>Administrateur</MenuItem>
      </TextField>

      <Button
        variant="contained"
        size="large"
        style={{ marginTop: "20px" }}
        onClick={handleSubmit((formdata) => onSubmit(user, formdata))}
      >
        {user.id == 0 ? "Créer" : "Modifier"}
      </Button>
    </>
  );
}
