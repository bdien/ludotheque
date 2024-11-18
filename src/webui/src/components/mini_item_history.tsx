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
  const picture = item?.pictures?.length
    ? item.pictures[0]
    : "../../notavailable.webp";

  // render data
  return (
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 120px)",
        width: "min(100%, 450px)",
        mb: 1,
        p: 0.5,
      }}
    >
      <div style={{ width: "40%" }}>
        {item ? (
          <Link href={`/items/${props.loan.item}`}>
            <img
              style={{
                height: "100%",
                width: "100%",
                borderRadius: "10px",
                filter: "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
                objectFit: "contain",
              }}
              src={`/storage/thumb/${picture}`}
            />
          </Link>
        ) : (
          <Skeleton
            sx={{ bgcolor: "grey.200" }}
            variant="rounded"
            width="100%"
            height="100%"
          />
        )}
      </div>
      <div style={{ width: "60%", marginLeft: "10px" }}>
        {item ? (
          <>
            <Typography component="div" fontWeight={600}>
              <Link
                href={`/items/${props.loan.item}`}
                style={{ textDecoration: "none" }}
              >
                {item.name} ({props.loan.item})
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
            <Skeleton sx={{ bgcolor: "grey.200" }} />
            <Skeleton sx={{ bgcolor: "grey.200" }} />
          </>
        )}
      </div>
    </Box>
  );
}
