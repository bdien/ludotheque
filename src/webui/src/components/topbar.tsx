import { useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { useAuth0 } from "@auth0/auth0-react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import { RandomColors } from "./random_colors";
import Avatar from "@mui/material/Avatar";
import { SideMenu } from "./sidemenu";

interface TopBarProps {
  width: number;
}

export function TopBar(props: TopBarProps) {
  const logotxt = useMemo(
    () => <RandomColors txt="Ludo du Poisson-Lune" />,
    [],
  );

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

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          elevation={1}
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
            <SideMenu setIsDrawerOpen={setIsDrawerOpen} />
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
            <SideMenu setIsDrawerOpen={setIsDrawerOpen} />
          </Drawer>
        </Box>
      </Box>
    </>
  );
}
