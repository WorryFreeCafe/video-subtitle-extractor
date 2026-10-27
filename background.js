importScripts("./lib/vtt2srt.js");

function decodeXmlText(text) {
  return String(text || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function youtubeJson3Cues(json) {
  const cues = [];
  (json?.events || []).forEach(event => {
    const text = (event.segs || []).map(segment => segment.utf8 || "").join("").replace(/\n+$/g, "").trim();
    if (!text) return;
    const start = Math.max(0, Number(event.tStartMs) || 0) / 1000;
    const duration = Math.max(0, Number(event.dDurationMs) || 0) / 1000;
    cues.push({from:start, to:start + duration, content:text});
  });
  return cues;
}

function youtubeXmlCues(xml) {
  const cues = [];
  const regex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = regex.exec(String(xml || "")))) {
    const attrs = match[1];
    const start = Number((attrs.match(/\bstart="([^"]*)"/) || [])[1]);
    const duration = Number((attrs.match(/\bdur="([^"]*)"/) || [])[1]);
    const content = decodeXmlText(match[2].replace(/<[^>]+>/g, "")).replace(/\n/g, " ").trim();
    if (content && Number.isFinite(start)) cues.push({from:start, to:start + (Number.isFinite(duration) ? duration : 2), content});
  }
  return cues;
}

function cuesToSrt(cues) {
  const time = seconds => {
    const ms = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
    const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
    const s = Math.floor(ms % 60000 / 1000), milli = ms % 1000;
    return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0") + "," + String(milli).padStart(3,"0");
  };
  return cues.map((cue, i) => (i + 1) + "\n" + time(cue.from) + " --> " + time(cue.to) + "\n" + cue.content + "\n").join("\n");
}

async function fetchYouTubeCues(url) {
  const target = new URL(url);
  target.searchParams.set("fmt", "json3");
  let response = await fetch(target.href, {credentials:"include"});
  if (!response.ok) throw new Error("YouTube 字幕请求失败（HTTP " + response.status + "）");
  const body = await response.text();
  try {
    const json = JSON.parse(body);
    const cues = youtubeJson3Cues(json);
    if (cues.length) return cues;
  } catch (_) {}
  const cues = youtubeXmlCues(body);
  if (cues.length) return cues;
  throw new Error("未能解析 YouTube 字幕内容；该字幕轨道可能不可访问");
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "download_sub") return;
  (async () => {
    try {
      let outContent, fileName;
      const label = String(msg.label || "subtitle").replace(/[\\/:*?"<>|]/g, "_").slice(0, 100);
      if (msg.source === "bilibili") {
        let json = msg.content;
        if (!json && msg.url) {
          const response = await fetch(msg.url, {credentials:"include"});
          if (!response.ok) throw new Error("B站字幕请求失败（HTTP " + response.status + "）");
          json = await response.json();
        }
        json = json || {};
        outContent = msg.format === "srt" ? bilibiliJsonToSrt(json) : bilibiliJsonToPlainText(json);
      } else if (msg.source === "youtube") {
        const cues = await fetchYouTubeCues(msg.url);
        outContent = msg.format === "srt" ? cuesToSrt(cues) : cues.map(cue => cue.content).join("\n");
      } else {
        const response = await fetch(msg.url, {credentials:"include"});
        if (!response.ok) throw new Error("字幕请求失败（HTTP " + response.status + "）");
        const vttText = await response.text();
        outContent = msg.format === "srt" ? vttToSrt(vttText) : vttToPlainText(vttText);
      }
      if (!outContent.trim()) throw new Error("字幕内容为空");
      const blobUrl = URL.createObjectURL(new Blob([outContent], {type:"text/plain;charset=utf-8"}));
      chrome.downloads.download({url:blobUrl, filename:fileName || (label + (msg.format === "srt" ? ".srt" : ".txt"))}, downloadId => {
        if (chrome.runtime.lastError) sendResponse({ok:false, error:chrome.runtime.lastError.message});
        else sendResponse({ok:true, downloadId});
      });
    } catch (error) {
      console.error("字幕下载失败", error);
      sendResponse({ok:false, error:error?.message || String(error)});
    }
  })();
  return true;
});
