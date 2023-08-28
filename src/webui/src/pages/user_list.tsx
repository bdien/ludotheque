import { useUsers } from "../api/hooks";
import { Link } from "wouter";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { TextField, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

export function UserList() {
  const [filter, setFilter] = useState<string>("");
  const { users, isLoading } = useUsers();
  const theme = useTheme();
  const displaysm = useMediaQuery(theme.breakpoints.up("md"))
    ? "block"
    : "none";

  if (isLoading || !users) return <div>Loading</div>;

  // Filtering
  let displayed = users;
  if (filter) {
    const lw_filter = filter.toLowerCase();
    displayed = users.filter(
      (i) =>
        i.name.toLowerCase().includes(lw_filter) ||
        i.email.toString().includes(lw_filter),
    );
  }

  const today = new Date();

  return (
    <Box>
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
            setFilter(event.target.value);
          }}
          sx={{ flexGrow: 0.5 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            {displayed.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ p: 1 }}>
                  <Typography component="div" fontWeight={500}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href={`/users/${row.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        {row.name}
                      </Link>
                      {row.role == "admin" && (
                        <Icon fontSize="small" sx={{ ml: 0.3 }}>
                          star
                        </Icon>
                      )}
                    </div>
                  </Typography>
                  <Box display={displaysm}>{row.email}</Box>
                </TableCell>

                <TableCell sx={{ p: 1 }}>
                  {row?.loans ? `${row?.loans} prêt` : ""}
                  {row?.loans && (row?.loans as unknown as number) > 1
                    ? "s"
                    : ""}
                </TableCell>

                <TableCell width="16px" sx={{ p: 0.5 }}>
                  {row?.notes && (
                    <Icon fontSize="large" color="warning">
                      notes
                    </Icon>
                  )}
                  {row.oldest_loan && new Date(row.oldest_loan) < today && (
                    <Icon color="warning">alarm</Icon>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
