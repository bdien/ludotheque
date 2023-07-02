import Typography from "@mui/material/Typography";
import { useLoan } from "../api/hooks";
import { fetchItem, fetchUser } from "../api/calls";
import { useEffect, useState } from "react";
import { ItemModel, UserModel } from "../api/models";

interface LoanCloseProps {
  id: number;
}

export function LoanClose(props: LoanCloseProps) {
  const { loan } = useLoan(props.id);
  const [user, setUser] = useState<UserModel | null>(null);
  const [item, setItem] = useState<ItemModel | null>(null);

  useEffect(() => {
    if (!loan) return;
    if (loan.user) fetchUser(loan.user as any).then((i) => setUser(i)); // TODO: Fix type
    if (loan?.item) fetchItem(loan.item).then((i) => setItem(i));
  }, [loan]);

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Rendre objet (TODO)
        {user && user.name}
        {item && item.name}
      </Typography>
    </>
  );
}
