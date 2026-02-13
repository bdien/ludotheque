import Box from "@mui/material/Box";
import { MiniItem } from "./mini_item";
import { APILoan } from "../api/models";
import { Button, Icon } from "@mui/material";
import { useState } from "react";
import { closeLoan, extendLoan } from "../api/calls";
import { mutate } from "swr";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useGlobalStore } from "../hooks/global_store";

interface UserLoansProps {
  userId: number;
  loans: APILoan[];
  buttons: boolean;
}

function ModifyLoanButton({
  userId,
  loanId,
  actionfunction,
  text,
}: {
  userId: number;
  loanId: number;
  actionfunction: (loanId: number) => Promise<any>;
  text: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <Button
      size="medium"
      variant="outlined"
      loading={loading}
      sx={{ mt: 0.5 }}
      onClick={() => {
        window.umami?.track("FicheUser: " + text);
        setLoading(true);
        actionfunction(loanId)
          .then(() => {
            mutate(`/api/loans/${loanId}`);
            mutate(`/api/users/${userId}`);
            mutate(`/api/users`);
          })
          .finally(() => {
            setLoading(false);
          });
      }}
    >
      {text}
    </Button>
  );
}

export function UserLoans(props: UserLoansProps) {
  const { info, account } = useGlobalStore();
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
              account.rights.includes("loan_manage") ? (
                <span style={{ display: "flex", gap: "5px" }}>
                  <ModifyLoanButton
                    userId={props.userId}
                    loanId={obj.id}
                    actionfunction={closeLoan}
                    text="Rendre"
                  />
                  {obj.extended! < info.loan.extend_max && (
                    <ModifyLoanButton
                      userId={props.userId}
                      loanId={obj.id}
                      actionfunction={extendLoan}
                      text="Prolonger"
                    />
                  )}
                </span>
              ) : undefined
            }
          />
        );
      })}
    </Box>
  );
}
