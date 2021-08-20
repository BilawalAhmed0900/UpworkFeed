const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;
const PORT_UUID = "179cb5b7-545a-4f59-b6ec-33c6607970e8";

const port = browserVar.runtime.connect({name: PORT_UUID});

port.postMessage({text: "give_me_keywords"});
port.postMessage({text: "give_me_interval"});
port.onMessage.addListener(function(msg) {
  console.log(msg);
  if (msg.text === "sent_keywords") {
    document.getElementById("KeywordInput").value = msg.keywords.toString();
  } else if (msg.text === "sent_interval") {
    document.getElementById("IntervalInput").value = msg.interval;
  }
});

function submitKeywords() {
  const keywords = document.getElementById("KeywordInput").value.split(",");
  for (let i = 0; i < keywords.length; i++) {
    keywords[i] = keywords[i].replaceAll(" ", "");
  }
  port.postMessage({text: "update_keywords", keywords: keywords});
}

function submitInterval() {
  const interval = document.getElementById("IntervalInput").value;
  port.postMessage({text: "update_interval", interval: interval});
}

document.getElementById("SubmitButtonKeywords").addEventListener("click", submitKeywords);
document.getElementById("SubmitButtonInterval").addEventListener("click", submitInterval);
