import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useAccount, useCategories, useItem } from "../api/hooks";
import { AgeChip } from "../components/age_chip";
import { ItemLinkModel, ItemModel } from "../api/models";
import Icon from "@mui/material/Icon";
import { Link, useLocation } from "wouter";
import TableHead from "@mui/material/TableHead";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import { SpeedDialIcon } from "@mui/material";
import Chip from "@mui/material/Chip";

interface ItemProps {
  id: number;
}

function renderItemLink(link: ItemLinkModel) {
  if (link.name == "myludo")
    return (
      <Chip
        key={link.name}
        sx={{ p: 1, mr: 0.5, borderRadius: "8px" }}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>link</Icon>}
        label="MyLudo"
        onClick={() =>
          window.open(`https://www.myludo.fr/#!/game/${link.ref}`, "_blank")
        }
      />
    );
  if (link.name == "manuel")
    return (
      <Chip
        key={link.name}
        sx={{ p: 1, mr: 0.5, borderRadius: "8px" }}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>book</Icon>}
        label="Règles"
        onClick={() => window.open(link.ref, "_blank")}
      />
    );
  return <></>;
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
  const { categories } = useCategories();
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
            : "/notavailable.webp"
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

      {/* Categories / Link */}
      {(item.categories || item.links) && (
        <Box sx={{ pb: 1 }}>
          {item.links && item.links.map((lnk) => renderItemLink(lnk))}
          {item.categories &&
            categories &&
            item.categories.map((cat) => (
              <Chip
                key={cat}
                sx={{ p: 1, mr: 0.5, borderRadius: "8px" }}
                color="primary"
                size="small"
                icon={<Icon>category</Icon>}
                label={categories.get(cat)}
              />
            ))}
        </Box>
      )}

      {/* Contenu */}
      {item.content && item.content.length > 0 && (
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
              {item.content.map((row, idx) => (
                <li key={idx}>{row}</li>
              ))}
            </ul>
          </Typography>
        </Box>
      )}

      {/* Item details */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>
                  {displayStatus(item)}
                  {item.status == "out" && item.loans?.length && (
                    <>
                      <br />
                      <Link href={`/users/${item.loans[0].user?.id}`}>
                        {item.loans[0].user?.name}
                      </Link>
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
        <Box sx={{ pb: 1, pt: 2 }}>
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
                    <TableCell>
                      {new Date(i.start).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(i.stop).toLocaleDateString()}
                    </TableCell>
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
                navigate(
                  `/loans/${item.loans ? item.loans[0].id : 0}/close?return=${
                    window.location.pathname
                  }`,
                )
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
