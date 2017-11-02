var config = require('../configQB.json')
var express = require('express')
var router = express.Router()
var qbfun = require('./qbfunction');
var xerofun = require('./../xerofunction');
var fs = require('fs')

var arrcustomer = [];
var requestObj;
var data = [];

let checkNameAndApp = function(req,res,name,app) {
  configdata = config.credentials[name];
  // console.log("configdata",configdata);
  if (configdata == undefined) {
    res.render('quickbook',{err:'Invalid Account Name'})
  }
  else {
    config1 = configdata[app];
    // console.log("config1",config1);
    if (config1 == undefined) {
        res.render('quickbook',{err:'Invalid App Name'})
    }
    else {
      req.session.name = name;
			req.session.app = app;
	    req.session.credentials = config1;
    }
  }
}

router.get('/', function(req,res) {
	res.render('quickbook',{app:'Quickbook'})
})

//############################Get customers, create customer
router.get('/customers',async function (req, res) {

	console.log("Params",req.query);
	var customers = [];
	var arr = [];
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
			checkNameAndApp(req,res,req.query.name,req.query.app);
			arr = await qbfun.getcustomer(req, req.query.name, req.query.app);
			// console.log("!!!!!!!!!!!!!!",arr);
			customers.push(arr);
		}
    else {
			var app = config.credentials[req.query.name];
      if (app == undefined) {
        res.render('quickbook',{err:'Invalid Account name'})
      }
			for(item in app) {
          configdata = config.credentials[req.query.name];
          config1 = configdata[item];
          req.session.app = item;
          req.session.credentials = config1;
					// checkNameAndApp(req,res,req.query.name,item)
          arr = await qbfun.getcustomer(req, req.query.name, item)
          customers.push(arr);
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
          req.session.app = item;
          req.session.credentials = config1;
          arr = await qbfun.getcustomer(req, uname, item)
          customers.push(arr);
      }
		}
	}
	// console.log("##########################");
	// console.log(customers);
	// console.log("##########################");
  data = []
	// console.log("arrcontact length",customers[0].length);
	// console.log("ERRRRRRRRROOOOOOOOOOOOORRRRRRR",customers[0].err);
  if (customers[0] == undefined || customers[0].length == undefined || (customers[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
		// if (customers[0].err) {
			res.render('quickbook',{err:customers[0].err})
		// }
		// else {
			// res.render('quickbook',{err:'Not Able to Fetch Data'})
		// }
  }
  else {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@");
		customers.forEach(function(result,i){
			// console.log('result', result)
			result.forEach(function(item, inx){
				data.push(item)
			})
		})
		// console.log('****************Customer data',data[0])
		res.render('quickbook',{customers:data});
  }
})

router.get('/customer/name/:name', async function(req,res) {
		var info = [];
    console.log("data length",data.length);
    if (data.length == 0) {
      data = [];
      customers = [];
      checkNameAndApp(req,res,req.query.name,req.query.app);
			arr = await qbfun.getcustomer(req, req.query.name, req.query.app);
      customers.push(arr);
      if (customers[0] == undefined || customers[0].length == undefined || (customers[0].length < 1)) {
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
    			res.render('quickbook',{err:customers[0].err})
      }
      else {
        customers.forEach(function(result,i) {
          result.forEach(function(item, inx) {
            data.push(item)
          })
        })
        data.forEach(function(result,i) {
    			console.log("###########Customer name",result.data.DisplayName);
    			if (result.data.DisplayName == req.params.name) {
    				info.push(result);
    			}
    		})
        // console.log("111111111111111111111111111111111111",info);
    		res.render('quickbook',{customer:info});
      }
    }
    else {
      data.forEach(function(result,i) {
        console.log("###########Customer name",result.data.DisplayName);
        if (result.data.DisplayName == req.params.name) {
          info.push(result);
        }
      })
      // console.log("111111111111111111111111111111111111",info);
      res.render('quickbook',{customer:info});
    }
})

