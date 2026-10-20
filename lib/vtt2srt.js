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
