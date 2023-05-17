import { useItems } from "../api/hooks";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import { ItemModel } from "../api/models";
import { Link } from "wouter";
import Box from "@mui/material/Box";
import { AgeChip } from "../components/age_chip";

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
  { field: "id", headerName: "ID", type: "number", minWidth: 55, flex: 0.1 },
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
  const { items, isLoading } = useItems();

  if (isLoading) return <div>Loading</div>;

  if (!items) return <div>Empty</div>;

  return (
    <Box sx={{ p: 1, height: "calc(100vh - 56px)" }}>
      {/* <h2>Liste des Jeux</h2> */}
      <DataGrid
        rows={items}
        columns={columns}
        autoPageSize
        rowHeight={40}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
