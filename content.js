const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;

/*
  A recursive timeout function that will check for
  feed-jobs or feed-jobs-responsive every 250 ms
*/
function mainFunction(message_id, sendResponseFunction) {
  /*
    This will keep checking for feed-jobs or feed-jobs-responsive every 250ms
  */
  if (document.getElementById("feed-jobs") === null &&
      document.getElementById("feed-jobs-responsive") === null) {
    setTimeout(() => mainFunction(message_id, sendResponseFunction), 250);
    return;
  }

  /*
    Send back id, so that the function can remove the tab along with
    html, not dom. We will parse it to dom later again
  */
  sendResponseFunction({id: message_id, html: document.documentElement.innerHTML})
}

browserVar.runtime.onMessage.addListener(function(msg, _sender, sendResponse) {
  if (msg.text === 'report_back') {
    /*
      Start the recursive timeout loop
    */
    mainFunction(msg.id, sendResponse);
  }
});
