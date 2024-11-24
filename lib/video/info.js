const info={};

//動画ページのHTMLを取得
info.getHtml=async(id)=>{
    const res = await fetch(`https://youtube.com/watch?v=${id}`);
    return await res.text();
};

//動画ページのplayer.jsを取得
info.getPlayerJs=async(id)=>{
    const html = await info.getHtml(id);
    const match = /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/.exec(html);
    const res = await fetch(`https://youtube.com/${match ? match[1] || match[2] : null}`);
    return await res.text();
};

info.getInfo=async(id)=>{
    const html = await info.getHtml(id);
    try{
        const ytInitialPlayerRespons = JSON.parse(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/.exec(html)[1] || {});
        const videoDetails = ytInitialPlayerRespons.videoDetails || null;
        const videoDetailsObj = {
            videoId: videoDetails.videoId || null,
            title: videoDetails.title || null,
            keywords: videoDetails.keywords || null,
            description: videoDetails.shortDescription || null,
            viewCount: videoDetails.viewCount || null,
            lengthSeconds: videoDetails.lengthSeconds || null,
            thumbnail: {
                default: `https://img.youtube.com/vi/${id}/default.jpg`,
                mqdefault: `https://img.youtube.com/vi/${id}/mqdefault.jpt`,
                hqdefault: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                sddefault:`https://img.youtube.com/vi/${id}/sddefault.jpg`,
                maxresdefault:`https://img.youtube.com/vi/${id}/maxresdefault.jpg`
            },
            formats: {}
        }
        ytInitialPlayerRespons.streamingData.adaptiveFormats.forEach(format => {
            videoDetailsObj.formats[format.itag] = format;
        });
        const channelObj = {
            name: videoDetails.author,
            id: videoDetails.channelId,
            url: `https://www.youtube.com/channel/${videoDetails.channelId}`
        }
        const ytInitialData = JSON.parse(/var ytInitialData = (\{.*?\});/.exec(html)[1]);
        return {
            ytInitialData: /var ytInitialData = (\{.*?\});/.exec(html)[1],
            video: videoDetailsObj,
            channel: channelObj,
            ytInitialPlayerRespons: ytInitialPlayerRespons,
        };
    }catch(e){
        console.error(`取得エラー : ${e}`);
        return
    }
};