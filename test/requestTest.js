// jscs:disable requireDotNotation
const btoa = require('btoa');
const nock = require('nock');
const Request = require('../lib/request');

describe('Request', function () {
  let headers;

  beforeEach(function () {
    headers = {};
    headers.Authorization = `Basic ${btoa('api:key')}`;
  });

  describe('request', function () {
    it('makes API request', function () {
      headers.Test = 'Custom Header';
      headers['X-CSRF-Token'] = 'protectme';

      nock('https://api.mailgun.com', { reqheaders: headers })
        .get('/v2/some/resource?query=parameter', { request: 'body' })
        .reply(200);

      const req = new Request({
        username: 'api',
        key: 'key',
        url: 'https://api.mailgun.com',
        headers: { 'X-CSRF-Token': 'protectme' }
      });
      const res = req.request('GET', '/v2/some/resource', {
        headers: { Test: 'Custom Header' },
        query: { query: 'parameter' },
        body: { request: 'body' }
      });

      return res;
    });

    it('parses API response', function () {
      nock('https://api.mailgun.com', { reqheaders: headers })
        .get('/v2/some/resource')
        .reply(200, { id: 1, message: 'hello' });

      const req = new Request({ username: 'api', key: 'key', url: 'https://api.mailgun.com' });
      const res = req.request('GET', '/v2/some/resource').then(function (response) {
        response.status.should.eql(200);
        response.body.should.eql({ id: 1, message: 'hello' });
      });

      return res;
    });

    it('handles API error', function () {
      nock('https://api.mailgun.com', { reqheaders: headers })
        .get('/v2/some/resource')
        .reply(429, { message: 'Too many requests' });

      const req = new Request({ username: 'api', key: 'key', url: 'https://api.mailgun.com' });
      const res = req.request('GET', '/v2/some/resource').catch(function (error) {
        error.status.should.eql(429);
        error.message.should.eql('Too many requests');
      });

      return res;
    });
  });

  describe('query', function () {
    it('sends data as query parameter', function () {
      nock('https://api.mailgun.com')
        .get('/v2/some/resource?query=data')
        .reply(200);

      const req = new Request({ url: 'https://api.mailgun.com' });
      const res = req.query('GET', '/v2/some/resource', { query: 'data' });

      return res;
    });
  });

  describe('command', function () {
    it('sends data as form-encoded request body', function () {
      nock('https://api.mailgun.com')
        .post('/v2/some/resource', 'query=data')
        .reply(200);

      const req = new Request({ url: 'https://api.mailgun.com' });
      const res = req.command('POST', '/v2/some/resource', { query: 'data' });

      return res;
    });
  });
});
