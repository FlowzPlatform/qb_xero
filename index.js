var path = require('path')
var express = require('express')
var app = express()
var exphbs = require('express-handlebars')
var session = require('express-session')
var bodyParser = require('body-parser');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
var fs = require('fs')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: `${__dirname}/views/layouts`
})

app.set('view engine', 'hbs')
app.engine('hbs', hbs.engine)


app.use(express.static(path.join(__dirname, 'public')))
app.use(session({secret: 'secret', resave: 'false', saveUninitialized: 'false'}))

var xero = require('./xeroclient')
var qb = require('./app')
// var xerofun = require('./xerofunction')
var api = require('./apixero')
var apiqb = require('./apiqb')

app.get('/', (req, res) => {
    res.render('index')
})

app.use('/xero', xero)
app.use('/qb', qb)
app.use('/api/xero', api)
app.use('/api/qb', apiqb)

app.listen(3001, 'localhost', function (err) {
    console.log('Example router listening on localhost:3001!')
})

module.exports=app
