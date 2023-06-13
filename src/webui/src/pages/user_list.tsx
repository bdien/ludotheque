import { useUsers } from "../api/hooks";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import Box from "@mui/material/Box";
import { UserModel } from "../api/models";
import { Link } from "wouter";
import { GridColDef } from "@mui/x-data-grid/models";
import Chip from "@mui/material/Chip";

function nameDisplay(user: UserModel) {
  return (
    <>
      <Link href={`/users/${user.id}`}>{user.name}</Link>
      {user.role == "operator" && (
        <Chip
          label="Opérateur"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      )}
      {user.role == "admin" && (
        <Chip
          label="Admin"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      )}
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
    field: "email",
    headerName: "Email",
    flex: 1,
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
    headerName: "Prêt +vieux",
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