router.get('/customer/new', async function(req,res) {
	res.render('QBaddcustomer');
})

router.post('/customer/add',async function (req, res) {
	var name = req.body.accname;
	var app = req.body.appname;

  checkNameAndApp(req,res,name,app)
	var savecontact = await qbfun.postcustomer(req, name, app)
  if (savecontact.isError) {
    console.log("Error******************",savecontact.err);
    res.render('quickbok',{err:'Contact name already exists.'})
  }
  else {
    res.redirect('/qb/customer/name/'+req.body.DisplayName+'?name='+name+'&app='+app);
  }
})

//#############################Get Invoice, create invoice
router.get('/invoice',async function (req, res) {

	console.log("Params",req.query);
	var invoice = [];
	console.log("Params Length",req.query)
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')

	if (req.query.name != undefined) {
		if (req.query.app != undefined) {
      checkNameAndApp(req,res,req.query.name,req.query.app);
			arr = await qbfun.listinvoice(req, req.query.name, req.query.app)
      invoice.push(arr);
		}
		else {
      var app = config.credentials[req.query.name];
      for(item in app) {
          checkNameAndApp(req,res,req.query.name,item)
          arr = await qbfun.listinvoice(req, req.query.name, item)
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
          configdata = config.credentials[uname];
          config1 = configdata[item];
          req.session.app = item;
          req.session.credentials = config1;
          arr = await qbfun.listinvoice(req, uname, item)
        	invoice.push(arr);
      }
		}
	}
  var data = []
  console.log("invoice length",invoice[0].length);
  if (invoice[0] == undefined || invoice[0].length == undefined || (invoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
			res.render('quickbook',{err:invoice[0].err})
  }
  else {
    invoice.forEach(function(result,i){
      result.forEach(function(item, inx){
        data.push(item)
      })
    })
    res.render('quickbook',{invoice:data});
  }
})

router.get('/invoice/new', async function(req,res) {
	res.render('QBaddinvoice',{name:req.query.name, app:req.query.app, cname:req.query.cname});
})

router.post('/invoice/add', async function(req,res) {
	var name = req.body.accname;
	var app = req.body.appname;
	var custname = req.body.name;
	var amount = req.body.amount;
	console.log("##########name",name)
	console.log("##########app",app)
	console.log("##########custname",custname)
	console.log("##########amount",amount)
  checkNameAndApp(req, res, name, app);
	var invoice = await qbfun.saveinvoice(req, name, app, custname, amount);
  if (invoice.isError) {
    res.render('quickbook', {err:invoice.err})
  }
  else {
    res.redirect('/qb/invoice/name/'+custname+'?name='+name+'&app='+app);
  }
})

router.get('/invoice/name/:cust_name',async function (req, res) {

	var cust_name = req.params.cust_name;
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
	console.log("Params",req.query);
	var invoice = [];

	var name = req.query.name;
	var app = req.query.app;
  checkNameAndApp(req, res, name, app);
	var credentials = config.credentials[name];
	for(item in credentials){
		if (item == app) {
        arr = await qbfun.invoicebyname(req, name, app, cust_name)
        invoice.push(arr);
		}
  }
  var data = []
  console.log("invoice length",invoice[0].length);
  if (invoice[0] == undefined || invoice[0].length == undefined || (invoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
			res.render('quickbook',{err:invoice[0].err})
  }
  else {
    invoice.forEach(function(result,i){
  		result.forEach(function(item, inx){
  			data.push(item)
  		})
  	})
  	// console.log('****************',data)
  	res.render('quickbook',{invoice:data});
  }
})

router.get('/invoice/id/:id',async function (req, res) {

	var cust_name = req.params.cust_name;
	console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
	console.log("Params",req.query);
	var invoice = [];

	var name = req.query.name;
	var app = req.query.app;

  checkNameAndApp(req, res, name, app);
	var credentials = config.credentials[name];
	for(item in credentials){
		if (item == app) {
        arr = await qbfun.invoicebyid(req,name,item)
        invoice.push(arr);
		}
  }
  var data = []
  console.log("invoice length",invoice[0].length);
  if (invoice[0] == undefined || invoice[0].length == undefined || (invoice[0].length < 1)) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!");
			res.render('quickbook',{err:invoice[0].err})
  }
  else {
    invoice.forEach(function(result,i) {
  		// console.log('result', result)invoice.forEach(function(result,i){
  		result.forEach(function(item, inx) {
  			data.push(item)
  		})
  	})
  	// console.log('****************',data)
    console.log("222222222222222222222222222222222",data[0].data);
  	res.render('quickbook',{invoiceDetail:data});
  }
})

//############################################# Payment via gateway
router.get('/payment/:id/:cname/:value', function(req,res) {
	var id = req.params.id;
	var cname = req.params.cname;
	var value = req.params.value;
	console.log("id",id, "name",cname, "value",value);
	res.render('QBaddpayment',{id:id,cname:cname,value:value});
})

router.post('/paymentviagateway', async function(req,res) {
	console.log("Inside get payment");
	var name= req.session.name;
	var app = req.session.app;
  if (name == undefined || app == undefined) {
    res.render('quickbook',{err:'Session Expired'});
  }
	var id = req.body.id;
	var amount = req.body.amount;
	var gateway = req.body.gateway;
	console.log("amount",amount,"gateway",gateway);

	if (gateway == 'Stripe') {
		var payment = await qbfun.paymentviastripe(req,amount);
		console.log("################",payment.status);
		var status = payment.status;
	}
	else if (gateway == 'AuthorizeDotNet') {
		var payment = await qbfun.paymentviaauthdotnet(req,amount);
		console.log("###################",payment.messages.resultCode);
		var status = payment.messages.resultCode
	}
	else if (gateway == 'PayPal') {
		var payment = await qbfun.paymentviapaypal(req,amount);
		console.log("###################",payment.state);
		var status = payment.state
	}
	else {
		console.log('Inside else');
    var err = 'Payment gateway is not provided';
		// res.render('quickbook',{err:'Payment gateway is not provided'})
	}

	if(status == 'succeeded' || status == 'Ok' || status == 'created') {
		console.log("@@@@@@@@");
		var payment = await qbfun.postpayment(req,name,app);
    if(payment ==  err) {

    }
		res.redirect('/qb/invoice/id/'+id+'?name='+name+'&app='+app);
	}
	else {
		res.render('quickbook',{err:'There is an error while connecting with quickbook payment'})
	}
})

router.get('/paymentdetail/:invoiceid',async function(req,res) {
		payment = [];
		arr = await qbfun.readpaymentbyid(req, req.query.name, req.query.app,req.params.invoiceid)
		console.log("#############",arr);
		payment.push(arr);
		// console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr[0].data.Line[0]);
		var data = []
		payment.forEach(function(result,i) {
			// console.log('result', result)
			result.forEach(function(item, inx){
				data.push(item)
			})
		})
		// console.log('****************',data)
		res.render('quickbook',{payment:data});
})

//######################################### Invoice Filter
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
	else if(total< 0 || totalgt < 0 || totallt < 0 || due < 0 || duegt < 0 || duelt < 0)
	{
		res.render('filter', {
			err: "Amount Should be Greater than Zero."
		})
	}
	else {
		if (req.query.name != undefined) {
			if (req.query.app != undefined) {
				arr = await await qbfun.invoiceByMultipleFilter(req, req.query.name, req.query.app, cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status);
				invoice.push(arr);
			}
			else {
				var app = config.credentials[req.query.name];
				for(item in app) {
					arr = await qbfun.invoiceByMultipleFilter(req, req.query.name, item, cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status);
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
					arr = await qbfun.invoiceByMultipleFilter(req, uname, item,cname, date, daterange, total, totalgt, totallt, due, duegt, duelt, status);
					invoice.push(arr);
				}
			}
		}
		var data = []
		invoice.forEach(function(result,i) {
			// console.log('result', result)
			result.forEach(function(item, inx){
				data.push(item)
			})
		})
		// console.log('****************',data)
		res.render('quickbook', {filter : data});
	}
})

