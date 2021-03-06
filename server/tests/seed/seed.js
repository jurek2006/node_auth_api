const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('../../models/todo');
const {User} = require('../../models/user');

// użytkownicy do testów
const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const todos = [
    {_id: new ObjectID(), text: 'First todo', _creator: userOneId},
    {_id: new ObjectID(), text: 'Second todo', completed: true, completedAt: 123, _creator: userTwoId}
];

const todosRemoveAndAdd = done => {
// funkcja usuwająca wszystkie todos i dodające te z tablicy todos, używana przed poszczególnymi testami lub zestawami testów
    Todo.remove({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
}


const users = [{
        // użytkownik z ważnym tokenem autentykacji
        _id: userOneId,
        email: 'valid@node.pl',
        password: 'superPass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id:userOneId.toHexString(), access: 'auth'}, 'secret123').toString()
        }]
    },
    {
        // drugi użytkownik (także z tokenem autentykacji)
        _id: userTwoId,
        email: 'notgood@node.pl',
        password: 'costam2',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id:userTwoId.toHexString(), access: 'auth'}, 'secret123').toString()
        }]
    }
];

const populateUsers = done => {
// funkcja usuwająca i dodająca użytkowników testowych (do użytku w beforeEach)
    User.remove({}).then(() => {

        const userOne = new User(users[0]).save();
        const userTwo = new User(users[1]).save();
        
        return Promise.all([userOne, userTwo]);
    }).then(() => done());
}

module.exports = {todos, todosRemoveAndAdd, users, populateUsers}