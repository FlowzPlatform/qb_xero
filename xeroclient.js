const exphbs = require('express-handlebars'),
    config = require('./config.json'),
    xero = require('xero-node')

var express = require('express');
var xerofun = require('./xerofunction');
var router = express.Router();

//To convert mjml to html
var fs = require('fs')
const { compile } = require('handlebars');
const { mjml2html } = require('mjml');
var _ = require('lodash');

//To send email
var nodemailer = require('nodemailer');
var htmlToText = require('html-to-text');

var arrcontact = [];
var arrinvoice = [];
var data = [];
var arr = [];
let configdata;
var config1;

//Set the static files directory
router.use(express.static(`${__dirname}/views/assets`))

let checkNameAndApp = function(res,name,app) {
  console.log("Inside function check");
  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if (configdata == undefined) {
    res.render('xero',{err:'Invalid Account Name'})
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.render('xero',{err:'Invalid App Name'})
    }
    else {
      return config1;
    }
  }
}

// render the main.hbs layout and the index.hbs file
router.get('/', (req, res) => {
    res.render('xero', {app:'xero'})
})

//############################Get customers, create customer
router.get('/contacts',async (req, res) => {
  console.log("Params",req.query);
	arrcontact = [];
  arr = [];
	var params;
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
        config1 = await checkNameAndApp(res,req.query.name,req.query.app);
        arr = await xerofun.getContactDetail(req.query.name, req.query.app, config1);
        arrcontact.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.render('xero',{err:'Invalid Account Name'})
      }
			for(item in app) {
        // console.log("##############",item);
        config1 = app[item];
        arr = await xerofun.getContactDetail(req.query.name, item, config1)
        arrcontact.push(arr);
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
  data = []
  // console.log("QQQQQQQQQQQQQQQQQarrcontact",arrcontact[0].length);
  if (arrcontact[0] == undefined || arrcontact[0].length == undefined || (arrcontact[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.render('xero',{err:arrcontact[0].err})
  }
  else {
    arrcontact.forEach(function(result,i) {
      result.forEach(function(item, inx) {
        data.push(item)
      })
    })
    console.log("arrcontact@@@@@@@@@@@@@@@@@@@@@@@@@@",data[1].data);
    // console.log("###########Customer data#######",data[0].data);
    // console.log("###########Customer data#######",data[0].data.Addresses['0'].tracking._instance);
    // console.log("###########Customer status#######",data[0].data.ContactStatus);
    res.render('xero', {cnt: data});
  }
})

router.get('/contact/:name', async function(req,res) {
		var info = [];
    data = [];
    arrcontact = [];
    configdata = config.credentials[req.query.name];
    config1 = configdata[req.query.app];
    checkNameAndApp(res,req.query.name,req.query.app)
    var arr = await xerofun.getContactDetail(req.query.name, req.query.app, config1);
    arrcontact.push(arr);
    arrcontact.forEach(function(result,i) {
      result.forEach(function(item, inx){
        data.push(item)
      })
    })
    data.forEach(function(result,i) {
      console.log("###########",result.data.Name);
      if (result.data.Name == req.params.name) {
        info.push(result);
      }
    })
    // console.log("111111111111111111111111111111111111",info);
    // console.log("2222222222222222222222222222222",info[0].data.Addresses['0']);
    // console.log("33333333333333333333333333333333",info[0].data.Addresses['1']);
    res.render('xero',{contact:info});
})

//Redirect to form for creating new contact
router.get('/contacts/new', (req,res) => {
    res.render('addcontact');
})

router.post('/contacts/add',async (req, res) => {
  var name = req.body.accname;
	var app = req.body.appname;
  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if(configdata == undefined) {
    res.render('xero',{err:'There is no such Account Exist'})
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.render('xero',{err:'There is no such App Exist'})
    }
    else {
      var savecontact = await xerofun.postSaveContact(req,name, app, config1);
      // console.log("@@@@@@@@@@@@@@@@@@@@@@",savecontact);
      if (savecontact.isError) {
        console.log("Error******************",savecontact.err);
        res.render('xero',{err:savecontact.err})
      }
      else {
        res.redirect('/xero/contact/'+req.body.name+'?name='+name+'&app='+app);
      }
    }
  }
})

//#############################Get Invoice, create invoice
// //Fetch all invoices
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
        res.render('xero',{err:'Invalid Account Name'})
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
    res.render('xero',{err:arrinvoice[0].err})
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
    res.render('xero', {invoice: data});
  }
})

