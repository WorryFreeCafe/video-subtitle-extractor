importScripts('./lib/vtt2srt.js');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === "download_sub"){
    (async ()=>{
      try{
        let outContent, fileName;
        const label = msg.label || "subtitle";

        if(msg.source === "bilibili"){
          let json = msg.content;
          if(!json && msg.url){
            const resp = await fetch(msg.url);
            json = await resp.json();
          }
          json = json || {};
          if(msg.format === "srt"){
            outContent = bilibiliJsonToSrt(json);
            fileName = `${label}.srt`;
          }else{
            outContent = bilibiliJsonToPlainText(json);
            fileName = `${label}.txt`;
          }
        }else{
          const resp = await fetch(msg.url);
          const vttText = await resp.text();
          if(msg.format === "srt"){
            outContent = vttToSrt(vttText);
            fileName = `${label}.srt`;
          }else{
            outContent = vttToPlainText(vttText);
            fileName = `${label}.txt`;
          }
        }

        const blobUrl = URL.createObjectURL(new Blob([outContent], {type:"text/plain"}));
        chrome.downloads.download({
          url: blobUrl,
          filename: fileName
        });
        sendResponse({ok:true});
      }catch(e){
        console.error("字幕下载失败", e);
        sendResponse({ok:false, error:e.message});
      }
    })();
    return true;
  }
})
