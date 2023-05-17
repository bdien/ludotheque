import { useItems } from "../api/hooks";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ItemModel } from "../api/models";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";

function displayItem(item: ItemModel) {
  return <div>{item.name}</div>;
}

function ageDisplay(age: number) {
  if (age == 0)
    return (
      <>
        <Icon sx={{ color: "#FFFFFF" }}>circle</Icon> 1- ans
      </>
    );
  if (age == 2)
    return (
      <>
        <Icon sx={{ color: "#00FF00" }}>circle</Icon> 2-3 ans
      </>
    );
  if (age == 4)
    return (
      <>
        <Icon sx={{ color: "#FFFF00" }}>circle</Icon> 4-5 ans
      </>
    );
  if (age == 6)
    return (
      <>
        <Icon sx={{ color: "#FF00FF" }}>circle</Icon> 6-7 ans
      </>
    );
  if (age == 8)
    return (
      <>
        <Icon sx={{ color: "#0000FF" }}>circle</Icon> 8-9 ans
      </>
    );
  if (age == 10)
    return <Chip label="10+" size="small" sx={{ color: "#FF0000" }} />;
  //    if (age == 10) return <><Icon sx={{ color: '#FF0000' }}>circle</Icon> 10+ ans</>
  return age;
}

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", type: "number", minWidth: 55, flex: 0.1 },
  { field: "name", headerName: "Nom", flex: 1 },
  {
    field: "age",
    headerName: "Age",
    renderCell: (i) => ageDisplay(i.value),
    flex: 0.3,
  },
];

export function ItemList() {
  const { items, isLoading } = useItems();

  if (isLoading) return <div>Loading</div>;

  if (!items) return <div>Empty</div>;

  return (
    <div style={{ height: "90vh", width: "100%" }}>
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
