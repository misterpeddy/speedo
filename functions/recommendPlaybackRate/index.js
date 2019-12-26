'use strict';

const {BigQuery} = require('@google-cloud/bigquery');
var assert = require('assert');


const bigQuery = new BigQuery();
const dataset = bigQuery.dataset('speedo_dev');
const table = dataset.table('playback_rate');
const modelAddr = "serving.peddy.ai/models/speedo-recommendPlaybackRate";

/**
 * Recommends a video playback rate for features received.
 * Expects request body to contain features.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.recommendPlaybackRate = (req, res) => {
  console.log(req);
  res.set('Access-Control-Allow-Origin', '*');

  // Handle pre-flight CORS request
  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  let features = req.body.features;
  console.log(`Received request with features ${JSON.stringify(req.body)}`);
  
  if (features == undefined || 
      features.title == undefined || 
      features.description == undefined || 
      features.channel == undefined) {
    return res
      .status(422)
      .json({'status': 'error', 'message': 'Required parameters (features{title, description, channel}) not present.'})
  }

  res.set('Access-Control-Allow-Origin', '*');
  res
    .json({'playback_rate': 1.0})
    .status(200);

};

function _doInference(modelAddr, features) {

  data = {"examples": [features]};

  return fetch(modelAddr, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      'Content-Type' : 'application/json'
    },
    redirect: 'follow',
  })
}
