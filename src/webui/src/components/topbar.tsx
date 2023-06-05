import { useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { useAccount } from "../api/hooks";
import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Link } from "wouter";
import Box from "@mui/material/Box";
import { RandomColors } from "./random_colors";

interface TopBarProps {
  width: number;
}

export function TopBar(props: TopBarProps) {
  const logotxt = useMemo(
    () => <RandomColors txt="Ludo du Poisson-Lune" />,
    [],
  );
  const { account } = useAccount();
  const [anchorUserMenu, setAnchorUserMenu] = useState<null | HTMLElement>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorUserMenu(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorUserMenu(null);
  };

  const drawer = (
    <>
      <img src="/logo.png" />
      <List>
        <hr />
        <ListItem
          component={Link}
          to="/"
          onClick={() => setIsDrawerOpen(false)}
        >
          <ListItemIcon>
            <Icon>home</Icon>
          </ListItemIcon>
          <ListItemText primary="Accueil" />
        </ListItem>
        <ListItem
          component={Link}
          to="/items"
          onClick={() => setIsDrawerOpen(false)}
        >
          <ListItemIcon>
            <Icon>list</Icon>
          </ListItemIcon>
          <ListItemText primary="Liste de Jeux" />
        </ListItem>
        {account && (
          <ListItem
            component={Link}
            to={`/users/${account.id}`}
            onClick={() => setIsDrawerOpen(false)}
          >
            <ListItemIcon>
              <Icon>account_circle</Icon>
            </ListItemIcon>
            <ListItemText primary="Mes emprunts" />
          </ListItem>
        )}
        <hr />
        <ListItem
          component={Link}
          to="/loans/new"
          onClick={() => setIsDrawerOpen(false)}
        >
          <ListItemIcon>
            <Icon>playlist_add</Icon>
          </ListItemIcon>
          <ListItemText primary="Nouvel emprunt" />
        </ListItem>
        <ListItem
          component={Link}
          to="/users/new"
          onClick={() => setIsDrawerOpen(false)}
        >
          <ListItemIcon>
            <Icon>person_add_alt1</Icon>
          </ListItemIcon>
          <ListItemText primary="Nouvel adhérent" />
        </ListItem>
        <ListItem
          component={Link}
          to="/items/new"
          onClick={() => setIsDrawerOpen(false)}
        >
          <ListItemIcon>
            <Icon>post_add</Icon>
          </ListItemIcon>
          <ListItemText primary="Nouvel objet" />
        </ListItem>
      </List>
    </>
  );

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${props.width}px)` },
            ml: { sm: `${props.width}px` },
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Ouvrir le menu"
              onClick={() => setIsDrawerOpen(true)}
              sx={{ mr: 1, display: { sm: "none" } }}
            >
              <Icon>menu</Icon>
            </IconButton>

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {logotxt}
            </Typography>

            {account && (
              <div>
                <IconButton color="inherit">
                  <Icon color="warning">warning</Icon>
                </IconButton>
                <IconButton
                  aria-label="account of current user"
                  aria-haspopup="true"
                  onClick={handleUserMenu}
                  color="inherit"
                >
                  <Icon>account_circle</Icon>
                </IconButton>
                <Menu
                  id="usermenu-appbar"
                  anchorEl={anchorUserMenu}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorUserMenu)}
                  onClose={handleUserMenuClose}
                >
                  <MenuItem onClick={handleUserMenuClose}>Mon profil</MenuItem>
                  <MenuItem onClick={handleUserMenuClose}>
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </div>
            )}
            {!account && <Button color="inherit">Login</Button>}
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: props.width }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: props.width,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: props.width,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      </Box>
    </>
  );
}
