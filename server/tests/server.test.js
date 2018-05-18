// server/tests/server.test.js
const request = require('supertest'); //do testowania zapytań 

const {app} = require('../server');
const {Todo} = require('../models/todo');

const todos = [
    {text: 'First todo'},
    {text: 'Second todo'}
];

beforeEach(done => {
    Todo.remove({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
});

describe('server.js', () => {

    describe('GET /', () => {

        it('should return welcome response', done => {
            request(app)
            .get('/')
            .expect(200)
            .expect('<h1>Witaj w node-auth-api</h1>') //sprawdzenie zgodności zwracanej treści
            .end(done);
        });
    });

    describe('POST /todos', () => {

        test('should create a new todo', done => {
            const todo_text = 'Test todo';

            request(app)
            .post('/todos')
            .send({text: todo_text})
            .expect(200)
            .expect(res => {
                expect(res.body.text).toBe(todo_text);
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.find({text: todo_text}).then(todos => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(todo_text);
                    done();
                }).catch(err => done(err));
            });
        });

        test('should not create todo with invalid body data', done => {
            request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.find().then(todos => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch(err => done(err));
            })
        });
    });

});