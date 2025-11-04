import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useCategories, useItem, useUser } from "../api/hooks";
import { useGlobalStore } from "../hooks/global_store";
import { AgeChip } from "../components/age_chip";
import { ItemLinkModel, ItemModel, Loan } from "../api/models";
import Icon from "@mui/material/Icon";
import { navigate } from "wouter/use-browser-location";
import TableHead from "@mui/material/TableHead";
import {
  AccordionDetails,
  Accordion,
  styled,
  Paper,
  IconButton,
  Alert,
} from "@mui/material";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import ReactMarkdown from "react-markdown";
import { ShortUser } from "../components/short_user";
import EmblaCarousel from "../components/EmblaCarousel";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { favItem, unfavItem } from "../api/calls";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

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

function loan_time(i: Loan) {
  if (i.status == "in") return differenceInDays(i.stop, i.start);
  return differenceInDays(new Date(), i.start);
}

function nb_loans_percent(item: ItemModel, maxdays: number) {
  if (!item.loans) return 0;

  // Compute start date (with item creation date)
  let start_date = new Date();
  start_date.setDate(start_date.getDate() - maxdays);
  if (item.created_at) {
    const item_created_at = new Date(item.created_at);
    if (start_date < item_created_at) start_date = item_created_at;
  }

  // Number of days for the comparison
  const nbdays = differenceInDays(new Date(), start_date);
  if (nbdays == 0) return 100;

  // Add time for loans within the time frame
  const local_loans = item.loans.filter((i) => new Date(i.start) >= start_date);
  const loan_times = local_loans.reduce((a, i) => a + loan_time(i), 0);

  return Math.round((100 * loan_times) / nbdays);
}

