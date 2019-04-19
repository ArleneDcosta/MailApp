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

var connect = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'company'
});

connection.connect(function(err){
    if(!err){
        console.log("Database is connected ... nn");
    }
    else{
        console.log("Error connecting database .... nn");
    }
});

connect.connect(function(err){
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
    "Messages":req.body.message
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
  console.log(req.body);
  connection.query("select * from messages WHERE sendername=? and Messages = ? and status=?",[req.body.sender,req.body.message,req.body.status],function(err,result,fields){
    if (err) throw err;
    result.push(req.body.email);
    result.push(req.body.password);
    result.push(result[0].sendername);
    result.push('All');
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
        if(req.body.image==undefined)
        {
        var output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Name: XYZ</li>
      <li>Company:Pehchan</li>
      <li>Email:pehchan@gmail.com</li>
      <li>Phone:0222892939/li>
    </ul>
    <h3>Message</h3>
    <pre>${req.body.message}</pre>`;
        }
        else{
          var output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Name: XYZ</li>
      <li>Company:Pehchan</li>
      <li>Email:pehchan@gmail.com</li>
      <li>Phone:0222892939/li>
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
  var whole = [];
  workbook.xlsx.readFile("sample.xlsx").then(function(){
    var workSheet =  workbook.getWorksheet("Sheet1"); 
    workSheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {

      currRow = workSheet.getRow(rowNumber); 
      // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
      
      whole.push(row.values);
      console.log("inside");
      
       // console.log("Email:" + currRow.getCell(1).value[0] + row.values[1]);
       // console.log("User Name :" + row.values[1] +", Password :" +  row.values[2] ); 

       // assert.equal(currRow.getCell(2).type, Excel.ValueType.Number); 
     //  console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
    });
    var temp = {};
    for(i=0;i<whole.length;i++){
    	if(whole[i][2]==results[0].email){
    		temp = whole[i];
    		break;
    	}
    }
    if(req.files.length!=0)
  {
    attachment = [{ filename:req.files[0].originalname,path:__dirname + '/public/uploads/'+req.files[0].filename}];
    var mailOptions = {
      from: '"'+temp[4]+'"<'+temp[2] +'>', // sender address
      to: ''+temp[3]+'', // list of receivers
      subject: ''+req.body.subject+'', // Subject line
      text: ''+req.body.text+'', // plain text body
      attachments : attachment,
      html:output // html body
  };
  var today = new Date();
  var messages={
    "fromsender":mailOptions.from,
    "sendername":temp[4],
    "emailsender":temp[2],
    "status":'sent',
    "Messages":req.body.message,
    "image":req.files[0].filename,
    "imagename":req.files[0].originalname,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today
  }
  }
    else{
  // setup email data with unicode symbols
  var mailOptions = {
    from: '"'+temp[4]+'"<'+temp[2]+'>', // sender address
    to: ''+temp[3]+'', // list of receivers
    subject: ''+req.body.subject+'', // Subject line
    text: ''+req.body.text+'', // plain text body
    html:output // html body
};
var today = new Date();
var messages={
  "fromsender":mailOptions.from,
  "sendername":temp[4],
  "emailsender":temp[2],
  "status":'sent',
  "Messages":req.body.message,
  "image":'undefined',
  "imagename":'undefined',
  "toreceiver":mailOptions.to,
  "subject":mailOptions.subject,
  "text":mailOptions.text,
  "date":today
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
    "date":today
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
      
        connection.query("select * from messages WHERE emailsender = ?",[temp[2]],function(err,result,fields){
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