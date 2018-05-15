const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('<h1>Witaj w node-auth-api</h1>');
});

if(!module.parent){
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}