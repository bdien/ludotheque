import { useLocation } from "wouter";
import { createLoan, fetchItem, fetchUser } from "../api/calls";
import { useEffect, useState } from "react";
import { UserModel, ItemModel, LoanCreateResult } from "../api/models";
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

function submitLoan(user_id: number, objs_id: number[], simulation: boolean) {
  return createLoan(user_id, objs_id, simulation);
}

const fakeItemAdhesion: ItemModel = { id: -1, name: "Adhésion" };
const fakeItemCarte: ItemModel = { id: -2, name: "Remplissage carte" };

export function Loan() {
  const queryParameters = new URLSearchParams(window.location.search);
  const initialItem = queryParameters.get("item");
  const initialUser = queryParameters.get("user");
  const { info } = useInfo();
  const [_location, setLocation] = useLocation();
  const [user, setUser] = useState<UserModel | null>(null);
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
    if (!user || !items.length) return setLoanResult(null);

    submitLoan(
      user.id,
      items.map((i) => i.id),
      true,
    ).then((result) => setLoanResult(result));
  }, [user, items]);

  function itemPrice(item: ItemModel) {
    if (!info) return 0;
    if (item.id == -1) return info.pricing.yearly;
    if (item.id == -2) return info.pricing.card;
    if (item.big) return info.pricing.big;
    return info.pricing.regular;
  }

  function addItem(item: ItemModel) {
    const isthere = items.some((i) => i.id == item.id);
    if (!isthere) {
      setItems((items) => [...items, item]);
    }
  }

  // Transform items into LoanItemTableEntry
  const loanItems: LoanItemTableEntry[] = items.map((i, idx) => ({
    name: i.id > 0 ? `[${i.id}] ${i.name}` : i.name,
    price: itemPrice(i),
    simulatedPrice: loanResult?.items_cost[idx],
  }));

  // Function to remove a specific index
  function removeItem(idx: number) {
    setItems((items) => [...items.slice(0, idx), ...items.slice(idx + 1)]);
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
      setUser(user);
      window.history.replaceState(
        {},
        document.title,
        location.href.split("?")[0],
      );
    });

  return (
    <Box sx={{ m: 0.5 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
          Adhérent
        </Typography>
        <UserSearch user={user} setUser={setUser} />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" color="primary.main" sx={{ mb: 2 }}>
          Emprunts
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
        <LoanItemTable items={loanItems} removeItem={removeItem} />
      </Box>

      {loanResult && (
        <Box sx={{ mb: 2, position: "relative" }}>
          Règlement:
          <br />
          <ul>
            <li>
              Total: <b>{loanResult.topay.real}€</b>
              {loanResult.topay.credit
                ? ` (${loanResult.topay.credit}€ pris sur la carte)`
                : ""}
            </li>
            {user?.role == "benevole" && <li>Avantage Bénévole</li>}
            {user?.role == "admin" && <li>Avantage Membre du Bureau</li>}
          </ul>
        </Box>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        disabled={!items.length || !user}
        color="primary"
        sx={{ mt: "15px", p: 1.5 }}
        onClick={() =>
          user &&
          submitLoan(
            user.id,
            items.map((i) => i.id),
            false,
          ).then(() => {
            setLocation(`/users/${user.id}`);
          })
        }
      >
        Valider
      </Button>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        sx={{ mt: "15px" }}
        onClick={() => history.back()}
      >
        Annuler
      </Button>
    </Box>
  );
}
