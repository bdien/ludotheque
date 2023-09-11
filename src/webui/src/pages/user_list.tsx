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
import { TextField, Tooltip, useMediaQuery, useTheme } from "@mui/material";
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
        (i.email && i.email.toString().includes(lw_filter)),
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
                <TableCell scope="row" sx={{ p: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Box flexGrow={1}>
                      <Typography component="div" fontWeight={500}>
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
                      </Typography>
                      <Box display={displaysm}>{row.email}</Box>
                    </Box>

                    <Box flexGrow={0.3}>
                      {row?.loans ? `${row?.loans} emprunt` : ""}
                      {row?.loans && (row?.loans as unknown as number) > 1
                        ? "s"
                        : ""}
                    </Box>

                    <Box>
                      {row?.notes && (
                        <Tooltip title={row.notes}>
                          <Icon color="warning" sx={{ mx: 0.5 }}>
                            notes
                          </Icon>
                        </Tooltip>
                      )}
                      {row.subscription &&
                        new Date(row.subscription) <= today && (
                          <Tooltip title="Abonnement en retard">
                            <Icon color="warning" sx={{ mx: 0.5 }}>
                              sell
                            </Icon>
                          </Tooltip>
                        )}

                      {row.oldest_loan && new Date(row.oldest_loan) < today && (
                        <Tooltip title="Jeux en retard">
                          <Icon color="warning" sx={{ mx: 0.5 }}>
                            alarm
                          </Icon>
                        </Tooltip>
                      )}
                    </Box>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
