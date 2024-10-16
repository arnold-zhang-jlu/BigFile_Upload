// 导入所需的模块
const express = require("express"); // 导入 Express 框架，用于创建服务器和处理路由
const logger = require("morgan"); // 导入 Morgan 日志中间件，用于记录 HTTP 请求日志
const { StatusCodes } = require("http-status-codes"); // 导入 HTTP 状态码枚举，便于使用标准的状态码
const cors = require("cors"); // 导入 CORS 中间件，用于处理跨域资源共享
const fs = require("fs-extra"); // 导入 fs-extra 模块，提供了比 Node.js 内置 fs 模块更多的文件系统方法
const path = require("path"); // 导入 path 模块，用于处理和转换文件路径
const PUBLIC_DIR = path.resolve(__dirname, "public");
const TEMP_DIR = path.resolve(__dirname, "temp");

const CHUNK_SIZE = 100 * 1024 * 1024; //每个切片大小为100MB
// 确保特定目录存在，如果不存在则创建

//存放上传后合并好的文件
fs.ensureDirSync(PUBLIC_DIR); // 确保 'public' 目录存在，如果目录不存在，则会创建。用于存放静态文件，如图片、CSS、JavaScript 等
//存放分片的文件
fs.ensureDirSync(TEMP_DIR); // 确保 'temp' 目录存在，用于存放临时文件，如上传的文件分块

// 创建 Express 应用实例

const app = express();

// 使用中间件

app.use(logger("dev")); // 使用 Morgan 日志中间件，以 'dev' 格式记录请求日志，便于开发调试
app.use(cors()); // 使用 CORS 中间件，允许跨域请求，默认情况下允许所有来源
app.use(express.json()); // 解析传入请求的 JSON 负载，挂载在 req.body 上
app.use(express.urlencoded({ extended: true })); // 解析传入请求的 URL 编码数据，支持更丰富的编码方式
app.use(express.static(path.resolve(__dirname, "public"))); // 提供静态文件服务，'public' 目录下的文件可以通过 URL 直接访问

app.post("/upload/:filename", async (req, res, next) => {
  //通过路径参数获取文件名
  const { filename } = req.params;
  console.log(`upload filename`, filename);
  //通过查询参数获取分片名
  const { chunkFileName } = req.query;
  console.log("chunkFileName", chunkFileName);
  //存储分片文件的总目录路径
  const chunkDir = path.resolve(TEMP_DIR, filename);
  //存储单个分片文件的目录路径
  const chunkFilePath = path.resolve(chunkDir, chunkFileName);
  await fs.ensureDir(chunkDir);
  const ws = fs.createWriteStream(chunkFilePath, {});
  //后面会实现暂停操作，如果客户端点击了暂停按钮，会取消上传操作，取消之后会在服务器触发请求对象的aborted事件，关闭可写流
  req.on("aborted", () => {
    ws.close();
  });
  try {
    //使用管道的方式把请求体流数据写入到文件中
    await pipeStream(req, ws);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/merge/:filename", async (req, res, next) => {
  //通过路径参数获取文件名
  const { filename } = req.params;
  try {
    await mergeChunks(filename);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

function pipeStream(rs, ws) {
  return new Promise((resolve, reject) => {
    //把可读流中的数据写入可写流中
    rs.pipe(ws).on("finish", resolve).on("error", reject);
  });
}

async function mergeChunks(filename) {
  const mergedFilePath = path.resolve(PUBLIC_DIR, filename);
  const chunkDir = path.resolve(TEMP_DIR, filename);
  const chunkFiles = await fs.readdir(chunkDir);
  //对分片按索引进行升序排列
  chunkFiles.sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));
  //为了提高性能，我们在这可以实现并行写入
  try {
    const pipes = chunkFiles.map((chunkFile, index) => {
      return pipeStream(
        fs.createReadStream(path.resolve(chunkDir, chunkFile), {
          autoClose: true,
        }),
        fs.createWriteStream(mergedFilePath, { start: index * CHUNK_SIZE })
      );
    });
    await Promise.all(pipes);
    await fs.rmdir(chunkDir, { recursive: true });
  } catch (error) {
    next(error);
  }
}

app.listen(8080, () => console.log("Server starts on port 8080"));
