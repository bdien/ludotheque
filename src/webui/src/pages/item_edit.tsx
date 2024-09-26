import { Controller, useForm } from "react-hook-form";
import { useItem, useCategories, useAccount, useItems } from "../api/hooks";
import { ItemModel } from "../api/models";
import { createItem, deleteItem, updateItem } from "../api/calls";
import { useConfirm } from "../hooks/useConfirm";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { AgeChip } from "../components/age_chip";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-browser-location";
import { ImageChooser } from "../components/image_chooser";
import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import ToggleButton from "@mui/material/ToggleButton";
import Alert from "@mui/material/Alert";

interface ItemEditProps {
  id?: number;
}

const marks = [
  {
    value: 1,
    label: "1",
  },
  {
    value: 2,
    label: "2",
  },
  {
    value: 4,
    label: "4",
  },
  {
    value: 8,
    label: "8",
  },
  {
    value: 10,
    label: "10",
  },
  {
    value: 16,
    label: "∞",
  },
];

interface FormValues {
  id: number;
  players: number[];
  name: string;
  description: string;
  categories: number[];
  age: number;
  gametime: number;
  big: boolean;
  outside: boolean;
  disabled: boolean;
  content: string;
  notes: string;
}

export function ItemEdit(props: ItemEditProps) {
  const { item, error, mutate } = useItem(props.id);
  const { mutate: mutateItems } = useItems();
  const initialItemId = item?.id;
  const { categories } = useCategories();
  const [autoId, setAutoId] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, control, handleSubmit } = useForm<FormValues>();
  const { account } = useAccount();
  const { ConfirmDialog, confirmPromise } = useConfirm(
    "Suppression du jeu",
    `Etes-vous sûr de vouloir supprimer le jeu '${item?.name}' ? Cela supprimera
    définitivement tout son historique d'emprunts.`,
  );

  async function onSubmit(item: ItemModel, data: FormValues) {
    setApiError(null);

    item.id ||= data.id;
    item.players_min = data.players[0];
    item.players_max = data.players[1];
    item.name = data.name.trim();
    item.description = data.description.trim();
    if (Array.isArray(data.categories)) item.categories = data.categories;
    else
      item.categories = (data.categories as string)
        .split(",")
        .map((i) => parseInt(i));
    item.age = data.age;
    item.gametime = data.gametime;
    item.big = data.big;
    item.outside = data.outside;
    item.enabled = !data.disabled;
    item.notes = data.notes.trim();
    item.content = data.content.trim()
      ? data.content
          .trim()
          .split("\n")
          .map((i) => i.trim())
      : [];

    if (initialItemId) {
      await updateItem(item?.id ?? 0, item);
    } else {
      // Create New Item
      const result = await createItem(item);
      if ("detail" in result) {
        setApiError(result.detail);
        return;
      }
      item = result;
    }

    // Refresh item/items
    if (mutate) {
      mutate({ ...item });
    }
    mutateItems();

    navigate(`/items/${item.id}`, { replace: true });
  }

  async function onDelete(itemId: number) {
    const answer = await confirmPromise();
    if (!answer) return;

    deleteItem(itemId).then(() => {
      mutateItems();
      navigate("/items", { replace: true });
    });
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  // render data
  return (
    <>
      <FormControl sx={{ width: "100%", py: 2 }}>
        <Box>
          <ImageChooser
            onImageChange={(imgs) => {
              item.pictures = imgs;
            }}
            src={item.pictures}
          />
        </Box>

        {apiError && (
          <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <TableContainer>
          <Table
            size="small"
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: "none",
              },
            }}
          >
            <TableBody>
              {/* Numéro du jeu */}
              <TableRow>
                <TableCell
                  sx={{
                    width: "clamp(10ch, 10vw, 300px)",
                    color: "primary.main",
                  }}
                >
                  Numéro
                </TableCell>
                <TableCell style={{ display: "flex" }}>
                  {item?.id ? (
                    <TextField
                      label="Numéro du Jeu"
                      type="number"
                      value={item.id}
                      disabled
                    />
                  ) : (
                    <>
                      <ToggleButton
                        color="primary"
                        value="check"
                        selected={autoId}
                        onChange={() => {
                          setAutoId(!autoId);
                        }}
                        sx={{ py: 1.8 }}
                      >
                        Auto
                      </ToggleButton>
                      {!autoId && (
                        <TextField
                          type="number"
                          {...register("id")}
                          sx={{ ml: 2, flexGrow: "1", width: "120px" }}
                        />
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>

              {/* Nom du jeu */}
              <TableRow>
                <TableCell
                  sx={{
                    width: "clamp(10ch, 10vw, 300px)",
                    color: "primary.main",
                  }}
                >
                  Nom
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    label="Nom"
                    inputProps={{ maxLength: 128 }}
                    defaultValue={item.name}
                    spellCheck={true}
                    {...register("name")}
                  />
                </TableCell>
              </TableRow>

              {/* Description du jeu */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>
                  Description
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    label="Description"
                    spellCheck={true}
                    multiline
                    minRows={2}
                    defaultValue={item.description}
                    {...register("description")}
                  />
                </TableCell>
              </TableRow>

              {/* Age pour le jeu */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Age</TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <InputLabel id="item-age-label">Age</InputLabel>
                    <Select
                      label="Age"
                      defaultValue={item.age}
                      sx={{ minWidth: "200px" }}
                      {...register("age")}
                    >
                      {[0, 2, 4, 6, 8, 10].map((i) => (
                        <MenuItem dense key={i} value={i}>
                          <AgeChip age={i} size="medium" />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>

              {/* Contenu du jeu */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Contenu</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    label="Contenu"
                    placeholder="Une ligne par objet ou groupe d'objet"
                    helperText="Une ligne par objet ou groupe d'objet"
                    spellCheck={true}
                    multiline
                    defaultValue={item.content ? item.content.join("\n") : []}
                    {...register("content")}
                  />
                </TableCell>
              </TableRow>

              {/* Categories */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Catégories</TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <InputLabel id="item-categories-label">
                      Catégories
                    </InputLabel>
                    <Select
                      label="Catégories"
                      multiple
                      defaultValue={item.categories}
                      sx={{ minWidth: "200px" }}
                      MenuProps={{
                        sx: {
                          "&& .Mui-selected": {
                            backgroundColor: "#556cd640",
                          },
                        },
                      }}
                      {...register("categories")}
                    >
                      {categories &&
                        Array.from(categories, ([id, name]) => (
                          <MenuItem key={id} value={id}>
                            {name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>

              {/* Durée d'une partie */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>
                  Durée de jeu
                </TableCell>
                <TableCell>
                  <TextField
                    defaultValue={item.gametime}
                    sx={{ minWidth: "200px" }}
                    label="Durée de jeu"
                    type="number"
                    InputProps={{
                      inputProps: { min: 0, max: 360 },
                      endAdornment: (
                        <InputAdornment position="end">min</InputAdornment>
                      ),
                    }}
                    {...register("gametime")}
                  />
                </TableCell>
              </TableRow>

              {/* Nombre de joueurs */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Joueurs</TableCell>
                <TableCell>
                  <Controller
                    defaultValue={
                      [item.players_min ?? 1, item.players_max ?? 4] as number[]
                    }
                    control={control}
                    name="players"
                    render={({ field }) => (
                      <Slider
                        {...field}
                        valueLabelDisplay="auto"
                        min={1}
                        max={16}
                        step={1}
                        marks={marks}
                      />
                    )}
                  />
                </TableCell>
              </TableRow>

              {/* Notes */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Notes</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    label="Notes"
                    spellCheck={true}
                    multiline
                    defaultValue={item.notes}
                    {...register("notes")}
                  />
                </TableCell>
              </TableRow>

              {/* Cases à cocher */}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Extra</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="error"
                        defaultChecked={!item.enabled}
                        {...register("disabled")}
                      />
                    }
                    label="Retiré de l'emprunt (Précisez la raison dans 'Notes')"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={item.outside}
                        {...register("outside")}
                      />
                    }
                    label="Jeu d'extérieur"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={item.big}
                        {...register("big")}
                      />
                    }
                    label="Jeu surdimensionné"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: "20px", p: 1.5 }}
          onClick={handleSubmit((formdata) => onSubmit(item, formdata))}
        >
          {item.id == 0 ? "Créer" : "Modifier"}
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

        {item.id != 0 && account?.role == "admin" && (
          <>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              color="error"
              sx={{ mt: "15px" }}
              onClick={handleSubmit(() => onDelete(item.id))}
            >
              Supprimer
            </Button>
            <ConfirmDialog />
          </>
        )}
      </FormControl>
    </>
  );
}
