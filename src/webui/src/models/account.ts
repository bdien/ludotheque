import { Loan } from "./loan";

export interface Account {
    name: string;
    email?: string;
    role: string;
    id: number;
    loans?: Loan[];
  }
