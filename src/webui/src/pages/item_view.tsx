import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useCategories, useItem } from "../api/hooks";
import { useGlobalStore } from "../hooks/global_store";
import { ageColors } from "../components/age_chip";
import { ItemLinkModel, ItemModel, APILoan } from "../api/models";
import Icon from "@mui/material/Icon";
import { navigate } from "wouter/use-browser-location";
import TableHead from "@mui/material/TableHead";
import {
  AccordionDetails,
  Accordion,
  styled,
  Paper,
  Divider,
  Stack,
  Fab,
} from "@mui/material";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import ReactMarkdown from "react-markdown";
import { ShortUser } from "../components/short_user";
import EmblaCarousel from "../components/EmblaCarousel";
import { differenceInDays, formatDistanceToNow, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Rating from "@mui/material/Rating";
import { useState, useRef, useEffect } from "react";

interface ItemProps {
  id: number;
}

/* ── Styled components ──────────────────────────────────────── */
const Section = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: "16px !important",
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  "&::before": { display: "none" },
  marginBottom: theme.spacing(1.5),
  overflow: "hidden",
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary {...props} />
))(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  minHeight: 48,
  fontWeight: 600,
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(0.5),
    alignItems: "center",
    gap: theme.spacing(1),
  },
}));

/* ── Helpers ─────────────────────────────────────────────────── */
function formatRelativeTime(date: Date | string | number) {
  if (isToday(new Date(date))) {
    return "aujourd'hui";
  }
  return formatDistanceToNow(new Date(date), {
    locale: fr,
    addSuffix: true,
  });
}

function loan_time(i: APILoan) {
  if (i.status == "in") return differenceInDays(i.stop, i.start);
  return differenceInDays(new Date(), i.start);
}

function nb_loans_percent(item: ItemModel, maxdays: number) {
  if (!item.loans) return 0;
  let start_date = new Date();
  start_date.setDate(start_date.getDate() - maxdays);
  if (item.created_at) {
    const item_created_at = new Date(item.created_at);
    if (start_date < item_created_at) start_date = item_created_at;
  }
  const nbdays = differenceInDays(new Date(), start_date);
  if (nbdays == 0) return 100;
  const local_loans = item.loans.filter((i) => new Date(i.start) >= start_date);
  const loan_times = local_loans.reduce((a, i) => a + loan_time(i), 0);
  return Math.round((100 * loan_times) / nbdays);
}

function calculateItemScore(item: ItemModel) {
  const item_score = item.links?.reduce(
    (acc, link) => {
      const r = link.extra?.rating;
      if (r != null) {
        acc.sum += r;
        acc.count += 1;
      }
      return acc;
    },
    { sum: 0, count: 0 },
  ) ?? { sum: 0, count: 0 };

  // Rating between 0 and 10
  const avgRating =
    item_score.count > 0 ? item_score.sum / item_score.count : null;

  // Scale linearly: below 3 → 0, above 8.5 → 5
  if (avgRating === null) return null;
  return Math.max(0, Math.min(5, ((avgRating - 3) / (8.5 - 3)) * 5));
}

function renderComplexityChip(complexity: number) {
  const [color, text] =
    complexity < 1.3
      ? ["success" as const, "Facile à jouer"]
      : complexity <= 2
        ? ["info" as const, "Rapide à comprendre"]
        : complexity <= 3
          ? ["info" as const, "Un peu complexe"]
          : complexity <= 4
            ? ["warning" as const, "Mécanique complexe"]
            : ["error" as const, "Règles difficiles"];
  return (
    <Chip
      icon={<Icon>school</Icon>}
      sx={{ borderRadius: "20px" }}
      size="small"
      variant="outlined"
      color={color}
      label={text}
    />
  );
}

