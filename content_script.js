'use strict';

console.log("Speedo activated");

const PLAYBACK_RATE_FIELD = 'playback_rate';
const ACTION_CAPTURE_PLAYBACK_RATE = 'action_capture_playback_rate';
const CAPTURE_PLAYBACK_RATE_DELAY_MS = 5000;
const BASE_URL = "https://us-central1-speedo-249504.cloudfunctions.net/";

// Add Listener for runtime messages from background service
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(`Received request to ${request.action}`)
  if (request.action ==  ACTION_CAPTURE_PLAYBACK_RATE) {
    handlePlaybackRateCapture(request, sender, sendResponse);
    handlePlaybackRateRecommend(request, sender, sendResponse);
  }
});

/*********** Handlers ******************/

function handlePlaybackRateRecommend(request, sender, sendResponse) {
  var player = document.querySelector('#movie_player video');

    if (player == undefined) {
      return _fatal('Could not find video player');
    }

  _getRecommendedPlaybackRate()
  then(function(rate){
    console.log(`Got rate ${rate}`);
    player.playbackRate(rate);
  });
}

function handlePlaybackRateCapture(request, sender, sendResponse) {
  var url = request.url;
  var player = document.querySelector('#movie_player video');

  if (player == undefined) {
    return _fatal('Could not find video player');
  }

  setTimeout(function() {
    var features = _getFeatures();
    _capturePlaybackRate(features, player.playbackRate);
  }, CAPTURE_PLAYBACK_RATE_DELAY_MS);
}

function _getRecommendedPlaybackRate() {
  var url = BASE_URL + "recommendPlaybackRate";
  var features = _getFeatures();

  console.log("Sending feature (%s) to %s", JSON.stringify(features), url);
  _phoneHome('recommendPlaybackRate', {'features': features})
  .then(resp => resp.json())
  .then(function(playbackRec) {
    if (playbackRec[PLAYBACK_RATE_FIELD] === undefined) {
      throw `Was not able to retrieve ${PLAYBACK_RATE_FIELD} from object ${playbackRec}`
    } else {
      var recommendedRate = playbackRec[PLAYBACK_RATE_FIELD];
      console.log(`Received Playback recommendation: ${recommendedRate}`);
      return recommendedRate;
  }});
}

// Get video features
function _getFeatures() {
  try {
    var titleEl = document.querySelector("h1.title yt-formatted-string");
    var descEl = document.querySelector("div#description .content ");
    var channelEl = document.querySelector("ytd-video-owner-renderer #channel-name .yt-formatted-string");
    if (channelEl == null)
      channelEl = document.querySelector("ytd-video-owner-renderer #owner-name .yt-formatted-string");
    return {
      title : titleEl ? titleEl.innerText : "",
      channel : channelEl ? channelEl.innerText : "",
      description : descEl ? descEl.innerText : "",
    }
  }
  catch (error) {
    console.error(`Could not compute features: ${error}`);
  }
}

function _capturePlaybackRate(features, playbackRate) {
  _phoneHome('recordPlaybackRate', {'features': features, 'playback_rate': playbackRate})
}

function _phoneHome(endpoint, data) {
  var url = BASE_URL + endpoint;
  /*
  TODO(peddy): Understand whether we actually need this
  fetch(url, {
    method: "OPTIONS",
    redirect: 'follow',
  }).then(
  */
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      'Content-Type' : 'application/json'
    },
    redirect: 'follow',
  })
  .catch(err => console.log(`Encountered error while phoning home to Speedo: ${err}`));   
}

function _fatal(error) {
  console.log(error);
  return false;
}
