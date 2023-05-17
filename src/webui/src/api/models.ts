export interface UserModel {
  id: number;
  name: string;
  email?: string;
  role: string;
  credit: number;
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
  picture?: string;
  players_max?: number;
  players_min?: number;
  age?: number;
  big?: boolean;
  outside?: boolean;
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
