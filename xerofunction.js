const exphbs = require('express-handlebars'),
    xero = require('xero-node');
var fs = require('fs')
var config = require('./config.json');
var rp = require('request-promise');

var arrcontact = [];
var arrinvoice = [];
var arrinvoicename = [];
let xeroClient;

let authorize = function(config1) {
  if (config1.privateKeyPath && !config1.privateKey)
      config1.privateKey = fs.readFileSync(config1.privateKeyPath);
  xeroClient = new xero.PrivateApplication(config1);
  return xeroClient;
  // console.log("xeroClient",xeroClient);
}

//#####################################Contact data
let listContacts = async function(name,app) {
  console.log("Inside list contacts");
   arr = [];
   var data = {};
   await xeroClient.core.contacts.getContacts()
   .then(function(contacts) {
     contacts.forEach(function(contact){
       arrcontact = {
         name: name,
         app: app,
         data: {}
       };
       arrcontact.data= contact;
       arr.push(arrcontact);
     });
     data = arr;
    //  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",arr);
   })
   .catch(function(err) {
     console.log("Error", typeof(err));
     data = {err:'Authentication error!!! Check your connection and credentials.'};
   })
   return data;
}

exports.getContactDetail = async function(accname, app, config1) {
  console.log('called getContactDetail');
  console.log("##########Accname",accname,"########app",app);
  // console.log("config",config1);
  return new Promise(async function(resolve, reject){
      var auth = await authorize(config1);
      // console.log("@@@@@@@@@@@@@@@@@@",auth);
      if(auth == undefined) {
        console.log("inside if auth");
        resolve({err:'Authentication error!!! Check your connection and try Again'});
      }
      else {
        console.log("else auth");
        var result = await listContacts(accname, app);
        // console.log("result",result);
        if (result == undefined) {
          resolve({ err:'No data found'});
        }
        else {
          // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAA",result);
          resolve(result);
        }
      }
  })
}

// exports.getContactById = async function(accname, app, id) {
//   console.log("Inside get contact by id");
//   console.log("##########Accname",accname,"########app",app);
//   let configdata = config.credentials[accname];
//   // console.log("configdata",configdata);
//   var config1 = configdata[app];
//   // console.log("config",config1);
//    arr = [];
//    var myInvoiceID = id;
//
//    return new Promise(async function(resolve, reject){
//      console.log("1");
//      var auth = await authorize(config1);
//      let invoice = await xeroClient.core.contacts.getContact(myInvoiceID)
//        .then(function(invoice) {
//          console.log("2");
//            arrinvoice = {
//              name: accname,
//              app: app,
//              data: []
//            };
//           arrinvoice.data = invoice;
//           arr.push(arrinvoice);
//        });
//       //  console.log("@@@@@@@@@@@@@@",arr); //ACCPAY
//        resolve(arr);
//     })
// }

exports.postSaveContact = async function(req,accname, app, config1) {
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject) {
    var auth = await authorize(config1);
    if(auth == undefined) {
      console.log("inside if auth");
      resolve({err:'Authentication error!!! Check your connection and try Again'});
    }
    else {
      console.log("else auth");
      var sampleContact = {
        Name: req.body.name,
        EmailAddress: req.body.email,
        Addresses: [ {
          AddressType: 'STREET',
          AddressLine1: req.body.line1,
          AddressLine2: req.body.line2,
          City: req.body.city,
          PostalCode: req.body.code
        } ],
        Phones: [ {
          PhoneType: 'DDI',
          PhoneNumber: req.body.number
        } ]
      };
      console.log("sampleContact************",sampleContact);
      var contactObj = await xeroClient.core.contacts.newContact(sampleContact);
      var myContact;
      contactObj.save()
      .then(function(contacts) {
        myContact = contacts.entities[0];
        resolve(myContact);
      })
      .catch(function(err) {
        console.log("Error in save contact");
        resolve({isError:true , err: err});
      });
    }
  })
}

