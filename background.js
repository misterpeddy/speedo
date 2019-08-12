	'use strict';

const ACTION_CAPTURE_PLAYBACK_RATE = 'action_capture_playback_rate';
const SITE_PREFIX = 'https://www.youtube.com/watch';

chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");
});

chrome.tabs.onUpdated.addListener(function
  (tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.startsWith(SITE_PREFIX)) {
    	console.log(`Sending message ${ACTION_CAPTURE_PLAYBACK_RATE} for ${changeInfo.url} to ${tabId}`);
    	chrome.tabs.sendMessage(tabId, {
    		action: ACTION_CAPTURE_PLAYBACK_RATE,
    		url: changeInfo.url
    	});	
    }
  }
);