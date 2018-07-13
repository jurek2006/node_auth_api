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
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done)
        });

        test('should return 404 if todo not found', done => {
            request(app)
            .get(`/todos/${new ObjectID()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
        });

        test('should return 404 for non-object ids', done => {
            request(app)
            .get('/todos/123')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
        });

        test('should not return todo doc created by other user', done => {
            request(app)
            .get(`/todos/${todos[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
        });
    });

    describe('PATCH /todos/:id', () => {
        beforeEach(done => todosRemoveAndAdd(done)); //przed każdym testem, bo modyfikują one todos

        test('should update the todo and set it to completed', done => {
            const text = 'Modified text';

            request(app)
            .patch(`/todos/${todos[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({text, completed: true})
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBeTruthy();
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo).toBeDefined();
                    expect(todo.text).toBe(text);
                    expect(todo.completed).toBeTruthy();
                    expect(typeof todo.completedAt).toBe('number');
                    done();
                }).catch(err => done(err));
            });
        });

        test('should not update todo created by other user', done => {
            request(app)
            .patch(`/todos/${todos[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({text: 'NotModified', completed: true})
            .expect(404)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                // sprawdzenie czy nie zmodyfikowano danych todo w bazie
                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo.text).toBe(todos[0].text);
                    expect(todo.completed).toBeFalsy();
                    expect(todo.completedAt).toBeNull();
                    done();
                }).catch(err => done(err));
            });
        });

        test('should return 401 when user not authenticated', done => {
            request(app)
            .patch(`/todos/${todos[0]._id}`)
            .send({text: 'NotModified', completed: true})
            .expect(401)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                // sprawdzenie czy nie zmodyfikowano danych todo w bazie
                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo.text).toBe(todos[0].text);
                    expect(todo.completed).toBeFalsy();
                    expect(todo.completedAt).toBeNull();
                    done();
                }).catch(err => done(err));
            });
        });

        test('should clear completedAt when todo is not completed', done => {
            request(app)
            .patch(`/todos/${todos[1]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({completed: false})
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[1].text);
                expect(res.body.todo.completed).toBeFalsy();
                expect(res.body.todo.completedAt).toBeNull();
            })
            .end(done);
        });
    });

    describe('DELETE /todos/:id,', () => {
        beforeEach(done => todosRemoveAndAdd(done)); //przed każdym testem, bo modyfikują one todos
        test('should delete todo with given id if owner authenticated', done => {
            request(app)
            .delete(`/todos/${todos[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo).toBeNull();
                    done();
                }).catch(err => done(err));
            });
        });

        test('should not delete todo with given id if not owner authenticated', done => {
            request(app)
            .delete(`/todos/${todos[0]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo).toBeDefined();
                    done();
                }).catch(err => done(err));
            });
        });

        test('should return 404 if todo not found', done => {
            request(app)
            .delete(`/todos/${new ObjectID()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
        });

        test('should return 404 for non-object ids', done => {
            request(app)
            .delete('/todos/123')
            .set('x-auth', users[0].tokens[0].token)
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