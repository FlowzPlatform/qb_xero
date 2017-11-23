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
    // var urlname = 'krishna';
    // var urlapp = 'private app test company'
    // var allname = config.credentials;
    // console.log("allname",allname);
    // for (uname in allname) {
    //   console.log("name uppercase",uname.toUpperCase(),urlname.toUpperCase());
    //   if (uname.toUpperCase() == urlname.toUpperCase()) {
    //     configdata = config.credentials[uname]
    //     for (app in configdata) {
    //       if(app.toUpperCase() == urlapp.toUpperCase()) {
    //         config1 = configdata[app];
    //         console.log("config1",config1);
    //       }
    //     }
    //   }
    // }
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
    console.log("#########data.contacts",data[0].data.Contact.Addresses[0]);
    console.log("#########data lineitems",data[0].data.LineItems);
    console.log("&&&&&&&&&&&Inside invoice by id",data);
    // console.log("###############################");
    res.render('xero', {invoicedetail: data})
  }
})

//Order confirmation
router.get('/invoice/confirmOrder', async (req,res) => {
  console.log("1");
  config1 = checkNameAndApp(res,req.query.name,req.query.app)
  arr = await xerofun.getListInvoiceById(req.query.name, req.query.app, req.query.id, config1);
  console.log("@@@@@@@@@@@@@",arr[0].data._obj);
  arr[0].data._obj.LineItems = _.filter(arr[0].data._obj.LineItems, (items, key)=> { return key != '_index' })

  // arrinvoice = [];
  // arrinvoice.push(arr);
  // console.log("2");
  // data = [];
  // arrinvoice.forEach(function(result,i){
  //   // console.log('result', result)
  //   result.forEach(function(item, inx){
  //     data.push(item)
  //   })
  // })

  // console.log("#######",arr[0].data.LineItems);
  // console.log("##########data",arr);

  // var MjmlTemplate = require('./Mjml_Template/template1.txt');
  var MjmlTemplate = await fs.readFileSync('./Mjml_Template/template1.txt')
  // console.log("%%%%%%%%%%mjml template",MjmlTemplate);
  const template = compile("'" + MjmlTemplate + "'");

  var context = {
    invoice : arr
  }
  //
  const mjml = template(context);
  const html = mjml2html(mjml);

  var mail = await sendMail(html.html)

  // console.log("#############",mjml);
  // console.log("%%%%%%%%%%%",html);
  res.send(html.html);
})

let sendMail = async function(data) {
  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'abc@gmail.com',
        pass: 'xxxx'
    }
  });

  var mailOptions = {
      from: 'abc@gmail.com', // sender address (who sends)
      to: 'xyz@gmail.com', // list of receivers (who receives)
      subject: 'Hello', // Subject line
      html: data,
      // text: text1,
      //text:text1,
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error) {
          return console.log(error);
      }
      console.log('Message sent: ');
      return info;
  });
}

router.get('/invoice/mail', async (req,res) => {
  var text1 = htmlToText.fromString('<h1>Hello World</h1>');
  console.log(text1);
  //console.log(data);
  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'abc@gmail.com',
        pass: 'xxxx'
    }
  });

  var mailOptions = {
      from: 'abc@gmail.com', // sender address (who sends)
      to: 'xyz@gmail.com', // list of receivers (who receives)
      subject: 'Hello', // Subject line
      //html: 'text',
      text: text1,
      //text:text1,
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      // console.log(data);
      res.json({data:info})
      console.log('Message sent: ');
  });
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

//############################################# Payment via gateway
//Create payment for perticular invoice
router.get('/payment/:id/:cname', (req,res) => {
  var name = req.session.name;
  var app = req.session.app;
  var id = req.params.id;
  config1 = checkNameAndApp(res,name,app);
  console.log("name",name,"app",app,"id",id);
  res.render('addpayment',{id:id, name:req.params.cname});
})

