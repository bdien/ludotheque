import Box from "@mui/material/Box";
import { useLedger, useUser } from "../api/hooks";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { LedgerEntry } from "../api/models";
import { ReactElement } from "react";
import { Link } from "wouter";

function ShortUser({ user_id }: { user_id: number }) {
  const { user } = useUser(user_id);
  return (
    <>
      {user ? (
        <Link href={`/users/${user.id}`}>
          {user.name}
          {user.role == "admin" ? (
            <Icon sx={{ fontSize: "1em" }}>star</Icon>
          ) : (
            ""
          )}
        </Link>
      ) : (
        `User ${user_id}`
      )}
    </>
  );
}

function groupBy<K, V>(array: V[], grouper: (item: V) => K) {
  return array.reduce((store, item) => {
    const key = grouper(item);
    if (store.has(key)) {
      store.get(key)!.push(item);
    } else {
      store.set(key, [item]);
    }
    return store;
  }, new Map<K, V[]>());
}

function highlevel_summary(entries: LedgerEntry[]) {
  const ret: string[] = [];

  const adherent = entries.filter((i) => i.item_id == -1).length;
  if (adherent) {
    ret.push(`${adherent} adhérent${adherent > 1 ? "s" : ""}`);
  }

  const carte = entries.filter((i) => i.item_id == -2).length;
  if (carte) {
    ret.push(`${carte} carte${carte > 1 ? "s" : ""}`);
  }

  const items = entries.filter((i) => i.item_id > 0).length;
  if (items) {
    ret.push(`${items} jeu${items > 1 ? "x" : ""}`);
  }

  return ret.join(", ");
}

function summary(entries: LedgerEntry[]): ReactElement {
  const per_user = groupBy(entries, (i) => i.user_id);

  return (
    <>
      {[...per_user.keys()].map((u) => (
        <TableRow>
          <TableCell>
            <ShortUser user_id={u} />
          </TableCell>
          <TableCell sx={{ textAlign: "right" }}>
            {summary_peruser(per_user.get(u)!)}
          </TableCell>
          <TableCell sx={{ width: "3em", px: 0.5, textAlign: "right" }}>
            {per_user.get(u)!.reduce((val, i) => i.money + val, 0)}€
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function summary_peruser(entries: LedgerEntry[]): string {
  const ret: string[] = [];

  const adherent = entries.filter((i) => i.item_id == -1).length;
  if (adherent) {
    ret.push("Nouvel adhérent");
  }

  const carte = entries.filter((i) => i.item_id == -2).length;
  if (carte) {
    ret.push("Remplissage carte");
  }

  const items = entries.filter((i) => i.item_id > 0);
  if (items.length) {
    ret.push(`${items.length} jeu${items.length > 1 ? "x" : ""}`);
  }

  return ret.join(", ");
}

function localeDate(txt: string) {
  const d = new Date(txt);
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Ledger() {
  const { ledger } = useLedger();

  if (!ledger) return <>Chargement</>;

  const ledger_day = groupBy(ledger, (i) => i.day);

  return (
    <Box>
      <Alert severity="warning" sx={{ m: 2, border: "1px solid orange" }}>
        Experimental
      </Alert>

      {[...ledger_day.keys()].map((d) => (
        <Accordion TransitionProps={{ unmountOnExit: true }} key={d}>
          <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
            <Typography
              variant="subtitle1"
              sx={{ textAlign: "right", width: "8em" }}
            >
              {localeDate(d)}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ textAlign: "right", width: "7em", fontWeight: 500 }}
            >
              {ledger_day.get(d)!.reduce((val, i) => i.money + val, 0)}€
            </Typography>
            <Typography variant="subtitle1" sx={{ pl: 4 }}>
              {highlevel_summary(ledger_day.get(d)!)}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableBody>{summary(ledger_day.get(d)!)}</TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
