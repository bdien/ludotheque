import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

export function UserCreate() {
  return (
    <>
      <Typography variant="h5">Nouvel adhérent</Typography>
      <FormControl sx={{ width: "100%", p: 2 }}>
        <TextField
          label="Nom du compte"
          fullWidth
          required={true}
          margin="normal"
        />
        <TextField label="Email" margin="normal" />
        <TextField
          label="Crédit"
          margin="normal"
          type="number"
          InputProps={{
            endAdornment: <InputAdornment position="end">€</InputAdornment>,
          }}
        />
        <Button variant="contained" size="large" style={{ marginTop: "20px" }}>
          Valider
        </Button>
      </FormControl>
    </>
  );
}
