import { UserModel, ItemModel, UsersItem } from "./models";
export const SERVER_URL = "/api";

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

export async function updateItem(
  itemId: number,
  obj: Object,
): Promise<ItemModel> {
  const response = await fetch(`${SERVER_URL}/items/${itemId}`, {
    method: "POST",
    body: JSON.stringify(obj),
  });
  return response.json();
}

export async function deleteItemPicture(itemId: number) {
  await fetch(`${SERVER_URL}/items/${itemId}/picture`, {
    method: "DELETE",
  });
}

export async function updateItemPicture(itemId: number, file: File) {
  var data = new FormData();
  data.append("file", file);

  await fetch(`${SERVER_URL}/items/${itemId}/picture`, {
    method: "POST",
    body: data,
  });
}

export async function qsearchUser(txt: string): Promise<UsersItem[]> {
  if (!txt || txt.length < 2) return Promise.resolve([]);
  const response = await fetch(`${SERVER_URL}/users/qsearch/${txt}`);
  return response.json();
}

export async function createLoan(
  user: number,
  items: number[],
): Promise<ItemModel> {
  const response = await fetch(`${SERVER_URL}/loans`, {
    method: "POST",
    body: JSON.stringify({ user, items }),
  });
  return response.json();
}

export async function closeLoan(loanId: number): Promise<ItemModel> {
  const response = await fetch(`${SERVER_URL}/loans/${loanId}/close`);
  return response.json();
}
