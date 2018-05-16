// server/models/user.js
const mongoose = require('mongoose');

const User = mongoose.model('User', {
// Model user - z jednym polem email, będącym wymaganym stringiem, przycinanym (trim) o długości min 1 znaku
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }
});

module.exports = {User};