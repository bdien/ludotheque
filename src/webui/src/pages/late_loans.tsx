import Box from "@mui/material/Box";
import { useLoansLate } from "../api/hooks";
import { Typography, Table, TableCell, TableRow } from "@mui/material";
import { differenceInDays } from "date-fns";
import { Loan } from "../api/models";
import { ShortUser } from "../components/short_user";
import { ShortItem } from "../components/short_item";
import { Loading } from "../components/loading";

const categories = new Map([
  [365, "Plus d'un an"],
  [180, "plus de 6 mois"],
  [60, "2 mois et plus"],
  [30, "1 mois"],
  [21, "3 semaines"],
  [14, "2 semaines"],
  [7, "1 semaine"],
]);

const today = new Date();

function nbWeeks(stop_txt: string): number {
  return differenceInDays(today, stop_txt) / 7;
}

function col_time(nbWeeks: number) {
  if (nbWeeks >= 52) return `${Math.round(nbWeeks / 52)} ans`;
  if (nbWeeks >= 8) return `${Math.floor(nbWeeks / 4)} mois`;
  return `${Math.floor(nbWeeks)} semaines`;
}

function categorize(stop_txt: string): number | null {
  const diff_days = differenceInDays(today, stop_txt);
  if (diff_days < 0) return null;
  for (const diff_cur of categories.keys()) {
    if (diff_days >= diff_cur) return diff_cur;
  }
  return 0;
}

export function LateLoans() {
  const { loans } = useLoansLate(14);

  if (!loans) return <Loading />;

  // Group by "late" category
  const grouped = loans.reduce((grp: Loan[][], loan) => {
    const cat = categorize(loan.stop);
    if (cat) {
      if (grp[cat] == null) grp[cat] = [];
      grp[cat].push(loan);
    }
    return grp;
  }, []);

  //  Only keep index and reverse it (to display oldest first)
  const grouped_idxs = grouped.map((_loans, idx) => idx).reverse();

  return (
    <Box>
      <Table size="small">
        {grouped_idxs.map((idx) => (
          <>
            <TableRow>
              <TableCell colSpan={3} sx={{ backgroundColor: "#EEEEEE" }}>
                <Typography
                  variant="overline"
                  sx={{ fontSize: "1em", fontWeight: 700 }}
                >
                  Retard de {categories.get(idx)} ({grouped[idx].length} jeu
                  {grouped[idx].length > 1 ? "x" : ""})
                </Typography>
              </TableCell>
            </TableRow>

            {grouped[idx].map((i) => (
              <TableRow key={i.id}>
                <TableCell sx={{ px: 1 }}>
                  <ShortUser user_id={i.user} />
                </TableCell>

                <TableCell sx={{ textAlign: "right", fontWeight: 500 }}>
                  <ShortItem item_id={i.item} />
                </TableCell>

                <TableCell sx={{ textAlign: "left", minWidth: 80, px: 0 }}>
                  {col_time(nbWeeks(i.stop))}
                </TableCell>
              </TableRow>
            ))}
          </>
        ))}
      </Table>
    </Box>
  );
}
