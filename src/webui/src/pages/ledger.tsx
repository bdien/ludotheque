import Box from "@mui/material/Box";
import { useItem, useLedger, useUser } from "../api/hooks";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Icon,
  List,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { LedgerEntry } from "../api/models";
import React, { ReactElement } from "react";
import { Link } from "wouter";

function ShortUser({ user_id }) {
  const { user } = useUser(user_id);
  return (
    <>
      {user ? <Link href={`/users/${user.id}`}>{user.name}</Link> : "Unknown"}
    </>
  );
}

function ShortItem({ item_id }) {
  const { item } = useItem(item_id);
  return (
    <>
      {item ? <Link href={`/items/${item.id}`}>{item.name}</Link> : "Unknown"}
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

  const items = entries.filter((i) => i.item_id > 0);
  if (items.length) {
    ret.push(`${items.length} jeux`);
  }

  const carte = entries.filter((i) => i.item_id == -2).length;
  if (carte) {
    ret.push(`${carte} carte`);
  }

  const adherent = entries.filter((i) => i.item_id == -1).length;
  if (adherent) {
    ret.push(`${adherent} adhérent`);
  }

  const total_cost = entries.reduce((val, i) => i.cost + val, 0);
  return `${total_cost}€ => ` + ret.join(", ");
}

function summary(entry: LedgerEntry): ReactElement {
  return (
    <TableRow>
      <TableCell>
        <ShortUser user_id={entry.user_id} />
      </TableCell>
      <TableCell>
        <ShortItem item_id={entry.item_id} />
      </TableCell>
      <TableCell>{entry.cost ? `${entry.cost}€` : "Gratuit"}</TableCell>
    </TableRow>
  );
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
      {[...ledger_day.keys()].map((d) => (
        <Accordion TransitionProps={{ unmountOnExit: true }} key={d}>
          <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
            {localeDate(d)} {highlevel_summary(ledger_day.get(d)!)}
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableBody>
                {ledger_day.get(d)!.map((entry) => summary(entry))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
