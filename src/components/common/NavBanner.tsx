import {useState, MouseEvent} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link } from 'react-router-dom';

const pages: Record<string, string> = {
  Sessions: '/',
  Messages: '/messages',
  'Ship Design': '/ship-design',
  'GM Controls': '/gm-controls'
};

interface NavBannerProps {
  signOut: () => void;
  userGroups: any;
  userAttributes: any;
}
export default function NavBanner({ signOut, userGroups, userAttributes }: NavBannerProps) {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLDivElement>(null);

  const handleOpenUserMenu = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
         {/* logo and title */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'Futura',
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Star Empires
          </Typography>

          {/* nav menu items */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {Object.entries(pages)
                .filter(([page]) => page !== "GM Controls" || (userGroups?.includes("GAMEMASTERS")))
                .map(([page, url]) => (
              <Button
                key={page}
                component={Link} to={url}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* settings items */}
          <Box sx={{ flexGrow: 0 }}>
           <Box sx={{ display: 'flex', alignItems: 'center', ml: 5, cursor: 'pointer' }}
             onClick={handleOpenUserMenu}
           >
              <Typography variant="h6" gutterBottom sx={{ ml: 5, color: "white" }}>
                Welcome, {userAttributes?.preferred_username}
              </Typography>
              <ArrowDropDownIcon sx={{ fontSize: 40, color: "white", ml: 0.5 }} />
            </Box>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem key="Profile"
                         component={Link} to="/profile"
                         onClick={handleCloseUserMenu}>
                    <Typography sx={{ textAlign: 'center' }}>Profile</Typography>
              </MenuItem>
              <MenuItem key="Logout"
                         onClick={signOut}>
                    <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
              </MenuItem>

            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}