//####################################Invoice data
exports.getListInvoices = async function(accname, app,config1) {
  console.log("Inside Get list Invoice");
  return new Promise(async function(resolve, reject){
     var auth = await authorize(config1);
     if(auth == undefined) {
       console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection and try Again'});
     }
     else {
       console.log("else auth");
       arr = [];
      //  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$",xeroClient);
       let invoice = await xeroClient.core.invoices.getInvoices()
       .then(function(invoices) {
         console.log("Inside fun invoice length",invoices.length);
         invoices.forEach(function(invoice) {
           var arrinvoice = {
             name: accname,
             type: 'Invoice',
             app: app,
             data: {}
           };
           arrinvoice.data = invoice;
           arr.push(arrinvoice);
         });
         if (arr == undefined) {
           console.log("result undefined");
           resolve({ err:'No data found' });
         }
         else {
           // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr[0]);
           resolve(arr);
         }
       })
       .catch(function(err) {
         console.log("Error Inside list invoice");
         resolve({err:'Authentication error!!! Check your connection and credentials.'});
       })
     }
   })
}

exports.getListInvoiceByName = async function(accname, app, contactName, config1) {
  console.log("##########Accname",accname,"########app",app);
   arr = [];
   var filter = 'Contact.Name == "'+contactName+'"';

   return new Promise(async function(resolve, reject) {
     var auth = await authorize(config1);
     if(auth == undefined) {
       console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection and try Again'});
     }
     else {
       console.log("else auth");
       let invoice = await xeroClient.core.invoices.getInvoices({ where : filter})
       .then(function(invoices) {
         invoices.forEach(function(invoice) {
           arrinvoice = {
             name: accname,
             app: app,
             data: []
           };
           arrinvoice.data = invoice;
           arr.push(arrinvoice);
         })
         if (arr == undefined) {
           console.log("result undefined");
           resolve({ err:'No data found' });
         }
         else {
           // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr[0]);
           resolve(arr);
         }
       })
       .catch(function(err) {
         console.log("Error in invoice by name");
         resolve({err:'Authentication error!!! Check your connection and credentials.'});
       })
     }
  })
}

exports.getListInvoiceById = async function(accname, app, id, config1) {
  console.log("##########Accname",accname,"########app",app);
   arr = [];
   var myInvoiceID = id;

   return new Promise(async function(resolve, reject) {
     var auth = await authorize(config1);
     if(auth == undefined) {
       console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection and try Again'});
     }
     else {
       console.log("else auth");
       let invoice = await xeroClient.core.invoices.getInvoice(myInvoiceID)
       .then(function(invoice) {
         arrinvoice = {
           name: accname,
           app: app,
           data: []
         };
         arrinvoice.data = invoice;
         arr.push(arrinvoice);
         if (arr == undefined) {
           console.log("result undefined");
           resolve({ err:'No data found' });
         }
         else {
           // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr[0]);
           resolve(arr);
         }
       })
       .catch(function(err) {
         console.log("Error in invoice by id");
         resolve({err:'Authentication error!!! Check your connection and credentials.'});
       })
     }
    })
}

let addInvoice = async function (sampleInvoice) {
  console.log("Inside add invoice",sampleInvoice);
  return new Promise(async function(resolve, reject){
    var invoiceObj = await xeroClient.core.invoices.newInvoice(sampleInvoice);
    var myInvoice;
    invoiceObj.save()
        .then(function(invoices) {
            myInvoice = invoices.entities[0];
            resolve(myInvoice);
        })
        .catch(function(err) {
          console.log("Error in add invoice method");
          resolve({err:'Error in creating invoice. Check Account code'})
        });
  })
}

