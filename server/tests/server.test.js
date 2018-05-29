// server/tests/server.test.js
const request = require('supertest'); //do testowania zapytań 
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');
const {todos, todosRemoveAndAdd, users, populateUsers} = require('../tests/seed/seed');




describe('server.js', () => {

    describe('POST /todos', () => {

        beforeEach(todosRemoveAndAdd); //przed każdym z testów, bo modyfikują one todos

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
        beforeAll(done => todosRemoveAndAdd(done)); //przed wszystkimi testami (raz), bo nie modyfikują one todos

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

    describe('test users routes', () => {

        beforeEach(populateUsers);
        
        describe('GET /users/me', () => {
            
            test('should return user if authenticated', done => {
                // testowanie route dla zautentyfikowanego użytkownika

                request(app)
                .get('/users/me')
                .set('x-auth', users[0].tokens[0].token)
                .expect(200)
                .expect(res => {
                    expect(res.body._id).toBe(users[0]._id.toHexString());
                    expect(res.body.email).toBe(users[0].email);
                })
                .end(done)
            });
            
            test('should return 401 if not authenticated', done => {
                request(app)
                .get('/users/me')
                .expect(401)
                .expect(res => {
                    expect(res.body).toEqual({}); //oczekiwane jest zwrócenie pustego obiektu
                })
                .end(done)
            });
        });
        
    });
});