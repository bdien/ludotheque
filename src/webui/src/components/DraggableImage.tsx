import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@mui/material";
import { CSSProperties } from "react";

export interface DraggableImageProps {
  filename: string;
  onRemove: (filename: string) => void;
}

export function DraggableImage(props: DraggableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.filename });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "inline-block",
    width: "clamp(150px, 47vw, 300px)",
    height: "clamp(150px, 47vw, 300px)",
    padding: "6px",
    position: "relative",
    zIndex: isDragging ? 100 : undefined,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <img
        {...attributes}
        {...listeners}
        src={
          props.filename.startsWith("data")
            ? props.filename
            : "/storage/img/" + props.filename
        }
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "white",
          cursor: isDragging ? "grabbing" : "grab",
          transition: "filter 0.3s ease",
          filter: isDragging
            ? "drop-shadow(5px 5px 8px rgba(0, 0, 0, 60%))"
            : "drop-shadow(1px 1px 1px rgba(0, 0, 0, 60%))",
        }}
      />
      <Icon
        onClick={() => props.onRemove(props.filename)}
        sx={{
          position: "absolute",
          right: "10px",
          top: "10px",
          cursor: "pointer",
        }}
      >
        delete
      </Icon>
    </div>
  );
}
