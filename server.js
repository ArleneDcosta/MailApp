var mysql = require('mysql');
const path = require('path');
const fs = require('fs');
var Excel = require('exceljs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
var multer=require("multer");
var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'mailtest'
});



connection.connect(function(err){
    if(!err){
        console.log("Database is connected ... nn");
    }
    else{
        console.log("Error connecting database .... nn");
    }
});



var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use('/public', express.static(path.join(__dirname, 'public')));

const exphbs = require('express-handlebars');
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.set("view engine","ejs");
app.engine('handlebars', exphbs());
app.get("/",function(req,res){
    res.render("login");
});
app.post("/register",function(req,res){
  var users={
    "firstname":req.body.firstname,
    "lastname":req.body.lastname,
    "email":req.body.email,
    "password":req.body.password,
    "phoneno":req.body.phone_no
  }
  var random = req.body.random;
  if(random==req.body.random1){
  connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
    if (error) {
      console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      console.log("successfully Inserted!!!!!");
    }
    
      connection.query("select * from messages WHERE emailsender = ?",[req.body.email],function(err,result,fields){
        if (err) throw err;
        console.log('inside final ');
        
        result.push(req.body.email);
        result.push(req.body.password);
        result.push(result[0].sendername);
        result.push('All');
        
        res.render('outbox',{result:result});
      });
    });
  }
});
app.post("/sign",function(req,res){
  console.log(req.body.email);
  var today = new Date();
  let hash = bcrypt.hashSync(req.body.password,12);
  var users={
    "firstname":req.body.firstname,
    "lastname":req.body.lastname,
    "email":req.body.email,
    "password":hash,
    "phoneno":req.body.phone_no
  }
  var random = Math.floor((Math.random));
  var rand=Math.floor((Math.random() * 100000) + 184);
  const output="<p>"+rand+"</p>";
  users.random=rand;
  let transporter = nodemailer.createTransport({
    service:'Gmail',
    auth: {
        user: req.body.email, // generated ethereal user
        pass: req.body.password  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });
  let mailOptions = {
    from: '"'+req.body.firstname+'"<'+req.body.email +'>', // sender address
    to: ''+req.body.email+'', // list of receivers
    subject: 'Verify', // Subject line
    text: 'Enter the otp below to verify your account in the database', // plain text body
    html: output // html body
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
     
     res.send("Enter appropriate email and password");
    return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);   
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  
});
console.log(users);
res.render('register',{users:users});
});

app.get("/login",function(req,res){
  res.render('login');
});
app.get("/signup",function(req,res){
  res.render('signup');
});
app.get("/logout",function(req,res){
  res.render('login');
});
app.post("/sent",function(req,res){
  var email = req.body.email;
  connection.query("select * from messages where status ='sent' and emailsender = ? ",[email],function(error,result,fields){
    if(error){
      res.send({
        "code":400,
        "failed":"error occured"
      })
    }else{
      console.log('Inside Sent emails');
      result.push(req.body.email);
      result.push(req.body.password);
      result.push(result[0].sendername);
      result.push('sent');
      res.render('outbox',{result:result});
    }

  });
});
app.post("/senddraft",function(req,res){
  console.log(req.body);
  console.log(req.files);
  var today = new Date();
  console.log(req.body.image);
  console.log("Reached");
  var messages = {
    "fromsender":req.body.fromsender,
    "toreceiver":req.body.toreceiver,
    "emailsender":req.body.email,
    "sendername":req.body.sender,
    "image":"undefined",
    "imagename":"undefined",
    "status":"draft",
    "date":today,
    "subject":req.body.subject,
    "text":req.body.text,
    "Messages":req.body.message,
    "orderno":undefined,
    "orderdate":undefined,
    "orderprice":undefined,
    "quantity":undefined,
    "price":undefined,
    "gst":undefined,
    "total":undefined,
    "quantity1":undefined,
    "price1":undefined,
    "gst1":undefined,
    "total1":undefined,
    "quantity2":undefined,
    "price2":undefined,
    "gst2":undefined,
    "total2":undefined,
    "quantity3":undefined,
    "price3":undefined,
    "gst3":undefined,
    "total3":undefined
  };
  
  if (req.body.subject!=''){
  connection.query('INSERT INTO messages SET ?',messages, function (error, results, fields) {
    console.log(results);
    if (error) {
      console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })}else{
        console.log("successfully inserted");
        }
      });
    }
  
    connection.query("select * from messages WHERE emailsender = ?",[req.body.email],function(err,result,fields){
      if (err) throw err;
      result.push(req.body.email);
      result.push(req.body.password);
      result.push(result[0].sendername);
      result.push('All');
      res.render('outbox',{result:result});
    });
});

