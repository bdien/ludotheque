import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";

// From https://medium.com/@kch062522/useconfirm-a-custom-react-hook-to-prompt-confirmation-before-action-f4cb746ebd4e

type ResolveFunc = { resolve: (a: boolean) => void };

export function useConfirm(title: string, message: string) {
  const [promise, setPromise] = useState<ResolveFunc | null>(null);

  const confirmPromise = () =>
    new Promise<boolean>((resolve, _reject) => {
      setPromise({ resolve: resolve });
    });

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise && promise.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise && promise.resolve(false);
    handleClose();
  };

  function ConfirmDialog(): JSX.Element {
    return (
      <Dialog
        open={promise !== null}
        fullWidth
        sx={{ "& .MuiDialog-paper": { boxShadow: "inset 0em 0.2em #dc2d2d;" } }}
      >
        <DialogTitle sx={{ m: 1, mb: 0.5 }}>
          <span
            style={{
              position: "relative",
              right: "14px",
              fontSize: "x-large",
            }}
          >
            ⚠️
          </span>
          {title}
        </DialogTitle>
        <DialogContent sx={{ ml: 5 }}>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "#f5f5fa" }}>
          <Button onClick={handleCancel} sx={{ mr: 2 }}>
            Annuler
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirm}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return { ConfirmDialog, confirmPromise };
}
