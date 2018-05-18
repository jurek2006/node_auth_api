// server/server.js
const express = require('express');
const bodyParser = require('body-parser');

const {mongoose} = require('./db/mongoose');

const {Todo} = require('./models/todo');
const {User} = require('./models/user');

// zapisanie testowego użytkownika
// const newUser = new User({
    
//     email: 'user testowy'
// });

// newUser.save().then( doc => {
//     console.log('Saved user', doc);
// }).catch(err => {
//     console.log('Unable to save user', err);
    
// });

const app = express();
app.use(bodyParser.json());

// route dodająca todo (z polem text) do bazy
app.post('/todos', (req, res) => {
    console.log(req.body);

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

app.get('/', (req, res) => {
    res.send('<h1>Witaj w node-auth-api</h1>');
});

if(!module.parent){
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

module.exports = {app}