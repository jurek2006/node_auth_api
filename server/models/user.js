// server/models/user.js
const mongoose = require('mongoose');
const validator = require('validator');

const User = mongoose.model('User', {
// Model user - z jednym polem email, będącym wymaganym stringiem, przycinanym (trim) o długości min 1 znaku
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true, 
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,

        }
    }]
});

module.exports = {User};