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
