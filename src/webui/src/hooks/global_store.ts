import { Info, Account } from "../api/models";
import { create } from "zustand";

interface GlobalStore {
  info: Info;
  account: Account;
  setInfo: (info: Info) => void;
  setAccount: (account: Account) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  // Server info (Default value to avoid undefined)
  info: {
    nbitems: 0,
    domain: "",
    version: "",
    pricing: {
      regular: 0,
      big: 0,
      big_associations: 0,
      yearly: 0,
      card: 0,
    },
    loan: {
      weeks: 0,
    },
    booking: {
      max: 0,
      weeks: 0,
    },
    image_max: 0,
    email_minperiod: 0,
    email_minlate: 0,
  },
  // User account (Default value to avoid undefined)
  account: {
    id: 0,
    role: "",
  },
  setInfo: (value: Info) => set(() => ({ info: value })),
  setAccount: (value: Account) => set(() => ({ account: value })),
}));
