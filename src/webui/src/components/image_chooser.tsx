import Icon from "@mui/material/Icon";
import { ChangeEvent, useState } from "react";

interface ImageChooserProps {
  onImageChange: (params: File | null) => any;
  src: string | null | undefined;
}

export function ImageChooser(props: ImageChooserProps) {
  const [img, setImg] = useState<string | null | undefined>(props.src);

  const handleFilePicker = (e: ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target;

    if (img) {
      URL.revokeObjectURL(img);
    }

    if (files != null && files.length > 0) {
      let newimg = URL.createObjectURL(files[0]);
      setImg(newimg);
      if (props.onImageChange) {
        props.onImageChange(files[0]);
      }
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
            src={img ?? "/img/notavailable.png"}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </label>
      </div>
    </>
  );
}
