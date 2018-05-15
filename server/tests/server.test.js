// server/tests/server.test.js
const request = require('supertest'); //do testowania zapytań 
const expect = require('expect'); //biblioteka do asercji https://github.com/mjackson/expect

const {app} = require('../server');

describe('server.js', () => {

    it('should return welcome response', done => {
        request(app)
        .get('/')
        .expect(200)
        .expect('<h1>Witaj w node-auth-api</h1>') //sprawdzenie zgodności zwracanej treści
        .end(done);
    });

});