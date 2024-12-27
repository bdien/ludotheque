import { useSWRConfig } from "swr";
import { useLocation } from "wouter";
import { createLoan, fetchItem, fetchUser } from "../api/calls";
import { useEffect, useState } from "react";
import { User, ItemModel, LoanCreateResult } from "../api/models";
import { UserSearch } from "../components/user_search";
import { ItemSearch } from "../components/item_search";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import Typography from "@mui/material/Typography";
import { useInfo } from "../api/hooks";
import {
  LoanItemTable,
  LoanItemTableEntry,
} from "../components/loan_item_table";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";

const fakeItemAdhesion: ItemModel = { id: -1, name: "Adhésion" };
const fakeItemCarte: ItemModel = { id: -2, name: "Remplissage carte" };

export function Loan() {
  const queryParameters = new URLSearchParams(window.location.search);
  const initialItem = queryParameters.get("item");
  const initialUser = queryParameters.get("user");
  const { mutate } = useSWRConfig();
  const { info } = useInfo();
  const [_location, setLocation] = useLocation();
  const [editBusy, setEditBusy] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [loanResult, setLoanResult] = useState<LoanCreateResult | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openAdd = Boolean(anchorEl);
  const menuAddLoanOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const menuAddLoanClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!user || !items.length) {
      setLoanResult(null);
      return;
    }

    createLoan(
      user.id,
      items.map((i) => i.id),
      true,
    ).then(setLoanResult);
  }, [user, items]);

  function onSubmit(user: User, items: ItemModel[]) {
    setApiError(null);
    setEditBusy(true);

    createLoan(
      user.id,
      items.map((i) => i.id),
      false,
    )
      .then(() => {
        mutate(`/api/users/${user.id}`);
        items.map((i) => mutate(`/api/items/${i.id}`));
        setLocation(`/users/${user.id}`);
      })
      .catch((err) => {
        console.log(err);
        setApiError("Erreur de communication");
      })
      .finally(() => setEditBusy(false));
  }

  function itemPrice(item: ItemModel) {
    if (!info) return 0;

    if (item.id === -1) return info.pricing.yearly;
    if (item.id === -2) return info.pricing.card;
    if (item.big) return info.pricing.big;

    return info.pricing.regular;
  }

  function addItem(item: ItemModel) {
    if (items.some((i) => i.id === item.id)) return;
    setItems((current) => [...current, item]);
  }
  function removeItem(item: ItemModel) {
    const idx = items.indexOf(item);
    if (idx != -1) removeItemIndex(idx);
  }

  // Transform items into LoanItemTableEntry
  const loanItems: LoanItemTableEntry[] = items.map((i, idx) => ({
    name: i.id > 0 ? `[${i.id}] ${i.name}` : i.name,
    price: itemPrice(i),
    simulatedPrice: loanResult?.items_cost[idx],
  }));

  // Function to remove a specific index
  function removeItemIndex(idx: number) {
    setItems((items) => [...items.slice(0, idx), ...items.slice(idx + 1)]);
  }

  // Function to add/remove items when changing user
  function changeUser(user: User | null) {
    // If user must renew its subscription, add it to the loans
    if (user && new Date(user?.subscription ?? "") <= new Date())
      addItem(fakeItemAdhesion);
    else removeItem(fakeItemAdhesion);

    setUser(user);
  }

  // Initial Item (If present in URL)
  if (initialItem)
    fetchItem(parseInt(initialItem)).then((item) => {
      addItem(item);
      window.history.replaceState(
        {},
        document.title,
        location.href.split("?")[0],
      );
    });
  // Initial User (if present in URL)
  if (initialUser)
    fetchUser(parseInt(initialUser)).then((user) => {
      changeUser(user);
      window.history.replaceState(
        {},
        document.title,
        location.href.split("?")[0],
      );
    });

  return (
    <Box sx={{ m: 0.5 }}>
      {apiError && (
        <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Emprunteur
        </Typography>
        <UserSearch user={user} setUser={changeUser} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Jeux
        </Typography>
        <Box display="flex" sx={{ mb: 1.5 }}>
          <ItemSearch setItem={addItem} excludesIds={items.map((i) => i.id)} />

          <Button onClick={menuAddLoanOpen}>
            <Icon>add</Icon>
          </Button>
          <Menu
            id="menu-add-loan"
            anchorEl={anchorEl}
            open={openAdd}
            onClose={menuAddLoanClose}
          >
            <MenuItem
              onClick={() => {
                addItem(fakeItemAdhesion);
                menuAddLoanClose();
              }}
            >
              Adhésion
            </MenuItem>
            <MenuItem
              onClick={() => {
                addItem(fakeItemCarte);
                menuAddLoanClose();
              }}
            >
              Remplissage carte
            </MenuItem>
          </Menu>
        </Box>
        <LoanItemTable items={loanItems} removeItem={removeItemIndex} />
      </Box>

      {loanResult && (
        <Box>
          <Typography variant="h6" sx={{ mb: 0 }}>
            Total
          </Typography>
          <Typography sx={{ mr: "10%" }} align="right" variant="h2">
            <b>{loanResult.topay.real}€</b>
          </Typography>

          {loanResult.topay.credit || user?.role != "user" ? (
            <Box sx={{ textAlign: "right", mr: "10%" }}>
              {loanResult.topay.credit > 0 &&
                `${loanResult.topay.credit}€ pris sur la carte`}
              {user?.role == "benevole" && "Bénévole"}
              {user?.role == "admin" && "Membre du Bureau"}
            </Box>
          ) : (
            ""
          )}
        </Box>
      )}

      <LoadingButton
        variant="contained"
        fullWidth
        size="large"
        color="secondary"
        loading={editBusy}
        disabled={!items.length || !user}
        sx={{ mt: "15px", p: 1.5 }}
        onClick={() => onSubmit(user as User, items)}
      >
        Valider
      </LoadingButton>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "20px" }}
        onClick={() => history.back()}
      >
        Annuler
      </Button>
    </Box>
  );
}
