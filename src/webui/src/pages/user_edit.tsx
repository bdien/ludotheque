import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useUser } from "../api/hooks";
import { createUser, deleteUser, updateUser } from "../api/calls";
import { UserModel } from "../api/models";
import { useConfirm } from "../hooks/useConfirm";
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
  const { ConfirmDialog, confirmPromise } = useConfirm(
    "Suppression du compte",
    `Etes-vous sûr de vouloir supprimer l'utilisateur '${user?.name}' ? Cela supprimera
    définitivement tout son historique d'emprunts.`,
  );

  async function onSubmit(user: UserModel, data: FormValues) {
    user.name = data.name;
    user.email = data.email;
    user.credit = data.credit;
    user.role = data.role;

    if (user?.id) {
      await updateUser(user.id, user);
    } else {
      user = await createUser(user);
    }

    if (mutate) {
      mutate({ ...user });
    }
    window.history.back();
  }

  async function onDelete(user_id: number) {
    const answer = await confirmPromise();
    if (!answer) return;

    deleteUser(user_id).then(() => navigate("/users"));
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
        autoCorrect="off"
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
          inputProps: { min: 0, max: 100 },
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
        <MenuItem value={"admin"}>Administrateur</MenuItem>
      </TextField>

      <Button
        variant="contained"
        size="large"
        sx={{ ml: 2, mt: "20px" }}
        onClick={handleSubmit((formdata) => onSubmit(user, formdata))}
      >
        {user.id == 0 ? "Créer" : "Modifier"}
      </Button>

      {user.id != 0 && (
        <>
          <Button
            variant="outlined"
            size="large"
            color="error"
            sx={{ ml: 2, mt: "20px" }}
            onClick={handleSubmit(() => onDelete(user.id))}
          >
            Supprimer
          </Button>
          <ConfirmDialog />
        </>
      )}
    </>
  );
}
