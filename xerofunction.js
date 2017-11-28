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
  console.log("Inside listContacts method");
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
  console.log('Inside getContactDetail method');
  console.log("##########Accname",accname,"########app",app);
  // console.log("config",config1);
  return new Promise(async function(resolve, reject){
      var auth = await authorize(config1);
      // console.log("@@@@@@@@@@@@@@@@@@",auth);
      if(auth == undefined) {
        // console.log("inside if auth");
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

exports.postSaveContact = async function(req,accname, app, config1) {
  console.log("Inside postSaveContact method");
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject) {
    var auth = await authorize(config1);
    if(auth == undefined) {
      // console.log("inside if auth");
      resolve({err:'Authentication error!!! Check your connection and try Again'});
    }
    else {
      // console.log("else auth");
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
  console.log("Inside getListInvoices method");
  return new Promise(async function(resolve, reject){
     var auth = await authorize(config1);
     if(auth == undefined) {
      //  console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection & credentials and try Again'});
     }
     else {
      //  console.log("else auth");
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
             status: {},
             data: {}
           };
           if(invoice.Status == 'AUTHORISED') {
             arrinvoice.status = 'Unpaid'
           }
           else if(invoice.Status == 'DRAFT') {
             arrinvoice.status = 'Draft'
           }
           else {
             arrinvoice.status = 'Paid'
           }
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
  console.log("Inside getListInvoiceByName method");
  console.log("##########Accname",accname,"########app",app);
   arr = [];
   var filter = 'Contact.Name == "'+contactName+'"';

   return new Promise(async function(resolve, reject) {
     var auth = await authorize(config1);
     if(auth == undefined) {
      //  console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection and try Again'});
     }
     else {
      //  console.log("else auth");
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
  console.log("Inside getListInvoiceById method");
  console.log("##########Accname",accname,"########app",app , "###############id",id);
   arr = [];

   return new Promise(async function(resolve, reject) {
     var auth = await authorize(config1);
     if(auth == undefined) {
      //  console.log("inside if auth");
       resolve({err:'Authentication error!!! Check your connection and try Again'});
     }
     else {
      //  console.log("else auth");
       let invoice = await xeroClient.core.invoices.getInvoice(id)
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
          //  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@",arr);
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
  console.log("Inside postSaveInvoice method");
  console.log("##########Accname",accname,"########app",app);
  return new Promise(async function(resolve, reject) {
    var auth = await authorize(config1);
    if(auth == undefined) {
      // console.log("Inside if auth");
      resolve({err:'Authentication error!!! Check your connection and try Again'});
    }
    else {
      // console.log("else auth");
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
        console.log("Existing Contact Name",arr.data.Name);
        if(sampleInvoice.Contact.Name == arr.data.Name) {
          // console.log("Inside IF loop")
          flag = 1;
        }
      });
      console.log("Flag value",flag);
      if (flag === 1) {
        invoice = addInvoice(sampleInvoice);
        resolve(invoice);
      }
      else {
        var contactObj = await xeroClient.core.contacts.newContact({Name: sampleInvoice.Contact.Name});
        contactObj.save()
        .then(function(contacts) {
          console.log("Inside contactsave method from saveInvoice");
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

exports.invoiceByAdvanceFilter = async function(accname, app, name, date, dategt, datelt, total, totalgt, totallt, due, duegt, duelt, status, config1) {
  console.log("##########Accname",accname,"########app",app);
  console.log("cname inside function",date);
  return new Promise(async function(resolve, reject){
    var auth = await authorize(config1);
    var filter = "";
    var flag = 0;
    if(name != "undefined" && name!= "" && name!= undefined) {
      name = name.split(',');
      if (flag == 0) {
        condition = ' '
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition
      name.forEach(function(cname, index) {
        if (name.length == index+1) {
          filter += ' Contact.Name = "' + cname + '"'
        }
        else {
          filter += ' Contact.Name = "' + cname + '" OR'
        }
      })
    }

    if(date != "undefined" && date != "" && date!= undefined) {
      date = date.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Date =  DateTime(' + date + ',00,00,00)'
    }

    if(dategt != "undefined" && dategt != "" && dategt != undefined) {
      dategt = dategt.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + 'Date > DateTime(' + dategt + ',00,00,00)'
    }

    if(datelt != "undefined" && datelt != "" && datelt != undefined) {
      datelt = datelt.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Date <  DateTime(' + datelt + ',00,00,00)'
    }

    if(total != "undefined" && total != "" && total != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Total = ' +total
    }

    if(totalgt != "undefined" && totalgt != "" && totalgt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Total >= ' +totalgt
    }

    if(totallt != "undefined" && totallt != "" && totallt != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' Total <= ' +totallt
    }

    if(due != "undefined" && due != "" && due != undefined) {
      due = due.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' AmountDue = ' +due
    }

    if(duegt != "undefined" && duegt != "" && duegt != undefined) {
      duegt = duegt.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition + ' AmountDue >= ' +duegt
    }

    if(duelt != "undefined" && duelt != "" && duelt != undefined) {
      duelt = duelt.replace(/-/g,',');
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      filter += condition +  ' AmountDue <= ' +duelt
    }

    if(status != "undefined" && status != 'select' && status != undefined) {
      if (flag == 0) {
        condition = ''
        flag = 1
      }
      else {
        condition = ' AND'
      }
      if (status == 'paid') {
        filter += condition + ' AmountDue = 0'
      }
      else {
        filter += condition + ' AmountDue > 0'
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
            status: {},
            data: []
          };
          if(invoice.Status == 'AUTHORISED' || invoice.Status == 'DRAFT') {
            arrinvoice.status = 'Unpaid'
          }
          else {
            arrinvoice.status = 'Paid'
          }
           arrinvoice.data = invoice;
           arr.push(arrinvoice);
        });
        // console.log("@@@@@@@@@@@@@@@arr",arr[0]);
      })
      .catch(function(err) {
        console.log("Error in filter");
        arr = {Err:'Not able to fetch data'}
      })
      resolve(arr);
  })
}
