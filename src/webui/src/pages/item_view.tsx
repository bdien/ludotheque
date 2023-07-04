import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useAccount, useItem } from "../api/hooks";
import { AgeChip } from "../components/age_chip";
import { ItemModel } from "../api/models";
import Icon from "@mui/material/Icon";
import { Link, useLocation } from "wouter";
import TableHead from "@mui/material/TableHead";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { SpeedDialIcon } from "@mui/material";

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
  const { account } = useAccount();
  const { item, error } = useItem(props.id);
  const [_location, navigate] = useLocation();

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
        src={
          item.pictures?.length
            ? `/storage/img/${item.pictures[0]}`
            : "/notavailable.png"
        }
      />
      <Typography
        variant="h5"
        textAlign="center"
        fontWeight="medium"
        sx={{ p: 2 }}
      >
        {item.name}
      </Typography>

      {/* Description */}
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

      {/* Contenu */}
      {item.content && (
        <Box border="1px solid #E5E5E5" borderRadius="10px">
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="div"
            style={{ whiteSpace: "pre-line" }}
            sx={{ p: 1 }}
          >
            Contenu:
            <ul>
              {item.content.map((row) => (
                <li>{row}</li>
              ))}
            </ul>
          </Typography>
        </Box>
      )}

      {/* Item details */}
      <Box sx={{ p: 1 }}>
        <TableContainer sx={{ pt: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>
                  {displayStatus(item)}
                  {item.loans?.length && (
                    <>
                      <span> (</span>
                      <Link href={`/users/${item.loans[0].user?.id}`}>
                        {item.loans[0].user?.name}
                      </Link>
                      )
                    </>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Joueurs</TableCell>
                <TableCell>{playerDisplay(item)}</TableCell>
              </TableRow>
              {item.gametime && (
                <TableRow>
                  <TableCell>Temps d'une partie</TableCell>
                  <TableCell>{item.gametime} minutes</TableCell>
                </TableRow>
              )}
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
        <Box sx={{ p: 1, pt: 2 }}>
          Emprunts:
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Adhérent</TableCell>
                  <TableCell>Début</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Durée</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.loans.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.user?.name}</TableCell>
                    <TableCell>{i.start}</TableCell>
                    <TableCell>{i.stop}</TableCell>
                    <TableCell>
                      {i.status == "out"
                        ? "En cours"
                        : `${
                            (new Date(i.stop).valueOf() -
                              new Date(i.start).valueOf()) /
                            (3600000 * 24)
                          } jours`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Edit button */}
      {account?.role == "admin" && (
        <SpeedDial
          ariaLabel="Actions"
          sx={{
            position: "fixed",
            bottom: (theme) => theme.spacing(2),
            right: (theme) => theme.spacing(2),
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            key="edit"
            tooltipOpen={true}
            icon={<Icon>edit</Icon>}
            tooltipTitle="Edition"
            onClick={() => navigate(`/items/${item.id}/edit`)}
          />

          {item.status == "out" ? (
            <SpeedDialAction
              key="rendre"
              tooltipOpen={true}
              icon={<Icon>file_download</Icon>}
              tooltipTitle="Rendre"
              onClick={() =>
                navigate(`/loans/${item.loans ? item.loans[0].id : 0}/close`)
              }
            />
          ) : (
            <SpeedDialAction
              key="emprunter"
              tooltipOpen={true}
              icon={<Icon>file_upload</Icon>}
              tooltipTitle="Emprunter"
              onClick={() => alert("TODO")}
            />
          )}
        </SpeedDial>
      )}
    </>
  );
}
