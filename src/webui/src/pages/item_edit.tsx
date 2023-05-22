import { Controller, useForm } from "react-hook-form";
import { useItem } from "../api/hooks";
import { ItemModel } from "../api/models";
import { updateItem } from "../api/calls";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { AgeChip } from "../components/age_chip";
import Button from "@mui/material/Button";
import { useLocation } from "wouter";

interface ItemEditProps {
  id: number;
}

function playerDisplay(item: ItemModel) {
  let txt = item.players_min;
  if (item.players_min == item.players_max) return <>{txt}</>;
  if (item.players_max == 99) return <>{txt}+</>;
  return (
    <>
      {item.players_min} - {item.players_max}
    </>
  );
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

export function ItemEdit(props: ItemEditProps) {
  const { item, error, mutate } = useItem(props.id);
  const { register, control, handleSubmit } = useForm<ItemModel>();
  const [_location, navigate] = useLocation();

  async function onSubmit(data: Object) {
    console.log(item?.id);
    console.log(data);

    data.players_min = data.players[0];
    data.players_max = data.players[1];

    await updateItem(item?.id ?? 0, data);
    mutate({ ...data });
    navigate(`/items/${item?.id}`);
  }

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  // render data
  return (
    <>
      <Box
        component="img"
        sx={{
          width: "100vw",
          height: "40vh",
          objectFit: "contain",
        }}
        src={"/img/" + (item.picture || "notavailable.png")}
      />

      <TableContainer component={Paper}>
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
                  {...register("name")}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
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
                  defaultValue={[item.players_min ?? 1, item.players_max ?? 4]}
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
          </TableBody>
        </Table>
      </TableContainer>

      <Button onClick={handleSubmit(onSubmit)}>Submit</Button>
    </>
  );
}
