import Typography from "@mui/material/Typography";
import { useLoan } from "../api/hooks";
import { closeLoan, fetchItem, fetchUser } from "../api/calls";
import { useEffect, useState } from "react";
import { ItemModel, UserModel } from "../api/models";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { navigate } from "wouter/use-location";

interface LoanCloseProps {
  id: number;
}

export function LoanClose(props: LoanCloseProps) {
  const { loan } = useLoan(props.id);
  const [user, setUser] = useState<UserModel | null>(null);
  const [item, setItem] = useState<ItemModel | null>(null);
  const queryParameters = new URLSearchParams(window.location.search);
  const returnPath = queryParameters.get("return");

  useEffect(() => {
    if (!loan) return;
    if (loan.user) fetchUser(loan.user as any).then((i) => setUser(i)); // TODO: Fix type
    if (loan?.item) fetchItem(loan.item).then((i) => setItem(i));
  }, [loan]);

  if (!loan) return <>Loading</>;

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Rendre objet (TODO)
        {user && user.name}
      </Typography>
      <div>
        Merci de vérifier le contenu du jeu
        {item?.content && (
          <Box border="1px solid #E5E5E5" borderRadius="10px">
            <Typography
              variant="subtitle1"
              color="text.secondary"
              component="div"
              style={{ whiteSpace: "pre-line" }}
              sx={{ p: 1 }}
            >
              Contenu:
              <ul>
                {item.content.map((row, idx) => (
                  <li key={idx}>{row}</li>
                ))}
              </ul>
            </Typography>
          </Box>
        )}
      </div>
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
