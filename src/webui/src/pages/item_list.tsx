import { useItems } from "../api/hooks";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Chip from "@mui/material/Chip";
import { ItemModel } from "../api/models";
import { Link } from "wouter";

function nameDisplay(item: ItemModel) {
  return (
    <>
      <Link href={`/item/${item.id}`}>{item.name}</Link>
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

function ageDisplay(age: number) {
  if (age == 0)
    return (
      <Chip
        label="1-"
        size="small"
        sx={{ backgroundColor: "hsl(170, 100%, 90%)" }}
      />
    );
  if (age == 2)
    return (
      <Chip
        label="2/3"
        size="small"
        sx={{ backgroundColor: "hsl(90, 100%, 80%)" }}
      />
    );
  if (age == 4)
    return (
      <Chip
        label="4/5"
        size="small"
        sx={{ backgroundColor: "hsl(50, 100%, 70%)" }}
      />
    );
  if (age == 6)
    return (
      <Chip
        label="6/7"
        size="small"
        sx={{ backgroundColor: "hsl(320, 100%, 70%)" }}
      />
    );
  if (age == 8)
    return (
      <Chip
        label="8/9"
        size="small"
        sx={{ backgroundColor: "hsl(210, 100%, 80%)" }}
      />
    );
  if (age == 10)
    return (
      <Chip
        label="10+"
        size="small"
        sx={{ backgroundColor: "hsl(0, 100%, 75%)" }}
      />
    );
  return <Chip label={age} size="small" />;
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
    align: "center",
  },
  {
    field: "age",
    headerName: "Age",
    renderCell: (i) => ageDisplay(i.value),
    flex: 0.3,
    align: "center",
  },
];

export function ItemList() {
  const { items, isLoading } = useItems();

  if (isLoading) return <div>Loading</div>;

  if (!items) return <div>Empty</div>;

  return (
    <div style={{ height: "85vh", width: "100%" }}>
      <h2>Liste des Jeux</h2>
      <DataGrid
        rows={items}
        columns={columns}
        autoPageSize
        rowHeight={40}
        disableRowSelectionOnClick
      />
    </div>
  );
}
