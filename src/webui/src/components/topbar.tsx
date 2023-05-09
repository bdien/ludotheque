import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import WarningIcon from '@mui/icons-material/Warning';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useAccount } from "../hooks/api";
import { Warning } from '@mui/icons-material';

export function TopBar() {
  const { account } = useAccount();
  const [ anchorUserMenu, setAnchorUserManu ] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorUserManu(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorUserManu(null);
  };

  // render data
  return <AppBar position="static">
    <Toolbar>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Ludothèque
      </Typography>
      {account && <div>

        <IconButton color="inherit">
          <WarningIcon color="warning"/>
        </IconButton>
        <IconButton
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorUserMenu}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorUserMenu)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>Mon profil</MenuItem>
          <MenuItem onClick={handleClose}>Se déconnecter</MenuItem>
        </Menu>
      </div>}
      {!account && <Button color="inherit">Login</Button>}
    </Toolbar>
  </AppBar>;
}

export default TopBar;