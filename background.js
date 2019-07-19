	'use strict';

const ACTION_CAPTURE_PLAYBACK_RATE = 'cation_capture';
const CAPTURE_PORT_NAME = 'capture_port'

var captureBusPort;

chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");
});

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == CAPTURE_PORT_NAME);
  captureBusPort = port;
  port.onMessage.addListener(function(request) {
  	console.log(request);
  });
});

chrome.webNavigation.onCompleted.addListener(function() {
	captureBusPort.postMessage({action: ACTION_CAPTURE_PLAYBACK_RATE});
}, {url: [{urlMatches : 'https://www.youtube.com/'}]});