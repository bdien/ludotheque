import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { closeLoan } from "../api/calls";
import { Link } from "wouter";
import Button from "@mui/material/Button";

interface MiniItemProps {
  id: number;
}

export function MiniItem(props: MiniItemProps) {
  const { item, error, isLoading, mutate } = useItem(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!item) return <div>Server error...</div>;

  function close_loan(loanId: number) {
    closeLoan(loanId).then((data) => {
      mutate && mutate(data);
    });
  }

  const rtf = new Intl.RelativeTimeFormat();
  const today = new Date().valueOf();
  function relTime(txt: string) {
    const days: number = Math.round(
      (new Date(txt).valueOf() - today) / (3600000 * 24),
    );
    return rtf.format(days, "days");
  }

  const last_loan = item.loans ? item.loans[0] : undefined;

  // render data
  return (
    <Card sx={{ display: "flex", height: "clamp(100px, 15vw, 300px)", mb: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <CardContent sx={{ flex: "1 0 auto" }}>
          <Typography
            component="div"
            variant="h6"
            sx={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
          >
            <Link href={`/items/${item.id}`}>
              {item.name} ({item.id})
            </Link>
          </Typography>
          {last_loan && (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                component="div"
              >
                Date de retour {relTime(last_loan.stop)}
              </Typography>
              {last_loan.status == "out" && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => close_loan(last_loan.id)}
                >
                  Rendre
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Box>
      <CardMedia
        component="img"
        sx={{ width: "clamp(150px, 20vw, 300px)" }}
        image={"/storage/img/" + (item.picture || "notavailable.png")}
      />
    </Card>
  );
}

export default MiniItem;
