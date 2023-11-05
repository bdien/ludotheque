import Box from "@mui/material/Box";
import { useLedger } from "../api/hooks";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { LedgerEntry } from "../api/models";
import { ShortUser } from "../components/short_user";
import { Loading } from "../components/loading";

function groupBy<T, K>(array: T[], keyFn: (item: T) => K) {
  const map = new Map<K, T[]>();

  array.forEach((item) => {
    const key = keyFn(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });

  return map;
}

function highlevelSummary(entries: LedgerEntry[]) {
  const summary = [];

  const adherentCount = entries.filter((e) => e.item_id === -1).length;
  if (adherentCount > 0) {
    summary.push(`${adherentCount} adhésion${adherentCount > 1 ? "s" : ""}`);
  }

  const carteCount = entries.filter((e) => e.item_id === -2).length;
  if (carteCount > 0) {
    summary.push(`${carteCount} carte${carteCount > 1 ? "s" : ""}`);
  }

  const itemCount = entries.filter((e) => e.item_id > 0).length;
  if (itemCount > 0) {
    summary.push(`${itemCount} jeu${itemCount > 1 ? "x" : ""}`);
  }

  return summary.join(", ");
}

function summary(entries: LedgerEntry[]) {
  const entriesByUser = groupBy(entries, (entry) => entry.user_id);

  return (
    <>
      {[...entriesByUser.keys()].map((userId) => {
        const userEntries = entriesByUser.get(userId)!;

        return (
          <TableRow key={userId}>
            <TableCell>
              <ShortUser user_id={userId} />
            </TableCell>

            <TableCell sx={{ textAlign: "right" }}>
              {summaryPerUser(userEntries)}
            </TableCell>

            <TableCell sx={{ textAlign: "right", fontWeight: 500 }}>
              {userEntries.reduce((total, entry) => total + entry.money, 0)}€
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function summaryPerUser(entries: LedgerEntry[]) {
  const summary = [];

  const adherentCount = entries.filter((e) => e.item_id === -1).length;
  if (adherentCount > 0) {
    summary.push("Adhésion");
  }

  const carteCount = entries.filter((e) => e.item_id === -2).length;
  if (carteCount > 0) {
    summary.push("Carte");
  }

  const itemCount = entries.filter((e) => e.item_id > 0).length;
  if (itemCount > 0) {
    summary.push(`${itemCount} jeu${itemCount > 1 ? "x" : ""}`);
  }

  return summary.join(", ");
}

function localeDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Ledger() {
  const { ledger } = useLedger();

  if (!ledger) return <Loading />;

  const ledgerByDay = groupBy(ledger, (entry) => entry.day);

  return (
    <Box>
      {[...ledgerByDay.keys()].map((date) => {
        const entries = ledgerByDay.get(date)!;
        const total = entries.reduce((sum, e) => sum + e.money, 0);

        return (
          <Accordion TransitionProps={{ unmountOnExit: true }} key={date}>
            <AccordionSummary
              expandIcon={<Icon>expand_more</Icon>}
              sx={{ px: 1 }}
            >
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{
                  textAlign: "right",
                  width: "clamp(100px, 8em, 20%)",
                  mx: 0,
                }}
              >
                {localeDate(date)}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  textAlign: "right",
                  width: "clamp(60px, 7em, 20%)",
                  fontWeight: 500,
                }}
              >
                {total}€
              </Typography>
              <Typography variant="subtitle1" sx={{ pl: 3, maxWidth: "40%" }}>
                {highlevelSummary(entries)}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Table size="small">
                <TableBody>{summary(entries)}</TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
