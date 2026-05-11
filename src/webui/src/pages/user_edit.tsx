import { AlertTitle } from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Icon from "@mui/material/Icon";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { formatISO, parseISO } from "date-fns";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { navigate } from "wouter/use-browser-location";
import { createUser, deleteUser, updateUser } from "../api/calls";
import { useUser, useUsers } from "../api/hooks";
import type { User } from "../api/models";
import { useGlobalStore } from "../hooks/global_store";
import { useConfirm } from "../hooks/useConfirm";

interface UserEditProps {
  id?: number;
}

interface FormValues {
  id: number;
  name: string;
  emails: { email: string }[];
  phones: { phone: string }[];
  credit: number;
  role: string;
  notes: string;
  informations: string;
  subscription: Date;
  disabled: boolean;
}

function generateDefaultValues(user?: User): FormValues | undefined {
  if (!user) return user;
  return {
    id: user.id,
    name: user.name,
    emails: user.emails
      ? user.emails.map((i) => {
          return { email: i };
        })
      : ([] as { email: string }[]),
    phones: user.phones
      ? user.phones.map((i) => {
          return { phone: i };
        })
      : ([] as { phone: string }[]),
    credit: user.credit,
    role: user.role,
    notes: user.notes ?? "",
    informations: user.informations ?? "",
    subscription: user.subscription ? parseISO(user.subscription) : new Date(),
    disabled: !user.enabled,
  };
}

