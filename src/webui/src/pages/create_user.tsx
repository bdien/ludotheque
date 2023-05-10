import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';


export function CreateUser() {

    return <div>
        <h2>Création d'un compte</h2>
        <FormControl sx={{ width: '90vw', margin: '5vw' }}>
            <TextField label="Nom du compte" fullWidth  required={true} margin="normal"/>
            <TextField label="Email" margin="normal"/>
            <TextField label="Crédit" margin="normal" type="number"/>
            <Button variant="contained" size="large" style={{ marginTop: '20px' }}>Valider</Button>
        </FormControl>

    </div>

}