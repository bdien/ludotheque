import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import Paper from "@mui/material/Paper";

interface ItemProps {
  id: number;
}

export function Item(props: ItemProps) {
  const { item, error, isLoading } = useItem(props.id);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  if (!item) return <div>Server error...</div>;

  // render data
  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Typography component="div" variant="h6">
        {item.name} ({item.id})
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" component="div">
        {item.description}
      </Typography>
      <Paper variant="outlined">
        <img src={"/img/" + (item.picture || "notavailable.png")} />
      </Paper>
    </Box>
  );
}
