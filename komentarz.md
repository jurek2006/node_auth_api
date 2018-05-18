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


