import { useAccount, useItems } from "../api/hooks";
import { ItemModel } from "../api/models";
import { Link } from "wouter";
import { AgeChip } from "../components/age_chip";
import { forwardRef, useState } from "react";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import Paper from "@mui/material/Paper";
import { TableVirtuoso, TableComponents } from "react-virtuoso";
import useSessionStorage from "../hooks/useSessionStorage";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { exportItems } from "../api/calls";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuList,
} from "@mui/material";

function exportCSV() {
  exportItems().then((txt) => {
    const file = new File(("\ufeff" + txt).split("\n"), "jeux.csv", {
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

function nameDisplay(item: ItemModel) {
  return (
    <Link href={`/items/${item.id}`}>
      <Box
        style={{
          cursor: "pointer",
        }}
      >
        <Box
          component="span"
          sx={{
            color: "primary.main",
            fontSize: 14,
            fontWeight: "500",
            mr: 1,
            textDecoration: item.enabled ? "" : "line-through",
          }}
        >
          {item.name}
        </Box>
        {item.status == "out" && (
          <Icon
            title="Emprunté"
            fontSize="small"
            color="secondary"
            sx={{ pt: 0.2 }}
          >
            logout
          </Icon>
        )}
        {item.big && (
          <Icon
            title="Surdimensionné"
            fontSize="small"
            color="secondary"
            sx={{ pt: 0.2 }}
          >
            inventory
          </Icon>
        )}
        {item.outside && (
          <Icon
            title="Jeu d'Extérieur"
            fontSize="small"
            color="secondary"
            sx={{ pt: 0.2 }}
          >
            park
          </Icon>
        )}
        {!item.enabled && (
          <Icon
            title="Indisponible"
            fontSize="small"
            color="warning"
            sx={{ pt: 0.2 }}
          >
            construction
          </Icon>
        )}
      </Box>
    </Link>
  );
}

function playerDisplay(item: ItemModel) {
  const txt = item.players_min;
  if (item.players_min == item.players_max) return <>{txt}</>;
  if (item.players_max == 99) return <>{txt}+</>;
  return (
    <>
      {item.players_min} - {item.players_max}
    </>
  );
}

const TableComps: TableComponents<ItemModel> = {
  Scroller: forwardRef((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table {...props} size="small" style={{ borderCollapse: "separate" }} />
  ),
  TableHead: TableHead,
  TableRow: TableRow,
  TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

interface ItemListFilters {
  text: string;
  age: boolean[];
  outside: boolean;
  big: boolean;
  regular: boolean;
  disabled: boolean;
}

export function ItemList() {
  const { account } = useAccount();
  const { items } = useItems();
  const [filter, setFilter] = useSessionStorage<ItemListFilters>(
    "itemSearchFilters",
    {
      text: "",
      age: [false, false, false, false, false, false],
      outside: false,
      big: false,
      regular: false,
      disabled: true,
    },
  );

  // Filter menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpened = Boolean(anchorEl);
  const filterMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const filterMenuClose = () => {
    setAnchorEl(null);
  };

  if (!items) return <div>Aucun jeu</div>;

  // Filtering
  let displayed = Array.from(items.values());
  if (filter.text) {
    const lw_filter = filter.text.toLowerCase();
    displayed = displayed.filter(
      (i) =>
        i.name.toLowerCase().includes(lw_filter) ||
        i.id.toString().includes(lw_filter),
    );
  }
  if (filter.regular) {
    displayed = displayed.filter((i) => i.big || i.outside);
  }
  if (filter.big) {
    displayed = displayed.filter((i) => !i.big);
  }
  if (filter.outside) {
    displayed = displayed.filter((i) => !i.outside);
  }
  [0, 2, 4, 6, 8, 10].forEach((age, index) => {
    if (filter.age[index]) displayed = displayed.filter((i) => i.age != age);
  });
  if (filter.disabled) {
    displayed = displayed.filter((i) => i.enabled);
  }

  return (
    <>
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
          type="search"
          defaultValue={filter.text}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter({ ...filter, text: event.target.value });
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
                setFilter({ ...filter, regular: !filter.regular });
              }}
            >
              <ListItemIcon>
                <Icon>{!filter.regular ? "checked" : ""}</Icon>
              </ListItemIcon>
              Jeux de société
            </MenuItem>
            <MenuItem
              onClick={() => {
                setFilter({ ...filter, big: !filter.big });
              }}
            >
              <ListItemIcon>
                <Icon>{!filter.big ? "checked" : ""}</Icon>
              </ListItemIcon>
              Jeux surdimensionnés
            </MenuItem>
            <MenuItem
              onClick={() => {
                setFilter({ ...filter, outside: !filter.outside });
              }}
            >
              <ListItemIcon>
                <Icon>{!filter.outside ? "checked" : ""}</Icon>
              </ListItemIcon>
              Jeux d'extérieur
            </MenuItem>

            <Divider />

            {[0, 2, 4, 6, 8, 10].map((i, index) => (
              <MenuItem
                onClick={() => {
                  filter.age[index] = !filter.age[index];
                  setFilter({ ...filter, age: filter.age });
                }}
              >
                <ListItemIcon>
                  <Icon>{!filter.age[index] ? "checked" : ""}</Icon>
                </ListItemIcon>
                <AgeChip age={i} />
              </MenuItem>
            ))}

            <Divider />

            <MenuItem
              onClick={() => {
                setFilter({ ...filter, disabled: !filter.disabled });
              }}
            >
              <ListItemIcon>
                <Icon>{!filter.disabled ? "check" : ""}</Icon>
              </ListItemIcon>
              <ListItemText>Afficher indisponibles</ListItemText>
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

      <TableVirtuoso
        style={{ height: "100%" }}
        data={displayed}
        components={TableComps}
        initialTopMostItemIndex={parseInt(
          sessionStorage.getItem("itemSearchIndex") ?? "0",
        )}
        rangeChanged={(range) => {
          sessionStorage.setItem(
            "itemSearchIndex",
            range.startIndex.toString(),
          );
        }}
        fixedHeaderContent={() => (
          <TableRow sx={{ background: "#F9FBFC" }}>
            <TableCell sx={{ textAlign: "right", color: "#6B7582" }}>
              #
            </TableCell>
            <TableCell sx={{ p: 0.5, color: "#6B7582" }}>Nom</TableCell>
            <TableCell
              sx={{
                width: "clamp(66px, 10vw, 240px)",
                textAlign: "center",
                color: "#6B7582",
              }}
            >
              <Icon>people_alt</Icon>
            </TableCell>
            <TableCell
              sx={{
                width: "clamp(50px, 10vw, 240px)",
                textAlign: "center",
                color: "#6B7582",
                p: 0.75,
              }}
            >
              Age
            </TableCell>
          </TableRow>
        )}
        itemContent={(_index, row) => (
          <>
            <TableCell
              sx={{
                width: "clamp(56px, 10vw, 90px)",
                py: 1.2,
                textAlign: "right",
              }}
            >
              {row.id}
            </TableCell>
            <TableCell sx={{ p: 0.5 }}>{nameDisplay(row)}</TableCell>
            <TableCell
              sx={{ width: "clamp(66px, 10vw, 240px)", textAlign: "center" }}
            >
              {playerDisplay(row)}
            </TableCell>
            <TableCell sx={{ textAlign: "center", p: 0.75 }}>
              <AgeChip age={row.age || 0} />
            </TableCell>
          </>
        )}
      />
    </>
  );
}