app.post("/route",function(req,res){
  
  connection.query("select * from messages WHERE sendername=? and Messages = ? and status=?",[req.body.sender,req.body.message,req.body.status],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('All');
    console.log(result);
    res.render('home',{result:result});
  });
});

app.post("/delete",function(req,res){
  connection.query("delete from messages WHERE status=? and sendername = ? and Messages = ?",[req.body.status,req.body.sender,req.body.message],function(err,result,fields){
    if (err) throw err;
    console.log('DELETION SUCCESSFUL!!!!');
  });
  connection.query("select * from messages WHERE emailsender = ?",[req.body.email],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('All');
    res.render('outbox',{result:result});
  });
});
app.post("/edit",function(req,res){
  connection.query("select * from messages WHERE status='draft' and emailsender = ? and Messages = ?",[req.body.email,req.body.message],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('draft');
    res.render('edit',{result:result});
  });

});
app.post("/draft",function(req,res){
  connection.query("select * from messages WHERE status='draft' and emailsender = ?",[req.body.email],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('draft');
    res.render('outbox',{result:result});
  });
});
app.post("/outbox",function(req,res){
  connection.query("select * from messages WHERE emailsender = ?",[req.body.email],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('All');
    res.render('outbox',{result:result});
  });
});
app.post("/loginenter",function(req,res){
    var email= req.body.email;
  var password = req.body.password;
  let hash = bcrypt.hashSync(password,12);
  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
  if (error) {
    // console.log("error ocurred",error);
    res.send({
      "code":400,
      "failed":"error ocurred"
    })
  }else{
    // console.log('The solution is: ', results);
    if(results.length >0){
      if(bcrypt.compareSync(req.body.password,results[0].password)){
        connection.query("select * from messages WHERE emailsender = ?",[email],function(err,result,fields){
          if (err) throw err;
          result.push(req.body.email);
          result.push(req.body.password);
          result.push(result[0].sendername);
          result.push('All');
          res.render('outbox',{result:result});
        });
         
      }
      else{
        res.send({
          "code":204,
          "success":"Email and password does not match"
            });
      }
    }
    else{
      res.send({
        "code":204,
        "success":"Email does not exits"
          });
    }
  }
  });

});

 app.use(multer({ dest:__dirname + '/public/uploads/'}).any('image'));
