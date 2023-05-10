import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { useItem } from "../hooks/api";

interface MiniItemProps {
  id: number;
}

export function MiniItem(props: MiniItemProps) {
  const { item, error, isLoading } = useItem(props.id);

  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  if (!item) return <div>Server error...</div>

  // render data
  return <Card sx={{ display: 'flex', height: 'clamp(100px, 30vw, 300px)' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <CardContent sx={{ flex: '1 0 auto' }}>
        <Typography component="div" variant="h6">
          {item.name} ({item.id})
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" component="div" >
          {item.description}
        </Typography>
      </CardContent>
    </Box>
    <CardMedia
      component="img"
      sx={{ width: 'clamp(150px, 20vw, 300px)' }}
      image={"/img/" + (item.picture || "notavailable.png")}
    />
  </Card>;
}

export default MiniItem;