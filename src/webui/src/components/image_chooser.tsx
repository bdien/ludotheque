import { Icon, Box, Button } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { DraggableImage } from "./DraggableImage";
import Resizer from "react-image-file-resizer";

interface ImageChooserProps {
  onImageChange: (items: string[]) => void;
  src: string[] | undefined;
}

export function ImageChooser(props: ImageChooserProps) {
  const [imgs, setImgs] = useState<string[]>(props.src ?? []);

  // Call onImageChange if needed
  useEffect(() => {
    props.onImageChange(imgs);
  }, [imgs]);

  // Image move
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id == over.id) return;

    setImgs((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  // New image (Result of filepicker, resize image and handle it)
  function handleFilePicker(e: ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;

    // New image, resize it and let the parent knows that it is there
    if (files != null && files.length > 0) {
      Resizer.imageFileResizer(files[0], 800, 800, "WEBP", 90, 0, (uri) => {
        setImgs((imgs) => imgs.concat(uri as string));
      });
    }
  }

  // Remove image
  function handleDeleteImage(filename: string) {
    setImgs((items) => items.filter((i) => i !== filename));
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Box>
        <SortableContext items={imgs}>
          {imgs.map((filename) => (
            <DraggableImage
              key={filename}
              filename={filename}
              onRemove={handleDeleteImage}
            />
          ))}
        </SortableContext>
      </Box>
      <Button component="label" startIcon={<Icon>add</Icon>}>
        Ajouter une image
        <input
          type="file"
          onChange={(e) => handleFilePicker(e)}
          accept="image/*"
          hidden
        />
      </Button>
    </DndContext>
  );
}
