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

// route dodająca todo (z polem text) do bazy
app.post('/todos', (req, res) => {

    // zapisanie przekazanego todo
    const newTodo = new Todo({
        
        text: req.body.text
    });

    newTodo.save()
    .then( doc => {
        res.send(doc);
    }).catch(err => {
        res.status(400).send(err);
    });
});

// route zwracająca wszystkie todos z bazy danych
app.get('/todos', (req, res) => {
    Todo.find({}).then(todos => {
        res.send({todos})
    }).catch(err => {
        res.status(400).send(err);
    });
});

// route zwracająca todo o zadanym id
app.get('/todos/:id', (req, res) => {
    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    Todo.findById(id).then(todo => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch(err => res.status(400).send());
    
});

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