router.post('/paymentviagateway', async function(req,res) {
	console.log("Inside get payment");
  var id = req.body.id;
	var name= req.session.name;
	var app = req.session.app;
  var amount = req.body.amount;
  var gateway = req.body.gateway;
  console.log("amount",amount,"gateway",gateway);

  if (name == undefined || app == undefined) {
    console.log("Inside payment gateway");
    res.redirect('/xero/invoice/id/'+id+'?name='+name+'&app='+app)
  }
  else {
    if (gateway == 'Stripe') {
      var payment = await xerofun.paymentviastripe(req,amount);
      // console.log("################",payment.status);
      if (payment.err) {
        console.log("#########Inside Err",payment.err.message);
        var err = payment.err.message
      }
      else {
        var status = payment.status;
      }
    }
    else if (gateway == 'AuthorizeDotNet') {
      var payment = await xerofun.paymentviaauthdotnet(req,amount);
      // console.log("###################",payment.messages.resultCode);
      if (payment.err) {
        console.log("#########Inside Err",payment.err.message);
        var err = payment.err.message
      }
      else {
        var status = payment.messages.resultCode
      }
    }
    else if (gateway == 'PayPal') {
      var payment = await xerofun.paymentviapaypal(req,amount);
      // console.log("###################",payment.state);
      if (payment.err) {
        console.log("#########Inside Err",payment.err.error_description);
        var err = payment.err.error_description
      }
      else {
        var status = payment.state
      }
    }
    else {
      console.log('Inside else');
      var err = 'select gateway'
    }

    if(status == 'succeeded' || status == 'Ok' || status == 'created') {
      console.log("@@@@@@@@");
      config1 = checkNameAndApp(res,name,app);
      var payment = await xerofun.postPayment(name,app,id,amount,config1);
      if(payment == err) {
        res.render('xero',{err:err})
      }
      else {
        res.redirect('/xero/invoice/id/'+id+'?name='+name+'&app='+app);
      }
    }
    else {
      console.log("%%%");
      if (err) { }
      else {
        var err = 'There is an error while performing payment using '+ gateway
      }
    }
    if (err) {
      res.render('xero',{err:err})
    }
  }
})

router.get('/paymentdetail/:invoiceid',async function(req,res) {
  console.log("Inside payment detail",data[0]);
    // console.log("Inside payment detail",data[0].data._obj);
    arr = [];
    var payment = data[0].data.Payments;
    console.log("payment",payment);
    console.log("Name",data[0].data.Contact.Name);
    console.log("InvoiceId",data[0].data.InvoiceID);

    // console.log("QQQQQQQQQQQQQQQQQpayment length",payment[0].length);
    if (payment[0] == undefined || (payment[0].length < 1)) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
      res.render('xero',{err:'Payment not done yet'})
    }
    else {
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
      payment.forEach(function(result,i) {
        paymentdata = {
          name: data[0].data.Contact.Name,
          invoiceid: data[0].data.InvoiceID,
          data: {}
        }
        paymentdata.data = result;
        // console.log("@@@@@@@@@@@@@@",result);
        // console.log('****************',result._obj.Amount);
        arr.push(paymentdata);
      })
      res.render('xero',{payment:arr});
    }
})

// router.post('/payment',async (req, res) => {
//   var name = req.session.name;
//   var app= req.session.app;
//   var id = req.body.id;
//   var amount = req.body.amount;
//   console.log("amount",amount);
//   var payment = await xerofun.postPayment(name, app, id, amount);
//   res.redirect('/xero/app/invoice/id/'+id+'?name='+name+'&app='+app);
// })

