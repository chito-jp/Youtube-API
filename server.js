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

app.get("/", async(req, res)=>{
  const response=await axios.get("https://raw.githubusercontent.com/mochidukiyukimi/yuki-youtube-instance/main/instance.txt")
  res.send(response.data);
});

const MAX_API_WAIT_TIME=5000; 
const MAX_TIME=10000;

app.get("/api/watch/:id",async(req,res)=>{
  const id=req.params.id;
  const videoInfo=await getVideo(id);
  const formatStreams=videoInfo.formatStreams || [];
  const streamUrl=formatStreams.reverse()[0].url;

  res.redirect(301, streamUrl);
});

app.get("/api/video/:id",async(req,res)=>{
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
        console.log(apis);
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

app.get("/api/suggest/:keyword",async(req,res)=>{
  const keyword=req.params.keyword;
  try{
    const response=await axios.get(`https://www.google.com/complete/search?client=youtube&hl=ja&ds=yt&q=${encodeURIComponent(keyword)}`,{
      headers: {
          "User-Agent": "Mozilla/5.0"
      }
    });
    const jsonString = response.data.substring(response.data.indexOf("["), response.data.lastIndexOf("]") + 1);
    try{
      const suggestionsArray = JSON.parse(jsonString);
      const suggestions = suggestionsArray[1].map(i => i[0]);
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.json(suggestions);
    }catch(e){
      console.error("JSONパースエラー",e);
      res.status(500).send("JSONパースエラー",e);
    }
  }catch(e){
    console.error("リクエストエラー",e);
    res.status(500).send("リクエストエラー",e);
  }
});

app.get("/api/search",(req,res)=>{
  const {search_query}=req.query;
});

const PORT=process.env.PORT || 3000;
const listener=app.listen(PORT,()=>{
  console.log(`Server is running on http://localhost:${listener.address().port}`);
});
