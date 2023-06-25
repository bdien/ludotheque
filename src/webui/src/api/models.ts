export interface UserModel {
  id: number;
  name: string;
  email?: string;
  role: string;
  credit: number;
  loans?: Loan[];
  created_time?: string;
}

export interface UsersItem {
  id: number;
  name: string;
}

export interface Users extends Array<UsersItem> {}

export interface ItemModel {
  id: number;
  name: string;
  description?: string;
  pictures?: string[];
  players_max?: number;
  players_min?: number;
  age?: number;
  big?: boolean;
  outside?: boolean;
  status?: string;
  return?: string;
  loans?: Loan[];
}

export interface Loan {
  id: number;
  item: number;
  user: number;
  start: string;
  stop: string;
  status: string;
}

export interface Account {
  name: string;
  email?: string;
  role: string;
  id: number;
  loans?: Loan[];
}
