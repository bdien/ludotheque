import { useState } from "react";
import { UserModel, ItemModel } from "../api/models";
import { UserSearch } from "../components/user_search";
import { ItemSearch } from "../components/item_search";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export function Loan() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [_item, setItem] = useState<ItemModel | null>(null);

  let html = (
    <div>
      Personne: <UserSearch setUser={setUser} />
    </div>
  );

  if (!user) {
    return html;
  }

  return (
    <>
      {html}
      <Box>
        Emprunts:
        <ItemSearch setItem={setItem} />
      </Box>
      <Button variant="contained" color="primary" sx={{ width: "90vw", m: 1 }}>
        Valider
      </Button>
    </>
  );
}
