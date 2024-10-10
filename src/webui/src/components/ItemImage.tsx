import { useItem } from "../api/hooks";
import { Link } from "wouter";
import Skeleton from "@mui/material/Skeleton";

interface ItemImageProps {
  id: number;
}

export function ItemImage(props: ItemImageProps) {
  const { item } = useItem(props.id);

  const picture = item?.pictures?.length
    ? item.pictures[0]
    : "../../notavailable.webp";

  return (
    <>
      {item ? (
        <Link href={`/items/${item.id}`}>
          <img
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              borderRadius: "10px",
              filter: "drop-shadow(6px 6px 8px rgba(0,0,0,0.3))",
            }}
            src={`/storage/thumb/${picture}`}
          />
        </Link>
      ) : (
        <Skeleton variant="rounded" height="100%" sx={{ aspectRatio: 1 }} />
      )}
    </>
  );
}

export default ItemImage;
