# body-parser i route POST /todos 
**Tworzymy tutaj nową route POST /todos, która pozwala na odebranie json ze szczegółami zadania do dodania - aby ją przetestować w postmanie wchodzimy na**
body-parser pozwoli na wysyłanie JSON do serwera:
## instalacja body-parser
```npm i body-parser --save```

## przetestowanie
Wchodzimy w postmanie na ```localhost:3000/todos```
i ustawiamy w Body zapytania (**raw > JSON**)
```
{
	"text": "text z postman"
}
```
Efekt powinien być taki, że konsola wyświetli zadany "to-do" i zostanie on dodany do bazy. W postmanie powinna być odpowiedź w stylu:
```
{
    "_id": "5afba585e1686e3ed727fc7a",
    "text": "text z postman",
    "__v": 0
}
```
-------------------------------------
# Testowanie POST /todos
*Potrzebujemy do tego modułów jest i supertest (w kursie były expect@1.20.2 mocha@3.0.2 nodemon@1.10.2 supertest@2.0.0 ale eksperymentuję z jest)*

## Eksport app w server.js
Jest potrzebne do testowania

```module.exports = {app}```

### Dodanie wymagania pola w mongoose
W modelu Todo dodajemy wymagalność pola text, jak i jego minimalną długość i przycinanie.

## Test server.test.js
W server.test.js dodajemy test route POST /todos (trzeba pamiętać o importowaniu modułu Todo)
Test sprawdza, czy dostaniemy w odpowiedzi status 200 i w body odpowiedzi text z dodawanego todo. Oraz w bazie danych czy znajduje się jeden todo, z przekazanym text.

Drugi test sprawdza, czy zwracany jest błąd, gdy nie przekaże się wartości pola

### beforeEach
Dodajemy beforeEach powodujące usunięcie wszystkich todos z bazy.

## Skrypt testów w package.json
Już było wcześniej dodane:
```
"scripts": {
    "test": "jest",
    "test-watch": "nodemon --exec \"npm test\""
  },
```

Teraz będzie można uruchomić testy w konsoli poleceniem:
```npm run test``` i ```npm run test-watch```

-----
# GET /todos - wyświetlanie danych



## dodanie GET /todos
W route wyszukujemy wszystkie dokumenty w todos za pomocą ```Todo.find({})``` i zwracamy je w obiekcie. Jeśli nastąpi błąd pobierania todos, to zwracamy status 400 i error
```
app.get('/todos', (req, res) => {
    Todo.find({}).then(todos => {
        res.send({todos})
    }, err => {
        res.status(400).send(err);
    })
});
```

Co równoznacznie można zapisać również:
```
app.get('/todos', (req, res) => {
    Todo.find({}).then(todos => {
        res.send({todos})
    }).catch(err => {
        res.status(400).send(err);
    });
});
```

---------
# Testowanie GET /todos

## Modyfikacja beforeEach
Modyfikujemy tak, żeby przed każdym testem usuwał z bazy wszystkie todo i dodawał dwa z todos (co musimy uwzględnić w testach)

Używamy **Todo.insertMany** i robimy łańcuch promis:
```
const todos = [
    {text: 'First todo'},
    {text: 'Second todo'}
];

beforeEach(done => {
    Todo.remove({}).then(() => {
        Todo.insertMany(todos);
    }).then(() => done());
});
```
W teście na poprawne dodawanie todo teraz musimy wyszukiwać todo o zadanym text ```Todo.find({text: todo_text})...``` a w teście na niepoprawne ilość znalezionych wszystkich todos musi być 2

-----
# GET /todos/:id Pobieranie pojedynczego todo 
Pobierać będziemy todo o id przekazanym w ścieżce, np.:
```localhost:3000/todos/1234```

## Pobranie parametru req.params
Parametr (tutaj id) będziemy pobierać z req.params czyli 
```
const id = req.params.id;
```

## ObjectID
W bazie MongoDB id jest instancją klasy ObjectID. Dzięki Mongoose nie musimy konwertować id ze stringa na ObjectID - Mongoose zrobi to za nas. 

**Jeśli w kwerendzie przekażemy id, które nie jest prawidłowym ObjectID - zostanie rzucony błąd. Natomiast jeśli przekażemy id, które jest prawidłowym ObjectID ale nie ma żadnego elementu o takim id, to zwrócona zostanie pusta tablica lub null**

### ObjectID.isValid()
Można obsłużyć błędne id w następujący sposób:
Najpierw importujemy ObjectID z modułu mongodb
```
const {ObjectID} = require('mongodb');
```

A następnie sprawdzamy, czy id jest poprawne i jeśli nie - zwracamy np. 404:
```
if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }
```

Teraz kolejnym etapem jest sprawdzenie czy nie zwrócono pustej tablicy lub null (j.w. id poprawne, ale nie ma dla niego żadnego todo):
```
Todo.findById(id).then(todo => {
        if(!todo) {
            return res.status(404).send();
        }
        res.send({todo});
    }).catch(err => res.status(400).send());
```

