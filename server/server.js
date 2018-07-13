// server/server.js
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {mongoose} = require('./db/mongoose');
const {ObjectID} = require('mongodb');

const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/middleware');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('<h1>Witaj w node-auth-api</h1>');
});

// route do tworzenia użytkowników
app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']));

    user.save()
        .then(user => {
            return user.generateAuthToken();
        })
        .then(token => {
            res.header('x-auth', token).send(user);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

// route do logowania się
app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    // weryfikowanie czy użytkownik o takim email i haśle istnieje
    User.findByCredentials(body.email, body.password).then(user => {
        return user.generateAuthToken().then(token => {
            res.header('x-auth', token).send(user);
        })
    }).catch(err => {
        res.status(400).send();
    });
});


// ROUTES Z AUTENTYKACJĄ

// route prywatna (wymaga zalogowanego użytkownika) dodająca todo (z polem text) do bazy (zapamiętując id użytkownika, który je utworzył)
app.post('/todos', authenticate, (req, res) => {

    // zapisanie przekazanego todo
    const newTodo = new Todo({
        
        text: req.body.text,
        completed: req.body.completed,
        _creator: req.user._id
    });

    newTodo.save()
    .then( doc => {
        res.send(doc);
    }).catch(err => {
        res.status(400).send(err);
    });
});

// route prywatna zwracająca wszystkie todos utworzone przez zalogowanego użytkownika
app.get('/todos', authenticate, (req, res) => {
    Todo.find({
        _creator: req.user._id
    }).then(todos => {
        res.send({todos})
    }).catch(err => {
        res.status(400).send(err);
    });
});

// route zwracająca todo o zadanym id
app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findOne({
            _id: id,
            _creator: req.user._id
        }).then(todo => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch(err => res.status(400).send());
    
});

// route usuwająca todo o zadanym id dla zautentyfikowanego twórcy tego todo
app.delete('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if(!todo) {
            return res.status(404).send();
        }
        res.status(200).send({todo});
    }).catch(err => res.status(404).send());
});

// route modyfikująca todo o zadanym id
app.patch('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);
    
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    
    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }
    
    // Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then(todo => {
        Todo.findOneAndUpdate({
                _id: id,
                _creator: req.user._id
            }, {$set: body}, {new: true}).then(todo => {
                if(!todo){
                    return res.status(404).send();
                }

                res.send({todo});
            }).catch(err => { res.status(400).send(); });
});

// prywatna route
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

// route do wylogowywania
app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }), () => {
        res.status(400).send();
        
    }
});


if(!module.parent){
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

module.exports = {app}