exports.postSaveInvoice = async function(accname, app, name, description, qty, amount,config1) {
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject){
    var auth = await authorize(config1);
    if(auth == undefined) {
      console.log("Inside if auth");
      resolve({err:'Authentication error!!! Check your connection and try Again'});
    }
    else {
      console.log("else auth");
      var sampleInvoice = {
        Type: 'ACCREC',
        Contact: {
          Name: name
        },
        Status: 'AUTHORISED',
        DueDate: new Date().toISOString().split("T")[0],
        LineItems: [{
          Description: description,
          Quantity: qty,
          UnitAmount: amount,
          AccountCode: '200'
        }]
      };
      // console.log("sampleInvoice:-",sampleInvoice);
      var flag = 0;
      var contact = [];
      contact = await listContacts(accname, app);
      contact.forEach(function(arr) {
        console.log("Name",arr.data.Name);
        if(sampleInvoice.Contact.Name == arr.data.Name) {
          console.log("Inside IF loop")
          flag = 1;
        }
      });
      console.log("Flag",flag);
      if (flag === 1) {
        invoice = addInvoice(sampleInvoice);
        resolve(invoice);
      }
      else {
        var contactObj = await xeroClient.core.contacts.newContact({Name: sampleInvoice.Contact.Name});
        contactObj.save()
        .then(function(contacts) {
          console.log("Inside save method");
          invoice = addInvoice(sampleInvoice);
          resolve(invoice);
        })
        .catch(function(err) {
          console.log('Error while creating new contact from add invoice');
          resolve({err:'Error in creating new contact for invoice'})
        })
      }
    }
  })
}

//#################################################################
exports.paymentviastripe = async function(req,amount) {
  var amount = parseInt(amount);
  return new Promise(function (resolve, reject) {
    var options = {
      method: "POST",
      uri: "http://localhost:3030/payment",
      body: {
                "gateway":"stripe",
                "amount" : amount,
                "currency":"usd",
                "cardNumber":req.body.cardnumber,
                "expMonth":req.body.expire_month,
                "expYear":req.body.expire_year,
                "cvc":req.body.cvc,
                "description":"this is desc",
                "isCustomer":false
      },
      json: true, // Automatically stringifies the body to JSON
      headers: {
        "X-api-token" : ""
      }
    };
    console.log("########################",options);
    rp(options)
        .then(function (parsedBody) {
          console.log("inside then%%%%%%%%%%%",parsedBody)
          if (parsedBody.type) {
            console.log("Error if",parsedBody.message);
            resolve({err:parsedBody})
          } else {
            resolve(parsedBody);
          }
            // POST succeeded...
        })
        .catch(function (err) {
          console.log("inside catch")
          resolve({err:err});
            // POST failed...
        });
  })
}

exports.paymentviaauthdotnet = async function(req,amount) {
  var amount = parseInt(amount);
  return new Promise(function (resolve, reject) {
    var options = {
      method: "POST",
      uri: "http://localhost:3030/payment",
      body: {
          "gateway":"authdotnet",
           "amount": amount,
           "cardNumber":req.body.cardnumber,
           "expMonth":req.body.expire_month,
           "expYear":req.body.expire_year,
           "cvc":req.body.cvc,
           "isCustomer":false
          },
      json: true, // Automatically stringifies the body to JSON
      headers: {
        "X-api-token" : "",
         "x-api-login" :  ""
      }
    };
    console.log("########################",options);
    rp(options)
        .then(function (parsedBody) {
          console.log("inside then%%%%%%%%%%%",parsedBody)
          resolve(parsedBody);
            // POST succeeded...
        })
        .catch(function (err) {
          console.log("inside catch")
          resolve({err:err});
            // POST failed...
        });
  })
}

exports.paymentviapaypal = async function(req,amount) {
  // var amount = parseInt(amount);
  return new Promise(function (resolve, reject) {
    var options = {
      method: "POST",
      uri: "http://localhost:3030/payment",
      body: {
          "gateway":"paypal",
          "intent": "sale",
            "payer": {
              "payment_method": "credit_card",
              "funding_instruments": [{
                "payment_card": {
                  "type": req.body.cardtype,
                  "number": req.body.cardnumber,
                  "expire_month":parseInt(req.body.expire_month),
                  "expire_year": parseInt(req.body.expire_year),
                  "cvv2": parseInt(req.body.cvc),
                  "billing_country": "US",
                }
              }]
            },
            "transactions": [{
              "amount": {
                "total": amount,
                "currency": "USD",
                "details": {
                  "subtotal": amount,
                  "tax": "0",
                  "shipping": "0"
                }
              },
              "description": "This is the payment transaction description"
            }]
        },
      json: true, // Automatically stringifies the body to JSON
      headers: {
        "X-api-token" : "",
         "x-api-login" :  ""
      }
    };
    console.log("########################",options.body.payer.funding_instruments[0]);
    rp(options)
        .then(function (parsedBody) {
          console.log("inside then%%%%%%%%%%%",parsedBody)
          if (parsedBody.response.error) {
            console.log("inside if error",parsedBody.response.error_description);
            resolve({err:parsedBody.response})
          }
          resolve(parsedBody);
            // POST succeeded...
        })
        .catch(function (err) {
          console.log("inside catch")
          resolve({err:err});
            // POST failed...
        });
  })
}

