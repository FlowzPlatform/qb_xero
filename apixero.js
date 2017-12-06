const exphbs = require('express-handlebars'),
    config = require('./config.json'),
    xero = require('xero-node'),
    paymentConf = require('./payment-plugin.json')

var _ = require('lodash');
var fs = require('fs')
const { compile } = require('handlebars');
const { mjml2html } = require('mjml');
// var minifier = require('minifier')
var minify = require('html-minifier').minify;

//To send email
var nodemailer = require('nodemailer');

//To perform math operation in handlebars
var helpers = require('handlebars-helpers');
var math = helpers.math();

var xerofun = require('./xerofunction');
var express = require('express');
var router = express.Router();
var axios = require('axios');
var arrcontact = [];
var arrinvoice = [];
var arrinvoicename = [];

let checkNameAndApp = function(res,name,app) {
  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if (configdata == undefined) {
    res.json({err:'Invalid Account Name'})
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.json({err:'Invalid App Name'})
    }
    else {
      return config1;
    }
  }
}

router.get('/contacts',async (req, res) => {
  console.log("Params",req.query);
	arrcontact = [];
  arr = [];
	var params;
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
        config1 = checkNameAndApp(res,req.query.name,req.query.app);
        arr = await xerofun.getContactDetail(req.query.name, req.query.app, config1);
        arrcontact.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.json({
          Err : 'Invalid Account Name'
        })
      }
      else {
        for(item in app) {
          config1 = app[item];
          arr = await xerofun.getContactDetail(req.query.name, item, config1)
          arrcontact.push(arr);
        }
      }
	  }
  }
	else {
		var apps = config.credentials;
	 	console.log("apps",apps);
		for (uname in apps) {
			var app = config.credentials[uname];
			for(item in app) {
        configdata = config.credentials[uname];
        config1 = configdata[item];
        arr = await xerofun.getContactDetail(uname, item, config1);
        arrcontact.push(arr);
      }
		}
	}
  if (arrcontact[0] == undefined || arrcontact[0].length == undefined || (arrcontact[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.render('xero',{err:arrcontact[0].err})
  }
  else {
    console.log("Arracontact data",arrcontact[0]);
    res.json({
      data: arrcontact
    });
  }
})

router.post('/contacts/save',async (req, res) => {
  console.log(req.body);
  var accname = req.body.accname;
  var appname = req.body.appname;
  config1 = checkNameAndApp(res,accname,appname);
  var savecontact = await xerofun.postSaveContact(req,accname,appname,config1);
  if (savecontact.isError) {
    console.log("Error******************",savecontact.err);
    res.json({
      Err : savecontact.err
    })
  }
  else {
    res.json({
      data : savecontact
    })
  }
})

router.get('/invoice',async (req, res) => {

  console.log("Params",req.query);
	arrinvoice = [];
	var params;
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
      config1 = checkNameAndApp(res,req.query.name,req.query.app)
			arr = await xerofun.getListInvoices(req.query.name, req.query.app, config1);
			arrinvoice.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.json({
          data: 'Invalid Account Name'
        });
      }
			for(item in app) {
        console.log("Inside for");
        config1 = app[item];
        arr = await xerofun.getListInvoices(req.query.name, item, config1);
        arrinvoice.push(arr);
	    }
		}
	}
	else {
		var apps = config.credentials;
	 	console.log("apps",apps);
		for (uname in apps) {
			var app = config.credentials[uname];
			for(item in app) {
          configdata = config.credentials[uname];
          config1 = configdata[item];
          arr = await xerofun.getListInvoices(uname, item, config1);
          arrinvoice.push(arr);
      }
		}
	}
  data = []
  console.log("QQQQQQQQQQQQQQQQQarrinvoice",arrinvoice[0].length);
  if (arrinvoice[0] == undefined || arrinvoice[0].length == undefined || (arrinvoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.json({
      data: arrinvoice[0].err
    });
  }
  else {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
    arrinvoice.forEach(function(result,i) {
  		// console.log('result', result)
  		result.forEach(function(item, inx) {
  			data.push(item)
  		})
  	})
    // console.log("********************Invoice Data",data[0]);
    res.json({
      data: data
    });
  }
})

router.get('/invoice/name/:name',async (req, res) => {

  console.log("Params",req.query);
	arrinvoice = [];
	var params;
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  contactName = req.params.name;

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
      config1 = checkNameAndApp(res,req.query.name,req.query.app)
			arr = await xerofun.getListInvoiceByName(req.query.name, req.query.app, req.params.name, config1);
			arrinvoice.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.json({
          data: 'Invalid Account name'
        });
      }
			for(item in app) {
            config1 = app[item];
            arr = await xerofun.getListInvoiceByName(req.query.name, item, req.params.name, config1);
            arrinvoice.push(arr);
        }
		 }
	}
	else {
		var apps = config.credentials;
	 	console.log("apps",apps);
		for (uname in apps) {
			var app = config.credentials[uname];
			for(item in app) {
          configdata = config.credentials[uname];
          config1 = configdata[item];
          arr = await xerofun.getListInvoiceByName(uname, item, req.params.name,config1)
          arrinvoice.push(arr);
      }
		}
	}
  data = []
  // console.log("QQQQQQQQQQQQQQQQQarrinvoice",arrinvoice[0].length);
  if (arrinvoice[0] == undefined || arrinvoice[0].length == undefined || (arrinvoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.json({
      data: arrinvoice[0].err
    });
  }
  else {
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
    arrinvoice.forEach(function(result,i) {
  		// console.log('result', result)
  		result.forEach(function(item, inx){
  			data.push(item)
  		})
  	})
    // console.log("********************Invoice Data",data[0]);
    res.json({
      data: data
    });
  }
})