function renderItemLink(link: ItemLinkModel) {
  let rating = link.extra?.rating;
  if (link.name == "myludo")
    return (
      <Chip
        key={link.name}
        sx={{ p: 1, m: 0.25, borderRadius: "8px" }}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>link</Icon>}
        label={"MyLudo" + (rating ? ` (${rating.toFixed(1)})` : "")}
        onClick={() =>
          window.open(`https://www.myludo.fr/#!/game/${link.ref}`, "_blank")
        }
      />
    );
  if (link.name == "bgg")
    return (
      <Chip
        key={link.name}
        sx={{ p: 1, m: 0.25, borderRadius: "8px" }}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>link</Icon>}
        label={"BGG" + (rating ? ` (${rating.toFixed(1)})` : "")}
        onClick={() =>
          window.open(
            `https://boardgamegeek.com/boardgame/${link.ref}`,
            "_blank",
          )
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
  if (!item?.enabled) {
    return <Chip label="Retiré de l'emprunt" color="error" />;
  }
  if (item?.status == "in") {
    return <Chip label="Disponible" color="success" />;
  }
  if (item?.status == "out") {
    if (!item?.return) {
      return <Chip label="Emprunté" color="primary" />;
    }
    const ret = new Date(item.return);
    return (
      <Chip
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

function displayPlayer(item: ItemModel) {
  let txt = item.players_min?.toString();
  if (item.players_max == 99) txt += "+";
  else if (item.players_min != item.players_max)
    txt += "-" + item.players_max?.toString();
  return <Chip sx={{ mx: "5px" }} icon={<Icon>people_alt</Icon>} label={txt} />;
}

function displayGametime(item: ItemModel) {
  if (!item.gametime) return <></>;
  return (
    <Chip
      sx={{ mx: "5px" }}
      icon={<Icon>schedule</Icon>}
      label={item.gametime}
    />
  );
}

export function Item(props: ItemProps) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  const { account } = useGlobalStore();
  const { user, mutate: mutateUser } = useUser(account.id);
  const { item, error } = useItem(props.id);
  const { categories } = useCategories();

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  function changeFav(item_id: number, isFav: boolean) {
    let promise = favItem;
    if (isFav) promise = unfavItem;

    promise(item_id).then(() => {
      if (mutateUser) mutateUser();
    });
  }

  const ownLoans = item.loans
    ? item.loans.filter((i) => i.user == account.id)
    : [];

  const isFav = user?.favorites.indexOf(item.id) != -1;

  const pictures = item.pictures?.length
    ? item.pictures
    : ["../../notavailable.webp"];

  // Reset scroll position
  window.scrollTo(0, 0);

  // render data
  return (
    <>
      {/* Actions floating box */}
      <Box
        sx={{
          position: "absolute",
          right: "10px",
          zIndex: 2,
          display: "flex",
          flexDirection: desktop ? "row" : "column-reverse",
        }}
      >
        {(account?.role == "admin" || account?.role == "benevole") && (
          <>
            {/* Loan button */}
            {item.status == "out" ? (
              <IconButton
                sx={{ fontSize: "1.5em" }}
                title="Rendre"
                onClick={() =>
                  navigate(
                    `/loans/${item.loans ? item.loans[0].id : 0}/close?return=${
                      window.location.pathname
                    }`,
                  )
                }
              >
                <Icon sx={{ fontSize: "1.5em", textShadow: "0 0 3px white" }}>
                  login
                </Icon>
              </IconButton>
            ) : (
              <IconButton
                sx={{ fontSize: "1.5em" }}
                title="Emprunter"
                onClick={() => navigate(`/loans/new?item=${item.id}`)}
              >
                <Icon sx={{ fontSize: "1.5em", textShadow: "0 0 3px white" }}>
                  logout
                </Icon>
              </IconButton>
            )}

            {/* Edit Button */}
            <IconButton
              sx={{ fontSize: "1.5em" }}
              aria-label="edit"
              title="Editer"
              onClick={() => navigate(`/items/${item.id}/edit`)}
            >
              <Icon sx={{ fontSize: "1.5em", textShadow: "0 0 3px white" }}>
                edit
              </Icon>
            </IconButton>
          </>
        )}

        {/* Favorite button */}
        {user && user.id != 0 && (
          <IconButton onClick={() => changeFav(item.id, isFav)}>
            <Icon sx={{ fontSize: "1.5em", textShadow: "0 0 3px white" }}>
              {isFav ? "favorite" : "favorite_outline"}
            </Icon>
          </IconButton>
        )}

        {/* Share button */}
        {navigator.share && (
          <IconButton
            sx={{ fontSize: "1.5em" }}
            aria-label="share"
            title="Partager"
            onClick={() => {
              navigator
                .share({ url: window.location.href, title: item.name })
                .catch((e) => console.warn(e.message));
            }}
          >
            <Icon sx={{ fontSize: "1.5em", textShadow: "0 0 3px white" }}>
              share
            </Icon>
          </IconButton>
        )}
      </Box>

      <Box display="flex" sx={{ height: "clamp(200px, 35vh, 550px)" }}>
        <EmblaCarousel
          slides={pictures.map((item, i) => (
            <Box
              component="img"
              className="embla__slide"
              sx={{
                objectFit: "contain",
                filter: "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
              }}
              key={i}
              src={`/storage/img/${item}`}
            />
          ))}
        />
      </Box>
      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        className="item-view-title"
        sx={{
          p: 1,
          filter: "drop-shadow(0px 3px 4px rgba(100,100,100,0.3))",
        }}
      >
        {item.name} ({item.id})
      </Typography>

      <Box sx={{ textAlign: "center", flex: 1, marginBottom: "8px" }}>
        {displayStatus(item)}
      </Box>
      <Box sx={{ textAlign: "center", flex: 1, marginBottom: "8px" }}>
        {displayPlayer(item)}
        {displayGametime(item)}
        {item.age !== undefined ? (
          <AgeChip icon="cake" size="medium" age={item.age} />
        ) : (
          ""
        )}
      </Box>

      {(item.description ||
        (item.categories && item.categories?.length > 0) ||
        (item.links && item.links?.length > 0)) && (
        <Box component={Paper} sx={{ px: 2, py: 1, mb: 1 }}>
          {/* Dernier emprunt */}
          {ownLoans.length > 0 && (
            <Alert>
              Vous avez emprunté ce jeu{" "}
              {formatDistanceToNow(ownLoans[0].start, {
                locale: fr,
                addSuffix: true,
              })}{" "}
            </Alert>
          )}

          {/* Description */}
          {item.description && (
            <ReactMarkdown>{item.description}</ReactMarkdown>
          )}

          {/* Categories / Link */}
          {(item.categories || item.links) && (
            <Box>
              {item.links && item.links.map((lnk) => renderItemLink(lnk))}
              {item.categories &&
                categories &&
                item.categories.map((cat) => (
                  <Chip
                    key={cat}
                    sx={{ p: 1, m: 0.25, borderRadius: "8px" }}
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
      {item.notes && (
        <Box sx={{ pt: 2, pb: 1 }}>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "primary.main" }}>Notes</TableCell>
                  <TableCell>{item.notes}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Bookings */}
      {item?.bookings?.entries?.length ? (
        <Accordion>
          <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
            {item?.bookings?.entries?.length} réservation
            {item?.bookings?.entries?.length > 1 ? "s" : ""}
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {item?.bookings?.entries.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ width: "120px", m: 0 }}>
                        {new Date(i.start).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <ShortUser user_id={i.user} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ) : (
        ""
      )}

      {/* Loan history */}
      {item?.loans?.length ? (
        <Accordion>
          <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
            Emprunts ({nb_loans_percent(item, 365)}% du temps cette année)
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
                        {account.id == i.user ? (
                          <Link
                            href={`/users/${i.user}`}
                            style={{ textDecoration: "none" }}
                          >
                            Vous
                          </Link>
                        ) : (
                          <ShortUser user_id={i.user} />
                        )}
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
      ) : (
        ""
      )}
    </>
  );
}
