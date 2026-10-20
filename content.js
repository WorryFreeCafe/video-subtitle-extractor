function scanTrackSubtitles(){
  const videos = document.querySelectorAll('video');
  const subs = [];
  videos.forEach(v=>{
    const tracks = v.querySelectorAll('track[kind="subtitles"], track[kind="captions"]');
    tracks.forEach(track=>{
      subs.push({
        label: track.label,
        srclang: track.srclang,
        src: track.src
      })
    })
  })
  return subs;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === "scan_sub"){
    const res = scanTrackSubtitles();
    sendResponse(res);
  }
})

const obs = new MutationObserver(()=>{});
obs.observe(document.body, {childList:true, subtree:true});
