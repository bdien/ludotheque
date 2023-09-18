import { useAccount, useUsers } from "../api/hooks";
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
import {
  IconButton,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { exportUsers } from "../api/calls";

function exportCSV() {
  exportUsers().then((txt) => {
    const file = new File(("\ufeff" + txt).split("\n"), "users.csv", {
      type: "text/csv",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
}

export function UserList() {
  const { account } = useAccount();
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
        <Box sx={{ flexGrow: 0.5 }}></Box>
        {account?.role == "admin" && (
          <Tooltip title="Exporter en CSV">
            <IconButton color="primary" onClick={exportCSV}>
              <Icon fontSize="medium">file_download</Icon>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            {displayed.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell
                  scope="row"
                  sx={{
                    p: 1,
                    "&:hover": { backgroundColor: "#F9FBFC" },
                    cursor: "pointer",
                  }}
                >
                  <Link
                    href={`/users/${row.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box flexGrow={1}>
                        <Typography
                          component="div"
                          color="primary.main"
                          fontWeight={500}
                        >
                          {row.name}
                          {row.role == "admin" && (
                            <Icon fontSize="small" sx={{ ml: 0.3 }}>
                              star
                            </Icon>
                          )}
                          {row.role == "benevole" && (
                            <Icon fontSize="small" sx={{ ml: 0.3 }}>
                              star_half
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

                        {row.oldest_loan &&
                          new Date(row.oldest_loan) < today && (
                            <Tooltip title="Jeux en retard">
                              <Icon color="warning" sx={{ mx: 0.5 }}>
                                alarm
                              </Icon>
                            </Tooltip>
                          )}
                      </Box>
                    </div>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
