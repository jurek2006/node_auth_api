const mongoose = require('mongoose');

mongoose.Promise = global.Promise; //informacja dla mongoose, że korzystamy z wbudowanej biblioteki promis
mongoose.connect('mongodb://localhost:27017/AuthApi');

module.exports = { mongoose }