## Sprawdzenie czy działa
Sprawdzić można w postman, dodając todo za pomocą POST localhost:3000/todos i przekazania odpowiedniego obiektu w header. Jak zostanie dodany to zwrócone zostanie coś w stylu:
```
{
    "todo": {
        "_id": "5afe904449ddc01dce10cbba",
        "text": "jurek",
        "__v": 0
    }
}
```

I wtedy można skopiować wartość _id i zrobić nowe zapytanie
```localhost:3000/todos/5afe904449ddc01dce10cbba```
Powinno zwrócić szukany dokument

-----
# Testowanie GET /todos/:id

## new ObjectID()
Jeśli chcemy w testach generować prawidłowe ObjectID można to zrobić po prostu tworząc nową instancję tej klasy ```_id: new ObjectID()```

## Modyfikacja todos dodawanych w teście
Modyfikujemy todos, tak żeby miały _id (bo będziemy po nich wyszukiwać)
```
const todos = [
    {_id: new ObjectID(), text: 'First todo'},
    {_id: new ObjectID(), text: 'Second todo'}
];
```

## Test poprawnego zwrócenia todo o zadanym id
Sprawdzamy czy status jest 200 i czy dla znalezionego todo jest odpowiadający mu text. 
```
describe('GET /todos/:id', () => {
        test('should get todo with doc matching given id', done => {
            request(app)
            .get(`/todos/${todos[0]._id}`)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done)
        });
    });
```
## Test sytuacji, kiedy nie ma żadnego todo dla zadanego id
id jest prawidłowym ObjectID (generujemy nowe za pomocą ```new ObjectID()```) - zapytanie powinno zwrócić status 404

```
test('should return 404 if todo not found', done => {
            request(app)
            .get(`/todos/${new ObjectID()}`)
            .expect(404)
            .end(done);
        });
```

## Test sytuacji, kiedy id nie jest prawidłowe
id nie jest prawidłowym ObjectID. Testujemy j.w. dla dowolnego stringa id
```
test('shpult return 404 for non-object ids', done => {
            request(app)
            .get('/todos/123')
            .expect(404)
            .end(done);
        });
```
--------
# Ustawianie modelu user

## Uniqe - Wymuszanie unikalnego pola email w user
W modelu user dodajemu unique dla pola email

```
email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    }
```

## Validator
Instalujemy validator
```npm install validator --save```

Importujemy go w modelu user.js i ustawiamy validate:
```
validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
```

## Pola password i tokens
Dodajemy pole, które będzie przechowywać hash hasła i tokens, gdzie będą zapisywane tokenty niezbędne do weryfikacji czy użytkownik jest zalogowany

Model teraz wygląda następująco:
```
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
```

----
# POST /users - route do tworzenia użytkowników

## Modyfikacja beforeEach i beforeAll
Tak, żeby nie uruchamiały się zbędnie np. przed każdym testem, który nie modyfikuje danych

## Instalacja lodash
```npm i --save lodash```

Importujemy za pomocą:
```const _ = require('lodash');```

## Utworzenie nowej instancji User
Za pomocą lodash wybieramy z zapytania tylko pole email i password
```const user = new User(_.pick(req.body, ['email', 'password']));```

## Zapisanie użytkownika
Jeśli uda się zapisać zwracamy dane użytkownika, jeśli się nie uda, to zwracamy 400 i kod błędu

```
// route do tworzenia użytkowników
app.post('/users', (req, res) => {
    const user = new User(_.pick(req.body, ['email', 'password']));

    user.save()
        .then(user => {
            res.send(user);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});
```
## Instalacja jsonwebtoken
```npm i jsonwebtoken --save```
I importujemy w user.js

## Tworzymy UserSchema w modelu User
Dodajemy do UserSchema, na podstawie którego tworzony jest model User metody instancji

### generateAuthToken
Tworzymy metodę instancji (modelu User) generateAuthToken, która będzie generowała tokeny autoryzacji. Używamy zwykłej konstrukcji funkcji, zamiast arrow function, bo potrzebujemt this, która będzie wskazywała na instancję. 
Na razie zapisujemy "sekretną wartość" w jwt.sign (później przeniesiemy ją do pliku konfiguracji)

### uruchomienie user.generateAuthToken w route POST /users - zwracanie tokenu
Teraz chcemy, żeby przy zapisywaniu użytkownika token był generowany i zwracany w nagłówku odpowiedzi jako własne pole x-auth (własne pola w nagłówku mają nazwy x-...)
```
user.save()
        .then(user => {
            return user.generateAuthToken();
        })
        .then(token => {
            res.header('x-auth', token).send(user);
        })
        .catch(err => {
            res.status(400).send(err);
        });
```
### Sprawdzenie
Teraz w postman próbujemy stworzyć nowego użytkownika. W odpowiedzi powinien być token, w stylu:
```
{
    "__v": 1,
    "email": "nowyQ@wp.pl",
    "password": "qwerfgh",
    "_id": "5ab20d074ac0a3bc1c25ff5a",
    "tokens": [
        {
            "access": "auth",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YWIyMGQwNzRhYzBhM2JjMWMyNWZmNWEiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNTIxNjE4MTgzfQ.i1ffFrk1qxdeg0A1_Pb9SYmdgI380w4PLaJynHsca0o",
            "_id": "5ab20d074ac0a3bc1c25ff5b"
        }
    ]
}
```
W header odpowiedzi powinien być x-auth z tym właśnie tokenem

