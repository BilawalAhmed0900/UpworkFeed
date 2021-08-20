const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;
const CONTENT_SCRIPT_UUID = "3de05e6b-e5b2-4a07-b883-6c0a520597ef";
const POPUP_SCRIPT_UUID = "179cb5b7-545a-4f59-b6ec-33c6607970e8";

/*
  These are the default values that is set at first time
*/
let keywords = [];
let intervalDurationMilli = 5 * 60 * 1000;

const upworkHomepageLocation = "https://www.upwork.com/ab/find-work/recommended";
const selfCreatedIds = [];
const previousJobs = [];
const alreadySent = [];
let workerID = null;

function gotHTML({id, html}) {
  /*
    Now we remove the tab from the browser tabs because we now have the html
  */
  browserVar.tabs.remove(id);
  /*
    from html to dom
  */
  const dom = (new DOMParser()).parseFromString(html, "text/html");

  /*
    Rest is Upwork's job getting, from sheer-bruteforce :)
  */
  const elem = dom.getElementById("feed-jobs") || dom.getElementById("feed-jobs-responsive") || null;
  if (elem === null) {
    return;
  }

  const jobs = [];
  const children = elem.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    try {
      /*
        These are set in stone :)
      */
      const name = child.children[0].children[0].children[0].children[0].children[1].children[0].innerHTML;
      const tags_dom_collection = child.children[0].children[0].children[0].children[1].children[0].children[2].children[0].children[1].children[0].children;
      const tags_dom_array = [...tags_dom_collection];

      const tags = [];
      for (const elem of tags_dom_array) {
        if (elem.children !== undefined) {
          if (elem.children[0] !== undefined) {
            if (elem.children[0].children !== undefined) {
              if (elem.children[0].children[0] !== undefined) {
                tags.push(elem.children[0].children[0].innerHTML);
              }
            }
          }
        }
      }

      if (tags.length > 0) {
        jobs.push({"name": name, "tags": tags});
      }
    } catch (error) {
      console.log("No tags in a job found");
    }
  }

  for (const job of jobs) {
    let has_any = false;
    if (keywords.length === 0) {
      has_any = true;
    }

    /*
      When any tags has been found, we show notification only
      if we have not shown before
    */
    for (const search_tag of keywords) {
      if (job["tags"].includes(search_tag)) {
        has_any = true;
        break;
      }

      if (job["name"].toLowerCase().indexOf(search_tag.toLowerCase()) > -1) {
        has_any = true;
        break;
      }
    }

    if (has_any) {
      if (!alreadySent.includes(job["name"])) {
        browserVar.notifications.create({"title": job["name"], "type": "basic", "message": "", "iconUrl": "asset/img.png"});
        alreadySent.push(job["name"]);
      }
    }
  }
}

function callback(tab) {
  /*
    Add the id of the tab to the list of the tab ids, we own
  */
  selfCreatedIds.push(tab.id);
}

function intervalFunction() {
  /*
    Create a tab and call callback with tab, when successful
  */
  browserVar.tabs.create({
    "active": false,
    "index": 0,
    "url": upworkHomepageLocation
  }, callback);
}

/*
  Get storage values with default being empty array and 5 minutes
*/
browserVar.storage.sync.get({"keywords": []}, function (value) {
  keywords = value.keywords;
});

browserVar.storage.sync.get({"interval": 5 * 60 * 1000}, function (value) {
  intervalDurationMilli = value.interval;
});

/*
  Content script can communicate with us
*/
browserVar.runtime.onConnect.addListener(function(port) {
  if (port.name === CONTENT_SCRIPT_UUID) {
    port.onMessage.addListener(function(msg, sendingPort) {
      if (!selfCreatedIds.includes(sendingPort.sender.tab.id)) {
        port.disconnect();
        return;
      }
  
      /*
        Content script can send two message, first give_me_tab_id
        and then sent_stuff, which mark end of communication
  
        Now this whole communication can be simplified to just sent_stuff,
        but I need some chills :)
      */
      if (msg.text === "give_me_tab_id") {
        port.postMessage({text: "sent_tab_id", tabID: sendingPort.sender.tab.id});
      } else if (msg.text === "sent_stuff" && selfCreatedIds.includes(msg.id)) {
        selfCreatedIds.splice(selfCreatedIds.indexOf(msg.id), 1);
        gotHTML({id: msg.id, html: msg.html});
        port.disconnect();
      }
    });
  } else if (port.name === POPUP_SCRIPT_UUID) {
    port.onMessage.addListener(function (msg, sendingPort) {
      /*
        Communication with popup is just, getting 2 variables,
        keyword array and interval duration, and setting them
      */
      if (msg.text === "give_me_keywords") {
        port.postMessage({text: "sent_keywords", keywords: keywords});
      } else if (msg.text === "update_keywords") {
        keywords = msg.keywords;
        browserVar.storage.sync.set({"keywords": keywords}, function() { });
      } else if (msg.text === "give_me_interval") {
        port.postMessage({text: "sent_interval", interval: intervalDurationMilli});
      } else if (msg.text === "update_interval") {
        intervalDurationMilli = msg.interval;
        browserVar.storage.sync.set({"interval": intervalDurationMilli}, function() { });

        /*
          Restart worker with new interval
        */
        if (workerID !== null) {
          clearInterval(workerID);
          workerID = null;
        }
        
        workerID = setInterval(intervalFunction, intervalDurationMilli);
      }
    });
  }
});

/*
  If error occured due to connection lose or anything, we remove the tab
*/
browserVar.webNavigation.onErrorOccurred.addListener(function(details) {
  if (selfCreatedIds.includes(details.tabId)) {
    selfCreatedIds.splice(details.tabId, 1);
    browserVar.tabs.remove(details.tabId);
  }
});

browserVar.runtime.onInstalled.addListener(function() {
  if (workerID !== null) {
    clearInterval(workerID);
    workerID = null;
  }
  
  workerID = setInterval(intervalFunction, intervalDurationMilli);
});


browserVar.runtime.onStartup.addListener(function() {
  if (workerID !== null) {
    clearInterval(workerID);
    workerID = null;
  }
  
  workerID = setInterval(intervalFunction, intervalDurationMilli);
});

browserVar.runtime.onSuspend.addListener(function() {
  if (workerID !== null) {
    clearInterval(workerID);
    workerID = null;
  }
});
