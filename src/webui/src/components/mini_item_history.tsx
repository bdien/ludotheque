import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { Link } from "wouter";
import Skeleton from "@mui/material/Skeleton";
import { Loan } from "../api/models";

interface MiniItemHistoryProps {
  loan: Loan;
}

export function MiniItemHistory(props: MiniItemHistoryProps) {
  const { item, error } = useItem(props.loan.item);

  if (error) return <div>Impossible de charger: {error}</div>;

  // render data
  return (
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 120px)",
        width: "min(100%, 450px)",
        mb: 1,
        p: 0.5,
        borderBottom: "1px solid #EEEEEE",
      }}
    >
      <Box
        sx={{ width: "40%", mr: 2 }}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {item ? (
          <Link href={`/items/${item.id}`}>
            <img
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                borderRadius: "10px",
                filter: "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
              }}
              src={
                item.pictures?.length
                  ? `/storage/img/${item.pictures[0]}`
                  : "/notavailable.webp"
              }
            />
          </Link>
        ) : (
          <Skeleton variant="rounded" width="100%" height="100%" />
        )}
      </Box>
      <Box width="60%">
        {item ? (
          <>
            <Typography component="div" fontWeight={600}>
              <Link
                href={`/items/${item.id}`}
                style={{ textDecoration: "none" }}
              >
                {item.name} ({item.id})
              </Link>
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {new Date(props.loan.start).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              {" → "}
              {props.loan.status == "in"
                ? new Date(props.loan.stop).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "En cours"}
            </Typography>
          </>
        ) : (
          <>
            <Skeleton />
            <Skeleton />
          </>
        )}
      </Box>
    </Box>
  );
}
