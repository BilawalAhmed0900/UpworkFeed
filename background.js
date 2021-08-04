const sUsrAg = window.navigator.userAgent;
const isFirefox = (sUsrAg.indexOf("Chrome") === -1);
const browserVar = (!isFirefox) ? chrome : browser;

const keywords = ["Flutter"];
const intervalDurationMilli = 1 * 60 * 1000; // 1 Minute

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
    console.warn("Jobs feed empty");
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

    /*
      When all tags have been found, we show notification only
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

browserVar.tabs.onUpdated.addListener(function(tabID, changeInfo, _tab) {
  /*
    If the tabId is the one we own and it has successfully loaded, send
    message to content script so that it can give back id and html to gotHTML
  */
  if (selfCreatedIds.includes(tabID) && changeInfo.status === "complete") {
    /*
      Remove it from list of owned ids here, tab will be removed once, html is retrieved
    */
    selfCreatedIds.splice(selfCreatedIds.indexOf(tabID), 1);
    browserVar.tabs.sendMessage(tabID, {id: tabID, text: "report_back"}, gotHTML);
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
