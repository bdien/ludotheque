import { useItems } from "../api/hooks";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import { ItemModel } from "../api/models";
import { Link } from "wouter";
import Box from "@mui/material/Box";
import { AgeChip } from "../components/age_chip";
import { TextField } from "@mui/material";
import { useState } from "react";

function nameDisplay(item: ItemModel) {
  return (
    <>
      <Link href={`/items/${item.id}`}>{item.name}</Link>
      {item.big && (
        <Chip
          label="Big"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      )}
      {item.outside && (
        <Chip
          label="Ext"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
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

export function ItemList() {
  const [filter, setFilter] = useState<string>("");
  const { items, isLoading } = useItems();

  if (isLoading) return <div>Loading</div>;
  if (!items) return <div>Empty</div>;

  // Filtering
  let displayed = items;
  if (filter) {
    const lw_filter = filter.toLowerCase();
    displayed = items.filter((i) => i.name.toLowerCase().includes(lw_filter));
  }

  return (
    <>
      <TextField
        size="small"
        label="Recherche"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setFilter(event.target.value);
        }}
        sx={{ mb: 1 }}
      />
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
