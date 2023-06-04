import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { AgeChip } from "../components/age_chip";
import { ItemModel } from "../api/models";
import Fab from "@mui/material/Fab";
import Icon from "@mui/material/Icon";
import { Link } from "wouter";

interface ItemProps {
  id: number;
}

function displayStatus(item: ItemModel) {
  if (item?.status == "in") {
    return "Disponible";
  }
  if (item?.status == "out") {
    if (!item?.return) {
      return "Emprunté";
    }
    const ret = new Date(item.return);
    return `Retour le ${ret.toLocaleDateString()}`;
  }
  return "Inconnu";
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

export function Item(props: ItemProps) {
  const { item, error } = useItem(props.id);

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  // render data
  return (
    <>
      <Box
        component="img"
        sx={{
          width: "100%",
          height: "40vh",
          objectFit: "contain",
        }}
        src={"/storage/img/" + (item.picture || "notavailable.png")}
      />
      <Typography
        variant="h5"
        textAlign="center"
        fontWeight="medium"
        sx={{ p: 2 }}
      >
        {item.name}
      </Typography>
      {item.description && (
        <Typography
          variant="subtitle1"
          color="text.secondary"
          component="div"
          style={{ whiteSpace: "pre-line" }}
          sx={{ p: 1 }}
        >
          {item.description}
        </Typography>
      )}

      {/* Item details */}
      <Box sx={{ p: 1 }}>
        <TableContainer sx={{ pt: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>{displayStatus(item)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Joueurs</TableCell>
                <TableCell>{playerDisplay(item)}</TableCell>
              </TableRow>
              {item.age !== undefined && (
                <TableRow>
                  <TableCell>Age (A partir de)</TableCell>
                  <TableCell>
                    <AgeChip age={item.age} />
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>Numéro d'inventaire</TableCell>
                <TableCell>{item.id}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Loan history */}
      {item?.loans?.length && (
        <div>
          Emprunts:
          <br />
          {item.loans.map((i) => (
            <span>
              {i.start} ➜ {i.stop}
              <br />
            </span>
          ))}
        </div>
      )}

      {/* Edit button */}
      <Link href={`/items/${item.id}/edit`}>
        <Fab
          color="primary"
          aria-label="edit"
          sx={{
            position: "fixed",
            bottom: (theme) => theme.spacing(2),
            right: (theme) => theme.spacing(2),
          }}
        >
          <Icon>edit</Icon>
        </Fab>
      </Link>
    </>
  );
}
