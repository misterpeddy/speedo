'use strict';

console.log("Speedo activated");

const ACTION_CAPTURE_PLAYBACK_RATE = 'action_capture_playback_rate';
const CAPTURE_PLAYBACK_RATE_DELAY_MS = 5000;
const BASE_URL = "https://us-central1-speedo-249504.cloudfunctions.net/";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(`Received request to ${request.action}`)
  if (request.action ==  ACTION_CAPTURE_PLAYBACK_RATE) {
    _playbackRateCaptureHandler(request, sender, sendResponse);
  }
});

function _playbackRateCaptureHandler(request, sender, sendResponse) {
  var url = request.url;
  var player = document.querySelector('#movie_player video');

    if (player == undefined) {
      return _fatal('Could not find video player')
    }

    setTimeout(function() {
      var features = _computeFeatures();
      //var features = {};
      _logPlaybackRate(features, player.playbackRate);
    }, CAPTURE_PLAYBACK_RATE_DELAY_MS);
}

function _computeFeatures() {
  try {
    // Capture category directly from initialization data since it's not loaded into DOM yet
    /*
    // Todo: Figure out how to do this robustly
    var category;
    var metadatarows = window["ytInitialData"]
                        .contents.twoColumnWatchNextResults.results.results.contents[1]
                        .videoSecondaryInfoRenderer.metadataRowContainer
                        .metadataRowContainerRenderer.rows;

    var categoryMetadataRow = Array.prototype.filter.call(metadatarows, function(el) {
      return el.metadataRowRenderer.title.simpleText == "Category"
    })
    if (categoryMetadataRow != undefined && categoryMetadataRow.length && 
      categoryMetadataRow[0].metadataRowRenderer.contents[0].runs.length > 0) {
        category = categoryMetadataRow[0].metadataRowRenderer.contents[0].runs[0].text;
    } 
    */
    // Capture all other features
    return {
      title : document.querySelector("h1.title yt-formatted-string").innerText,
      channel : document.querySelector("#owner-name .yt-formatted-string").innerText, 
      description : document.querySelector("div#description .content ").innerText,
    }
  }
  catch (error) {
    console.error(`Could not compute features: ${error}`);
  }
}

function _logPlaybackRate(features, playbackRate) {
  //console.log("Saving: " + JSON.stringify(features) + playbackRate);
  _phoneHome('recordPlaybackRate', {'features': features, 'playback_rate': playbackRate})
}

function _phoneHome(endpoint, data) {
  var url = BASE_URL + endpoint;
  fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      'Content-Type' : 'application/json'
    },
    redirect: 'follow',
    })
  .then(console.log(`Successfully phoned home to Speedo with paylod ${JSON.stringify(data)}`))
  .catch(err => console.log(`Encountered error while phoning home to Speedo: ${err}`));   
}

function _fatal(error) {
  console.log(error);
  return false;
}