## UserSchema.methods.toJSON
Za pomocą nadpisania metody toJSON ( która określa, co jest zwracana, gdy mode mongoose jest konwertowany do wartości JSON) ograniczamy zwracane w zapytaniu informacje tylko do email i _id - nie chcemy pokazywać hasła ani tokenów

```
UserSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['email', '_id']);
}
```

Teraz odpowiedź wygląda w stylu:
```
{
    "email": "antek@mail.pl",
    "_id": "5b0383351159a35ad3f79b95"
}
```
Oczywiście x-auth jest w headers

# GET /users/me - Prywatna route
Dodajemy teraz route, która będzie wymagała autentykacji

## req.header() pozwala na odczytanie nagłówków
analogicznie jak res.header pozwala na ich wysłanie

## User.findByToken
Dodajemy metodę findByToken - jest to metoda statyczna - metoda modelu, a nie instancji (dlatego tworzymy ją w UserSchema.statics, a nie w UserSchema.methods)

```
UserSchema.statics.findByToken = function(token){
    const User = this; //odwołanie do modelu
    let decoded;

    try{
        decoded = jwt.verify(token, 'secret123');
    } catch (err){

    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}
```
## Prywatna route GET /users/me
W route korzystamy z metody findByToken
```
app.get('users/me', (req, res) => {
    const token = req.header('x-auth');

    User.findByToken(token).then(user => {
        if(!user){

        }
        res.send(user);
    })
});
```
Teraz gdy testowo stworzymy zapytanie z tokenem użytkownika w headers, to powinniśmy dostać jego email i _id

## Obsługa niepowodzenia weryfikacji tokenu
W catch zwracamy nową promisę z reject
```
UserSchema.statics.findByToken = function(token){
    const User = this; //odwołanie do modelu
    let decoded;

    try{
        decoded = jwt.verify(token, 'secret123');
    } catch (err){
        return new Promise((resolve, reject) => {
            rejjject();
        }
    )}

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
}
```

Ale możemy uprościć
```
catch (err){
        return new Promise((resolve, reject) => {
            rejjject();
        }
    )}
```
do
```
catch (err){
        return Promise.reject();
    }
```

I w route dodajemy obsługę błędu - zwracającą 401 - unauthorised
```
app.get('/users/me', (req, res) => {
    const token = req.header('x-auth');
    console.log('token', token);
    

    User.findByToken(token).then(user => {
        if(!user){

        }
        res.send(user);
    }).catch(err => {
        res.status(401).send();
    });
});
```

## Obsługa nieznalezienia usera 
Wystarczy zwrócić reject promisy
```
if(!user){
            return Promise.reject();
        }
```
# Przenoszenie autentykacji do middleware

Chcemy teraz podzielić kod, żeby uzyskać middleware do autentykacji, z którego będzie można korzystać w innych route

## Funkcja middleware authenticate
Tworzymy funkcję authenticate w server.js
```
const authenticate = (req, res, next) => {
    const token = req.header('x-auth');

    User.findByToken(token).then(user => {
        if(!user){
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next();
    }).catch(err => {
        res.status(401).send();
    });
};
```
Żeby ją użyć wystarczy przekazać jako parametr w route:
```
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});
```

## Przeniesienie authenticate do nowego pliku
Tworzymy plik server/middleware/authenticate.js i przenosimy do niego funkcję authenticate (a w server.js tylko ją importujemy)

```
const {User} = require('./../models/user');

// middleware używana w routes z autentykacją
const authenticate = (req, res, next) => {
    const token = req.header('x-auth');

    User.findByToken(token).then(user => {
        if(!user){
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next();
    }).catch(err => {
        res.status(401).send();
    });
};

module.exports = {authenticate}
```

# Hashowanie haseł

## bcryptjs
Do hashowania haseł używamy bcryptjs
```npm i bcrypt --save```

https://www.npmjs.com/package/bcryptjs

### Przykład użycia bcrypt
Hashujemy hasło (z salting) następująco:
```
bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
        console.log(hash);
    });
});
```

Teraz gdy chcemy sprawdzić poprawność hasła (np. przy logowaniu) robimy:
```
const hashedPassword = '$2a$10$xaf3hd35jUX3fbuT/mNf1.ixmv/92AeWVvyeqT5rZdQsTDSrHAnQ6';

bcrypt.compare(password, hashedPassword, (err, res) => {
    console.log(res);
});
```
Res może być true (gdy hasło się zgadza) lub false. 

<!-- Dokończyć mongoose middleware -->