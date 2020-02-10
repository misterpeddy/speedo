'use strict';

const {BigQuery} = require('@google-cloud/bigquery');
var assert = require('assert');


const bigQuery = new BigQuery();
const dataset = bigQuery.dataset('speedo_dev');
const table = dataset.table('playback_rate');

/**
 * Receives a playback rate event and logs it to BigQuery.
 * Expects request body to contain rate and features.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.recordPlaybackRate = (req, res) => {
  let features = req.body.features;
  let rate = req.body.playback_rate;  
  console.log(`Received recordPlaybackRate request with features ${features} and rate ${rate}`);
  
  if (rate == undefined || 
      features == undefined || 
      features.title == undefined || 
      features.description == undefined || 
      features.channel == undefined) {
    return res
      .status(422)
      .json({'status': 'error', 'message': 'Required parameters (features{title, description, channel}, playback_rate) not present.'});
  }

  let rows = [
    {
      features: {
        title: features.title,
        description: features.description,
        channel: features.channel
      },
      playback_rate: rate
    }
  ];
  
  table.insert(rows)
  .then((data) => {
    console.log(`Successfully wrote to database request with features ${features} and rate ${rate}`)
    res
      .json({'status': 'success'})
      .status(200);
  }).catch(err => {
    console.log(`Error while writing request with ${features} and rate ${rate} to database: ${err}`)
    res
      .status(500)
      .send(`Error writing to database: ${err}\n`);
  });

};
