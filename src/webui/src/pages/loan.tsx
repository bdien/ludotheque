import { createLoan } from "../api/calls";
import { useState } from "react";
import { UserModel, ItemModel } from "../api/models";
import { UserSearch } from "../components/user_search";
import { ItemSearch } from "../components/item_search";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";

function submitLoan(user_id: number, objs_id: number[], topay: number) {
  createLoan(user_id, objs_id, topay);
}

export function Loan() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);

  let html = (
    <Box sx={{ mb: 2 }}>
      Personne: <UserSearch setUser={setUser} />
    </Box>
  );

  if (!user) {
    return html;
  }

  const topay = items.length * 0.5;
  const topay_fromcredit = Math.min(topay, user.credit);

  return (
    <>
      {html}
      <Box sx={{ mb: 2 }}>
        Emprunts:
        <ItemSearch setItems={setItems} />
      </Box>

      {items.length > 0 && (
        <Box sx={{ mb: 2, position: "relative" }}>
          Règlement:
          <br />
          <ul>
            <li>Total: {topay}€</li>
            <li>
              Carte: {topay_fromcredit}€ (Il restera{" "}
              {user.credit - topay_fromcredit}€)
            </li>
            <li>
              Reste: <b>{topay - topay_fromcredit}€</b>
            </li>
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
        disabled={!items.length}
        color="primary"
        sx={{ width: "90vw", m: 1 }}
        onClick={() =>
          submitLoan(
            user.id,
            items.map((i) => i.id),
            topay,
          )
        }
      >
        Valider
      </Button>
    </>
  );
}