//######################################## Invoice as Pdf
router.get('/pdf',async function (req, res) {
	var pdf = await qbfun.getPdf();
	console.log(typeof pdf)
	res.contentType("application/pdf");
	var base64data = new Buffer(pdf, 'binary').toString('base64');
	var apidata = new Buffer(base64data, 'base64');
	// console.log("$$$$$$$$",apidata);
	res.send(apidata);
	//
	// var filePath = "/invoice212.pdf";
	// console.log('__dirname', __dirname + filePath)
	// fs.readFile(__dirname + filePath , function (err,data){
	// 	console.log("==============================")
	// 	console.log("From api",apidata)
	// 	console.log("==============================")
	// 	console.log("==============================")
	// 	console.log("From File",data)
	// 	console.log("==============================")
	// 	res.send(data);
	// });
	// res.contentType("application/pdf");
	// res.end(pdf);
	// var data =fs.readFileSync(pdf);
	// res.contentType("application/pdf");
	// res.send(pdf);
	// res.render('index',{pdf:pdf});
})

//######################################## Invoice Refund
router.get('/refund',async function(req,res) {
		var refund = await qbfun.readRefund(req,req.query.name,req.query.app);
		console.log("Refund response",refund);
		// res.json(refund);
		res.render('quickbook',{refund:refund});
})