// compose button will be placed on outbox page and then to the compose page and then from the compose page will be send
app.post('/send', (req, res) => {
  console.log(req.files);
  if (req.files.length!=0){
  var dest_file = path.join(req.files[0].destination, req.files[0].originalname);
    var writerStream = fs.createWriteStream(dest_file);
  }
    // var stream = readerStream.pipe(writerStream);
    // stream.on('finish', function(){
    //     fs.unlink(req.files[0].path);
    // });
  console.log(req.files);
  var email= req.body.email;
  connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
    console.log(results);
    if (error) {
      // console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }
    
      else{
        console.log(email);
        if(req.body.purpose=="order")
        {
          var qty = req.body.quantity;
          var price = req.body.price;
          var gst = req.body.gst;
         
          if(req.body.price1!=null ||req.body.price1!=undefined ){
            var t=`<tr><td>${req.body.message1}</td><td>
             ${req.body.price1}
             </td>
             <td>
             ${req.body.quantity1}
             </td>
             <td>
             ${req.body.gst1}
             </td>
             <td>
             ${(req.body.price1*req.body.quantity1)+(req.body.price1*req.body.quantity1)*(req.body.gst1/100)}
             </td><tr>`;
           }
           else{
             var t=``;
           }
           if(req.body.price2!=null ||req.body.price2!=undefined ){
            var u=`<tr><td>${req.body.message2}</td><td>
             ${req.body.price2}
             </td>
             <td>
             ${req.body.quantity2}
             </td>
             <td>
             ${req.body.gst2}
             </td>
             <td>
             ${(req.body.price2*req.body.quantity2)+(req.body.price2*req.body.quantity2)*(req.body.gst2/100)}
             </td><tr>`;
             
           }
           else{
             var u=``;
           }
           if(req.body.price3!=null ||req.body.price3!=undefined ){
            var v=`<tr><td>${req.body.message3}</td><td>
             ${req.body.price3}
             </td>
             <td>
             ${req.body.quantity3}
             </td>
             <td>
             ${req.body.gst3}
             </td>
             <td>
             ${(req.body.price3*req.body.quantity3)+(req.body.price3*req.body.quantity3)*(req.body.gst3/100)}
             </td><tr>`;

            
           }
           else{
             var v=``;
           }
           if(req.body.price1!=null && req.body.price2==null ){
            var total = (req.body.price*req.body.quantity)+(req.body.price*req.body.quantity)*(req.body.gst/100)+
                        (req.body.price1*req.body.quantity1)+(req.body.price1*req.body.quantity1)*(req.body.gst1/100);
           }
           else if(req.body.price2!=null && req.body.price3==null){
            var total = (req.body.price*req.body.quantity)+(req.body.price*req.body.quantity)*(req.body.gst/100)+
            (req.body.price1*req.body.quantity1)+(req.body.price1*req.body.quantity1)*(req.body.gst1/100)+
            (req.body.price2*req.body.quantity2)+(req.body.price2*req.body.quantity2)*(req.body.gst2/100);
           }
           else if(req.body.price3!=null){
            var total = (req.body.price*req.body.quantity)+(req.body.price*req.body.quantity)*(req.body.gst/100)+
            (req.body.price1*req.body.quantity1)+(req.body.price1*req.body.quantity1)*(req.body.gst1/100)+
            (req.body.price2*req.body.quantity2)+(req.body.price2*req.body.quantity2)*(req.body.gst2/100)+
            (req.body.price3*req.body.quantity3)+(req.body.price3*req.body.quantity3)*(req.body.gst3/100);
           }
           else{
            var total = (req.body.price*req.body.quantity)+(req.body.price*req.body.quantity)*(req.body.gst/100);
           }

              var output = `
              <!doctype html>
          <html>
          <head>
             <meta charset="utf-8">
             <title></title>
          
             <style>
             .invoice-box {
                 max-width: 800px;
                 margin: auto;
                 padding: 30px;
                 border: 1px solid #eee;
                 box-shadow: 0 0 10px rgba(0, 0, 0, .15);
                 font-size: 16px;
                 line-height: 24px;
                 font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                 color: #555;
             }
          
             .invoice-box table {
                 width: 100%;
                 line-height: inherit;
                 text-align: left;
             }
          
             .invoice-box table td {
                 padding: 5px;
                 vertical-align: top;
             }
          
             .invoice-box table tr td:nth-child(2) {
                 text-align: right;
             }
          
             .invoice-box table tr.top table td {
                 padding-bottom: 20px;
             }
          
             .invoice-box table tr.top table td.title {
                 font-size: 45px;
                 line-height: 45px;
                 color: #333;
             }
          
             .invoice-box table tr.information table td {
                 padding-bottom: 40px;
             }
          
             .invoice-box table tr.heading td {
                 background: #eee;
                 border-bottom: 1px solid #ddd;
                 font-weight: bold;
             }
          
             .invoice-box table tr.details td {
                 padding-bottom: 20px;
             }
          
             .invoice-box table tr.item td{
                 border-bottom: 1px solid #eee;
             }
          
             .invoice-box table tr.item.last td {
                 border-bottom: none;
             }
          
             .invoice-box table tr.total td:nth-child(2) {
                 border-top: 2px solid #eee;
                 font-weight: bold;
             }
          
             @media only screen and (max-width: 600px) {
                 .invoice-box table tr.top table td {
                     width: 100%;
                     display: block;
                     text-align: center;
                 }
          
                 .invoice-box table tr.information table td {
                     width: 100%;
                     display: block;
                     text-align: center;
                 }
             }
          
             /** RTL **/
             .rtl {
                 direction: rtl;
                 font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
             }
          
             .rtl table {
                 text-align: right;
             }
          
             .rtl table tr td:nth-child(2) {
                 text-align: left;
             }
             </style>
          </head>
          
          <body>
             <div class="invoice-box">
                 <table cellpadding="0" cellspacing="0">
                     <tr class="top">
                         <td colspan="2">
                             <table>
                                 <tr>
                                     <td class="title">
                                         <img src="http://www.mailer.mypehchan.com/logo1.png" style="width:100%; max-width:300px;">
                                     </td>
          
                                     <td>
                                         Order #: ${req.body.orderno} <br>
                                         Order Date: ${req.body.orderdate}<br>
          
                                     </td>
                                 </tr>
                             </table>
                         </td>
                     </tr>
          
                     <tr class="information">
                         <td colspan="2">
                             <table>
                                 <tr>
                                     <td>
                                         Pehchan,Gala no.4<br>
                                         St. Martin Road, Off Turner Road,<br>
                                         Bandra,	Mumbai - 400 050
                                     </td>
          
                                     <td>
                         XYZ company<br>
                         ${results[0].firstname}<br>
                         ${results[0].email}<br>
                         ${results[0].phoneno}
                                     </td>
                                 </tr>
                             </table>
                         </td>
                     </tr>
                   </table>
          <table>
                     <tr class="heading">
                         <td>
                             Product Name
                         </td>
          
                         <td>
                             Unit Price
                         </td>
                         <td>
                             Quantity
                         </td>
                         <td>
                             GST %
                         </td>
                         <td>
                             Total Amount
                         </td>
          
                     </tr>
          
                     <tr class="details">
                 <td>
                 ${req.body.message}
               </td>
          
               <td>
               ${req.body.price}
               </td>
               <td>
               ${req.body.quantity}
               </td>
               <td>
               ${req.body.gst}
               </td>
               <td>
               ${(req.body.price*req.body.quantity)+(req.body.price*req.body.quantity)*(req.body.gst/100)}
               </td>`+t+u+v
               
              
               
               
                    +`</tr>
                    <tr><td></td><td></td><td></td><td></td><td>${total}</td></tr>
          </table>
          
          <table>
            <tr>
              <th width='1%'>follow us :</th>
              <th width='15%'>                        <img src="http://www.mailer.mypehchan.com/facebook.png" data-default="placeholder" data-max-width="30" width='30' height='30' alt='facebook' style='margin-right:40x;' data-customIcon="true" >
                <img src="http://www.mailer.mypehchan.com/twitter.png" data-default="placeholder" data-max-width="30" width='30' height='30' alt='twitter' style='margin-right:40x;'>
                <img src="http://www.mailer.mypehchan.com/pinterest.png" width="30" height="30" data-max-width="30" alt='Pinterest' style='margin-right:40x;' data-customIcon="true" />
          
           </th>
            </tr>
          </table>
          
             </div>
          </body>
          </html>
              `;
            }          
        else{
          var output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Name: ${results[0].firstname}  ${results[0].lastname}</li>
      <li>Company:Pehchan</li>
      <li>Email:pehchan@gmail.com</li>
      <li>Phone:0222892939/li>
      <li>Pehchan,Gala no.4<br>
      St. Martin Road, Off Turner Road,<br>
      Bandra,	Mumbai - 400 050</li>
    </ul>
    <h3>Message</h3>
    <pre>${req.body.message}</pre>`;
    
        }
      
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // host: 'smtp.mail.gmail.com',
    // port: 587,
    // secure: true, // true for 465, false for other ports
    service:'Gmail',
    auth: {
        user: results[0].email, // generated ethereal user
        pass: req.body.password  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });
  var workbook = new Excel.Workbook();
  var arr = [];
  workbook.xlsx.readFile("sample.xlsx").then(function(){
    var workSheet =  workbook.getWorksheet("Sheet1"); 
    workSheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {

      currRow = workSheet.getRow(rowNumber); 
      // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
      
      arr.push(row.values[1]);
      console.log("inside");
      
       // console.log("Email:" + currRow.getCell(1).value[0] + row.values[1]);
       // console.log("User Name :" + row.values[1] +", Password :" +  row.values[2] ); 

       // assert.equal(currRow.getCell(2).type, Excel.ValueType.Number); 
     //  console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
    });
    var receivers = arr.join();
    // var temp = {};
    // for(i=0;i<whole.length;i++){
    // 	if(whole[i][2]==results[0].email){
    // 		temp = whole[i];
    // 		break;
    // 	}
    // }
    if(req.files.length!=0)
  {
    attachment = [{ filename:req.files[0].originalname,path:__dirname + '/public/uploads/'+req.files[0].filename}];
    var mailOptions = {
      from: '"'+results[0].firstname+' '+results[0].lastname+'"<'+results[0].email+'>', // sender address
      to: ''+receivers+'', // list of receivers
      subject: ''+req.body.subject+'', // Subject line
      text: ''+req.body.text+'', // plain text body
      attachments : attachment,
      html:output // html body
  };
  var today = new Date();
  if(req.body.purpose=="order"){
  var messages={
    "fromsender":mailOptions.from,
    "sendername":results[0].firstname+' '+results[0].lastname,
    "emailsender":results[0].email,
    "status":'sent',
    "Messages":req.body.message,
    "image":req.files[0].filename,
    "imagename":req.files[0].originalname,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today,
    "orderno":req.body.orderno,
    "orderdate":req.body.orderdate,
    "orderprice":req.body.orderprice,
    "quantity":req.body.quantity,
    "price":req.body.price,
    "gst":req.body.gst,
    "message1":req.body.message1,
    "quantity1":req.body.quantity1,
    "price1":req.body.price1,
    "gst1":req.body.gst1,
    "message2":req.body.message2,
    "quantity2":req.body.quantity2,
    "price2":req.body.price2,
    "gst2":req.body.gst2,
    "message3":req.body.message3,
    "quantity3":req.body.quantity3,
    "price3":req.body.price3,
    "gst3":req.body.gst3,
    
  }
}
else{
  var messages={
    "fromsender":mailOptions.from,
    "sendername":results[0].firstname+' '+results[0].lastname,
    "emailsender":results[0].email,
    "status":'sent',
    "Messages":req.body.message,
    "image":req.files[0].filename,
    "imagename":req.files[0].originalname,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today,
    "orderno":undefined,
    "orderdate":undefined,
    "orderprice":undefined,
    "quantity":undefined,
    "price":undefined,
    "gst":undefined,
    "message1":undefined,
    "quantity1":undefined,
    "price1":undefined,
    "gst1":undefined,
    "message2":undefined,
    "quantity2":undefined,
    "price2":undefined,
    "gst2":undefined,
    "message3":undefined,
    "quantity3":undefined,
    "price3":undefined,
    "gst3":undefined,
    "total3":undefined
  }
}
  }
    else{
  // setup email data with unicode symbols
  var mailOptions = {
    from: '"'+results[0].firstname+' '+results[0].lastname+'"<'+results[0].email+'>', // sender address
    to: ''+receivers+'', // list of receivers
    subject: ''+req.body.subject+'', // Subject line
    text: ''+req.body.text+'', // plain text body
    html:output // html body
};
var today = new Date();
if(req.body.purpose=="order"){
var messages={
  "fromsender":mailOptions.from,
  "sendername":results[0].firstname+' '+results[0].lastname,
  "emailsender":results[0].email,
  "status":'sent',
  "Messages":req.body.message,
  "image":'undefined',
  "imagename":'undefined',
  "toreceiver":mailOptions.to,
  "subject":mailOptions.subject,
  "text":mailOptions.text,
  "date":today,
  "orderno":req.body.orderno,
  "orderdate":req.body.orderdate,
  "orderprice":req.body.orderprice,
  "quantity":req.body.quantity,
  "price":req.body.price,
  "gst":req.body.gst,
  "message1":req.body.message1,
  "quantity1":req.body.quantity1,
  "price1":req.body.price1,
  "gst1":req.body.gst1,
  "message2":req.body.message2,
  "quantity2":req.body.quantity2,
  "price2":req.body.price2,
  "gst2":req.body.gst2,
  "message3":req.body.message3,
  "quantity3":req.body.quantity3,
  "price3":req.body.price3,
  "gst3":req.body.gst3
  

}}else{
  var messages={
    "fromsender":mailOptions.from,
    "sendername":results[0].firstname+' '+results[0].lastname,
    "emailsender":results[0].email,
    "status":'sent',
    "Messages":req.body.message,
    "image":'undefined',
    "imagename":'undefined',
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today,
    "orderno":undefined,
    "orderdate":undefined,
    "orderprice":undefined,
    "quantity":undefined,
    "price":undefined,
    "gst":undefined,
    "message1":undefined,
    "quantity1":undefined,
    "price1":undefined,
    "gst1":undefined,
    "message2":undefined,
    "quantity2":undefined,
    "price2":undefined,
    "gst2":undefined,
    "message3":undefined,
    "quantity3":undefined,
    "price3":undefined,
    "gst3":undefined,
    "total3":undefined
  }
}}
 
  var messages1={
    "fromsender":mailOptions.from,
    "sendername":results[0].Name,
    "emailsender":results[0].sender,
    "status":'failed',
    "Messages":req.body.message,
    "image":req.body.image,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today,
    "orderno":undefined,
    "orderdate":undefined,
    "orderprice":undefined,
    "quantity":undefined,
    "price":undefined,
    "gst":undefined,
    "total":undefined
  }
 

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        connection.query('INSERT INTO messages SET ?',messages1, function (error, results, fields) {
          console.log(results);
          if (error) {
            console.log("error ocurred",error);
            res.send({
              "code":400,
              "failed":"error ocurred"
            })
          }else{
            console.log("successfully inserted");
            }
          });
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      
      connection.query('INSERT INTO messages SET ?',messages, function (error, results, fields) {
        console.log(results);
        if (error) {
          console.log("error ocurred",error);
          res.send({
            "code":400,
            "failed":"error ocurred"
          })
        }else{
          console.log("successfully inserted");
          }
        });
      
        connection.query("select * from messages WHERE emailsender = ?",[req.body.email],function(err,result,fields){
          if (err) throw err;
          console.log('inside final ');
          
          result.push(req.body.email);
          result.push(req.body.password);
          result.push(result[0].sendername);
          result.push('All');
          
          res.render('outbox',{result:result});
        });
  });
}); 
}

});
});

app.listen(3000,function(){
    console.log("Server is listening!!!!");
});