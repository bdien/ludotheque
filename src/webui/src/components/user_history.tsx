import { useUserHistory } from "../api/hooks";
import Box from "@mui/material/Box";
import { MiniItemHistory } from "../components/mini_item_history";
import { Loan } from "../api/models";
import { Icon, Typography } from "@mui/material";
import { Loading } from "../components/loading";

interface UserHistoryProps {
  id: number;
}

function categorize(loan: Loan): string {
  return new Date(loan.start).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function UserHistory(props: UserHistoryProps) {
  const { history } = useUserHistory(props.id);

  if (!history) return <Loading />;

  if (history.length == 0)
    return (
      <Box sx={{ mx: "auto", textAlign: "center" }}>
        <Icon sx={{ opacity: 0.1, fontSize: "min(40vw, 250px)", mt: 4 }}>
          sentiment_dissatisfied
        </Icon>
        <br />
        Pas d'historique
      </Box>
    );

  // Group by "starting month" category
  const grouped = history.reduce((map, loan) => {
    const cat = categorize(loan);
    if (!map.has(cat)) return map.set(cat, [loan]);
    map.get(cat).push(loan);
    return map;
  }, new Map());

  return (
    <>
      {Array.from(grouped.keys()).map((startdate) => (
        <span key={startdate}>
          <Typography variant="overline" fontSize="1.2rem" color="primary">
            {startdate}
          </Typography>

          <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 1 }}>
            {grouped.get(startdate).map((obj: Loan) => (
              <MiniItemHistory key={obj.id} loan={obj} />
            ))}
          </Box>
        </span>
      ))}
    </>
  );
}
