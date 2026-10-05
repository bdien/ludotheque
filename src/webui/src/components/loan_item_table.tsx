import { useAutoAnimate } from "@formkit/auto-animate/react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { ageColors } from "./age_chip";
import { Stack } from "@mui/material";

export interface LoanItemTableEntry {
  id: number;
  age?: number;
  name: string;
  price: number;
  is_extension?: boolean;
  simulatedPrice?: number;
  offered?: boolean;
}

interface LoanItemTableProps {
  items: LoanItemTableEntry[];
  removeItem: (idx: number) => void;
}

function iconForId(id: number, age?: number) {
  if (id === -1) return <Icon sx={{ color: "primary.main", fontSize: 32 }}>credit_score</Icon>;
  if (id === -2) return <Icon sx={{ color: "primary.main", fontSize: 32 }}>loyalty</Icon>;

  const [bgColor, fgColor] = ageColors(age);
  return (
    <Box
      sx={{
        borderRadius: 1,
        textAlign: "center",
        px: 0.5,
        width: "3em",
        border: "1px solid lightgrey",
        backgroundColor: bgColor,
        color: fgColor,
      }}
    >
      {id}
    </Box>
  );
}

export function LoanItemTable(props: LoanItemTableProps) {
  const [parent] = useAutoAnimate();

  if (props.items.length === 0) {
    return;
  }

  return (
    <List sx={{ mt: 1, bgcolor: "background.paper" }} component={Paper} ref={parent}>
      {props.items.map((i, idx) => (
        <ListItem key={i.name} disableGutters divider={idx < props.items.length - 1}>
          <ListItemIcon sx={{ justifyContent: "center" }}>{iconForId(i.id, i.age)}</ListItemIcon>
          <ListItemText sx={{ display: "flex", alignItems: "center" }}>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              <span>{i.name}</span>
              {i.is_extension && (
                <Icon aria-label="Extension" fontSize="small">
                  extension
                </Icon>
              )}
            </Stack>
          </ListItemText>
          <Stack
            direction="row"
            spacing={0}
            alignItems="center"
          >
            {i.offered ? (
              <Chip size="small" label="0€" color="success" />
            ) : (
              <span>
                <b>{i.simulatedPrice ?? i.price}€</b>
              </span>
            )}
            <IconButton
              sx={{ py: 0, pl: 0.75 }}
              size="large"
              color="warning"
              onClick={() => props.removeItem(idx)}
            >
              <Icon>clear</Icon>
            </IconButton>
          </Stack>
        </ListItem>
      ))}
    </List>
  );
}
