import { useUsers } from "../api/hooks";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import Box from "@mui/material/Box";
import { UserModel } from "../api/models";
import { Link } from "wouter";
import Icon from "@mui/material/Icon";
import { GridColDef } from "@mui/x-data-grid/models";

function nameDisplay(user: UserModel) {
  return (
    <>
      <Link href={`/items/${user.id}`}>{user.name}</Link>
      {user.role && <Icon>star</Icon>}
    </>
  );
}

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Nom",
    flex: 1,
    renderCell: (i) => nameDisplay(i.row),
  },
  {
    field: "loans",
    headerName: "Prêts",
    flex: 0.3,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "oldest_loan",
    headerName: "+ Vieux",
    flex: 0.3,
    minWidth: 95,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "credit",
    headerName: "€€€",
    flex: 0.3,
    headerAlign: "center",
    align: "center",
  },
];

export function UserList() {
  const { users, isLoading } = useUsers();

  if (isLoading || !users) return <div>Loading</div>;

  return (
    <Box sx={{ p: 1, pt: 0, height: "calc(90vh - 56px)" }}>
      <DataGrid
        rows={users}
        columns={columns}
        autoPageSize
        rowHeight={40}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