function renderItemLink(link: ItemLinkModel) {
  const rating = link.extra?.rating;
  const sx = { borderRadius: "20px" };
  if (link.name == "myludo")
    return (
      <Chip
        key={link.name}
        sx={sx}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>link</Icon>}
        clickable
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
        sx={sx}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>link</Icon>}
        clickable
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
        sx={sx}
        variant="outlined"
        color="primary"
        size="small"
        icon={<Icon>menu_book</Icon>}
        label="Règles"
        clickable
        onClick={() => window.open(link.ref, "_blank")}
      />
    );
  return <></>;
}

function displayPlayersText(item: ItemModel) {
  let txt = item.players_min?.toString() ?? "";
  if (item.players_max == 99) txt += "+";
  else if (item.players_min != item.players_max)
    txt += " – " + item.players_max?.toString();
  return txt;
}

/* ── Status badge ────────────────────────────────────────────── */
function StatusBadge({ item }: { item: ItemModel }) {
  const available = item?.enabled && item?.status === "in";
  const color = available ? "success.main" : "text.secondary";
  const icon = available ? "check_circle" : "cancel";
  let label = available ? "Disponible" : "Indisponible";
  if (!item?.enabled) label = "Retiré";
  else if (item?.status === "out" && item?.return)
    label = `Retour le ${new Date(item.return).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`;
  else if (item?.status === "out") label = "Emprunté";

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Icon sx={{ fontSize: "1rem", color }}>{icon}</Icon>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontSize: "0.8rem", color }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

