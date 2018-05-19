// server/tests/server.test.js
const request = require('supertest'); //do testowania zapytań 
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');

const todos = [
    {_id: new ObjectID(), text: 'First todo'},
    {_id: new ObjectID(), text: 'Second todo'}
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

    describe('GET /todos/:id', () => {
        test('should get todo with doc matching given id', done => {
            request(app)
            .get(`/todos/${todos[0]._id}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done)
        });

        test('should return 404 if todo not found', done => {
            request(app)
            .get(`/todos/${new ObjectID()}`)
            .expect(404)
            .end(done);
        });

        test('shpult return 404 for non-object ids', done => {
            request(app)
            .get('/todos/123')
            .expect(404)
            .end(done);
        });
    });

});