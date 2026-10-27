function scanTrackSubtitles(){
  const subs = [];
  document.querySelectorAll('video').forEach(video => {
    video.querySelectorAll('track[kind="subtitles"], track[kind="captions"]').forEach(track => {
      if (track.src) subs.push({type:"native", label:track.label, srclang:track.srclang, src:track.src});
    });
  });
  return subs;
}

const bilibiliSubs = [];
const bilibiliMeta = new Map();
const youtubeSubs = new Map();

function normalizeUrl(url){
  try { return new URL(url, location.href).href; } catch (_) { return String(url || ""); }
}

function extractBilibiliSubtitles(data){
  const subtitles = data?.subtitle?.subtitles || data?.data?.subtitle?.subtitles || [];
  subtitles.forEach(sub => {
    if (sub.subtitle_url) bilibiliMeta.set(normalizeUrl(sub.subtitle_url), {
      lan:sub.lan || "", lan_doc:sub.lan_doc || sub.title || ""
    });
  });
}

function addBilibiliSubtitle(url, data){
  url = normalizeUrl(url);
  const body = Array.isArray(data?.body) ? data.body : (Array.isArray(data) ? data : null);
  if (!body?.length || bilibiliSubs.some(item => item.src === url)) return;
  const meta = bilibiliMeta.get(url) || {};
  bilibiliSubs.push({
    type:"bilibili", label:data?.lan_doc || meta.lan_doc || meta.lan || "B站字幕",
    srclang:data?.lan || meta.lan || "", src:url, content:data
  });
}

function extractYouTubeSubtitles(player){
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  tracks.forEach(track => {
    if (!track.baseUrl) return;
    const src = normalizeUrl(track.baseUrl);
    const language = track.languageCode || "";
    const name = track.name?.simpleText || track.name?.runs?.map(run => run.text).join("") || language || "YouTube字幕";
    const key = src + "|" + language;
    if (!youtubeSubs.has(key)) youtubeSubs.set(key, {
      type:"youtube", label:name, srclang:language, src, content:null
    });
  });
}

window.addEventListener("message", event => {
  if (event.source !== window || event.data?.source !== "__subtitleExtractor") return;
  const {type, payload} = event.data;
  if (!payload) return;
  if (type === "subtitle") addBilibiliSubtitle(payload.url, payload.data);
  else if (type === "player") extractBilibiliSubtitles(payload.data?.data || payload.data);
  else if (type === "youtube-player") extractYouTubeSubtitles(payload.data);
  else if (type === "youtube-caption" && typeof payload.data === "string") {
    // Captions can be fetched on demand from the track URL; this event is diagnostic only.
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "scan_sub") {
    const native = scanTrackSubtitles();
    sendResponse([...native, ...bilibiliSubs, ...youtubeSubs.values()]);
  }
});