/* ── Quick‑stat item for the metadata row ────────────────────── */
function QuickStat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 56 }}>
      <Icon sx={{ fontSize: "1.3rem", color: "primary.main" }}>{icon}</Icon>
      <Typography variant="body2" fontWeight={700} lineHeight={1}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" lineHeight={1}>
        {label}
      </Typography>
    </Stack>
  );
}

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════ */
export function Item(props: ItemProps) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  const { account } = useGlobalStore();
  const { item, error } = useItem(props.id);
  const { categories } = useCategories();
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) setDescOverflows(el.scrollHeight > el.clientHeight);
  }, [item?.description]);

  if (error) return <div>Server error: {error.cause}</div>;
  if (!item) return <></>;

  const ownLoans = item.loans
    ? item.loans.filter((i) => i.user == account.id)
    : [];
  const pictures = item.pictures?.length
    ? item.pictures
    : ["../../notavailable.webp"];
  const bgg_link = item.links?.find((i) => i.name === "bgg");

  // Calculate item score
  const itemScore = calculateItemScore(item);

  window.scrollTo(0, 0);

  const hasTags =
    item.categories?.length ||
    item.links?.length ||
    bgg_link?.extra?.complexity;

  /* ── Shared FAB style ─────────────────────────────────────── */
  const fabSx = {
    bgcolor: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    "&:hover": { bgcolor: "rgba(255,255,255,0.96)" },
  };

  // ── render ────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 4, position: "relative" }}>
      {/* ── Floating actions (top‑right, page‑level) ─────── */}
      <Stack
        direction={desktop ? "row" : "column-reverse"}
        spacing={1}
        sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
      >
        {account?.rights.includes("loan_manage") && item.status == "out" && (
          <Fab
            size="small"
            title="Rendre"
            sx={fabSx}
            onClick={() => {
              window.umami?.track("FicheJeu: Rendre");
              navigate(
                `/loans/${item.loans ? item.loans[0].id : 0}/close?return=${window.location.pathname}`,
              );
            }}
          >
            <Icon>login</Icon>
          </Fab>
        )}
        {account?.rights.includes("loan_create") && item.status == "in" && (
          <Fab
            size="small"
            title="Emprunter"
            sx={fabSx}
            onClick={() => {
              window.umami?.track("FicheJeu: Emprunter");
              navigate(`/loans/new?item=${item.id}`);
            }}
          >
            <Icon>logout</Icon>
          </Fab>
        )}
        {account?.rights.includes("item_manage") && (
          <Fab
            size="small"
            title="Editer"
            sx={fabSx}
            onClick={() => {
              window.umami?.track("FicheJeu: Editer");
              navigate(`/items/${item.id}/edit`);
            }}
          >
            <Icon>edit</Icon>
          </Fab>
        )}
        {navigator.share && (
          <Fab
            size="small"
            title="Partager"
            sx={fabSx}
            onClick={() => {
              window.umami?.track("FicheJeu: Partager");
              navigator
                .share({ url: window.location.href, title: item.name })
                .catch((e) => console.warn(e.message));
            }}
          >
            <Icon>share</Icon>
          </Fab>
        )}
      </Stack>

      {/* ── Image carousel ──────────────────────────────── */}
      <Box sx={{ height: "clamp(200px, 38vh, 480px)", mb: 2 }}>
        <EmblaCarousel
          slides={pictures.map((pic, i) => (
            <Box
              component="img"
              className="embla__slide"
              sx={{
                objectFit: "contain",
                maxHeight: "100%",
                filter: "drop-shadow(3px 6px 8px rgba(0,0,0,0.18))",
              }}
              key={i}
              src={`/storage/img/${pic}`}
            />
          ))}
        />
      </Box>

      {/* ── Main info card ─────────────────────────────────── */}
      <Section>
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            mb: 2,
          }}
        >
          {/* Title + Status */}
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              flexWrap="nowrap"
            >
              <Typography
                variant={desktop ? "h4" : "h5"}
                fontWeight={800}
                sx={{
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  color: "primary.dark",
                }}
              >
                {item.name}
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: ageColors(item.age)[0],
                  border: "1.5px solid rgba(0,0,0,0.12)",
                  borderRadius: "10px",
                  px: 1,
                  py: 0.5,
                  minWidth: 36,
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: desktop ? "1.1rem" : "0.95rem",
                    color: ageColors(item.age)[1],
                    lineHeight: 1,
                  }}
                >
                  {item.id}
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 0.5 }}
            >
              <StatusBadge item={item} />
              {itemScore !== null && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Rating
                    value={itemScore}
                    precision={0.5}
                    size="small"
                    readOnly
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {itemScore.toFixed(1)}
                  </Typography>
                </Stack>
              )}
            </Stack>
            {ownLoans.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ mt: 0.75 }}
              >
                <Icon sx={{ fontSize: "0.95rem", color: "info.main" }}>
                  info_outline
                </Icon>
                <Typography
                  variant="caption"
                  color="info.main"
                  sx={{ fontWeight: 500 }}
                >
                  Vous avez emprunté ce jeu{" "}
                  {formatRelativeTime(ownLoans[0].start)}
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Quick stats strip */}
          <Divider />
          <Stack direction="row" justifyContent="space-evenly" sx={{ py: 1.5 }}>
            <QuickStat
              icon="people_alt"
              value={displayPlayersText(item)}
              label="joueurs"
            />
            {item.gametime ? (
              <QuickStat
                icon="schedule"
                value={`${item.gametime}`}
                label="minutes"
              />
            ) : null}
            {item.age !== undefined ? (
              <QuickStat icon="cake" value={`${item.age}+`} label="ans" />
            ) : null}
          </Stack>

          {/* Description */}
          {item.description && (
            <>
              <Divider />
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  pt: 2,
                  pb: 0.5,
                  position: "relative",
                }}
              >
                <Box
                  ref={descRef}
                  sx={{
                    ...(!descExpanded && {
                      maxHeight: "6.5em",
                      overflow: "hidden",
                    }),
                    ...(!descExpanded &&
                      descOverflows && {
                        maskImage:
                          "linear-gradient(to bottom, black 60%, transparent 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, black 60%, transparent 100%)",
                      }),
                    "& p": {
                      mt: 0,
                      mb: 1,
                      lineHeight: 1.7,
                      color: "text.secondary",
                      fontSize: "0.92rem",
                    },
                    "& p:last-child": { mb: 0 },
                  }}
                >
                  <ReactMarkdown>{item.description}</ReactMarkdown>
                </Box>
                {descOverflows && (
                  <Box sx={{ textAlign: "center", pb: 0.5 }}>
                    <Typography
                      component="button"
                      variant="caption"
                      onClick={() => setDescExpanded((v) => !v)}
                      sx={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "primary.main",
                        fontWeight: 600,
                        p: 0.5,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {descExpanded ? "Voir moins" : "Voir plus"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* Tags row: complexity · links · categories */}
          {hasTags && (
            <>
              <Divider />
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.75}
                sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}
              >
                {bgg_link?.extra?.complexity &&
                  renderComplexityChip(bgg_link.extra.complexity)}
                {item.links && item.links.map((lnk) => renderItemLink(lnk))}
                {item.categories &&
                  categories &&
                  item.categories.map((cat) => (
                    <Chip
                      key={cat}
                      sx={{ borderRadius: "20px" }}
                      color="primary"
                      size="small"
                      icon={<Icon>category</Icon>}
                      label={categories.get(cat)}
                    />
                  ))}
              </Stack>
            </>
          )}
        </Paper>
      </Section>

      {/* ── Notes ───────────────────────────────────────────── */}
      {item.notes && (
        <Section>
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              px: 2,
              py: 1.5,
              borderRadius: "16px",
              bgcolor: "rgba(85,108,214,0.05)",
              border: "1px solid rgba(85,108,214,0.12)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Icon
                sx={{ color: "primary.main", fontSize: "1.15rem", mt: "3px" }}
              >
                sticky_note_2
              </Icon>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                {item.notes}
              </Typography>
            </Stack>
          </Paper>
        </Section>
      )}

      {/* ── Game contents ───────────────────────────────────── */}
      {item.content && item.content.length > 0 && (
        <Section>
          <StyledAccordion>
            <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
              <Icon sx={{ color: "text.secondary", fontSize: "1.2rem" }}>
                inventory_2
              </Icon>
              <Typography fontWeight={600} variant="body2">
                Contenu du jeu
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, py: 1.5 }}>
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2.5,
                  "& li": {
                    color: "text.secondary",
                    fontSize: "0.9rem",
                    py: 0.25,
                  },
                }}
              >
                {item.content.map((row, idx) => (
                  <li key={idx}>{row}</li>
                ))}
              </Box>
            </AccordionDetails>
          </StyledAccordion>
        </Section>
      )}

      {/* ── Bookings ────────────────────────────────────────── */}
      {item?.bookings?.entries?.length ? (
        <Section>
          <StyledAccordion>
            <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
              <Icon sx={{ color: "text.secondary", fontSize: "1.2rem" }}>
                bookmark
              </Icon>
              <Typography fontWeight={600} variant="body2">
                {item.bookings.entries.length} réservation
                {item.bookings.entries.length > 1 ? "s" : ""}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {item.bookings.entries.map((i, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ width: "120px" }}>
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
          </StyledAccordion>
        </Section>
      ) : null}

      {/* ── Loan history ────────────────────────────────────── */}
      {item?.loans?.length ? (
        <Section>
          <StyledAccordion>
            <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
              <Icon sx={{ color: "text.secondary", fontSize: "1.2rem" }}>
                history
              </Icon>
              <Typography fontWeight={600} variant="body2">
                {account.role === "admin" ? (
                  <>
                    Emprunts ({nb_loans_percent(item, 365)}% du temps cette
                    année)
                  </>
                ) : (
                  "Vos emprunts"
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {account.role === "admin" && (
                        <TableCell sx={{ fontWeight: 600 }}>Adhérent</TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 600 }}>Début</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Fin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.loans.map((i) => (
                      <TableRow key={i.id}>
                        {account.role === "admin" && (
                          <TableCell>
                            {account.id == i.user ? (
                              <Link
                                href={`/users/${i.user}`}
                                style={{ textDecoration: "none" }}
                              >
                                Vous
                              </Link>
                            ) : i.user ? (
                              <ShortUser user_id={i.user} />
                            ) : (
                              "Inconnu"
                            )}
                          </TableCell>
                        )}
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
          </StyledAccordion>
        </Section>
      ) : null}
    </Box>
  );
}
