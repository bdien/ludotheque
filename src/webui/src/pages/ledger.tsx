import Box from "@mui/material/Box";
import { useLedger, useLoans } from "../api/hooks";
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
import { LedgerEntry, Loan } from "../api/models";
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

function highlevelSummary(
  entries: LedgerEntry[],
  nbLoansOut: number,
  nbLoansIn: number,
) {
  const summary = [];

  const adherentCount = entries.filter((e) => e.item_id === -1).length;
  if (adherentCount > 0) {
    summary.push(`${adherentCount} adhésion${adherentCount > 1 ? "s" : ""}`);
  }

  const carteCount = entries.filter((e) => e.item_id === -2).length;
  if (carteCount)
    summary.push(`${carteCount} carte${carteCount > 1 ? "s" : ""}`);

  if (nbLoansOut) summary.push(`${nbLoansOut} jeux`);
  if (nbLoansIn) summary.push(`${nbLoansIn} rendus`);

  return summary.join(", ");
}

function summary(entries: LedgerEntry[], loansIn: Loan[]) {
  const entriesByUser = groupBy(entries, (i) => i.user_id);
  const loansInByUser = groupBy(loansIn, (i) => i.user);
  const users = [...entriesByUser.keys(), ...loansInByUser.keys()];

  return (
    <>
      {[...new Set(users)].map((userId) => {
        const userEntries = entriesByUser.get(userId) ?? [];
        const loansInEntries = loansInByUser.get(userId) ?? [];
        const totalMoney = userEntries.reduce(
          (total, entry) => total + entry.money,
          0,
        );

        return (
          <TableRow key={userId}>
            <TableCell sx={{ px: 1 }}>
              <ShortUser user_id={userId} />
            </TableCell>

            <TableCell sx={{ textAlign: "right", px: 1 }}>
              {summaryPerUser(userEntries, loansInEntries)}
            </TableCell>

            <TableCell
              sx={{
                textAlign: "right",
                px: 1,
                fontWeight: 500,
                opacity: totalMoney ? 1 : 0.2,
              }}
            >
              {totalMoney}€
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

function summaryPerUser(entries: LedgerEntry[], loansIn: Loan[]) {
  const summary = [];

  const adherentCount = entries.filter((e) => e.item_id === -1).length;
  if (adherentCount) summary.push("Adhésion");

  const carteCount = entries.filter((e) => e.item_id === -2).length;
  if (carteCount) summary.push("Carte");

  const itemCount = entries.filter((e) => e.item_id > 0).length;
  if (itemCount) summary.push(`${itemCount} jeu${itemCount > 1 ? "x" : ""}`);

  const itemReturned = loansIn.filter((i) => i.status == "in").length;
  if (itemReturned)
    summary.push(`${itemReturned} rendu${itemReturned > 1 ? "s" : ""}`);

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
  const { loans } = useLoans();

  if (!ledger || !loans) return <Loading />;

  const ledgerByDay = groupBy(ledger, (i) => i.day);
  const days = [...ledgerByDay.keys()].reverse();

  return (
    <Box>
      {days.map((date) => {
        const ledgersDay = ledgerByDay.get(date) as LedgerEntry[];
        const loansOut = loans ? loans.filter((i) => i.start == date) : [];
        const loansIn = loans
          ? loans.filter((i) => i.status == "in" && i.stop == date)
          : [];
        const total = ledgersDay.reduce((sum, e) => sum + e.money, 0);

        return (
          <Accordion TransitionProps={{ unmountOnExit: true }} key={date}>
            <AccordionSummary
              expandIcon={<Icon>expand_more</Icon>}
              sx={{ px: 1, display: "flex" }}
            >
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{
                  textAlign: "right",
                  maxWidth: "clamp(98px, 8em, 20%)",
                  mx: 0,
                  flex: 1,
                }}
              >
                {localeDate(date)}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  textAlign: "right",
                  maxWidth: "clamp(60px, 5em, 20%)",
                  fontWeight: 500,
                  flex: 0.33,
                }}
              >
                {total}€
              </Typography>
              <Typography variant="subtitle1" sx={{ pl: 2.2, flex: 1 }}>
                {highlevelSummary(ledgersDay, loansOut.length, loansIn.length)}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Table size="small">
                <TableBody>{summary(ledgersDay, loansIn)}</TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
