'use strict';

const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const assert = require('assert');

function getSample() {
  const resultsMock = sinon.stub().returns(true);
  const tableMock = {
    insert: sinon.stub().returns(Promise.resolve(resultsMock))
  }
  const datasetMock = {
    table: sinon.stub().returns(tableMock),
  };
  const bigQueryMock = {
    dataset: sinon.stub().returns(datasetMock),
  };

  const BigQueryMock = sinon.stub().returns(bigQueryMock);

  return {
    program: proxyquire('../', {
      '@google-cloud/bigquery': {BigQuery: BigQueryMock},
    }),
    mocks: {
      bigQuery: bigQueryMock,
      dataset: datasetMock,
      table: tableMock,
      results: resultsMock,
      goodReq: {
        body: {
          features: {
            "title": "some_title",
            "description": "desc",
            "channel": "channel1"
          },
          playback_rate: 1.0
        }
      },
      badReq: {
        body: {
          features: {},
          playback_rate: 1.0
        }
      },
      res: {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
        write: sinon.stub().returnsThis(),
      },
    },
  };
}

it('recordPlaybackRate writes good request to BigQuery', async () => {
  const sample = getSample();
  const {mocks} = sample;

  await sample.program.recordPlaybackRate(mocks.goodReq, mocks.res);
  assert.strictEqual(mocks.bigQuery.dataset.called, true);
  assert.strictEqual(mocks.table.insert.calledWith([mocks.goodReq.body]), true);
  assert.strictEqual(mocks.res.json.called, true);
});

it('recordPlaybackRate does not write bad request to BigQuery', async () => {
  const sample = getSample();
  const {mocks} = sample;

  await sample.program.recordPlaybackRate(mocks.badReq, mocks.res);
  assert.strictEqual(mocks.bigQuery.dataset.called, true);
  assert.strictEqual(mocks.table.insert.called, false);
  assert.strictEqual(mocks.res.status.calledWith(422), true);
});
