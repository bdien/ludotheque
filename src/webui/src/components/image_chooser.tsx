import Icon from "@mui/material/Icon";
import { ChangeEvent, useState } from "react";
import Resizer from "react-image-file-resizer";

interface ImageChooserProps {
  onImageChange: (params: File | null) => void;
  src: string | null | undefined;
}

export function ImageChooser(props: ImageChooserProps) {
  const [img, setImg] = useState<string | null | undefined>(props.src);

  const handleFilePicker = (e: ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target;

    // Delete previous images
    if (img) {
      URL.revokeObjectURL(img);
    }

    // New image, resize it and let the parent knows that it is there
    if (files != null && files.length > 0) {
      // Immediatly display image
      const newimg = URL.createObjectURL(files[0]);
      setImg(newimg);

      // Resize in background before alerting parent
      if (props.onImageChange)
        Resizer.imageFileResizer(
          files[0],
          800,
          800,
          "WEBP",
          90,
          0,
          (uri) => {
            props.onImageChange(uri as File);
          },
          "file",
        );
    }
  };

  const handleDeleteImage = (): void => {
    setImg(null);
    if (props.onImageChange) {
      props.onImageChange(null);
    }
  };

  return (
    <>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {img && (
          <div
            onClick={() => handleDeleteImage()}
            style={{
              float: "right",
              bottom: 0,
              right: 0,
              position: "absolute",
            }}
          >
            <Icon fontSize="large">delete</Icon>
          </div>
        )}

        <input
          type="file"
          onChange={(e) => handleFilePicker(e)}
          accept="image/*"
          id="file_uploader"
          hidden
        />
        <label htmlFor="file_uploader">
          <img
            src={img ?? "/notavailable_edit.webp"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </label>
      </div>
    </>
  );
}
