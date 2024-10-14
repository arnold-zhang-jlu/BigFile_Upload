import { InboxOutlined } from "@ant-design/icons";
import "./FileUploader.css";
import { useRef } from "react";
import useDrag from "./hooks/useDrag";

function FileUploader() {
  const uploadContainerRef = useRef(null);
  const { selectedFile, filePreview } = useDrag(uploadContainerRef);
  return (
    <div className="upload-container" ref={uploadContainerRef}>
      {/* <InboxOutlined /> */}
      {renderFilePreview(filePreview)}
    </div>
  );
}

function renderFilePreview(filePreview) {
  const { url, type } = filePreview;
  if (url) {
    if (type.startsWith("video/")) {
      return (
        <video
          src={url}
          alt="preview"
          controls
          style={{ maxWidth: "200px", maxHeight: "200px" }}
        />
      );
    } else if (type.startsWith("image/")) {
      return (
        <img
          src={url}
          alt="preview"
          controls
          style={{ maxWidth: "200px", maxHeight: "200px" }}
        />
      );
    } else {
      return url;
    }
  } else {
    return <InboxOutlined />;
  }
}

export default FileUploader;
