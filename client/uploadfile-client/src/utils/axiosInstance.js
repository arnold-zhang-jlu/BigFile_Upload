import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
});

//拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || "服务器端错误");
    }
  },
  (error) => {
    console.error("错误", error);
    throw error;
  }
);

export default axiosInstance;
