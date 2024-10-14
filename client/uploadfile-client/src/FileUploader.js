import { InboxOutlined } from "@ant-design/icons";
import "./FileUploader.css";
import { useRef } from "react";
import useDrag from "./hooks/useDrag";

function FileUploader() {
  const uploadContainerRef = useRef(null);
  useDrag(uploadContainerRef);
  return (
    <div className="upload-container" ref={uploadContainerRef}>
      <InboxOutlined />
    </div>
  );
}

export default FileUploader;
