function scanTrackSubtitles(){
  const videos = document.querySelectorAll('video');
  const subs = [];
  videos.forEach(v=>{
    const tracks = v.querySelectorAll('track[kind="subtitles"], track[kind="captions"]');
    tracks.forEach(track=>{
      subs.push({
        type: 'native',
        label: track.label,
        srclang: track.srclang,
        src: track.src
      })
    })
  })
  return subs;
}

const bilibiliSubs = [];
const bilibiliMeta = new Map();

function injectBilibiliHook(){
  if(window.__subtitleExtractorHooked) return;
  window.__subtitleExtractorHooked = true;

  const script = document.createElement('script');
  script.textContent = `
    (function(){
      if(window.__subtitleExtractorInjected) return;
      window.__subtitleExtractorInjected = true;

      const SUBTITLE_URL_PATTERNS = [
        /\\/subtitle\\/.+\\.json/i,
        /aisubtitle\\.hdslb\\.com.*\\.json/i,
        /subtitle\\.json/i
      ];
      const PLAYER_API_PATTERNS = [
        /api\\.bilibili\\.com\\/x\\/player\\/wbi\\/v2/i,
        /api\\.bilibili\\.com\\/x\\/player\\/v2/i,
        /api\\.bilibili\\.com\\/x\\/player\\.so/i,
        /api\\.bilibili\\.com\\/pgc\\/player\\/web\\/v2\\/playurl/i
      ];

      function isSubtitleUrl(url){
        return SUBTITLE_URL_PATTERNS.some(p=>p.test(url));
      }
      function isPlayerApi(url){
        return PLAYER_API_PATTERNS.some(p=>p.test(url));
      }
      function send(type, payload){
        window.postMessage({source: '__subtitleExtractor', type, payload}, '*');
      }

      const origFetch = window.fetch;
      window.fetch = async function(...args){
        const input = args[0];
        const url = input instanceof Request ? input.url : String(input);
        const response = await origFetch.apply(this, args);
        try{
          const clone = response.clone();
          const text = await clone.text();
          if(isSubtitleUrl(url)){
            const json = JSON.parse(text);
            send('subtitle', {url, data: json});
          }else if(isPlayerApi(url)){
            const json = JSON.parse(text);
            send('player', {url, data: json});
          }
        }catch(e){}
        return response;
      };

      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url, ...rest){
        this.__url = url;
        return origOpen.apply(this, [method, url, ...rest]);
      };
      XMLHttpRequest.prototype.send = function(...args){
        this.addEventListener('load', function(){
          try{
            if(isSubtitleUrl(this.__url)){
              const json = JSON.parse(this.responseText);
              send('subtitle', {url: this.__url, data: json});
            }else if(isPlayerApi(this.__url)){
              const json = JSON.parse(this.responseText);
              send('player', {url: this.__url, data: json});
            }
          }catch(e){}
        });
        return origSend.apply(this, args);
      };
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

function extractBilibiliSubtitles(data){
  const subtitles = data?.subtitle?.subtitles || [];
  subtitles.forEach(sub=>{
    if(sub.subtitle_url){
      bilibiliMeta.set(sub.subtitle_url, {
        lan: sub.lan || '',
        lan_doc: sub.lan_doc || sub.title || ''
      });
    }
  });
}

function addBilibiliSubtitle(url, data){
  const body = Array.isArray(data.body) ? data.body : (Array.isArray(data) ? data : null);
  if(!body || body.length === 0) return;

  if(bilibiliSubs.some(s=>s.src===url)) return;

  const meta = bilibiliMeta.get(url) || {};
  const label = data.lan_doc || meta.lan_doc || meta.lan || 'B站字幕';

  bilibiliSubs.push({
    type: 'bilibili',
    label,
    srclang: data.lan || meta.lan || '',
    src: url,
    content: data
  });
}

window.addEventListener('message', (e)=>{
  if(e.source !== window) return;
  if(e.data?.source !== '__subtitleExtractor') return;

  const {type, payload} = e.data;
  if(type === 'subtitle'){
    addBilibiliSubtitle(payload.url, payload.data);
  }else if(type === 'player'){
    extractBilibiliSubtitles(payload.data?.data);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.type === 'scan_sub'){
    const native = scanTrackSubtitles();
    sendResponse([...native, ...bilibiliSubs]);
  }
});

injectBilibiliHook();

const obs = new MutationObserver(()=>{});
obs.observe(document.body, {childList:true, subtree:true});
