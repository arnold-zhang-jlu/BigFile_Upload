import { InboxOutlined } from "@ant-design/icons";
import "./FileUploader.css";
import { useRef } from "react";
import useDrag from "./hooks/useDrag";
import { Button, message } from "antd";
import { CHUNK_SIZE } from "./utils/constant";
import axiosInstance from "./utils/axiosInstance";
import axios from "axios";

function FileUploader() {
  const uploadContainerRef = useRef(null);
  const { selectedFile, filePreview } = useDrag(uploadContainerRef);

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error("你尚未选中任何文件");
      return;
    }
    const filename = await getFileName(selectedFile);
    await uploadFile(selectedFile, filename);
  };

  const renderButton = () => {
    return <Button onClick={handleUpload}>上传</Button>;
  };
  return (
    <>
      <div className="upload-container" ref={uploadContainerRef}>
        {renderFilePreview(filePreview)}
      </div>
      {renderButton()}
    </>
  );
}

//实现大文件切片上传到服务端
async function uploadFile(file, filename) {
  //把文件进行切片
  const chunks = createFileChunks(file, filename);
  //实现并行上传
  const requests = chunks.map(({ chunk, chunkFileName }) => {
    return createRequest(filename, chunkFileName, chunk);
  });

  try {
    //并行上传每个分片
    await Promise.all(requests);
    //等全部分片上传完成，向服务器发送一个合并文件的请求
    await axiosInstance.get(`/merge/${filename}`);
    message.success("文件上传完成");
  } catch (error) {
    console.log("上传出错", error);
    message.error("上传出错");
  }
}

function createFileChunks(file, filename) {
  let chunks = [];
  let count = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < count; i++) {
    let chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    chunks.push({
      chunk,
      chunkFileName: `${filename}-${i}`,
    });
  }
  return chunks;
}

function createRequest(filename, chunkFileName, chunk) {
  return axiosInstance.post(`/upload/${filename}`, chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
    params: {
      chunkFileName,
    },
  });
}

async function getFileName(file) {
  const fileHash = await caculateFileHash(file);
  const fileExtension = file.name.split(".").pop();
  return `${fileHash}.${fileExtension}`;
}

async function caculateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return bufferToHex(hashBuffer);
}

//把ArrayBuffer转换成16进制的字符串
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
