import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Link, useLocation } from "wouter";
import { Box, Collapse, Divider, Icon, Typography } from "@mui/material";
import { useState } from "react";
import { useGlobalStore } from "../hooks/global_store";

interface SideMenuProps {
  setIsDrawerOpen: (arg0: boolean) => void;
}

export function SideMenu(props: SideMenuProps) {
  const [location] = useLocation();
  const { info, account } = useGlobalStore();
  const [adminOpen, adminSetOpen] = useState(false);
  const [inventoryOpen, inventorySetOpen] = useState(false);

  const handleClickAdmin = () => {
    adminSetOpen(!adminOpen);
    inventorySetOpen(false);
  };
  const handleClickInventaire = () => {
    inventorySetOpen(!inventoryOpen);
    adminSetOpen(false);
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
          <img
            src="/logosmall.webp"
            style={{ maxWidth: "100%" }}
            loading="lazy"
          />
        </ListItem>
        <ListItem
          component={Link}
          to="/items"
          onClick={() => {
            window.umami?.track("SideBar: Liste des Jeux");
            props.setIsDrawerOpen(false);
          }}
          sx={{ ...styleUrl("/items") }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <Icon>list</Icon>
          </ListItemIcon>
          <ListItemText primary="Liste des jeux" />
        </ListItem>
        {account?.id ? (
          <ListItem
            component={Link}
            to={`/users/${account.id}`}
            onClick={() => {
              window.umami?.track("SideBar: Mon Compte");
              props.setIsDrawerOpen(false);
            }}
            sx={{ ...styleUrl(`/users/${account.id}`) }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon>account_circle</Icon>
            </ListItemIcon>
            <ListItemText primary="Mon compte" />
          </ListItem>
        ) : (
          ""
        )}
        {account?.rights.includes("loan_create") && (
          <>
            <Divider />
            <ListItem
              component={Link}
              to="/loans/new"
              onClick={() => {
                window.umami?.track("SideBar: Nouvel Emprunt");
                props.setIsDrawerOpen(false);
              }}
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
        {account?.rights.includes("user_list") && (
          <>
            <Divider />
            <ListItem
              component={Link}
              to="/users"
              onClick={() => {
                window.umami?.track("SideBar: Liste Adhérents");
                props.setIsDrawerOpen(false);
              }}
              sx={{ ...styleUrl("/users") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>list</Icon>
              </ListItemIcon>
              <ListItemText primary="Liste adhérents" />
            </ListItem>
          </>
        )}
        {account?.rights.includes("user_create") && (
          <>
            <ListItem
              component={Link}
              to="/users/new"
              onClick={() => {
                window.umami?.track("SideBar: Nouvel Adhérent");
                props.setIsDrawerOpen(false);
              }}
              sx={{ ...styleUrl("/users/new") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>person_add_alt1</Icon>
              </ListItemIcon>
              <ListItemText primary="Nouvel adhérent" />
            </ListItem>

            <Divider />
          </>
        )}
        {account?.rights.includes("system") && (
          <>
            <ListItem sx={{ ...styleUrl("/admin") }} onClick={handleClickAdmin}>
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
                  onClick={() => {
                    window.umami?.track("SideBar: Feuille de Caisse");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/ledger"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>account_balance</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Feuille de caisse" />
                </ListItem>

                {/* Emprunts en retard */}
                <ListItem
                  component={Link}
                  to="/loans/late"
                  onClick={() => {
                    window.umami?.track("SideBar: Emprunts en retard");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/loans/late"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>alarm</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Jeux en retards" />
                </ListItem>

                {/* Documents */}
                <ListItem
                  component={Link}
                  to="/documents"
                  onClick={() => {
                    window.umami?.track("SideBar: Documents");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/documents"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>description</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Documents" />
                </ListItem>

                {/* Stats */}
                <ListItem
                  component={Link}
                  to="/stats"
                  onClick={() => {
                    window.umami?.track("SideBar: Statistiques");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/stats"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>numbers</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Statistiques" />
                </ListItem>
              </List>
            </Collapse>

            <ListItem
              sx={{ ...styleUrl("/inventorymenu") }}
              onClick={handleClickInventaire}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>find_replace</Icon>
              </ListItemIcon>
              <ListItemText primary="Inventaire" />
              {inventoryOpen ? (
                <Icon>expand_less</Icon>
              ) : (
                <Icon>expand_more</Icon>
              )}
            </ListItem>
            <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Inventaire */}
                <ListItem
                  component={Link}
                  to="/inventory"
                  onClick={() => {
                    window.umami?.track("SideBar: Inventaire Scan");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/inventory"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>list_alt</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Scanner" />
                </ListItem>

                {/* Inventaire inverse */}
                <ListItem
                  component={Link}
                  to="/inventoryrev"
                  onClick={() => {
                    window.umami?.track("SideBar: Inventaire Inverse");
                    props.setIsDrawerOpen(false);
                  }}
                  sx={{ ...styleUrl("/inventoryrev"), pl: 4 }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <Icon>settings_backup_restore</Icon>
                  </ListItemIcon>
                  <ListItemText primary="Trouve le jeu" />
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
