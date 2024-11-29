import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import Button from "@mui/material/Button";
import { updateItem } from "../api/calls";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

interface InventoryItemProps {
  id: number;
  onClick: () => void;
}

function dayscolor(days: number) {
  if (days < 180) return "green";
  if (days < 365) return "orange";
  return "red";
}

export function InventoryItem(props: InventoryItemProps) {
  const { item, error, mutate } = useItem(props.id);

  function onClick() {
    if (item && mutate)
      updateItem(item.id, { lastseen: format(new Date(), "yyyy-MM-dd") }).then(
        () => {
          mutate();
          props.onClick();
        },
      );
  }

  if (error) return <div>Jeu non trouvé</div>;
  if (!item) return <></>;

  const days = differenceInDays(new Date(), item.lastseen ?? "");

  const picture = item?.pictures?.length
    ? item.pictures[0]
    : "../../notavailable.webp";

  // render data
  return (
    <>
      <Button sx={{ m: 1 }} variant="contained" onClick={onClick}>
        Marquer comme vu
      </Button>
      <br />

      <Box sx={{ mt: 1 }}>
        <Typography variant="h5">
          <Link href={`/items/${item.id}`}>{item ? item.name : ""}</Link>
          {item.status == "out" && (
            <Icon
              fontSize="small"
              color="secondary"
              sx={{ opacity: 0.7, pt: 0.2, ml: 1 }}
            >
              logout
            </Icon>
          )}
          {!item.enabled && (
            <Icon
              fontSize="small"
              color="error"
              sx={{ opacity: 0.7, pt: 0.2, ml: 1 }}
            >
              construction
            </Icon>
          )}
        </Typography>
        Vu la dernière fois{" "}
        <Box sx={{ display: "inline", color: dayscolor(days) }}>
          {days
            ? "il y a " +
              formatDistanceToNow(item.lastseen ?? "", { locale: fr })
            : "aujourd'hui"}
        </Box>
      </Box>

      <Box
        display="flex"
        sx={{ mt: 1, maxWidth: "95vw", height: "clamp(200px, 35vh, 550px)" }}
      >
        <img src={`/storage/img/${picture}`} />
      </Box>
    </>
  );
}

export default InventoryItem;
