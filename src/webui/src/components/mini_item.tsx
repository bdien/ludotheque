import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useItem } from "../api/hooks";
import { Link } from "wouter";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { ItemIdBox } from "./itemIdBox";

interface MiniItemProps {
  id: number;
  late?: boolean;
  subtext?: string;
  button?: React.ReactElement;
  action?: {
    text: string | React.ReactElement;
    func: () => void;
  };
}

export function MiniItem(props: MiniItemProps) {
  const { item, error, mutate } = useItem(props.id);

  if (error) return <div>Impossible de charger: {error}</div>;
  if (!mutate) return <div>Erreur du serveur</div>;

  const picture = item?.pictures?.length
    ? item.pictures[0]
    : "../../notavailable.webp";

  // render data
  return (
    <Box
      sx={{
        display: "flex",
        height: "clamp(100px, 15vw, 200px)",
        width: "min(100%, 485px)",
        mb: 2,
        p: 0.5,
      }}
    >
      <Box
        sx={{ width: "35%", mr: 2 }}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {item ? (
          <Link
            href={`/items/${item.id}`}
            style={{ height: "100%", width: "100%" }}
          >
            <img
              style={{
                height: "100%",
                width: "100%",
                borderRadius: "10px",
                objectFit: "contain",
                filter: props.late
                  ? "drop-shadow(0px 0px 8px rgba(255,0,0,0.7))"
                  : "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
              }}
              src={`/storage/thumb/${picture}`}
            />
          </Link>
        ) : (
          <Skeleton
            sx={{ bgcolor: "grey.200" }}
            variant="rounded"
            width="100%"
            height="100%"
          />
        )}
      </Box>
      <Box width="65%">
        {item ? (
          <Typography component="div" fontWeight={600}>
            <Link href={`/items/${item.id}`} style={{ textDecoration: "none" }}>
              <Box
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                <ItemIdBox item={item} />
                {item.name}
              </Box>
            </Link>
          </Typography>
        ) : (
          <Skeleton />
        )}

        {item ? (
          <>
            {props.subtext && (
              <Typography
                variant="subtitle2"
                color={props.late ? "red" : "text.secondary"}
              >
                {props.subtext}
              </Typography>
            )}

            {props.button && props.button}

            {props.action && (
              <Button
                size="small"
                variant="outlined"
                onClick={props.action.func}
                sx={{ mt: 1 }}
              >
                {props.action.text}
              </Button>
            )}
          </>
        ) : (
          <Skeleton sx={{ bgcolor: "grey.200" }} />
        )}
      </Box>
    </Box>
  );
}

export default MiniItem;
