import { useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { useAccount, useInfo } from "../api/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Link, useLocation } from "wouter";
import Box from "@mui/material/Box";
import { RandomColors } from "./random_colors";
import Avatar from "@mui/material/Avatar";

interface TopBarProps {
  width: number;
}

export function TopBar(props: TopBarProps) {
  const [location] = useLocation();
  const { info } = useInfo();

  const logotxt = useMemo(
    () => <RandomColors txt="Ludo du Poisson-Lune" />,
    [],
  );
  const { account } = useAccount();
  const [anchorUserMenu, setAnchorUserMenu] = useState<null | HTMLElement>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorUserMenu(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorUserMenu(null);
  };

  function styleUrl(url: string) {
    if (location == url)
      return { backgroundColor: "primary.main", color: "white" };
    return {
      "&:hover": { backgroundColor: "#E5E7F9", color: "text.primary" },
      color: "text.secondary",
    };
  }

  const drawer = (
    <Box style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      <List sx={{ flexGrow: "1" }}>
        <ListItem
          component={Link}
          to="/"
          onClick={() => setIsDrawerOpen(false)}
        >
          <img src="/logosmall.webp" style={{ maxWidth: "100%" }} />
        </ListItem>
        <ListItem
          component={Link}
          to="/items"
          onClick={() => setIsDrawerOpen(false)}
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
            onClick={() => setIsDrawerOpen(false)}
            sx={{ ...styleUrl(`/users/${account.id}`) }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon>account_circle</Icon>
            </ListItemIcon>
            <ListItemText primary="Mes emprunts" />
          </ListItem>
        )}
        {(account?.role == "admin" || account?.role == "benevole") && (
          <>
            <ListItem
              component={Link}
              to="/loans/new"
              onClick={() => setIsDrawerOpen(false)}
              sx={{
                borderTop: "1px solid #E5E5E5",
                borderBottom: "1px solid #E5E5E5",
                mt: 1,
                ...styleUrl("/loans/new"),
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>playlist_add</Icon>
              </ListItemIcon>
              <ListItemText primary="Nouvel emprunt" />
            </ListItem>
            <ListItem
              component={Link}
              to="/users"
              onClick={() => setIsDrawerOpen(false)}
              sx={{ ...styleUrl("/users") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>list</Icon>
              </ListItemIcon>
              <ListItemText primary="Liste adhérents" />
            </ListItem>
            <ListItem
              component={Link}
              to="/users/new"
              onClick={() => setIsDrawerOpen(false)}
              sx={{ ...styleUrl("/users/new") }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <Icon>person_add_alt1</Icon>
              </ListItemIcon>
              <ListItemText primary="Nouvel adhérent" />
            </ListItem>
          </>
        )}
        {account?.role == "admin" && (
          <ListItem
            component={Link}
            to="/items/new"
            onClick={() => setIsDrawerOpen(false)}
            sx={{ ...styleUrl("/items/new") }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon>post_add</Icon>
            </ListItemIcon>
            <ListItemText primary="Nouveau jeu" />
          </ListItem>
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
            Version {info.version}
          </Typography>
        </Box>
      )}
    </Box>
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

            <Typography
              sx={{
                flexGrow: 1,
                fontFamily: "Satisfy",
                fontSize: "clamp(5px, 7vw, 36px)",
                textShadow: "1px 1px 5px rgba(0,0,0,0.5)",
              }}
            >
              {logotxt}
            </Typography>

            {isAuthenticated && user && (
              <div>
                <IconButton
                  aria-label="account of current user"
                  aria-haspopup="true"
                  onClick={handleUserMenu}
                  color="inherit"
                  sx={{ p: 0 }}
                >
                  <Avatar alt={user.name} src={user.picture} />
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
                  <MenuItem onClick={handleUserMenuClose}>
                    {user?.name}
                  </MenuItem>
                  <MenuItem
                    onClick={() =>
                      logout({
                        logoutParams: { returnTo: window.location.origin },
                      })
                    }
                  >
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </div>
            )}
            {!isAuthenticated && (
              <Button
                sx={{ minWidth: 0 }}
                color="inherit"
                onClick={() => loginWithRedirect()}
              >
                <Icon>person_outline</Icon>
              </Button>
            )}
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
