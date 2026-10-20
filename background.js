importScripts('./lib/vtt2srt.js');

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse)=>{
  if(msg.type === "download_sub"){
    try{
      const resp = await fetch(msg.url);
      const vttText = await resp.text();
      let outContent, fileName;
      if(msg.format === "srt"){
        outContent = vttToSrt(vttText);
        fileName = `${msg.label}.srt`;
      }else{
        outContent = vttToPlainText(vttText);
        fileName = `${msg.label}.txt`;
      }
      const blobUrl = URL.createObjectURL(new Blob([outContent], {type:"text/plain"}));
      chrome.downloads.download({
        url: blobUrl,
        filename: fileName
      })
    }catch(e){
      console.error("字幕下载失败", e);
    }
  }
})
