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
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { exportUsers } from "../api/calls";
import { Loading } from "../components/loading";

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

        <Button onClick={filterMenuOpen}>
          <Icon>filter_list</Icon>
        </Button>
        <Menu
          id="user-filter-menu"
          anchorEl={anchorEl}
          open={filterMenuOpened}
          onClose={filterMenuClose}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setFilterDisabled((filterDisabled) => !filterDisabled);
              }}
            >
              <ListItemIcon>
                <Icon>
                  {filterDisabled ? "check_box" : "check_box_outline_blank"}
                </Icon>
              </ListItemIcon>
              <ListItemText>Afficher désactivés</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>

        <Box sx={{ flexGrow: 0.5 }}></Box>
        {account?.role == "admin" && (
          <IconButton
            title="Exporter en CSV"
            color="primary"
            onClick={exportCSV}
          >
            <Icon fontSize="medium">file_download</Icon>
          </IconButton>
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
                              title="Adhésion en retard"
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
                        {row?.enabled || (
                          <Icon
                            title="Utilisateur désactivé"
                            color="warning"
                            sx={{ mx: 0.5 }}
                          >
                            visibility_off
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