exports.postPayment = async function(accname, app, id, amount, config1) {
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject){
    var auth = await authorize(config1);
    var samplePayment = {
        Invoice: {
            InvoiceID: id
        },
        Account: {
            Code: '100'
        },
        Date: new Date().toISOString().split("T")[0],
        Amount: amount
    };
    console.log("Sample payment",samplePayment);
    var paymentObj = xeroClient.core.payments.newPayment(samplePayment);
    var myPayment;
    paymentObj.save()
        .then(function(payments) {
            myPayment = payments.entities[0];
            console.log("Save");
            resolve(myPayment);
        })
        .catch(function(err) {
            console.log("Error in payment")
            console.log(err);
            resolve({err:'Not able to perform payment!! Check Payment data'});
        });
  })
}

exports.readpayment = async function(accname,app, config1) {
    console.log("##########Accname",accname,"########app",app);
    arr = [];
    return new Promise(async function(resolve, reject) {
      var auth = await authorize(config1);
      if(auth == undefined) {
        console.log("Inside if auth");
        resolve({err:'Authentication error!!! Check your connection and try Again'});
      }
      else {
        console.log("else auth");
        xeroClient.core.payments.getPayments()
         .then(function(payments) {
            payments.forEach(function(payment){
              var paymentarr = {
                name: accname,
                type: 'Payment',
                app: app,
                data: {}
              };
               paymentarr.data = payment;
              //  console.log(paymentarr.data.Amount);
               arr.push(paymentarr) ;
            });
            if (arr == undefined) {
              console.log("result undefined");
              resolve({ err:'No data found'});
            }
            else {
              // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr[0]);
              resolve(arr);
            }
         })
         .catch(function(err) {
           console.log("Error in read payment");
           resolve({err:'Not able to fetch data'})
         })
      }
    })
}

exports.invoiceByAdvanceFilter = async function(accname, app, name, date, daterange, total, totalgt, totallt, due, duegt, duelt, status, config1) {
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject){
    var auth = await authorize(config1);
    var filter = "";
    var flag = 0;
    if(name != undefined) {
      if (flag == 0) {
        condition = ' '
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Contact.Name = "' + name + '"'
    }

    if(date != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' Date =  DateTime(' + date + ',00,00,00)'
    }

    if(daterange != undefined) {
      daterange = daterange.split('to');
      var date1 = daterange[0];
      var date2 = daterange[1];
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' Date >  DateTime(' + date1 + ',00,00,00) AND Date <  DateTime(' + date2 + ',00,00,00)'
    }

    if(total != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' Total = ' +total
    }

    if(totalgt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' Total > ' +totalgt
    }

    if(totallt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + 'Total < ' +totallt
    }

    if(due != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' AmountDue = ' +due
    }

    if(duegt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition + ' AmountDue > ' +duegt
    }

    if(duelt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      filter += condition +  'AmountDue < ' +duelt
    }

    if(status != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = 'AND'
      }
      if (status == 'paid') {
        filter += condition + 'AmountDue = 0'
      }
      else {
        filter += condition + 'AmountDue > 0'
      }
    }

      // var filter = 'Contact.Name == "'+name+'" AND Date ==  DateTime('+date+',00,00,00) AND Total < '+totallt+' AND AmountPaid < '+paidlt+' AND Total >= '+totalgt+'';

    console.log("Filter####",filter);
    var arr = [];
    let result = await xeroClient.core.invoices.getInvoices({where : filter})
      .then(function(invoices) {
        console.log("222222222");
        invoices.forEach(function(invoice) {
          arrinvoice = {
            name: accname,
            app: app,
            data: []
          };
           arrinvoice.data = invoice;
           arr.push(arrinvoice);
        });
      })
      .catch(function(err) {
        console.log("Error in filter");
      })
      resolve(arr);
  })
}
