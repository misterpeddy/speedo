'use struct';

console.log("Content script injected.");

const ACTION_CAPTURE_PLAYBACK_RATE = 'cation_capture';
const CAPTURE_PORT_NAME = 'capture_port';

var port = chrome.runtime.connect({name: CAPTURE_PORT_NAME});

port.onMessage.addListener(function(request) {
  if (request.action ==  ACTION_CAPTURE_PLAYBACK_RATE) {
    player = document.querySelector('#movie_player video');
      if (player == undefined)
        return fatal('Could not find video player')
      port.postMessage({playback_rate: player.playbackRate});
  }
  });

function fatal(error) {
  console.log(error);
  return false;
}