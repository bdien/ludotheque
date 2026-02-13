import { Info, Account } from "../api/models";
import { create } from "zustand";

export interface SnackbarMessage {
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

interface GlobalStore {
  info: Info;
  account: Account;
  snackbar: SnackbarMessage | null;
  setInfo: (info: Info) => void;
  setAccount: (account: Account) => void;
  showSnackbar: (
    message: string,
    severity?: SnackbarMessage["severity"],
  ) => void;
  hideSnackbar: () => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  // Server info (Default value to avoid undefined)
  info: {
    nbitems: 0,
    domain: "",
    version: "",
    next_opening: "",
    pricing: {
      regular: 0,
      big: 0,
      big_associations: 0,
      yearly: 0,
      card: 0,
    },
    loan: {
      maxitems: 0,
      weeks: 0,
    },
    booking: {
      maxitems: 0,
      weeks: 0,
    },
    image_max: 0,
    email_minperiod: 0,
    email_minlate: 0,
    item_new_days: 0,
  },
  // User account (Default value to avoid undefined)
  account: {
    id: 0,
    role: "",
  },
  snackbar: null,
  setInfo: (value: Info) => set(() => ({ info: value })),
  setAccount: (value: Account) => set(() => ({ account: value })),
  showSnackbar: (
    message: string,
    severity: SnackbarMessage["severity"] = "success",
  ) => set(() => ({ snackbar: { message, severity } })),
  hideSnackbar: () => set(() => ({ snackbar: null })),
}));
