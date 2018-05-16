// server/models/todo.js
const mongoose = require('mongoose');

const Todo = mongoose.model('Todo', {
    text: {
        type: String
    }
});

module.exports = {Todo};