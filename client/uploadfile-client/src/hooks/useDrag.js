import { message } from "antd";
import { useState, useEffect, useCallback } from "react";
import { MAX_FILE_SIZE } from "../utils/constant";

function useDrag(uploadContainerRef) {
  const [selectedFile, setSelectedFile] = useState(null);
  //存放文件预览信息，url是预览地址，type是文件类型
  const [filePreview, setFilePreview] = useState({ url: null, type: null });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const checkFile = (files) => {
    const file = files[0];
    if (!file) {
      message.error("没有选择任何文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error("文件大小不能超过2G");
      return;
    }

    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      message.error("文件类型必须是图片或视频");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    checkFile(e.dataTransfer.files);
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setFilePreview({ url, type: selectedFile.type });
    return () => {
      //revokeObjectURL可以撤销此url占用的资源
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  useEffect(() => {
    const uploadContainer = uploadContainerRef.current;
    uploadContainer.addEventListener("dragenter", handleDrag);
    uploadContainer.addEventListener("dragover", handleDrag);
    uploadContainer.addEventListener("drop", handleDrop);
    uploadContainer.addEventListener("dragleave", handleDrag);

    return () => {
      uploadContainer.removeEventListener("dragenter", handleDrag);
      uploadContainer.removeEventListener("dragover", handleDrag);
      uploadContainer.removeEventListener("drop", handleDrop);
      uploadContainer.removeEventListener("dragleave", handleDrag);
    };
  }, []);
  return { selectedFile, filePreview };
}

export default useDrag;
