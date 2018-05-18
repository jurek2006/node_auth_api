// server/models/todo.js
const mongoose = require('mongoose');

const Todo = mongoose.model('Todo', {
    text: {
        type: String, 
        required: true,
        minlength: 1,
        trim: true
    }
});

module.exports = {Todo};