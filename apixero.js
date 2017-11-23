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

// router.post('/payment',async (req, res) => {
//
//   console.log("Inside get payment");
//   var id = req.body.id;
// 	var name= req.body.accname;
// 	var app = req.body.appname;
//   var amount = req.body.amount;
//   var gateway = req.body.gateway;
//   console.log("amount",amount,"gateway",gateway);
//
//   if (name == undefined || app == undefined) {
//     console.log("Inside payment gateway");
//     res.json({
//       data: 'Invalid Account and App name'
//     })
//   }
//   else {
//     if (gateway == 'Stripe') {
//       var payment = await xerofun.paymentviastripe(req,amount);
//       // console.log("################",payment.status);
//       if (payment.err) {
//         console.log("#########Inside Err",payment.err.message);
//         var err = payment.err.message
//       }
//       else {
//         var status = payment.status;
//       }
//     }
//     else if (gateway == 'AuthorizeDotNet') {
//       var payment = await xerofun.paymentviaauthdotnet(req,amount);
//       // console.log("###################",payment.messages.resultCode);
//       if (payment.err) {
//         console.log("#########Inside Err",payment.err.message);
//         var err = payment.err.message
//       }
//       else {
//         var status = payment.messages.resultCode
//       }
//     }
//     else if (gateway == 'PayPal') {
//       var payment = await xerofun.paymentviapaypal(req,amount);
//       // console.log("###################",payment.state);
//       if (payment.err) {
//         console.log("#########Inside Err",payment.err.error_description);
//         var err = payment.err.error_description
//       }
//       else {
//         var status = payment.state
//       }
//     }
//     else {
//       console.log('Inside else');
//       var err = 'Gateway is not provided'
//     }
//
//     if(status == 'succeeded' || status == 'Ok' || status == 'created') {
//       console.log("@@@@@@@@");
//       config1 = checkNameAndApp(res,name,app);
//       var payment = await xerofun.postPayment(name,app,id,amount,config1);
//       if(payment == err) {
//         res.json({
//           data: err
//         })
//       }
//       else {
//         res.json({
//           data: payment
//         })
//       }
//     }
//     else {
//       console.log("%%%");
//       if (err) { }
//       else {
//         var err = 'There is an error while performing payment using '+ gateway
//       }
//     }
//     if (err) {
//       res.json({
//         data: err
//       })
//     }
//   }
// })

router.post('/payment/:gateway', async function(req,res) {

    var name = 'Krishna';
    var app = 'Private Demo Company';
    var id = req.body.InvoiceID;
    var gateway = req.params.gateway;
    console.log("#############gateway",gateway);
    var paymentConfig = paymentConf.credentials[gateway];
    // console.log("Payment config credentials", paymentConfig);

    var payment = await xerofun.payment(req,paymentConfig,gateway,req.body.amount,req.body.type,req.body.cardNumber,req.body.expMonth,req.body.expYear,req.body.cvc);
    // console.log("################",payment.status);
    if (payment.err) {
      console.log("#########Inside Err",payment.err.message);
      var err = payment.err.message || payment.err.response.error_description
      console.log("Error in payment",err);
    }
    else {
      var status = payment.status || payment.messages.resultCode || payment.state
      console.log("Status of payment", status);
    }

    if(status == 'succeeded' || status == 'Ok' || status == 'created') {
      console.log("@@@@@@@@");
      console.log("####payment amount",payment.amount);
      config1 = checkNameAndApp(res,name,app);
      var payment1 = await xerofun.postPayment(name, app, id, req.body.amount, config1);
      if(payment1.err) {
        res.json({
          Err: payment1.err
        })
      }
      else {
        //Send Invoice as mail
        console.log("before redirect");
        res.redirect('/api/xero/invoice/confirmOrder?name='+name+'&app='+app+'&id='+id)
        // res.json({
        //   data: payment1
        // })
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
      res.json({
        data: err
      })
    }
})

router.get('/invoice/confirmOrder', async(req,res) => {
  console.log("Inside confirm order");
  config1 = checkNameAndApp(res,req.query.name,req.query.app)
  arr = await xerofun.getListInvoiceById(req.query.name, req.query.app, req.query.id, config1);
  // console.log("@@@@@@@@@@@@@",arr[0].data._obj);
  arr[0].data._obj.LineItems = _.filter(arr[0].data._obj.LineItems, (items, key)=> { return key != '_index' })

  // console.log("##########data",arr);
  console.log("#######",arr[0].data.LineItems);

  // var MjmlTemplate = require('./Mjml_Template/template1.txt');
  var MjmlTemplate = await fs.readFileSync('./Mjml_Template/template1.txt')
  // console.log("%%%%%%%%%%mjml template",MjmlTemplate);
  const template = compile("'" + MjmlTemplate + "'");

  var context = {
    invoice : arr
  }

  const mjml = template(context);
  const html = mjml2html(mjml);

  console.log("before send mail");
  //Send email
  var mail = await sendMail(html.html);

  // console.log("#############",mjml);
  // console.log("%%%%%%%%%%%",html.html);

	// console.log("#######",input)

  res.json(html.html);
})

let sendMail = async function(data) {
  console.log("Inside send mail");
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
      subject: 'Invoice', // Subject line
      html: data,
      // text: text1,
      //text:text1,
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error) {
          return console.log(error);
      }
      console.log('Message sent!!!');
      return info;
  });
}

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

  // var d1 = (new Date(date)).getDate();
  // console.log("#######date date",d1);
  // var m1 = (new Date(date)).getMonth();
  // console.log("#######date month",m1);
  // var y1 = (new Date(date)).getFullYear();
  // console.log("#######date year",y1);

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
    // console.log("QQQQQQQQQQQQQQQQQarrinvoice length",invoice[0].length);
    if (invoice[0] == undefined || (invoice[0].length < 1)) {
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
