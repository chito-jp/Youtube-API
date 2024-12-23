const express=require("express");
const axios=require("axios");
const fs = require("fs");
const cors = require("cors");

const app=express();
app.use(cors());

//apiリストをjsonファイルに書き込む
const saveApis=(data)=>{
  fs.writeFileSync("apis.json", JSON.stringify(data));
}

//apiリストをjsonファイルから読み取る
const loadApis=()=>{
  if (fs.existsSync("apis.json")) {
    return JSON.parse(fs.readFileSync("apis.json"));
  } else {
    return [];
  }
}

const apis=loadApis();

const MAX_API_WAIT_TIME=5000; 

//APIのリストを受け取り、それに対してリクエストを送る
const requestApi=async(apiList,reqPath)=>{
  for(const api of apiList){
    try{
      const {data:response}=await axios.get(`${api}${reqPath}`,{ timeout: MAX_API_WAIT_TIME });
      console.log("成功API : ${api}");
    }catch(e){
      console.error(`失敗API : ${api}`);
    }
  }
  console.error("すべてのAPIでの取得に失敗しました");
};

const getVideo=async id=>{
  for(const api of apis){
    try{
      const {data:response}=await axios.get(`${api}/api/v1/videos/${id}`, { timeout: MAX_API_WAIT_TIME });
      if (response && response.formatStreams) {
        console.log(`成功URL${api}`);
        const index = apis.indexOf(api);
        if (index !== -1) {
          apis.splice(index, 1);
        }
        apis.unshift(api);
        return response; 
      } else {
        console.error(`formatStreamsが存在しません: ${api}`);
      }
    }catch(e){
      console.error(`動画が取得できませんでした : ${api}`);
    }
  }
  return "動画が取得できません";
};

app.get("/", async(req, res)=>{
  res.send("Server is running");
});

app.get("/api/video/:id",async(req,res)=>{
  const id=req.params.id;
  const videoInfo=await getVideo(id);
  const formatStreams=videoInfo.formatStreams || [];
  const streamUrl=formatStreams.reverse()[0].url;
      
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ streamUrl: streamUrl }));
});

app.get("/api/raw/video/:id",async(req,res)=>{
  const id=req.params.id;
  res.send(await getVideo(id););
});

app.get("/api/watch/:id",async(req,res)=>{
  const id=req.params.id;
  const videoInfo=await getVideo(id);
  const formatStreams=videoInfo.formatStreams || [];
  const streamUrl=formatStreams.reverse()[0].url;

  res.redirect(301, streamUrl);
});

app.get("/apis",(req,res)=>{
  res.send(apis);
});

const PORT=process.env.PORT || 3000;
const listener=app.listen(PORT,()=>{
  console.log(`Server is running on http://localhost:${listener.address().port}`);
});