router.get('/refund/add', async function(req,res) {
		var refund = await qbfun.createRefund(req, req.query.name, req.query.app);
		console.log("Refund response@@@",refund);
		// res.json(refund)
		res.render('quickbook',{refund:refund});
})

//############################################List all invoice payment refund
let listdata = async function(req,name,app) {
	var newarr = [];
	if(req.query.invoice != undefined) {
		console.log("1111111111111");
		var invoice = await qbfun.listinvoice(req, name, app);
		newarr.push(invoice)
	}
	if(req.query.payment != undefined) {
		console.log("22222222222222222");
		var payment = await qbfun.readpayment(req, name, app);
		newarr.push(payment)
	}
	if(req.query.refund != undefined) {
		console.log("33333333333333333");
		var refund = await qbfun.readRefund(req, name, app);
		newarr.push(refund)
	}
	if( (req.query.invoice == undefined) && (req.query.payment == undefined) && (req.query.refund == undefined) ) {
		console.log("44444444444444444");
		var invoice = await qbfun.listinvoice(req, name, app);
		newarr.push(invoice);
		var payment = await qbfun.readpayment(req, name, app);
		newarr.push(payment);
		var refund = await qbfun.readRefund(req, name, app);
		newarr.push(refund);
	}
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
				var arr1 = await listdata(req, req.query.name, req.query.app)
				console.log("#############################",arr1);
				arr.push(arr1)
				console.log("array@@@@@@@@@@@@@@@@@@@@@@@@@",arr);
			}
			else {
				var app = config.credentials[req.query.name];
				for(item in app) {
	         var arr1 = await listdata(req, req.query.name, item)
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
	          var arr1 = await listdata(req, uname, item)
						arr.push(arr1)
	      }
			}
		}
		arr.forEach(function(response,i) {
			response.forEach(function(result, i) {
				result.forEach(function(item,i) {
					data.push(item)
				})
			})
		})
		console.log("@@@@@@@@@@@@@@@@@@@@22",data[0]);
		res.render('quickbook', {listall:data});
})

//##########################Send invoice as Email
router.get('/invoice/send/:id', async function(req,res) {
    var email = await qbfun.sendEmail(req,req.query.name,req.query.app,req.params.id)
    console.log("Email response",email);
    res.json({emailresponse:email});
})
module.exports = router
