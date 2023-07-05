import os
import sys
import oidc_client
import requests
import functools
import datetime


class Ludotheque:
    def __init__(self, url: str):
        self.__url = url.rstrip("/")
        self._session = requests.Session()
        self.__info = self.get_info()
        self._tokens = {}

    def __check_auth(self):
        if self._tokens.get("apikey"):
            return True

        if not self._tokens or not self.__loginfunc:
            raise RuntimeError("Not authenticated")

        if self._tokens["expires_at"] <= datetime.datetime.now():
            return self.__loginfunc()

        return True

    def __json_get(self, path: str, timeout=120):
        self.__check_auth()
        r = self._session.get(f"{self.__url}/api/{path}", timeout=timeout)
        r.raise_for_status()
        return r.json()

    def __json_post(self, path: str, params: dict, timeout=120):
        self.__check_auth()
        r = self._session.post(f"{self.__url}/api/{path}", json=params, timeout=timeout)
        r.raise_for_status()
        return r.json()

    def __json_postfile(self, path: str, filename: str, timeout=120):
        self.__check_auth()
        with open(filename, "rb") as f:
            r = self._session.post(
                f"{self.__url}/api/{path}", files={"file": f}, timeout=timeout
            )
            r.raise_for_status()
            return r.json()

    @functools.lru_cache(maxsize=1)  # noqa: B019 can lead to memory leaks
    def get_info(self) -> dict:
        r = requests.get(f"{self.__url}/api/info", timeout=20)
        r.raise_for_status()
        return r.json()

    def get_account(self) -> dict:
        return self.__json_get("users/me")

    # Users

    def get_users(self) -> list:
        return self.__json_get("users")

    def get_user(self, user_id: int) -> dict:
        return self.__json_get(f"users/{user_id}")

    def update_user(self, user_id: int, params: dict) -> dict:
        return self.__json_post(f"users/{user_id}", json=params)

    def create_user(self, params: dict) -> dict:
        return self.__json_post("users", json=params)

    # Categories

    def get_categories(self) -> dict:
        return self.__json_get("categories")

    def get_category(self, cat_id: int) -> dict:
        return self.__json_get(f"categories/{cat_id}")

    def update_category(self, cat_id: int, params: dict) -> dict:
        return self.__json_post(f"categories/{cat_id}", params)

    def create_category(self, params: dict) -> dict:
        return self.__json_post("categories", params)

    # Items

    def get_items(self) -> dict:
        return self.__json_get("items")

    def get_item(self, item_id: int) -> dict:
        return self.__json_get(f"items/{item_id}")

    def update_item(self, item_id: int, params: dict) -> dict:
        return self.__json_post(f"items/{item_id}", params)

    def create_item(self, params: dict) -> dict:
        return self.__json_post("items", params)

    # Item pictures

    def get_item_picture(self, item_id: int, index: int):
        return self.__json_get(f"items/{item_id}/picture/{index}")

    def update_item_picture(self, item_id: int, index: int, filename: str):
        return self.__json_postfile(f"items/{item_id}/picture/{index}", filename)

    def create_item_picture(self, item_id: int, filename: str):
        return self.__json_postfile(f"items/{item_id}/picture", filename)

    def _generate_oidc_config(self, authority_url):
        r = requests.get(
            f"{authority_url}/.well-known/openid-configuration", timeout=20
        )
        r.raise_for_status()
        authority_cfg = r.json()
        return oidc_client.ProviderConfig(
            authority_cfg["issuer"],
            authority_cfg["authorization_endpoint"],
            authority_cfg["token_endpoint"],
        )

    def auth_interactive(self) -> bool:
        "Launch a browser and listen on a local port 39303 for tokens"

        cfg = self._generate_oidc_config(f"https://{self.__info['domain']}")
        auth = oidc_client.login(
            cfg,
            "wWKvUo1xxIozwbIrwSv4jB17xPsRTWD4",
            redirect_uri="http://localhost:39303",
            interactive=True,
        )
        self._tokens = {
            "access": auth.access_token,
            "expires_at": datetime.datetime.now()
            + datetime.timedelta(seconds=auth.expires_in),
            "id": auth.id_token,
            "refresh": auth.refresh_token,
        }
        self._session.headers.update(
            {"Authorization": f"Bearer {self._tokens['access']}"}
        )
        self.__loginfunc = functools.partial(self.authenticate_interactive, self)
        return True

    def auth_apikey(self, apikey: str) -> None:
        self._tokens["apikey"] = apikey
        self._session.headers.update({"Authorization": f"Bearer {apikey}"})


if __name__ == "__main__":
    apikey = os.getenv("LUDOTHEQUE_APIKEY")
    if not apikey:
        sys.exit("Please define LUDOTHEQUE_APIKEY")

    ludo = Ludotheque("https://ludotheque.fly.dev/")
    ludo.auth_apikey(apikey)
    print(ludo.get_info())
    print(ludo.get_account())
