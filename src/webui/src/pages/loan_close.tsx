import Typography from "@mui/material/Typography";
import { useLoan } from "../api/hooks";
import { closeLoan, fetchItem } from "../api/calls";
import { useEffect, useState } from "react";
import { ItemModel } from "../api/models";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-location";

interface LoanCloseProps {
  id: number;
}

export function LoanClose(props: LoanCloseProps) {
  const { loan } = useLoan(props.id);
  const [item, setItem] = useState<ItemModel | null>(null);
  const queryParameters = new URLSearchParams(window.location.search);
  const returnPath = queryParameters.get("return");

  useEffect(() => {
    if (!loan) return;
    if (loan?.item) fetchItem(loan.item).then((i) => setItem(i));
  }, [loan]);

  if (!loan) return <>Loading</>;

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Retour de jeu
      </Typography>
      {item && item.pictures && (
        <Box
          component="img"
          sx={{
            width: "100%",
            height: "20vh",
            objectFit: "contain",
          }}
          src={
            item.pictures?.length
              ? `/storage/img/${item.pictures[0]}`
              : "/notavailable.webp"
          }
        />
      )}
      <Box sx={{ pt: 2 }}>
        <Typography fontWeight={500}>
          Merci de vérifier le contenu du jeu
        </Typography>
        {item?.content && (
          <Typography
            color="text.secondary"
            component="div"
            style={{ whiteSpace: "pre-line" }}
            sx={{ p: 0 }}
          >
            <ul>
              {item.content.map((row, idx) => (
                <li key={idx}>{row}</li>
              ))}
            </ul>
          </Typography>
        )}
      </Box>
      <div>
        <Button
          variant="contained"
          size="large"
          sx={{ ml: 2, mt: "20px" }}
          onClick={() => {
            closeLoan(loan.id).then(() => navigate(returnPath || "/"));
          }}
        >
          Rendre
        </Button>
        <Button
          variant="outlined"
          size="large"
          sx={{ ml: 2, mt: "20px" }}
          onClick={() => navigate(returnPath || "/")}
        >
          Annuler
        </Button>
      </div>
    </>
  );
}
