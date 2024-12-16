import { useUsers } from "../api/hooks";
import { useGlobalStore } from "../hooks/global_store";
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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { exportUsers } from "../api/calls";
import { Loading } from "../components/loading";
import { ShortUser } from "../components/short_user";

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
  const { account } = useGlobalStore();
  const [filter, setFilter] = useState<string>("");
  const [filterDisabled, setFilterDisabled] = useState<boolean>(false);
  const { users } = useUsers();
  const theme = useTheme();
  const displaysm = useMediaQuery(theme.breakpoints.up("md"))
    ? "block"
    : "none";

  // Filter menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpened = Boolean(anchorEl);
  const filterMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const filterMenuClose = () => {
    setAnchorEl(null);
  };

  if (!users) return <Loading />;

  // Filtering (According to text filter + hidden)
  let displayed = Array.from(users.values());
  if (filter || filterDisabled) {
    const lw_filter = filter.toLowerCase();
    displayed = displayed.filter(
      (i) =>
        i.name.toLowerCase().includes(lw_filter) ||
        (i.emails && i.emails.filter((e) => e.includes(lw_filter)).length > 0),
    );
  }
  let nbHidden = displayed.length;
  displayed = displayed.filter((i) => i.enabled || filterDisabled);
  nbHidden -= displayed.length;

  const today = new Date();

  return (
    <Box>
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <TextField
          size="small"
          label="Recherche"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter(event.target.value);
          }}
          sx={{ flexGrow: 1, backgroundColor: "white", maxWidth: "500px" }}
        />

        {/* Push to the right */}
        <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />

        {/* Filter Menu */}
        <IconButton color="primary" onClick={filterMenuOpen}>
          <Icon>filter_alt</Icon>
        </IconButton>
        <Menu
          id="user-filter-menu"
          anchorEl={anchorEl}
          open={filterMenuOpened}
          onClose={filterMenuClose}
        >
          <MenuList dense>
            <MenuItem
              onClick={() => {
                setFilterDisabled((filterDisabled) => !filterDisabled);
              }}
            >
              <ListItemIcon>
                <Icon>{filterDisabled ? "check" : ""}</Icon>
              </ListItemIcon>
              <ListItemText>Afficher désactivés</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Export CSV */}
        {account?.role == "admin" && (
          <Tooltip
            title="Exporter en CSV"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            <IconButton color="primary" onClick={exportCSV}>
              <Icon>file_download</Icon>
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
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      <Box flexGrow={1} my="auto">
                        <Typography fontWeight={500}>
                          <ShortUser user_id={row.id} />
                        </Typography>
                        <Box display={displaysm}>{row.emails?.join(", ")}</Box>
                      </Box>

                      <Box
                        flexGrow={0.3}
                        sx={{ textAlign: "right", my: "auto" }}
                      >
                        {row?.loans ? `${row?.loans} jeu` : ""}
                        {row?.loans && (row?.loans as unknown as number) > 1
                          ? "x"
                          : ""}
                      </Box>

                      <Box sx={{ width: 64, textAlign: "right", my: "auto" }}>
                        {row?.notes && (
                          <Icon
                            title={row.notes}
                            color="secondary"
                            sx={{ mx: 0.5 }}
                          >
                            notes
                          </Icon>
                        )}
                        {row.subscription &&
                          new Date(row.subscription) <= today && (
                            <Icon
                              title="Adhésion expirée"
                              color="secondary"
                              sx={{ mx: 0.5 }}
                            >
                              error_outline
                            </Icon>
                          )}
                        {row.oldest_loan &&
                          new Date(row.oldest_loan) < today && (
                            <Icon
                              title="Jeux en retard"
                              color="warning"
                              sx={{ mx: 0.5 }}
                            >
                              alarm
                            </Icon>
                          )}
                        &nbsp;
                      </Box>
                    </div>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{ mt: 1, fontSize: "0.8em", textAlign: "center", opacity: 0.5 }}
        onClick={() => {
          setFilterDisabled((filterDisabled) => !filterDisabled);
        }}
      >
        {nbHidden > 1 && `+${nbHidden} adhérents désactivés`}
        {nbHidden == 1 && `+${nbHidden} adhérent désactivé`}
      </Box>
    </Box>
  );
}
