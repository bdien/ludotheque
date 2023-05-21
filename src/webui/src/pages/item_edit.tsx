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

interface ItemEditProps {
  id: number;
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

export function ItemEdit(props: ItemEditProps) {
  const { item, error } = useItem(props.id);

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  // render data
  return (
    <>
      Edit mode
      <Box
        component="img"
        sx={{
          width: "100vw",
          height: "40vh",
          objectFit: "cover",
        }}
        src={"/img/" + (item.picture || "notavailable.png")}
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
          sx={{ p: 1 }}
        >
          {item.description}
        </Typography>
      )}
      <Box sx={{ p: 1 }}>
        <TableContainer sx={{ pt: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>displayStatus(item)</TableCell>
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
    </>
  );
}