router.get('/invoice/id/:id',async (req, res) => {
  console.log("Params",req.query);
	arrinvoice = [];
	var params;
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  var id = req.params.id;
  console.log("Invoice ID",id);
  req.session.name = req.query.name;
  req.session.app = req.query.app;
	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
      config1 = checkNameAndApp(res,req.query.name,req.query.app)
			arr = await xerofun.getListInvoiceById(req.query.name, req.query.app, id, config1);
			arrinvoice.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.json({
          data: 'Invalid Account name'
        });
      }
			for(item in app) {
              config1 = app[item];
	            arr = await xerofun.getListInvoiceById(req.query.name, item, id, config1);
	            arrinvoice.push(arr);
	        }
		}
	}
	else {
		var apps = config.credentials;
	 	console.log("apps",apps);
		for (uname in apps) {
			var app = config.credentials[uname];
			for(item in app) {
          configdata = config.credentials[uname];
          config1 = configdata[item];
          arr = await xerofun.getListInvoiceById(uname, item, id, config1);
          arrinvoice.push(arr);
      }
		}
	}
  data = [];
  // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",arrinvoice[0].length);
  if (arrinvoice[0] == undefined || arrinvoice[0].length == undefined || (arrinvoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.json({
      data: arrinvoice[0].err
    });
  }
  else {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
    arrinvoice.forEach(function(result,i){
  		// console.log('result', result)
  		result.forEach(function(item, inx){
  			data.push(item)
  		})
  	})
    // console.log("Inside invoice by id",data[0].data.Contact.EmailAddress);
    // console.log("Inside invoice by id",data[0].data.Contact.Phones);
    // console.log("###############################");
    res.json({
      data: data
    });
  }

})

router.post('/invoice/save',async (req, res) => {
  console.log("Inside invoice save api")
  var name = req.body.accname;
	var app = req.body.appname;
  var cname = req.body.name;
  var description = req.body.description;
  var qty = req.body.quantity;
  var amount = req.body.unitAmount;

  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if(configdata == undefined) {
    res.json({
      data: 'There is no such Account Exist'
    });
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.json({
          data: 'There is no such App Exist'
        });
    }
    else {
      var invoice = await xerofun.postSaveInvoice(name, app, cname, description, qty, amount,config1);
      // console.log("@@@@@@@@@@@@@@@@@@@@@@",savecontact);
      if (invoice.isError) {
        console.log("Error******************",savecontact.err);
        res.json({
          data:'Customer already exists.'
        });
      }
      else {
        res.json({
          data: invoice
        });
      }
    }
  }
})

router.get('/invoice/filter', async function(req,res) {

	console.log("Params",req.query);
	var invoice = [];
	var cname = req.query.cname;
	var date = req.query.date;
  var dategt = req.query.dategt;
	var datelt = req.query.datelt;
  var total  = req.query.total;
  var totalgt = req.query.totalgt;
	var totallt = req.query.totallt;
  var due = req.query.due;
	var duegt = req.query.duegt;
	var duelt = req.query.duelt;
	var status = req.query.status;

	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
	console.log('####################cname',req.query.cname);
	console.log('####################date',req.query.date);
  console.log('####################dategt',req.query.dategt);
	console.log('####################datelt',req.query.datelt);
  console.log('####################total',req.query.total);
	console.log('####################totalgt',req.query.totalgt);
	console.log('####################totallt',req.query.totallt);
  console.log('####################due',req.query.due);
	console.log('####################duegt',req.query.duegt);
	console.log('####################duelt',req.query.duelt);
	console.log('####################status',req.query.status);

	var date1 = new Date(date);
	var date2 = new Date();

	console.log("@@@@@@@@@",date1)
	console.log("@@@@@@@@@",date2)
	if(date1 > date2)
	{
    res.json({
      Err: "Date should not be Greater than Today's Date."
    })
	}
	else if(total < 0 || totalgt < 0 || totallt < 0 || due < 0 || duegt < 0 || duelt < 0)
	{
    res.json({
      Err: "Amount Should be Greater than Zero."
    })
	}
	else {
		if (req.query.name != undefined) {
			if (req.query.app != undefined) {
        config1 = checkNameAndApp(res,req.query.name,req.query.app);
				arr = await await xerofun.invoiceByAdvanceFilter(req.query.name, req.query.app, cname, date, dategt, datelt, total, totalgt, totallt, due, duegt, duelt, status,config1);
				invoice.push(arr);
			}
			else {
				var app = config.credentials[req.query.name];
				for(item in app) {
          config1 = checkNameAndApp(res,req.query.name,item);
					arr = await xerofun.invoiceByAdvanceFilter(req.query.name, item, cname, date, dategt, datelt, total, totalgt, totallt, due, duegt, duelt, status);
					invoice.push(arr);
				}
			}
		}
		else {
			var apps = config.credentials;
			console.log("apps",apps);
			for (uname in apps) {
				var app = config.credentials[uname];
				for(item in app) {
					arr = await xerofun.invoiceByAdvanceFilter(uname, item,cname, date, dategt, datelt, total, totalgt, totallt, due, duegt, duelt, status);
					invoice.push(arr);
				}
			}
		}
		data = []
    console.log("******************invoice inside api",invoice);
    // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",invoice[0].length);
    if (invoice[0] == undefined || (invoice[0].length < 1) || (invoice[0].Err)) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
      res.json({
        Err: 'Not able to fetch data'
      })
    }
    else {
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
      invoice.forEach(function(result,i){
  			// console.log('############result', result)
  			result.forEach(function(item, inx){
  				data.push(item)
  			})
  		})
  		// console.log('****************',data)
      res.json({
        data: data
      })
    }
  }
})

module.exports=router;
