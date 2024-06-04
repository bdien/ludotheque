import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Link, useLocation } from "wouter";
import { useAccount, useInfo } from "../api/hooks";
import { Box, Collapse, Divider, Icon, Typography } from "@mui/material";
import { useState } from "react";

interface SideMenuProps {
  setIsDrawerOpen: (arg0: boolean) => any;
}

export function SideMenu(props: SideMenuProps) {
  const [location] = useLocation();
  const { info } = useInfo();
  const { account } = useAccount();
  const [adminOpen, adminSetOpen] = useState(false);

  const handleClick = () => {
    adminSetOpen(!adminOpen);
  };

  function styleUrl(url: string) {
    if (location == url)
      return { backgroundColor: "primary.main", color: "white" };
    return {
      "&:hover": { backgroundColor: "#E5E7F9", color: "text.primary" },
      color: "text.secondary",
    };
  }

  return (
    <Box style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      <List sx={{ flexGrow: "1" }}>
        <ListItem
          component={Link}
          to="/"
          onClick={() => props.setIsDrawerOpen(false)}
        >
          <img src="/logosmall.webp" style={{ maxWidth: "100%" }} />
        </ListItem>
        <ListItem
          component={Link}
          to="/items"
          onClick={() => props.setIsDrawerOpen(false)}
          sx={{ ...styleUrl("/items") }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Icon>list</Icon>
          </ListItemIcon>
          <ListItemText primary="Liste des Jeux" />
        </ListItem>
        {account?.id && (
          <ListItem
            component={Link}
            to={`/users/${account.id}`}
            onClick={() => props.setIsDrawerOpen(false)}
            sx={{ ...styleUrl(`/users/${account.id}`) }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon>account_circle</Icon>
            </ListItemIcon>
            <ListItemText primary="Mes emprunts" />
          </ListItem>
        )}
        {account?.role == "admin" && (
          <>
            <Divider />
            <ListItem
              component={Link}
              to="/loans/new"
              onClick={() => props.setIsDrawerOpen(false)}
              sx={{
                ...styleUrl("/loans/new"),
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>playlist_add</Icon>
              </ListItemIcon>
              <ListItemText primary="Nouvel emprunt" />
            </ListItem>
          </>
        )}
        {(account?.role == "admin" || account?.role == "benevole") && (
          <>
            <Divider />
            <ListItem
              component={Link}
              to="/users"
              onClick={() => props.setIsDrawerOpen(false)}
              sx={{ ...styleUrl("/users") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>list</Icon>
              </ListItemIcon>
              <ListItemText primary="Liste adhérents" />
            </ListItem>
          </>
        )}
        {account?.role == "admin" && (
          <>
            <ListItem
              component={Link}
              to="/users/new"
              onClick={() => props.setIsDrawerOpen(false)}
              sx={{ ...styleUrl("/users/new") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>person_add_alt1</Icon>
              </ListItemIcon>
              <ListItemText primary="Nouvel adhérent" />
            </ListItem>

            <Divider />

            <ListItem sx={{ ...styleUrl("/admin") }} onClick={handleClick}>
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>star_border</Icon>
              </ListItemIcon>
              <ListItemText primary="Administration" />
              {adminOpen ? <Icon>expand_less</Icon> : <Icon>expand_more</Icon>}
            </ListItem>
            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Nouveau Jeu */}
                <ListItem
                  component={Link}
                  to="/items/new"
                  onClick={() => props.setIsDrawerOpen(false)}
                  sx={{ ...styleUrl("/items/new"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>post_add</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Nouveau jeu" />
                </ListItem>

                {/* Feuille de Caisse */}
                <ListItem
                  component={Link}
                  to="/ledger"
                  onClick={() => props.setIsDrawerOpen(false)}
                  sx={{ ...styleUrl("/ledger"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>account_balance</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Feuille de Caisse" />
                </ListItem>

                {/* Emprunts en retard */}
                <ListItem
                  component={Link}
                  to="/loans/late"
                  onClick={() => props.setIsDrawerOpen(false)}
                  sx={{ ...styleUrl("/loans/late"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>alarm</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Jeux en retards" />
                </ListItem>

                {/* Stats */}
                <ListItem
                  component={Link}
                  to="/stats"
                  onClick={() => props.setIsDrawerOpen(false)}
                  sx={{ ...styleUrl("/stats"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>numbers</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Statistiques" />
                </ListItem>
              </List>
            </Collapse>
          </>
        )}
      </List>

      {/* Version at the bottom of the sidebar */}
      {info?.version && (
        <Box>
          <Typography
            color="text.disabled"
            fontSize="0.75em"
            sx={{ m: 2, opacity: 0.3 }}
          >
            Version {info.version} / DEVDEV
          </Typography>
        </Box>
      )}
    </Box>
  );
}
