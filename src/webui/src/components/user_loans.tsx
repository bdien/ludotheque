import Box from "@mui/material/Box";
import { MiniItem } from "./mini_item";
import { APILoan } from "../api/models";
import { Button, CircularProgress, Icon } from "@mui/material";
import React, { useState } from "react";
import { closeLoan } from "../api/calls";

interface UserLoansProps {
  loans: APILoan[];
  buttons: boolean;
}

function generateCloseLoanButton(loanId: number) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const [txt, setTxt] = useState<string | React.ReactElement>("Rendre");
  return (
    <Button
      size="large"
      variant="outlined"
      disabled={disabled}
      sx={{ mt: 1 }}
      onClick={() => {
        //setDisabled(true);
        setTxt(
          <>
            Retour <CircularProgress sx={{ ml: 1 }} size="16px" />
          </>,
        );
        closeLoan(loanId)
          .then(() => {
            setTxt(
              <>
                Rendu <Icon sx={{ ml: 1 }}>check_circle</Icon>
              </>,
            );
            setDisabled(true);
          })
          .catch(() => {
            setTxt("Erreur");
            setDisabled(false);
          });
      }}
    >
      {txt}
    </Button>
  );
}

export function UserLoans(props: UserLoansProps) {
  if (props.loans.length == 0)
    return (
      <Box sx={{ mx: "auto", textAlign: "center" }}>
        <Icon sx={{ opacity: 0.1, fontSize: "min(40vw, 250px)", mt: 4 }}>
          info
        </Icon>
        <br />
        Pas d'emprunts en cours
      </Box>
    );

  const today = new Date();

  return (
    <Box display="flex" flexWrap="wrap">
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
            button={generateCloseLoanButton(obj.id)}
          />
        );
      })}
    </Box>
  );
}
