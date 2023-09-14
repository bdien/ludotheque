import { Controller, useForm } from "react-hook-form";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

interface UserEditProps {
  id?: number;
}

type FormValues = {
  name: string;
  email: string;
  credit: number;
  role: string;
  notes: string;
  subscription: Dayjs;
};

export function UserEdit(props: UserEditProps) {
  const { user, error, mutate } = useUser(props.id);
  const { register, handleSubmit, control } = useForm<FormValues>();
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
    user.notes = data.notes;
    user.subscription = data.subscription.format("YYYY-MM-DD");

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
      <Typography variant="h5" color="primary.main">
        {user.id ? "Edition d'un adhérent" : "Nouvel adhérent"}
      </Typography>

      <TextField
        fullWidth
        label="Nom du compte"
        margin="normal"
        required={true}
        defaultValue={user.name}
        {...register("name")}
      />

      <TextField
        fullWidth
        label="Email"
        margin="normal"
        defaultValue={user.email}
        autoCorrect="off"
        {...register("email")}
      />

      <Controller
        control={control}
        defaultValue={dayjs(user.subscription)}
        name="subscription"
        render={({ field }) => (
          <DatePicker
            label="Expiration abonnement"
            sx={{ my: 2 }}
            format="D MMM YYYY"
            {...field}
          />
        )}
      />

      <TextField
        fullWidth
        label="Crédit sur la carte"
        margin="normal"
        defaultValue={user.credit}
        type="number"
        {...register("credit")}
        InputProps={{
          inputProps: { min: 0, max: 100 },
          endAdornment: <InputAdornment position="end">€</InputAdornment>,
        }}
      />

      <TextField
        fullWidth
        label="Rôle"
        margin="normal"
        defaultValue={user.role}
        {...register("role")}
        select
      >
        <MenuItem value={"user"}>Adhérent</MenuItem>
        <MenuItem value={"admin"}>Administrateur</MenuItem>
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        label="Notes"
        defaultValue={user.notes}
        multiline
        minRows={2}
        {...register("notes")}
      />

      <Button
        variant="contained"
        fullWidth
        size="large"
        sx={{ mt: "20px", p: 1.5 }}
        onClick={handleSubmit((formdata) => onSubmit(user, formdata))}
      >
        {user.id == 0 ? "Créer" : "Modifier"}
      </Button>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "15px" }}
        onClick={handleSubmit(() => history.back())}
      >
        Annuler
      </Button>

      {user.id != 0 && (
        <>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            color="error"
            sx={{ mt: "15px" }}
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
