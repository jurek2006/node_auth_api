// server/tests/server.test.js
const request = require('supertest'); //do testowania zapytań 
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');
const {todos, todosRemoveAndAdd, users, populateUsers} = require('../tests/seed/seed');




describe('server.js', () => {
    beforeEach(populateUsers); 

    describe('POST /todos', () => {
        beforeEach(todosRemoveAndAdd); //przed każdym z testów, bo modyfikują one todos

        test('should create a new todo', done => {
            const todo_text = 'Test todo';

            request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
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

    describe('GET /todos', () => {
        test('should get all todos created by user 0', done => {
            request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(1);
            })
            .end(done);
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

        test('should return 404 for non-object ids', done => {
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

        describe('POST /users', () => {

            test('should create a user', done => {
                const email = "nottaken@example.com";
                const password = "testing";

                request(app)
                .post('/users')
                .send({email, password})
                .expect(200)
                .expect(res => {
                    expect(res.headers['x-auth']).toBeDefined();
                    expect(res.body._id).toBeDefined();
                    expect(res.body.email).toBe(email);
                })
                .end(err => {
                    if(err){
                        return done(err);
                    }

                    User.findOne({email}).then(user => {
                        expect(user).toBeDefined(); //czy znaleziono użytkownika
                        expect(user.password).not.toBe(password); //czy hasło zostało zhashowane
                        expect(user.password.length).toBeGreaterThan(0);
                        done();
                    });
                });
            });

            test('should return validation errors if email invalid', done => {
                const email = "notvalid.com";
                const password = "testing";

                request(app)
                .post('/users')
                .send({email, password})
                .expect(400)
                .end(err => {
                    if(err){
                        return done(err);
                    }

                    User.findOne({email}).then(user => {
                        expect(user).toBeFalsy(); //czy nie znaleziono użytkownika
                        done();
                    });
                })
            });

            test('should return validation errors if password too short', done => {
                const email = "not@valid.com";
                const password = "123";

                request(app)
                .post('/users')
                .send({email, password})
                .expect(400)
                .end(err => {
                    if(err){
                        return done(err);
                    }

                    User.findOne({email}).then(user => {
                        expect(user).toBeFalsy(); //czy nie znaleziono użytkownika
                        done();
                    });
                })
            });

            test('should return validation errors if email already in use', done => {
                const password = "12345678";

                request(app)
                .post('/users')
                .send({email: users[0].email, password})
                .expect(400)
                .end(done);
            });
        });

        describe('POST /users/login', () => {

            test('should login user and return auth token', done => {

                request(app)
                .post('/users/login')
                .send({email: users[0].email, password: users[0].password})
                .expect(200)
                .expect(res => {
                    expect(res.headers['x-auth']).toBeDefined();
                })
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }

                    User.findById(users[0]._id).then(user => {
                        expect(user.tokens[1]).toHaveProperty('access', 'auth');
                        expect(user.tokens[1]).toHaveProperty('token', res.headers['x-auth']);
                        done();
                    }).catch(err => done(err));
                });
            });

            test('should reject invalid login', done => {
                request(app)
                .post('/users/login')
                .send({email: users[0].email, password: 'wrongPass'})
                .expect(400)
                .expect(res => {
                    expect(res.headers['x-auth']).not.toBeDefined();
                })
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }

                    User.findById(users[0]._id).then(user => {
                        expect(user.tokens.length).toBe(1);
                        done();
                    }).catch(err => done(err));
                });
            });
        });

        describe('DELETE /users/me/token', () => {
            test('should remove auth token on logout', done => {
                request(app)
                .delete('/users/me/token')
                .set('x-auth', users[0].tokens[0].token)
                .expect(200)
                .end((err, res) => {
                    if(err){
                        return done(err);
                    }
                    // sprawdza, czy tablica tokenów dla użytkownika nie zawiera żadnego tokenu
                    User.findById(users[0]._id).then(user => {
                        expect(user.tokens.length).toBe(0);
                        done();
                    }).catch(err => done(err));
                });
            })
        });
        
    });
});