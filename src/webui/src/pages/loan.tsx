import { useLocation } from "wouter";
import { createLoan } from "../api/calls";
import { useState } from "react";
import { UserModel, ItemModel } from "../api/models";
import { UserSearch } from "../components/user_search";
import { ItemSearch } from "../components/item_search";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import Typography from "@mui/material/Typography";
import { useInfo } from "../api/hooks";

function submitLoan(user_id: number, objs_id: number[], topay: number) {
  return createLoan(user_id, objs_id, topay);
}

export function Loan() {
  const { info } = useInfo();
  const [_location, setLocation] = useLocation();
  const [user, setUser] = useState<UserModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);

  const nbbig = items.filter((i) => i.big).length;
  const nbregular = items.length - nbbig;
  const topay =
    nbregular * (info ? info.pricing.regular : -1) +
    nbbig * (info ? info.pricing.big : -1);
  const topay_fromcredit = user ? Math.min(topay, user.credit) : 0;

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Nouvel emprunt
      </Typography>
      <Box sx={{ mb: 2 }}>
        <UserSearch user={user} setUser={setUser} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <ItemSearch setItems={setItems} />
      </Box>

      {items.length > 0 && (
        <Box sx={{ mb: 2, position: "relative" }}>
          Règlement:
          <br />
          <ul>
            <li>
              Total: <b>{topay}€</b> ({nbbig > 0 && `${nbbig} gros`}
              {nbbig > 0 && nbregular > 0 && " et "}
              {nbregular > 0 && `${nbregular} taille normale`})
            </li>
            {user && (
              <>
                <li>
                  Pris sur la carte: {topay_fromcredit}€ (Il restera{" "}
                  {user.credit - topay_fromcredit}€)
                </li>
                <li>
                  Reste: <b>{topay - topay_fromcredit}€</b>
                </li>
              </>
            )}
          </ul>
          <Icon
            sx={{
              top: (theme) => theme.spacing(1),
              right: (theme) => theme.spacing(2),
              position: "absolute",
            }}
          >
            settings
          </Icon>
        </Box>
      )}
      <Button
        variant="contained"
        disabled={!items.length || !user}
        color="primary"
        sx={{ width: "100%", p: 2 }}
        onClick={() =>
          user &&
          submitLoan(
            user.id,
            items.map((i) => i.id),
            topay,
          ).then(() => {
            setLocation(`/users/${user.id}`);
          })
        }
      >
        Valider
      </Button>
    </>
  );
}
