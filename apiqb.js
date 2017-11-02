var config = require('./configQB.json')
var request = require('request')
var express = require('express')
var router = express.Router()
var arrcustomer = [];
var requestObj;
var qbfun = require('./routes/qbfunction');
var xerofun = require('./xerofunction');


router.get('/customers',async function (req, res) {
  res.json({
    data: await qbfun.getcustomer()
  });
})

router.post('/customers/save',async function (req, res) {
  var CompanyName = req.body.CompanyName;
  var DisplayName = req.body.DisplayName;
  res.json({
    data: await qbfun.postcustomers(CompanyName,DisplayName)
  });
})

router.get('/invoice',async function (req, res) {
  res.json({
    data: await qbfun.listinvoice()
  });
})

router.get('/invoice/:id',async function (req, res) {
  res.json({
    data: await qbfun.invoicebyid(req,res)
  });
})

router.post('/invoice/save', async function (req, res) {
  //To get all customer list
    var name = req.body.name;
    var amount = req.body.amount
  res.json({
    data: await qbfun.saveinvoice(req,res)
  });
})

router.get('/payment/:id/:name/:value', function(req,res) {
  var id = req.params.id;
  var name = req.params.name;
  var value = req.params.value;
  console.log("id",id, "name",name, "value",value);
  res.render('QBaddpayment',{id:id,name:name,value:value});
})

router.get('/payment',async function (req, res) {
    res.json({
    data: await qbfun.postpayment(req,res)
  });
})


/////////////////##########All Filtering api call
router.get('/invoice/totalamount/gt/:amount', async function(req,res) {
  var amount = req.params.amount
  res.json({
    data: await qbfun.invoiceByGtTotalAmount(amount)
  });
})

router.get('/invoice/totalamount/lt/:amount', async function(req,res) {
  var amount = req.params.amount
  res.json({
    data: await qbfun.invoiceByLtTotalAmount(amount)
  });
})

router.get('/invoice/dueamount/gt/:amount', async function(req,res) {
  var amount = req.params.amount
  res.json({
    data: await qbfun.invoiceByGtDueAmount(amount)
  });
})

router.get('/invoice/dueamount/lt/:amount', async function(req,res) {
  var amount = req.params.amount
  res.json({
    data: await qbfun.invoiceByLtDueAmount(amount)
  });
})

router.get('/invoice/status/unpaid', async function(req,res) {
  res.json({
    data: await qbfun.invoiceByStatusUnpaid()
  });
})

router.get('/invoice/status/paid', async function(req,res) {
  res.json({
    data: await qbfun.invoiceByStatusPaid()
  });
})

router.get('/invoice/date/gt/:date', async function(req,res) {
  var date = req.params.date;
  res.json({
    data: await qbfun.invoiceByGtCreationDate(date)
  });
})

router.get('/invoice/date/lt/:date', async function(req,res) {
  var date = req.params.date;
  res.json({
    data: await qbfun.invoiceByLtCreationDate(date)
  });
})

router.get('/invoice/dateRange/:date1/to/:date2', async function(req,res) {
  var date1 = req.params.date1;
  var date2 = req.params.date2;
  res.json({
    data: await qbfun.invoiceByCreationDateRange(date1,date2)
  });
})

router.get('/invoice/duedate/gt/:duedate', async function(req,res) {
  var duedate = req.params.duedate;
  res.json({
    data: await qbfun.invoiceByGtDueDate(duedate)
  });
})

router.get('/invoice/duedate/lt/:duedate', async function(req,res) {
  var duedate = req.params.duedate;
  res.json({
    data: await qbfun.invoiceByLtDueDate(duedate)
  });
})

router.get('/invoice/duedateRange/:date1/to/:date2', async function(req,res) {
  var date1 = req.params.date1;
  var date2 = req.params.date2;
  res.json({
    data: await qbfun.invoiceByDueDateRange(date1,date2)
  });
})

router.get('/allinvoice', async function(req,res) {
  var invoicexero;
  invoicexero = await xerofun.getListInvoices();
  // console.log("Xero invoices",invoicexero);

  var invoiceqb;
  invoiceqb = await qbfun.listinvoice();
  // console.log("QuickBook invoices",invoiceqb);

  // var invoice = { invoicexero,invoiceqb };
  var invoice = {
    domain:{"name" : "OB_ALL"},
    data: [ { invoicexero,invoiceqb } ]
  };
  // invoice.push(invoicexero);
  // invoice.push(invoiceqb);
  // console.log("All Invoice",invoice);
  res.json({
    data: invoice
  });
})

module.exports = router
