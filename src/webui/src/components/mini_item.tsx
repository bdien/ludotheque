import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useItem, useItems } from "../api/hooks";
import { Link } from "wouter";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-location";
import Skeleton from "@mui/material/Skeleton";

interface MiniItemProps {
  id: number;
}

export function MiniItem(props: MiniItemProps) {
  const { item, error, mutate } = useItem(props.id);
  const { items } = useItems();
  const item_short = item ?? items.get(props.id);

  if (error) return <div>Impossible de charger: {error}</div>;
  if (!mutate) return <div>Erreur du serveur</div>;

  const today = new Date();
  const thisweek = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

  const last_loan = item?.loans ? item.loans[0] : undefined;
  const last_loan_stop = last_loan && new Date(last_loan?.stop);

  // render data
  return (
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 200px)",
        width: "min(100%, 485px)",
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
                filter:
                  last_loan_stop && last_loan_stop < thisweek
                    ? "drop-shadow(0px 0px 8px rgba(255,0,0,0.7))"
                    : "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
              }}
              src={
                item.pictures?.length
                  ? `/storage/thumb/${item.pictures[0]}`
                  : "/notavailable.webp"
              }
            />
          </Link>
        ) : (
          <Skeleton variant="rounded" width="100%" height="100%" />
        )}
      </Box>
      <Box width="60%">
        {item_short ? (
          <Typography component="div" fontWeight={600}>
            <Link
              href={`/items/${item_short.id}`}
              style={{ textDecoration: "none" }}
            >
              {item_short.name} ({item_short.id})
            </Link>
          </Typography>
        ) : (
          <Skeleton />
        )}

        {item ? (
          <>
            {last_loan_stop && (
              <>
                <Typography
                  variant="subtitle2"
                  color={last_loan_stop < thisweek ? "red" : "text.secondary"}
                >
                  A rendre le{" "}
                  {last_loan_stop.toLocaleDateString(undefined, {
                    year: last_loan_stop < today ? "numeric" : undefined,
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
                {last_loan.status == "out" && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() =>
                      navigate(
                        `/loans/${last_loan.id}/close?return=${window.location.pathname}`,
                      )
                    }
                  >
                    Rendre
                  </Button>
                )}
              </>
            )}
          </>
        ) : (
          <Skeleton />
        )}
      </Box>
    </Box>
  );
}

export default MiniItem;