router.get('/listpayment', async function(req,res) {
  console.log("Params",req.query);
	payment = [];
	var params;
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  contactName = req.params.name;

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
      config1 = checkNameAndApp(res,req.query.name,req.query.app)
			arr = await xerofun.readpayment(req.query.name, req.query.app, config1);
			payment.push(arr);
		}
		else {
			var app = config.credentials[req.query.name];
			for(item in app) {
          config1 = checkNameAndApp(res,req.query.name,item);
          arr = await xerofun.readpayment(req.query.name, item, config1)
          payment.push(arr);
      }
		}
	}
	else {
		var apps = config.credentials;
	 	console.log("apps",apps);
		for (uname in apps) {
			var app = config.credentials[uname];
			for(item in app) {
          arr = await xerofun.readpayment(uname, item, config1)
          payment.push(arr);
      }
		}
	}
  data = []
  // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",payment[0].length);
  if (payment[0] == undefined || (payment[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.render('xero',{err:'No data found'})
  }
  else {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
    payment.forEach(function(result,i){
  		// console.log('result', result)
  		result.forEach(function(item, inx){
  			data.push(item)
  		})
  	})
    // console.log("Payment list",data[0]);
    // console.log("Payment list contact",data[0].data._obj.Invoice.Contact.Name);
    // console.log("payment amount",data[0].data.Amount);
    // console.log("invoice amount",data[0].data._obj.Amount);
    res.render('xero', {listpayment: data})
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

router.get('/pdf', async function(req,res) {
	var pdf = await xerofun.getListInvoiceById('name', 'app', 'id');
  res.contentType("application/pdf");
	var base64data = new Buffer(pdf, 'binary').toString('base64');
	var apidata = new Buffer(base64data, 'base64');
  console.log("###########################",apidata);
	res.send(apidata);
	// res.contentType("application/pdf");
	// res.send(pdf);
	// res.end(pdf);
	// var data =fs.readFileSync(pdf);
	// res.contentType("application/pdf");
	// res.send(pdf);
	// res.render('index',{pdf:pdf});
})

//List all invoice and payment
let listdata = async function(req,name,app) {
	var newarr = [];
	if(req.query.invoice != undefined) {
		console.log("1111111111111");
		var invoice = await xerofun.getListInvoices(name, app);
		newarr.push(invoice)
	}
	if(req.query.payment != undefined) {
		console.log("22222222222222222");
		var payment = await xerofun.readpayment(name, app);
		newarr.push(payment)
	}
	// if(req.query.refund != undefined) {
	// 	console.log("33333333333333333");
	// 	var refund = await qbfun.readRefund(req, name, app);
	// 	newarr.push(refund)
	// }
	if( (req.query.invoice == undefined) && (req.query.payment == undefined) ) {
		console.log("44444444444444444");
		var invoice = await xerofun.getListInvoices(name, app);
    // console.log("invoice",invoice[0]);
    console.log("Invoice length",invoice.length);
		newarr.push(invoice);
		var payment = await xerofun.readpayment(name, app);
    // console.log("payment",payment[0]);
    console.log("Payment length",payment.length);
		newarr.push(payment);
		// var refund = await qbfun.readRefund(req, name, app);
		// newarr.push(refund);
	}
  // console.log("Array length",newarr.length);
	return newarr;
}

router.get('/list', async function(req,res) {
		var arr = [];
		data = [];
		console.log("Params",req.query);
		console.log("Params Length",req.query)
		console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

		if (req.query.name != undefined) {
			if (req.query.app != undefined) {
        console.log("1!");
				var arr1 = await listdata(req, req.query.name, req.query.app);
        // console.log("##########################",arr1);
				arr.push(arr1);
        console.log("array@@@@@@@@@@@@@@@@@@@@@@@@@",arr);
			}
			else {
				var app = config.credentials[req.query.name];
				for(item in app) {
          console.log("2!");
	         var arr1 = await listdata(req, req.query.name, item)
           console.log("##########################",arr1);
					 arr.push(arr1)
	      }
			}
		}
		else {
			var apps = config.credentials;
		 	console.log("apps",apps);
			for (uname in apps) {
				var app = config.credentials[uname];
				for(item in app) {
          console.log("3!");
	          var arr1 = await listdata(req, uname, item)
						arr.push(arr1)
	      }
			}
		}
    // console.log("$$$$$$$$$$$$%%%%%%%%%%%%%%%%%%%%%%%%%",arr[0]);
		arr.forEach(function(response,i) {
      // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",response);
			response.forEach(function(result, i) {
        // console.log("####################################",result);
				result.forEach(function(item,i) {
					data.push(item)
				})
			})
		})
		// console.log("@@@@@@@@@@@@@@@@@@@@22",arr);
		res.render('xero', {listall:data});
})

module.exports=router;
