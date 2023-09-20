import { useAccount, useItems } from "../api/hooks";
import { ItemModel } from "../api/models";
import { Link } from "wouter";
import { AgeChip } from "../components/age_chip";
import { forwardRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
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
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          cursor: "pointer",
        }}
      >
        <Box sx={{ color: "primary.main", fontSize: 14, fontWeight: "500" }}>
          {item.name}
        </Box>
        {item.big && (
          <Icon fontSize="small" color="action" sx={{ ml: 0.5 }}>
            inventory
          </Icon>
        )}
        {item.outside && (
          <Icon fontSize="small" color="action" sx={{ ml: 0.5 }}>
            park
          </Icon>
        )}
        {!item.enabled && (
          <Icon fontSize="small" color="error" sx={{ ml: 0.5 }}>
            construction
          </Icon>
        )}
      </Box>
    </Link>
  );
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
  outside_air: string;
  age: number;
}

export function ItemList() {
  const { account } = useAccount();
  const [filter, setFilter] = useState<ItemListFilters>({
    text: "",
    outside_air: "",
    age: 99,
  });
  const { items, isLoading } = useItems();
  const [topIndex, setTopIndex] = useSessionStorage<number>("topItemIndex", 0);

  if (isLoading) return <div>Loading</div>;
  if (!items) return <div>Empty</div>;

  // Filtering
  let displayed = items;
  if (filter) {
    if (filter.text) {
      const lw_filter = filter.text.toLowerCase();
      displayed = items.filter(
        (i) =>
          i.name.toLowerCase().includes(lw_filter) ||
          i.id.toString().includes(lw_filter),
      );
    }
    if (filter.outside_air == "big") {
      displayed = displayed.filter((i) => i.big);
    }
    if (filter.outside_air == "outside") {
      displayed = displayed.filter((i) => i.outside);
    }
    if (filter.age != 99) {
      displayed = displayed.filter((i) => i.age == filter.age);
    }
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
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter({ ...filter, text: event.target.value });
          }}
          sx={{ flexGrow: 1, backgroundColor: "white", maxWidth: "500px" }}
        />

        {/* Select kind of game (outside/big) */}
        <Select
          size="small"
          sx={{
            height: "40px",
            ml: 1,
            pt: 1,
            maxWidth: "66px",
            backgroundColor: "white",
          }}
          displayEmpty
          defaultValue=""
          onChange={(event) =>
            setFilter({ ...filter, outside_air: event.target.value as string })
          }
        >
          <MenuItem value="">--</MenuItem>
          <MenuItem dense value="outside">
            <Icon fontSize="small" color="action">
              park
            </Icon>
          </MenuItem>
          <MenuItem dense value="big">
            <Icon fontSize="small" color="action">
              inventory
            </Icon>
          </MenuItem>
        </Select>

        {/* Select Age */}
        <Select
          size="small"
          sx={{
            height: "40px",
            ml: 1,
            backgroundColor: "white",
          }}
          defaultValue={99}
          onChange={(event) =>
            setFilter({ ...filter, age: event.target.value as number })
          }
        >
          <MenuItem dense value="99">
            --
          </MenuItem>
          {[0, 2, 4, 6, 8, 10].map((i) => (
            <MenuItem dense key={i} value={i}>
              <AgeChip age={i} />
            </MenuItem>
          ))}
        </Select>

        {/* Export CSV */}
        {account?.role == "admin" && (
          <>
            <Box
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            ></Box>

            <Tooltip
              title="Exporter en CSV"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              <IconButton color="primary" onClick={exportCSV}>
                <Icon fontSize="medium">file_download</Icon>
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      <TableVirtuoso
        style={{ height: "100%" }}
        data={displayed}
        components={TableComps}
        initialTopMostItemIndex={topIndex}
        rangeChanged={(range) => {
          setTopIndex(range.startIndex);
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
              sx={{ width: "clamp(56px, 10vw, 90px)", textAlign: "right" }}
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