export function UserEdit(props: UserEditProps) {
  const { user, error, mutate } = useUser(props.id);
  const { mutate: mutateUsers } = useUsers();

  const initialUserId = user?.id;
  const { account } = useGlobalStore();
  const [editBusy, setEditBusy] = useState<boolean>(false);
  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, control } = useForm({
    defaultValues: generateDefaultValues(user),
  });
  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({ control, name: "emails" });
  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({ control, name: "phones" });
  const { ConfirmDialog, confirmPromise } = useConfirm(
    "Suppression du compte",
    "Cela supprimera définitivement tout son historique",
  );

  function onSubmit(user: User, data: FormValues) {
    setApiError(null);
    setEditBusy(true);

    // Prepare data
    user.id ||= data.id;
    user.name = data.name;
    user.emails = data.emails.map((i) => i.email);
    user.phones = data.phones.map((i) => i.phone);
    user.credit = data.credit;
    user.role = data.role;
    user.notes = data.notes;
    user.informations = data.informations;
    user.subscription = formatISO(data.subscription || Date(), {
      representation: "date",
    });
    user.enabled = !data.disabled;

    // Update or create user
    const promise = initialUserId ? updateUser(user.id, user) : createUser(user);
    promise
      .then((result) => {
        // Error
        if ("detail" in result) {
          setApiError(result.detail);
          return;
        }
        if (mutate) mutate();
        mutateUsers();
        navigate(`/users/${result.id}`, { replace: true });
      })
      .catch((err) => {
        console.log(err);
        setApiError("Erreur de communication");
      })
      .finally(() => setEditBusy(false));
  }

  // Delete user
  async function onDelete(user_id: number) {
    const answer = await confirmPromise();
    if (!answer) return;

    setDeleteBusy(true);
    deleteUser(user_id)
      .then(() => {
        mutateUsers();
        navigate("/users", { replace: true });
      })
      .catch((error) => {
        console.error(error);
        setApiError("Erreur de communication");
      })
      .finally(() => setDeleteBusy(false));
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!user) return;

  return (
    <>
      {/* Title + Delete button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Typography variant="h5" color="primary.main" sx={{ pb: 2, flexGrow: 1 }}>
          {user.id ? `Edition d'un adhérent (${user.id})` : "Nouvel adhérent"}
        </Typography>

        {/* Push to the right */}
        <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />

        {/* Delete button */}
        {user.id !== 0 && account?.rights.includes("user_delete") && (
          <>
            <Button
              color="warning"
              loading={deleteBusy}
              onClick={handleSubmit(() => onDelete(user.id))}
            >
              <Icon>delete</Icon>
            </Button>
            <ConfirmDialog />
          </>
        )}
      </Box>

      {/* Display error */}
      {apiError && (
        <Alert severity="error" variant="filled" sx={{ m: 2 }}>
          {apiError}
        </Alert>
      )}

      {user?.id === 0 && (
        <Alert
          variant="outlined"
          severity="info"
          sx={{ backgroundColor: "rgba(85, 108, 214, 0.1)" }}
        >
          <AlertTitle>Adhésion et Remplissage de carte</AlertTitle>
          Merci d'utiliser "Nouvel Emprunt" puis "+" pour l'adhésion et la carte d'emprunt.
        </Alert>
      )}

      <h2 style={{ marginBottom: 1 }}>Informations générales</h2>

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
        margin="normal"
        label="Informations (Adresses / ...)"
        defaultValue={user.informations}
        placeholder="Informations (Adresses / ...)"
        multiline
        minRows={1}
        {...register("informations")}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Notes (Cheque de caution...)"
        defaultValue={user.notes}
        multiline
        minRows={1}
        {...register("notes")}
      />

      <FormControlLabel
        control={
          <Checkbox color="error" defaultChecked={!user.enabled} {...register("disabled")} />
        }
        label="Désactiver l'adhérent"
      />

      <h2 style={{ marginBottom: 1 }}>Emails</h2>

      <Box>
        {emailFields.map((field, idx) => (
          <Box sx={{ display: "flex" }} key={field.id}>
            <TextField
              fullWidth
              label={`Email ${idx + 1}`}
              margin="normal"
              autoCorrect="off"
              sx={{ flexGrow: 1 }}
              {...register(`emails.${idx}.email`)}
            />
            <Button onClick={() => removeEmail(idx)}>
              <Icon>delete</Icon>
            </Button>
          </Box>
        ))}
        <Button startIcon={<Icon>add</Icon>} onClick={() => appendEmail({ email: "" })}>
          Ajouter un EMail
        </Button>
      </Box>

      <h2 style={{ marginBottom: 1 }}>Numéros de Téléphone</h2>

      <Box>
        {phoneFields.map((field, idx) => (
          <Box sx={{ display: "flex" }} key={field.id}>
            <TextField
              fullWidth
              label={`Téléphone ${idx + 1}`}
              margin="normal"
              autoCorrect="off"
              sx={{ flexGrow: 1 }}
              {...register(`phones.${idx}.phone`)}
            />
            <Button onClick={() => removePhone(idx)}>
              <Icon>delete</Icon>
            </Button>
          </Box>
        ))}
        <Button startIcon={<Icon>add</Icon>} onClick={() => appendPhone({ phone: "" })}>
          Ajouter un numéro
        </Button>
      </Box>

      {user?.id !== 0 && (
        <>
          <h2 style={{ marginBottom: 1 }}>Zone dangereuse</h2>

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

          <Alert elevation={1} severity="warning" sx={{ mt: 2, mb: 1 }}>
            Evitez de modifier ces paramètres directement et passez plutôt par "Nouvel Emprunt" puis
            "+".
            <br />
            <Controller
              control={control}
              defaultValue={user.subscription ? parseISO(user.subscription) : new Date()}
              name="subscription"
              render={({ field }) => (
                <DatePicker
                  label="Expiration adhésion"
                  sx={{ mt: 2, mb: 1 }}
                  format="d MMM yyyy"
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
          </Alert>
        </>
      )}

      <Button
        variant="contained"
        fullWidth
        color="secondary"
        loading={editBusy}
        size="large"
        sx={{ mt: "15px", p: 1.5 }}
        onClick={handleSubmit((formdata) => onSubmit(user, formdata))}
      >
        {user.id === 0 ? "Créer" : "Modifier"}
      </Button>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "20px" }}
        onClick={handleSubmit(() => history.back())}
      >
        Annuler
      </Button>
    </>
  );
}
