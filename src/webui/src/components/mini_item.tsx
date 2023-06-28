import Box from "@mui/material/Box";
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
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 300px)",
        mb: 1,
        p: 0.5,
        borderBottom: "1px solid #EEEEEE",
      }}
    >
      <Box
        sx={{ width: "clamp(80px, 20vw, 200px)", mr: 2 }}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <img
          style={{ maxHeight: "100%", maxWidth: "100%" }}
          src={
            item.pictures?.length
              ? `/storage/img/${item.pictures[0]}`
              : "/notavailable.png"
          }
        ></img>
      </Box>
      <Box>
        <Typography
          component="div"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            textDecoration: "none",
          }}
          fontWeight={600}
        >
          <Link href={`/items/${item.id}`} style={{ textDecoration: "none" }}>
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
      </Box>
    </Box>
  );
}

export default MiniItem;
