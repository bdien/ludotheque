import { Controller, useFieldArray, useForm } from "react-hook-form";
import { navigate } from "wouter/use-location";
import { useAccount, useUser } from "../api/hooks";
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
import Alert from "@mui/material/Alert";
import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import AlertTitle from "@mui/material/AlertTitle";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";

interface UserEditProps {
  id?: number;
}

type FormValues = {
  id: number;
  name: string;
  emails: { email: string }[];
  credit: number;
  role: string;
  notes: string;
  informations: string;
  subscription: Dayjs;
  disabled: boolean;
};

function generateDefaultValues(user?: UserModel): FormValues | undefined {
  if (!user) return user;
  return {
    id: user.id,
    name: user.name,
    emails: user.emails
      ? user.emails.map((i) => {
          return { email: i };
        })
      : ([] as { email: string }[]),
    credit: user.credit,
    role: user.role,
    notes: user.notes ?? "",
    informations: user.informations ?? "",
    subscription: dayjs(user.subscription),
    disabled: !user.enabled,
  };
}

export function UserEdit(props: UserEditProps) {
  const { user, error, mutate } = useUser(props.id);
  const initialUserId = user?.id;
  const { account } = useAccount();
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, control } = useForm({
    defaultValues: generateDefaultValues(user),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "emails" });
  const { ConfirmDialog, confirmPromise } = useConfirm(
    "Suppression du compte",
    `Etes-vous sûr de vouloir supprimer l'utilisateur '${user?.name}' ? Cela supprimera
    définitivement tout son historique d'emprunts.`,
  );

  async function onSubmit(user: UserModel, data: FormValues) {
    setApiError(null);

    user.id ||= data.id;
    user.name = data.name;
    user.emails = data.emails.map((i) => i.email);
    user.credit = data.credit;
    user.role = data.role;
    user.notes = data.notes;
    user.informations = data.informations;
    user.subscription = data.subscription.format("YYYY-MM-DD");
    user.enabled = !data.disabled;

    if (initialUserId) {
      await updateUser(user.id, user);
    } else {
      // Create New User
      const result = await createUser(user);
      if ("detail" in result) {
        setApiError(result.detail);
        return;
      }
      user = result;
    }

    if (mutate) {
      mutate({ ...user });
    }

    navigate(`/users/${user.id}`, { replace: true });
  }

  async function onDelete(user_id: number) {
    const answer = await confirmPromise();
    if (!answer) return;

    deleteUser(user_id).then(() => navigate("/users", { replace: true }));
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!user) return <></>;

  return (
    <>
      <Typography variant="h5" color="primary.main" sx={{ pb: 2 }}>
        {user.id ? "Edition d'un adhérent" : "Nouvel adhérent"}
      </Typography>

      {apiError && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      <Alert
        variant="outlined"
        severity="info"
        sx={{ backgroundColor: "rgba(85, 108, 214, 0.1)" }}
      >
        <AlertTitle>Adhésion et Remplissage de carte</AlertTitle>
        Merci d'utiliser le formulaire d'emprunt pour encaisser l'adhésion et
        (optionnellement) remplir la carte.
        <br />
        {user?.id != 0 &&
          "Ne modifiez ces champs directement que pour corriger une erreur."}
      </Alert>

      {user?.id != 0 && (
        <TextField
          type="number"
          label="Numéro"
          value={user.id}
          disabled
          sx={{ mt: 2 }}
        />
      )}

      <TextField
        fullWidth
        label="Nom du compte"
        margin="normal"
        required={true}
        defaultValue={user.name}
        {...register("name")}
      />

      <Box>
        {fields.map((field, idx) => (
          <Box sx={{ display: "flex" }} key={field.id}>
            <TextField
              fullWidth
              label={`Email ${idx + 1}`}
              margin="normal"
              autoCorrect="off"
              sx={{ flexGrow: 1 }}
              {...register(`emails.${idx}.email`)}
            />
            <Button onClick={() => remove(idx)}>
              <Icon>delete</Icon>
            </Button>
          </Box>
        ))}
        <Button onClick={() => append({ email: "" })}>
          <Icon>add</Icon>Ajout d'EMail
        </Button>
      </Box>

      {user?.id != 0 && (
        <>
          <Controller
            control={control}
            defaultValue={dayjs(user.subscription)}
            name="subscription"
            render={({ field }) => (
              <DatePicker
                label="Expiration adhésion"
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
              inputProps: { min: 0, max: 100, step: 0.5 },
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
            <MenuItem value={"benevole"}>Bénévole</MenuItem>
            <MenuItem value={"admin"}>Membre du Bureau</MenuItem>
          </TextField>
        </>
      )}

      <TextField
        fullWidth
        margin="normal"
        label="Informations (Adresses / Téléphones / ...)"
        defaultValue={user.informations}
        placeholder="Informations (Adresses / Enfants / Téléphones)"
        multiline
        minRows={2}
        {...register("informations")}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Notes (Cheque de caution...)"
        defaultValue={user.notes}
        multiline
        minRows={2}
        {...register("notes")}
      />

      <FormControlLabel
        control={
          <Checkbox
            color="error"
            defaultChecked={!user.enabled}
            {...register("disabled")}
          />
        }
        label="Désactiver l'adhérent (Si besoin, précisez la raison dans 'Notes')"
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

      {user.id != 0 && account?.role == "admin" && (
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
