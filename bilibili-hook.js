(() => {
  if (window.__subtitleExtractorMainHook) return;
  window.__subtitleExtractorMainHook = true;

  const subtitlePatterns = [
    /\/subtitle\/.+\.json/i,
    /aisubtitle\.hdslb\.com.*\.json/i,
    /subtitle\.json/i
  ];
  const bilibiliPlayerPatterns = [
    /api\.bilibili\.com\/x\/player\/(?:wbi\/)?v2/i,
    /api\.bilibili\.com\/x\/player\/so/i,
    /api\.bilibili\.com\/pgc\/player\/web\/v2\/playurl/i
  ];
  const youtubePlayerPatterns = [
    /youtubei\/v1\/player/i,
    /youtube\.com\/get_video_info/i
  ];
  const youtubeCaptionPatterns = [
    /youtube\.com\/api\/timedtext/i,
    /youtube-nocookie\.com\/api\/timedtext/i
  ];
  const matches = (url, patterns) => patterns.some(pattern => pattern.test(String(url)));
  const send = (type, payload) => window.postMessage({source:"__subtitleExtractor", type, payload}, "*");

  function inspect(url, data) {
    if (matches(url, subtitlePatterns)) send("subtitle", {url:String(url), data});
    else if (matches(url, bilibiliPlayerPatterns)) send("player", {url:String(url), data});
    else if (matches(url, youtubePlayerPatterns)) send("youtube-player", {url:String(url), data});
    else if (matches(url, youtubeCaptionPatterns)) send("youtube-caption", {url:String(url), data});
  }

  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function(...args) {
      const input = args[0];
      const url = input instanceof Request ? input.url : String(input);
      const shouldInspect = matches(url, [...subtitlePatterns, ...bilibiliPlayerPatterns, ...youtubePlayerPatterns, ...youtubeCaptionPatterns]);
      const response = await originalFetch.apply(this, args);
      if (shouldInspect) {
        try { inspect(url, await response.clone().json()); }
        catch (_) {
          try { inspect(url, await response.clone().text()); } catch (_) {}
        }
      }
      return response;
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__subtitleExtractorUrl = String(url);
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener("load", function() {
      const url = this.__subtitleExtractorUrl || "";
      if (!matches(url, [...subtitlePatterns, ...bilibiliPlayerPatterns, ...youtubePlayerPatterns, ...youtubeCaptionPatterns])) return;
      try { inspect(url, JSON.parse(this.responseText)); }
      catch (_) { try { inspect(url, this.responseText); } catch (_) {} }
    });
    return originalSend.apply(this, args);
  };
})();