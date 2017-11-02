const exphbs = require('express-handlebars'),
    config = require('./config.json'),
    xero = require('xero-node')

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
			for(item in app) {
          config1 = checkNameAndApp(res,req.query.name,item);
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
  res.json({
    data: arrcontact
  });
})

router.post('/contacts/save',async (req, res) => {
  console.log(req.body);
  var accname = req.body.accname;
  var appname = req.body.appname;
  config1 = checkNameAndApp(res,accname,appname);
  res.send({
    data: await xerofun.postSaveContact(req,accname,appname,config1)
  });
})

router.get('/invoice',async (req, res) => {
  res.json({
    data: await xerofun.getListInvoices()
  });
})

router.get('/invoice/:name',async (req, res) => {
  var contactName = req.params.name;
  console.log("contactName",contactName);
  res.json({
    data: await xerofun.getListInvoiceByName(contactName)
  });
})

router.get('/invoice/id/:id',async (req, res) => {
  var id = req.params.id;
  console.log("Invoice     ID",id);
  res.json({
    data: await xerofun.getListInvoiceById(id)
  });
})

router.post('/invoice/save',async (req, res) => {
  var name=req.body.name;
  var description = req.body.description;
  var qty = req.body.quantity;
  var amount = req.body.unitAmount;
  res.json({
    data: await xerofun.postSaveInvoice(name,description,qty,amount)
  });
})

router.get('/invoice/status/paid',async (req,res) => {
  res.json({
    data: await xerofun.invoiceByStatusPaid()
  });
})

router.get('/invoice/status/unpaid',async (req,res) => {
  res.json({
    data: await xerofun.invoiceByStatusUnpaid()
  });
})

router.get('/invoice/amount/paid/gt/:AmountPaid',async (req,res) => {
   var amount = req.params.AmountPaid;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
    else{
  res.json({
    data: await xerofun.invoiceByGtPaidAmount(amount)
  })
}
})

router.get('/invoice/amount/paid/lt/:AmountPaid',async (req,res) => {
   var amount = req.params.AmountPaid;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
    else{
  res.json({
    data: await xerofun.invoiceByLtPaidAmount(amount)
  })
}
})

router.get('/invoice/amount/unpaid/gt/:AmountDue',async (req,res) => {
  var amount = req.params.AmountDue;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByGtUnpaidAmount(amount)
  })
}
})

router.get('/invoice/amount/unpaid/lt/:AmountDue',async (req,res) => {
  var amount = req.params.AmountDue;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByLtUnpaidAmount(amount)
  })
}
})

router.get('/invoice/amount/total/gt/:Total',async (req,res) => {
  var amount = req.params.Total;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByGtTotalAmount(amount)
  })
}
})

router.get('/invoice/amount/total/lt/:Total',async (req,res) => {
  var amount = req.params.Total;
  console.log("@@@@",amount)
  if(amount < 0)
    {
      res.render('index', {
        err: "Amount Should be Greater than Zero."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByLtTotalAmount(amount)
  })
}
})

router.get('/invoice/date/gt/:Date',async (req,res) => {
  var date = req.params.Date;
  var date1 = new Date(date);
  var date2 = new Date();
  console.log("@@@",date)
  console.log("@@@@@@",date1)
  console.log("@@@@@@@@@",date2)
  if(date1 > date2)
    {
      res.render('index', {
        err: "Date should not be Greater than Today's Date."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByGtDate(date)
  })
}
})

router.get('/invoice/date/lt/:Date',async (req,res) => {
  var date = req.params.Date;
  var date1 = new Date(date);
  var date2 = new Date();
  console.log("@@@",date)
  console.log("@@@@@@",date1)
  console.log("@@@@@@@@@",date2)
  if(date1 > date2)
    {
      res.render('index', {
        err: "Date should not be Greater than Today's Date."
      })
    }
  else{
  res.json({
    data: await xerofun.invoiceByLtDate(date)
  })
}
})

router.get('/invoice/duedate/gt/:DueDate',async (req,res) => {
  var date = req.params.DueDate;
  console.log("@@@@",date)
  res.json({
    data: await xerofun.invoiceByGtDueDate(date)
  })
})

router.get('/invoice/duedate/lt/:DueDate',async (req,res) => {
  var date = req.params.DueDate;
  console.log("@@@@",date)
  res.json({
    data: await xerofun.invoiceByLtDueDate(date)
  })
})

router.get('/invoice/daterange/:Date/to/:DueDate',async (req,res) => {
  var date = req.params.Date;
  var DueDate = req.params.DueDate;
  console.log("Date@@@@",date);
  console.log("DueDate@@@@",DueDate)
  if(date > DueDate)
  {
     res.render('index', {
        err: "First Date should not be Greater than Second Date."
      })
  }
  else{
  res.json({
    data: await xerofun.invoiceByRangeDate(date,DueDate)
  })
}
})

router.post('/payment',async (req, res) => {
  var id=req.body.id;
  var amount = req.body.amount;
  console.log("amount",amount);
  res.json({
    data: await xerofun.postPayment(id,amount)
  });
})
module.exports=router;
