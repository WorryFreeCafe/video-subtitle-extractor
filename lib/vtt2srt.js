function vttToSrt(vttText){
  let lines = vttText.split(/\r?\n/);
  lines = lines.filter(line=>{
    const t = line.trim();
    if(t.startsWith("WEBVTT")) return false;
    if(t.startsWith("NOTE")) return false;
    return true;
  })
  const blocks = [];
  let cur = [];
  for(const l of lines){
    if(l.trim() === ""){
      if(cur.length > 0){
        blocks.push(cur);
        cur = [];
      }
    }else{
      cur.push(l);
    }
  }
  if(cur.length>0) blocks.push(cur);

  let srt = "";
  blocks.forEach((b, idx)=>{
    srt += `${idx+1}\n`;
    srt += b.join("\n") + "\n\n";
  })
  return srt;
}

function vttToPlainText(vttText){
  const srt = vttToSrt(vttText);
  const lines = srt.split(/\r?\n/);
  const out = [];
  for(const l of lines){
    if(/^\d+$/.test(l.trim())) continue;
    if(/\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(l)) continue;
    if(l.trim() === "") continue;
    out.push(l.trim());
  }
  return out.join("\n");
}

function bilibiliJsonToSrt(json){
  const body = Array.isArray(json.body) ? json.body : (Array.isArray(json) ? json : []);
  return body.map((item, idx)=>{
    const from = formatSrtTime(item.from);
    const to = formatSrtTime(item.to);
    const content = String(item.content || "").trim().replace(/\n/g, " ");
    return `${idx+1}\n${from} --> ${to}\n${content}\n`;
  }).join("\n");
}

function bilibiliJsonToPlainText(json){
  const body = Array.isArray(json.body) ? json.body : (Array.isArray(json) ? json : []);
  return body.map(item=>String(item.content || "").trim().replace(/\n/g, " ")).join("\n");
}

function formatSrtTime(sec){
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  const pad = (n, len=2)=>String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(ss)},${pad(ms,3)}`;
}
