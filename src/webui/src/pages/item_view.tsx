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
import { navigate } from "wouter/use-browser-location";
import TableHead from "@mui/material/TableHead";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import {
  AccordionDetails,
  SpeedDialIcon,
  Accordion,
  styled,
  Paper,
} from "@mui/material";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import ReactMarkdown from "react-markdown";
import { ShortUser } from "../components/short_user";
import EmblaCarousel from "../components/EmblaCarousel";

interface ItemProps {
  id: number;
}

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary {...props} />
))(({ theme }) => ({
  backgroundColor: "#F9FBFC",
  flexDirection: "row-reverse",

  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

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
    return <Chip size="small" label="Disponible" color="success" />;
  }
  if (item?.status == "out") {
    if (!item?.return) {
      return <Chip size="small" label="Emprunté" color="success" />;
    }
    const ret = new Date(item.return);
    return (
      <Chip
        size="small"
        label={`Retour le ${ret.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}`}
        color="primary"
      />
    );
  }
  return "Inconnu";
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

export function Item(props: ItemProps) {
  const { account } = useAccount();
  const { item, error } = useItem(props.id);
  const { categories } = useCategories();

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;
  if (!item.pictures || item.pictures?.length == 0)
    item.pictures = new Array("");

  // Reset scroll position
  window.scrollTo(0, 0);

  // render data
  return (
    <>
      <Box display="flex" sx={{ height: "40vh", mb: 1 }}>
        <EmblaCarousel
          slides={item.pictures.map((item, i) => (
            <Box
              component="img"
              className="embla__slide"
              sx={{
                objectFit: "contain",
                filter: "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
              }}
              key={i}
              src={item ? `/storage/img/${item}` : "/notavailable.webp"}
            />
          ))}
        />
      </Box>
      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        sx={{
          p: 2,
          color: "primary.main",
          filter: "drop-shadow(0px 3px 4px rgba(100,100,100,0.3))",
        }}
      >
        {item.name}
      </Typography>

      {item.description && (
        <Box component={Paper} sx={{ p: 2, mb: 1 }}>
          {/* Description */}
          <ReactMarkdown>{item.description}</ReactMarkdown>

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
        </Box>
      )}

      {/* Contenu */}
      {item.content && item.content.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
            Contenu du jeu
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              component="div"
              style={{ whiteSpace: "pre-line" }}
              sx={{ pl: 1 }}
            >
              <ul>
                {item.content.map((row, idx) => (
                  <li key={idx}>{row}</li>
                ))}
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Item details */}
      <Box sx={{ pt: 2, pb: 1 }}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Status</TableCell>
                <TableCell>
                  {item.enabled ? (
                    <>
                      {displayStatus(item)}
                      {item.status == "out" && item.loans?.length && (
                        <>
                          <br />
                          <ShortUser user_id={item.loans[0].user} />
                        </>
                      )}{" "}
                    </>
                  ) : (
                    "Retiré de l'emprunt"
                  )}
                </TableCell>
              </TableRow>

              {item.rating && (
                <TableRow>
                  <TableCell sx={{ color: "primary.main" }}>Note</TableCell>
                  <TableCell>{item.rating}</TableCell>
                </TableRow>
              )}

              {item.notes && (
                <TableRow>
                  <TableCell sx={{ color: "primary.main" }}>Notes</TableCell>
                  <TableCell>{item.notes}</TableCell>
                </TableRow>
              )}

              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>Joueurs</TableCell>
                <TableCell>{playerDisplay(item)}</TableCell>
              </TableRow>

              {item.gametime && (
                <TableRow>
                  <TableCell sx={{ color: "primary.main" }}>
                    Temps d'une partie
                  </TableCell>
                  <TableCell>{item.gametime} minutes</TableCell>
                </TableRow>
              )}
              {item.age !== undefined && (
                <TableRow>
                  <TableCell sx={{ color: "primary.main" }}>
                    Age (A partir de)
                  </TableCell>
                  <TableCell>
                    <AgeChip age={item.age} />
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ color: "primary.main" }}>
                  Numéro d'inventaire
                </TableCell>
                <TableCell>{item.id}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Loan history */}
      {item?.loans?.length &&
        (item?.status != "out" || item?.loans?.length > 1) && (
          <Box sx={{ pb: 1 }}>
            <Accordion>
              <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                Historique des emprunts
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Adhérent</TableCell>
                        <TableCell>Début</TableCell>
                        <TableCell>Fin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.loans.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>
                            <ShortUser user_id={i.user} />
                          </TableCell>
                          <TableCell>
                            {new Date(i.start).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            {i.status == "out"
                              ? "En cours"
                              : new Date(i.stop).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

      {/* Edit button */}
      {(account?.role == "admin" || account?.role == "benevole") && (
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
              icon={<Icon>login</Icon>}
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
              icon={<Icon>logout</Icon>}
              tooltipTitle="Emprunter"
              onClick={() => navigate(`/loans/new?item=${item.id}`)}
            />
          )}
        </SpeedDial>
      )}
    </>
  );
}
