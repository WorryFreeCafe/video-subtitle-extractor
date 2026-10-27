const listEl = document.getElementById("list");
let subList = [];

chrome.tabs.query({active:true, currentWindow:true}, tabs => {
  const tab = tabs && tabs[0];
  if (!tab || typeof tab.id !== "number") return showError("无法获取当前标签页");
  chrome.tabs.sendMessage(tab.id, {type:"scan_sub"}, response => {
    if (chrome.runtime.lastError) {
      showError("此页面暂时无法扫描。请刷新视频页面后重试；Chrome 内部页面不支持扩展注入。");
      return;
    }
    subList = Array.isArray(response) ? response : [];
    render();
  });
});

function showError(message) {
  listEl.textContent = "";
  const el = document.createElement("div");
  el.className = "empty";
  el.textContent = message;
  listEl.appendChild(el);
}

function render() {
  if (subList.length === 0) {
    showError("暂未检测到字幕。请先播放视频并等待字幕轨道加载，再重新打开扩展。");
    return;
  }
  listEl.textContent = "";
  subList.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "item";
    const title = document.createElement("div");
    title.textContent = item.label || item.srclang || "字幕";
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.type === "bilibili" ? "B站" : item.type === "youtube" ? "YouTube" : "track";
    title.appendChild(tag);
    const buttons = document.createElement("div");
    buttons.className = "btns";
    for (const format of ["srt", "txt"]) {
      const button = document.createElement("button");
      button.textContent = format === "srt" ? "导出 SRT" : "导出纯文本";
      button.addEventListener("click", () => {
        button.disabled = true;
        chrome.runtime.sendMessage({
          type:"download_sub", url:item.src, source:item.type || "native",
          content:item.content, format, label:item.label || "subtitle"
        }, result => {
          button.disabled = false;
          if (chrome.runtime.lastError) showError("导出失败：" + chrome.runtime.lastError.message);
          else if (!result?.ok) showError("导出失败：" + (result?.error || "未知错误"));
        });
      });
      buttons.appendChild(button);
    }
    card.append(title, buttons);
    listEl.appendChild(card);
  });
}
