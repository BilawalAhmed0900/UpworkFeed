const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;

browserVar.runtime.onMessage.addListener(function(msg, _sender, sendResponse) {
  if (msg.text === 'report_back') {
      /*
        Send back id, so that the function can remove the tab along with
        html, not dom. We will parse it to dom later again
      */
      sendResponse({id: msg.id, html: document.documentElement.innerHTML});
  }
});
