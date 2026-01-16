import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import { colorMap } from "./age_chip";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export interface LoanItemTableEntry {
  id: number;
  age?: number;
  name: string;
  price: number;
  simulatedPrice?: number;
}

interface LoanItemTableProps {
  items: LoanItemTableEntry[];
  removeItem: (idx: number) => void;
}

function iconForId(id: number, age?: number) {
  if (id == -1)
    return (
      <Icon sx={{ color: "primary.main", fontSize: 32 }}>credit_score</Icon>
    );
  if (id == -2)
    return <Icon sx={{ color: "primary.main", fontSize: 32 }}>loyalty</Icon>;

  return (
    <Box
      sx={{
        borderRadius: 1,
        textAlign: "center",
        px: 0.5,
        width: "3em",
        border: "1px solid lightgrey",
        color: "black",
        backgroundColor: colorMap.get(age ?? 0),
      }}
    >
      {id}
    </Box>
  );
}

export function LoanItemTable(props: LoanItemTableProps) {
  const [parent] = useAutoAnimate();

  if (props.items.length == 0) {
    return <></>;
  }

  return (
    <List
      sx={{ mt: 1, bgcolor: "background.paper" }}
      component={Paper}
      ref={parent}
    >
      {props.items.map((i, idx) => (
        <ListItem
          key={i.name}
          disableGutters
          divider={idx < props.items.length - 1}
        >
          <ListItemIcon sx={{ justifyContent: "center" }}>
            {iconForId(i.id, i.age)}
          </ListItemIcon>
          <ListItemText>{i.name}</ListItemText>
          <span>
            <b>{i.simulatedPrice ?? i.price}€</b>
          </span>
          <span>
            <IconButton
              sx={{ py: 0, pl: 0.75 }}
              size="large"
              color="warning"
              onClick={() => props.removeItem(idx)}
            >
              <Icon>clear</Icon>
            </IconButton>
          </span>
        </ListItem>
      ))}
    </List>
  );
}
