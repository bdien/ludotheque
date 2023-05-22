import { useState } from "react";
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

interface TopBarProps {
  title?: any;
}

export function TopBar(props: TopBarProps) {
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

  // render data
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setIsDrawerOpen(true)}
          sx={{ mr: 1 }}
        >
          <Icon>menu</Icon>
        </IconButton>

        <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <List>
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
              to="/me"
              onClick={() => setIsDrawerOpen(false)}
            >
              <ListItemIcon>
                <Icon>account_circle</Icon>
              </ListItemIcon>
              <ListItemText primary="Mes emprunts" />
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
          </List>
        </Drawer>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {props.title}
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
              <MenuItem onClick={handleUserMenuClose}>Se déconnecter</MenuItem>
            </Menu>
          </div>
        )}
        {!account && <Button color="inherit">Login</Button>}
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
