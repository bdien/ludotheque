import Profile from './components/profile'
import TopBar from './components/topbar'
import Box from '@mui/material/Box';

function App() {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar/>
      <Profile/>
    </Box>
  );
}

export default App
