var config = require('./configQB.json')
var express = require('express')
var app = express.Router()

// Initial view - loads Connect To QuickBooks Button
// app.get('/', function (req, res) {
// 	console.log("App.js")
//   res.render('home', config)
// })

// These calls will redirect to Intuit's authorization flow
// app.use('/connect_to_quickbooks', require('./routes/connect_to_quickbooks.js'))
//
// // Callback - called via redirect_uri after authorization
// app.use('/callback', require('./routes/callback.js'))
//
// // Connected - call OpenID and render connected view
// app.use('/connected', require('./routes/connected.js'))

// Call an example API over OAuth2
app.use('/', require('./routes/api_call.js'))

module.exports=app
