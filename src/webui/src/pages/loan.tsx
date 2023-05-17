import { useState } from "react";
import { UserModel, ItemModel } from "../api/models";
import { UserSearch } from "../components/user_search";
import { ItemSearch } from "../components/item_search";
import { Button } from "@mui/material";

export function Loan() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [item, setItem] = useState<ItemModel | null>(null);

  let html = (
    <div>
      Personne: <UserSearch setUser={setUser} />
    </div>
  );

  if (!user) return html;

  return [
    html,
    <div>
      Emprunt:
      <ItemSearch setItem={setItem} />
      <Button variant="contained">+</Button>
    </div>,
  ];
}
