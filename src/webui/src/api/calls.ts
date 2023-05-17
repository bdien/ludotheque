import { UserModel, ItemModel, UsersItem } from "./models";
export const SERVER_URL = "http://localhost:8000";

export async function fetchUser(userId: number): Promise<UserModel> {
  const response = await fetch(`${SERVER_URL}/users/${userId}`);
  return response.json();
}

export async function qsearchItem(txt: string): Promise<ItemModel[]> {
  if (!txt || txt.length < 2) return Promise.resolve([]);
  const response = await fetch(`${SERVER_URL}/items/qsearch/${txt}`);
  return response.json();
}

export async function fetchItem(itemId: number): Promise<ItemModel> {
  const response = await fetch(`${SERVER_URL}/items/${itemId}`);
  return response.json();
}

export async function qsearchUser(txt: string): Promise<UsersItem[]> {
  if (!txt || txt.length < 2) return Promise.resolve([]);
  const response = await fetch(`${SERVER_URL}/users/qsearch/${txt}`);
  return response.json();
}
