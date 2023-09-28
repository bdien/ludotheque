import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { Link } from "wouter";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-location";

interface MiniItemProps {
  id: number;
}

export function MiniItem(props: MiniItemProps) {
  const { item, error, isLoading } = useItem(props.id);

  if (error) return <div>Impossible de charger: {error}</div>;
  if (isLoading) return <div>Chargement...</div>;
  if (!item) return <div>Erreur du serveur</div>;

  const today = new Date();
  function relTime(d: Date) {
    const days: number = Math.round(
      (d.valueOf() - today.valueOf()) / (3600000 * 24),
    );
    return days;
  }

  const last_loan = item.loans ? item.loans[0] : undefined;
  const last_loan_stop = last_loan && new Date(last_loan.stop);

  // render data
  return (
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 200px)",
        width: "min(100%, 500px)",
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
      </Box>
      <Box width="60%">
        <Typography component="div" fontWeight={600}>
          <Link href={`/items/${item.id}`} style={{ textDecoration: "none" }}>
            {item.name} ({item.id})
          </Link>
        </Typography>
        {last_loan_stop && (
          <>
            {last_loan_stop < today ? (
              <Typography variant="subtitle2" color="red">
                En retard de {-relTime(last_loan_stop)} jours
              </Typography>
            ) : (
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="div"
              >
                A rendre le{" "}
                {last_loan_stop.toLocaleDateString(undefined, {
                  year:
                    last_loan_stop.getFullYear() == today.getFullYear()
                      ? undefined
                      : "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
            )}
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
      </Box>
    </Box>
  );
}

export default MiniItem;
