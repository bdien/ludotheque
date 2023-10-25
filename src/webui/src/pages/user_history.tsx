import { useUser, useUserHistory } from "../api/hooks";
import Box from "@mui/material/Box";
import { MiniUser } from "../components/mini_user";
import { MiniItemHistory } from "../components/mini_item_history";
import { Loan } from "../api/models";
import { Typography } from "@mui/material";

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
  const { user, isLoading, error } = useUser(props.id);
  const { history } = useUserHistory(props.id);

  if (error) return <div>Impossible de charger: {error}</div>;
  if (isLoading || !history) return <div>Chargement...</div>;
  if (!user) return <div>Erreur du serveur</div>;

  // Group by "starting month" category
  const grouped = history.reduce((map, loan) => {
    const cat = categorize(loan);
    if (!map.has(cat)) return map.set(cat, [loan]);
    map.get(cat).push(loan);
    return map;
  }, new Map());

  return (
    <>
      <MiniUser fullDetails={true} user={user} history={false} />

      <Box>
        {Array.from(grouped.keys()).map((startdate) => (
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" fontSize="1.2rem">
              {startdate}
            </Typography>

            <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 2 }}>
              {grouped.get(startdate).map((obj: Loan) => (
                <MiniItemHistory key={obj.id} loan={obj} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
