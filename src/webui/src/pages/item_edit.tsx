import { Controller, useForm } from "react-hook-form";
import { useItem } from "../api/hooks";
import { ItemModel } from "../api/models";
import {
  createItem,
  deleteItem,
  deleteItemPicture,
  updateItem,
  updateItemPicture,
} from "../api/calls";
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
import { useLocation } from "wouter";
import { ImageChooser } from "../components/image_chooser";
import { useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";

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

type FormValues = {
  players: number[];
  name: string;
  description: string;
  age: number;
  big: boolean;
  outside: boolean;
};

export function ItemEdit(props: ItemEditProps) {
  const { item, error, mutate } = useItem(props.id);
  const [imgFile, setImgFile] = useState<File | null | undefined>(undefined);
  const { register, control, handleSubmit } = useForm<FormValues>();
  const [_location, navigate] = useLocation();
  const { ConfirmDialog, confirmPromise } = useConfirm(
    "Suppression du jeu",
    `Etes-vous sûr de vouloir supprimer le jeu '${item?.name}' ? Cela supprimera
    définitivement tout son historique d'emprunts.`,
  );

  async function onSubmit(item: ItemModel, data: FormValues) {
    item.players_min = data.players[0];
    item.players_max = data.players[1];
    item.name = data.name;
    item.description = data.description;
    item.age = data.age;
    item.big = data.big;
    item.outside = data.outside;

    if (item?.id) {
      await updateItem(item?.id ?? 0, item);

      // Remove previous picture
      if (imgFile === null && item?.picture) deleteItemPicture(item.id);
    } else {
      item = await createItem(item);
    }

    // Upload new picture
    if (imgFile) {
      await updateItemPicture(item.id, imgFile);
    }

    if (mutate) {
      mutate({ ...item });
    }
    navigate(`/items/${item?.id}`);
  }

  async function onDelete(itemId: number) {
    const answer = await confirmPromise();
    if (!answer) return;

    deleteItem(itemId).then(() => navigate("/items"));
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  // render data
  return (
    <>
      <FormControl sx={{ width: "100%", p: 2 }}>
        <Box
          sx={{
            width: "100%",
            height: "40vh",
            objectFit: "contain",
          }}
        >
          <ImageChooser
            onImageChange={setImgFile}
            src={item.picture && "/storage/img/" + item.picture}
          />
        </Box>

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
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    defaultValue={item.name}
                    spellCheck={true}
                    {...register("name")}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    spellCheck={true}
                    multiline
                    minRows={2}
                    defaultValue={item.description}
                    {...register("description")}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Age</TableCell>
                <TableCell>
                  <Select defaultValue={item.age} {...register("age")}>
                    {[0, 2, 4, 6, 8, 10].map((i) => (
                      <MenuItem dense key={i} value={i}>
                        <AgeChip age={i} size="medium" />
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Joueurs</TableCell>
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
              <TableRow>
                <TableCell>Extra</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={item.outside}
                        {...register("outside")}
                      />
                    }
                    label="Plein Air"
                  />
                  <br />
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={item.big}
                        {...register("big")}
                      />
                    }
                    label="Surdimensionné"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          variant="contained"
          size="large"
          sx={{ ml: 2, mt: "20px" }}
          onClick={handleSubmit((formdata) => onSubmit(item, formdata))}
        >
          {item.id == 0 ? "Créer" : "Modifier"}
        </Button>

        {item.id != 0 && (
          <>
            <Button
              variant="outlined"
              size="large"
              color="error"
              sx={{ ml: 2, mt: "20px" }}
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