//Fetch invoice by name
var contactName;
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
        res.render('xero',{err:'Invalid Account name'})
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
    res.render('xero',{err:arrinvoice[0].err})
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
    res.render('xero', {invoice: data});
  }
})

//Fetch invoice by id
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
      arr[0].data._obj.LineItems = _.filter(arr[0].data._obj.LineItems, (items, key)=> { return key != '_index' })
			arrinvoice.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.render('xero',{err:'Invalid Account name'})
      }
			for(item in app) {
              config1 = app[item];
	            arr = await xerofun.getListInvoiceById(req.query.name, item, id, config1);
              arr[0].data._obj.LineItems = _.filter(arr[0].data._obj.LineItems, (items, key)=> { return key != '_index' })
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
          arr[0].data._obj.LineItems = _.filter(arr[0].data._obj.LineItems, (items, key)=> { return key != '_index' })
          arrinvoice.push(arr);
      }
		}
	}
  data = [];
  // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",arrinvoice[0].length);
  if (arrinvoice[0] == undefined || arrinvoice[0].length == undefined || (arrinvoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.render('xero',{err:arrinvoice[0].err})
  }
  else {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
    arrinvoice.forEach(function(result,i){
  		// console.log('result', result)
  		result.forEach(function(item, inx){
  			data.push(item)
  		})
  	})
    // console.log("#########data.contacts",data[0].data.Contact.Addresses[0]);
    // console.log("#########data lineitems",data[0].data.LineItems);
    // console.log("&&&&&&&&&&&Inside invoice by id",data);
    // console.log("###############################");
    res.render('xero', {invoicedetail: data})
  }
})

//Redirect to form for creating new invoice
router.get('/invoice/new', (req,res) => {
  res.render('addinvoice',{name:req.query.name, app:req.query.app, cname:req.query.cname});
})

//Create new invoice
router.post('/invoice/add',async (req, res) => {
  var name = req.body.accname;
	var app = req.body.appname;
  var cname = req.body.name;
  var description = req.body.description;
  var qty = req.body.quantity;
  var amount = req.body.unitAmount;

  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if(configdata == undefined) {
    res.render('xero',{err:'There is no such Account Exist'})
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.render('xero',{err:'There is no such App Exist'})
    }
    else {
      var invoice = await xerofun.postSaveInvoice(name, app, cname, description, qty, amount,config1);
      // console.log("@@@@@@@@@@@@@@@@@@@@@@",savecontact);
      if (invoice.isError) {
        console.log("Error******************",savecontact.err);
        res.render('xero',{err:'Customer already exists.'})
      }
      else {
        res.redirect('/xero/invoice/name/'+cname+'?name='+name+'&app='+app);
      }
    }
  }
})


router.get('/invoice/filter', async function(req,res) {

	console.log("Params",req.query);
	var invoice = [];
	var cname = req.query.cname;
	var date = req.query.date;
	var daterange = req.query.daterange;
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
	console.log('####################daterange',req.query.daterange);
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
		res.render('filter', {
			err: "Date should not be Greater than Today's Date."
		})
	}
	else if(total < 0 || totalgt < 0 || totallt < 0 || due < 0 || duegt < 0 || duelt < 0)
	{
		res.render('filter', {
			err: "Amount Should be Greater than Zero."
		})
	}
	else {
		if (req.query.name != undefined) {
			if (req.query.app != undefined) {
        config1 = checkNameAndApp(res,req.query.name,req.query.app);
				arr = await await xerofun.invoiceByAdvanceFilter(req.query.name, req.query.app, cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status,config1);
				invoice.push(arr);
			}
			else {
				var app = config.credentials[req.query.name];
				for(item in app) {
          config1 = checkNameAndApp(res,req.query.name,item);
					arr = await xerofun.invoiceByAdvanceFilter(req.query.name, item, cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status);
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
					arr = await xerofun.invoiceByAdvanceFilter(uname, item,cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status);
					invoice.push(arr);
				}
			}
		}
		data = []
    // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",invoice[0].length);
    if (invoice[0] == undefined || (invoice[0].length < 1)) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
      res.render('xero',{err:'Not able to fetch data'})
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
  		res.render('xero', {filter : data});
    }
  }
})

module.exports=router;
