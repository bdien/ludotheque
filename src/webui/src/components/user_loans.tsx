import Box from "@mui/material/Box";
import { MiniItem } from "./mini_item";
import { APILoan } from "../api/models";
import { Button, Icon } from "@mui/material";
import { useState } from "react";
import { closeLoan } from "../api/calls";
import { mutate } from "swr";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useGlobalStore } from "../hooks/global_store";

interface UserLoansProps {
  userId: number;
  loans: APILoan[];
  buttons: boolean;
}

function CloseLoanButton({
  userId,
  loanId,
}: {
  userId: number;
  loanId: number;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <Button
      size="large"
      variant="outlined"
      loading={loading}
      sx={{ mt: 0.5 }}
      onClick={() => {
        setLoading(true);
        closeLoan(loanId)
          .then(() => {
            mutate(`/api/loans/${loanId}`);
            mutate(`/api/users/${userId}`);
            mutate(`/api/users`);
          })
          .catch(() => {
            setLoading(false);
          });
      }}
    >
      Rendre
    </Button>
  );
}

export function UserLoans(props: UserLoansProps) {
  const { account } = useGlobalStore();
  const today = new Date();
  const [parent] = useAutoAnimate();

  if (props.loans.length == 0)
    return (
      <Box sx={{ mx: "auto", textAlign: "center" }}>
        <Icon
          sx={{ color: "text.disabled", fontSize: "min(40vw, 250px)", mt: 4 }}
        >
          info
        </Icon>
        <br />
        Pas d'emprunts en cours
      </Box>
    );

  return (
    <Box display="flex" flexWrap="wrap" ref={parent}>
      {props.loans?.map((obj) => {
        const objstop = new Date(obj.stop);
        return (
          <MiniItem
            key={obj.id}
            id={obj.item}
            late={objstop <= today}
            subtext={
              "A rendre le " +
              objstop.toLocaleDateString("fr", {
                year: objstop < today ? "numeric" : undefined,
                month: "short",
                day: "numeric",
              })
            }
            button={
              account.role === "admin" ? (
                <CloseLoanButton userId={props.userId} loanId={obj.id} />
              ) : undefined
            }
          />
        );
      })}
    </Box>
  );
}
