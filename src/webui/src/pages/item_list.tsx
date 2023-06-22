import { useItems } from "../api/hooks";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ItemModel } from "../api/models";
import { Link } from "wouter";
import { AgeChip } from "../components/age_chip";
import { useState } from "react";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";

function nameDisplay(item: ItemModel) {
  return (
    <>
      <Link href={`/items/${item.id}`}>{item.name}</Link>
      {item.big && (
        <Icon fontSize="small" color="action" sx={{ ml: 0.5 }}>
          inventory
        </Icon>
      )}
      {item.outside && (
        <Icon fontSize="small" color="action" sx={{ ml: 0.5 }}>
          park
        </Icon>
      )}
    </>
  );
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

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", type: "number", minWidth: 56, flex: 0.1 },
  {
    field: "name",
    headerName: "Nom",
    flex: 1,
    renderCell: (i) => nameDisplay(i.row),
  },
  {
    field: "players_min",
    headerName: "Joueurs",
    flex: 0.3,
    renderCell: (i) => playerDisplay(i.row),
    headerAlign: "center",
    align: "center",
  },
  {
    field: "age",
    headerName: "Age",
    renderCell: (i) => <AgeChip age={i.value} />,
    flex: 0.3,
    headerAlign: "center",
    align: "center",
    minWidth: 60,
  },
];

interface ItemListFilters {
  text: string;
  outside_air: string;
  age: number;
}

export function ItemList() {
  const [filter, setFilter] = useState<ItemListFilters>({
    text: "",
    outside_air: "",
    age: 99,
  });
  const { items, isLoading } = useItems();

  if (isLoading) return <div>Loading</div>;
  if (!items) return <div>Empty</div>;

  // Filtering
  let displayed = items;
  if (filter) {
    if (filter.text) {
      const lw_filter = filter.text.toLowerCase();
      displayed = items.filter(
        (i) =>
          i.name.toLowerCase().includes(lw_filter) ||
          i.id.toString().includes(lw_filter),
      );
    }
    if (filter.outside_air == "big") {
      displayed = displayed.filter((i) => i.big);
    }
    if (filter.outside_air == "outside") {
      displayed = displayed.filter((i) => i.outside);
    }
    if (filter.age != 99) {
      displayed = displayed.filter((i) => i.age == filter.age);
    }
  }

  return (
    <>
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <TextField
          size="small"
          label="Recherche"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter({ ...filter, text: event.target.value });
          }}
          sx={{ flexGrow: 0.5 }}
        />

        <Select
          size="small"
          sx={{
            height: "40px",
            ml: 1,
            pt: 1,
            maxWidth: "66px",
          }}
          displayEmpty
          defaultValue=""
          onChange={(event) =>
            setFilter({ ...filter, outside_air: event.target.value as string })
          }
        >
          <MenuItem value="">--</MenuItem>
          <MenuItem dense value="outside">
            <Icon fontSize="small" color="action">
              park
            </Icon>
          </MenuItem>
          <MenuItem dense value="big">
            <Icon fontSize="small" color="action">
              inventory
            </Icon>
          </MenuItem>
        </Select>
        <Select
          size="small"
          sx={{
            height: "40px",
            ml: 1,
          }}
          defaultValue={99}
          onChange={(event) =>
            setFilter({ ...filter, age: event.target.value as number })
          }
        >
          <MenuItem dense value="99">
            --
          </MenuItem>
          {[0, 2, 4, 6, 8, 10].map((i) => (
            <MenuItem dense key={i} value={i}>
              <AgeChip age={i} />
            </MenuItem>
          ))}
        </Select>
      </Box>

      <DataGrid
        rows={displayed}
        columns={columns}
        autoPageSize
        rowHeight={40}
        disableRowSelectionOnClick
        sx={{ height: "100%" }}
      />
    </>
  );
}
