import { useUserHistory } from "../api/hooks";
import Box from "@mui/material/Box";
import { MiniItemHistory } from "../components/mini_item_history";
import { LoanHistoryItem } from "../api/models";
import { Icon, TextField, Typography } from "@mui/material";
import { Loading } from "../components/loading";
import { useState } from "react";

interface UserHistoryProps {
  id: number;
}

function categorize(loan: LoanHistoryItem): string {
  return new Date(loan.start).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function UserHistory(props: UserHistoryProps) {
  let { history } = useUserHistory(props.id);
  const [filter, setFilter] = useState("");

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

  // Filter
  if (filter != "") {
    const f = filter.toLowerCase();
    history = history.filter((loan) => loan.name.toLowerCase().includes(f));
  }

  // Group by "starting month" category
  const grouped = history.reduce((map, loan) => {
    const cat = categorize(loan);
    if (!map.has(cat)) return map.set(cat, [loan]);
    map.get(cat).push(loan);
    return map;
  }, new Map());

  return (
    <>
      {/* Filtering */}
      <div>
        <TextField
          size="small"
          label="Filtrer par nom"
          type="search"
          defaultValue={filter}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilter(event.target.value);
          }}
          sx={{ backgroundColor: "white", width: "100%", mb: 1 }}
        />
      </div>

      {Array.from(grouped.keys()).map((startdate) => (
        <span key={startdate}>
          <Typography variant="overline" fontSize="1.2rem" color="primary">
            {startdate}
          </Typography>

          <Box display="flex" flexWrap="wrap" width="100%" sx={{ pt: 1 }}>
            {grouped.get(startdate).map((obj: LoanHistoryItem) => (
              <MiniItemHistory key={obj.id} loan={obj} />
            ))}
          </Box>
        </span>
      ))}
    </>
  );
}
