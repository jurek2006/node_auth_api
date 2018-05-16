// server/server.js
const express = require('express');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');

const newTodo = new Todo({
    text: 'Jakis tekst nowy'
});

newTodo.save().then( doc => {
    console.log('Saved todo', doc);
}).catch(err => {
    console.log('Unable to save todo', err);
    
});

const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Witaj w node-auth-api</h1>');
});

if(!module.parent){
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

module.exports = {app}