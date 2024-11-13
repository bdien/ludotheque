import Box from "@mui/material/Box";
import { navigate } from "wouter/use-browser-location";
import { MiniItem } from "./mini_item";
import { Loan } from "../api/models";
import { Icon } from "@mui/material";

interface UserLoansProps {
  loans: Loan[];
  buttons: boolean;
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
            action={
              props.buttons
                ? {
                    text: "Rendre",
                    func: () => {
                      navigate(
                        `/loans/${obj.id}/close?return=${window.location.pathname}`,
                      );
                    },
                  }
                : undefined
            }
          />
        );
      })}
    </Box>
  );
}
