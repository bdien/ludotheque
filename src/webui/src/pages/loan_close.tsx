import Typography from "@mui/material/Typography";
import { useLoan } from "../api/hooks";
import { closeLoan, fetchItem } from "../api/calls";
import { useEffect, useState } from "react";
import { ItemModel, Loan } from "../api/models";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-browser-location";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import LoadingButton from "@mui/lab/LoadingButton";

interface LoanCloseProps {
  id: number;
}

export function LoanClose(props: LoanCloseProps) {
  const { loan } = useLoan(props.id);
  const [editBusy, setEditBusy] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [item, setItem] = useState<ItemModel | null>(null);
  const queryParameters = new URLSearchParams(window.location.search);
  const returnPath = queryParameters.get("return");

  useEffect(() => {
    if (!loan) return;
    const { item } = loan;
    if (item) {
      fetchItem(item).then(setItem);
    }
  }, [loan]);

  if (!loan || !item) return <>Loading</>;
  const picture = item?.pictures?.length
    ? item.pictures[0]
    : "../../notavailable.webp";

  function onSubmit(loan: Loan) {
    setApiError(null);
    setEditBusy(true);

    closeLoan(loan.id)
      .then(() => navigate(returnPath || "/"))
      .catch((err) => {
        console.log(err);
        setApiError("Erreur de communication");
      })
      .finally(() => setEditBusy(false));
  }

  return (
    <>
      <Typography variant="h5" color="primary.main">
        Retour de jeu
      </Typography>

      {apiError && (
        <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      {item.pictures && (
        <Box
          component="img"
          sx={{
            width: "100%",
            height: "30vh",
            objectFit: "contain",
          }}
          src={`/storage/img/${picture}`}
        />
      )}
      <Typography
        variant="h5"
        textAlign="center"
        fontWeight="bold"
        sx={{ p: 2, color: "primary.main" }}
      >
        {item.name} ({item.id})
      </Typography>

      {item.notes ? (
        <Alert severity="info" elevation={1}>
          <AlertTitle>Notes</AlertTitle>
          {item.notes}
        </Alert>
      ) : (
        ""
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

      <LoadingButton
        variant="contained"
        fullWidth
        color="secondary"
        loading={editBusy}
        size="large"
        sx={{ mt: "15px", p: 1.5 }}
        onClick={() => onSubmit(loan)}
      >
        Rendre
      </LoadingButton>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "20px" }}
        onClick={() => navigate(returnPath || "/")}
      >
        Annuler
      </Button>
    </>
  );
}
