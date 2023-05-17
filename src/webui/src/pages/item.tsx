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

interface ItemProps {
  id: number;
}

function displayStatus(item: ItemModel) {
  if (item?.status == "in") return "Disponible";
  if (item?.status == "out") {
    const ret = new Date(item.return);
    return `Retour le ${ret.toLocaleDateString()}`;
  }
  return "Inconnu";
}

export function Item(props: ItemProps) {
  const { item, error, isLoading } = useItem(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!item) return <div>Server error...</div>;

  // render data
  return (
    <>
      <Box
        component="img"
        sx={{
          width: "100vw",
          maxHeight: "40vh",
          objectFit: "cover",
        }}
        src={"/img/" + (item.picture || "notavailable.png")}
      />
      <Box sx={{ p: 1 }}>
        <Typography component="div" variant="h4">
          {item.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" component="div">
          {item.description}
        </Typography>
        <TableContainer sx={{ pt: 2 }}>
          <Table size="small">
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>{displayStatus(item)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Joueurs</TableCell>
              <TableCell>
                {item.players_min} - {item.players_max}
              </TableCell>
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
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
