const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;
const PORT_UUID = "3de05e6b-e5b2-4a07-b883-6c0a520597ef";
debugger;

/*
  A recursive timeout function that will check for
  feed-jobs or feed-jobs-responsive every 250 ms
*/
function mainFunction(message_id, port) {
  /*
    This will keep checking for feed-jobs or feed-jobs-responsive every 250 ms
  */
  if (document.getElementById("feed-jobs") === null &&
      document.getElementById("feed-jobs-responsive") === null) {
    setTimeout(() => mainFunction(message_id, port), 250);
    return;
  }

  /*
    Send back id, so that the function can remove the tab along with
    html, not dom. We will parse it to dom later again
  */
  port.postMessage({id: message_id, text: "sent_stuff", html: document.documentElement.innerHTML});
}

/*
  Connect to background script and do some handshake
*/
const port = browserVar.runtime.connect({name: PORT_UUID});

/*
  First send message to get own tabID
*/
port.postMessage({text: "give_me_tab_id"});
port.onMessage.addListener(function(msg) {
  if (msg.text === "sent_tab_id") {
    /*
      tabID retrieved, run main function
    */
    mainFunction(msg.tabID, port);
  }
});
