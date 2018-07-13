const mongoose = require('mongoose');

mongoose.Promise = global.Promise; //informacja dla mongoose, że korzystamy z wbudowanej biblioteki promis
mongoose.connect(process.env.MONGODB_URI);

module.exports = { mongoose }