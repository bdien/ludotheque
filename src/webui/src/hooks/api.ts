import useSWRImmutable from 'swr/immutable';
import { Account, Item, UserModel, Users } from "../models/api";

async function fetcher<JSON = any>(
    input: RequestInfo,
    init?: RequestInit
): Promise<JSON> {
    const res = await fetch(input, init)
    return res.json()
}

export function useAccount() {
    const { data, error, isLoading } = useSWRImmutable<Account>(
        'http://localhost:8000/me',
        fetcher);

    return {
        account: data,
        isLoading,
        error
    }
}

export function useItem(id: number) {
    const { data, error, isLoading } = useSWRImmutable<Item>(
        `http://localhost:8000/items/${id}`,
        fetcher);

    return {
        item: data,
        isLoading,
        error
    }
}

export function useUser(id: number | null) {
    if (!id)
        return { user: null, isLoading: false, error: false };

    const { data, error, isLoading } = useSWRImmutable<UserModel>(
        `http://localhost:8000/users/${id}`,
        fetcher);

    return {
        user: data,
        isLoading,
        error
    }
}

export function useUsers() {
    const { data, error, isLoading } = useSWRImmutable<Users>(
        `http://localhost:8000/users`,
        fetcher);

    return {
        users: data,
        isLoading,
        error
    }
}