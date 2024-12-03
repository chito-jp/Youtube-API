const express=require("express");
const axios=require("axios");
const fs = require("fs");
const path = require('path');

const app=express();

app.use(express.static(path.join(__dirname, "public")));

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

app.get("/", async(req, res)=>{
  res.sendFile(path.join(__dirname, "public", "site.html"));
});

const MAX_API_WAIT_TIME=5000; 
const MAX_TIME=10000;

app.get("/api/:id",async(req,res)=>{
  const id=req.params.id;
  const videoInfo=await getVideo(id);
  const formatStreams=videoInfo.formatStreams || [];
  const streamUrl=formatStreams.reverse()[0].url;
      
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ streamUrl: streamUrl }));
});

const getVideo=async id=>{
  for(const api of apis){
    try{
      const response=await axios.get(`${api}/api/v1/videos/${id}`, { timeout: MAX_API_WAIT_TIME });
      if (response.data && response.data.formatStreams) {
        console.log(`成功URL${api}`);
        const index = apis.indexOf(api);
        if (index !== -1) {
          apis.splice(index, 1);
        }
        apis.unshift(api);
        saveApis(apis);
        return response.data; 
      } else {
        console.error(`formatStreamsが存在しません: ${api}`);
      }
    }catch(e){
      console.error(`動画が取得できませんでした : ${api}`);
    }
  }
  return "動画が取得できません";
};

const PORT=process.env.PORT || 3000;
const listener=app.listen(PORT,()=>{
  console.log(`Server is running on http://localhost:${listener.address().port}`);
});
