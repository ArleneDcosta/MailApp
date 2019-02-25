var mysql = require('mysql');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
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
  var today = new Date();
  let hash = bcrypt.hashSync(req.body.password,12);
  var users={
    "firstname":req.body.firstname,
    "lastname":req.body.lastname,
    "email":req.body.email,
    "password":hash,
    "phoneno":req.body.phone_no
  }
  const output='<p>Verified</p>';
  let transporter = nodemailer.createTransport({
    service:'Gmail',
    auth: {
        user: req.body.email, // generated ethereal user
        pass: req.body.password  // generated ethereal password
    }
  });
  let mailOptions = {
    from: ''+req.body.name+' <'+req.body.email +'>', // sender address
    to: ''+req.body.email+'', // list of receivers
    subject: 'Verify', // Subject line
    text: 'Verify', // plain text body
    html: output // html body
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
     
     res.send("Enter appropriate email and password");
    return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);   
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
    if (error) {
      console.log("error ocurred",error);
      res.send({
        "code":400,
        "failed":"error ocurred"
      })
    }else{
      console.log('The solution is: ', results);
      res.render('home', {msg:'Email has been sent'});
    }
    });

  
});
});

app.get("/login",function(req,res){
  res.render('login');
});
app.get("/signup",function(req,res){
  res.render('signup');
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
          console.log(result);
          console.log(result.length);
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

app.get('/compose',function(req,res){
  // connect.query('select * from companydb where client = ? ',[email],function(error,results,fields){
  //   if(error){
  //     res.send({
  //       "code":400,
  //       "failed":"error occurred"
  //     });
  //   }
  //   else{
  //     res.render('compose',{result:result});
  //   }
  // });
  console.log("INSIDE COMPOSE");
  res.render('compose');

});
// compose button will be placed on outbox page and then to the compose page and then from the compose page will be send
app.post('/send', (req, res) => {
  console.log(req.body.recipient);
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
        const output = `
    <p>You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>  
      <li>Name: ${results[0].Name}</li>
      <li>Company: ${results[0].Company}</li>
      <li>Email: ${results[0].email}</li>
      <li>Phone: ${results[0].phone}</li>
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>
  `;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // host: 'smtp.mail.gmail.com',
    // port: 587,
    // secure: true, // true for 465, false for other ports
    service:'Gmail',
    auth: {
        user: results[0].email, // generated ethereal user
        pass: results[0].password  // generated ethereal password
    }
    // tls:{
    //   rejectUnauthorized:false
    // }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Arlene Dcosta" <'+results[0].email +'>', // sender address
      to: ''+req.body.recipient+'', // list of receivers
      subject: 'Mass Mail', // Subject line
      text: 'Offers valid up to Monday', // plain text body
      html: output // html body
  };
  var today = new Date();
  var messages={
    "fromsender":mailOptions.from,
    "emailsender":results[0].email,
    "toreceiver":mailOptions.to,
    "subject":mailOptions.subject,
    "text":mailOptions.text,
    "date":today
  }

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      connection.query('INSERT INTO messages SET ?',messages, function (error, results, fields) {
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
        connection.query("select * from messages WHERE emailsender = ?",[email],function(err,result,fields){
          if (err) throw err;
          console.log(result);
          console.log(result.length);
          res.render('outbox',{result:result});
        });
  });
}
});
});

app.listen(3000,function(){
    console.log("Server is listening!!!!");
});