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

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!item) return <div>Server error...</div>;

  const rtf = new Intl.RelativeTimeFormat();
  const today = new Date();
  function relTime(txt: string) {
    const days: number = Math.round(
      (new Date(txt).valueOf() - today.valueOf()) / (3600000 * 24),
    );
    return days;
  }
  function relTimeTxt(txt: string) {
    return rtf.format(relTime(txt), "days");
  }

  const last_loan = item.loans ? item.loans[0] : undefined;

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
        <Typography
          component="div"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
          fontWeight={600}
        >
          <Link href={`/items/${item.id}`} style={{ textDecoration: "none" }}>
            {item.name} ({item.id})
          </Link>
        </Typography>
        {last_loan && (
          <>
            {new Date(last_loan.stop) < today ? (
              <Typography variant="subtitle2" color="red">
                En retard de {-relTime(last_loan.stop)} jours
              </Typography>
            ) : (
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="div"
              >
                A rendre {relTimeTxt(last_loan.stop)}
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
