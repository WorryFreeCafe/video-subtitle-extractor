const listEl = document.getElementById('list');
let subList = [];

chrome.tabs.query({active:true, currentWindow:true}, tabs=>{
  chrome.tabs.sendMessage(tabs[0].id, {type:"scan_sub"}, res=>{
    subList = res || [];
    render();
  })
})

function render(){
  if(subList.length === 0){
    listEl.innerHTML = `<div class="empty">未检测到原生 track 软字幕</div>`;
    return;
  }
  listEl.innerHTML = subList.map((item, idx)=>`
    <div class="item">
      <div>${item.label || item.srclang || "字幕"}</div>
      <div class="btns">
        <button data-idx="${idx}" data-type="srt">导出 SRT</button>
        <button data-idx="${idx}" data-type="txt">导出 纯文本</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('button').forEach(btn=>{
    btn.onclick = async ()=>{
      const i = Number(btn.dataset.idx);
      const fmt = btn.dataset.type;
      const subItem = subList[i];
      chrome.runtime.sendMessage({
        type:"download_sub",
        url: subItem.src,
        format: fmt,
        label: subItem.label || "subtitle"
      })
    }
  })
}
