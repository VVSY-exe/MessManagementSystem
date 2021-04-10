require('dotenv').config()
const mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var fileupload = require('express-fileupload');
var connection = mysql.createConnection({
	host     : '127.0.0.1',
	user     : 'root',
	password : process.env.dbpassword,
	database : 'messmanagementsystem'
});

var app = express()
app.set('view engine', 'ejs');
app.use(fileupload());
app.use(session({
    secret: process.env.sessionsecret,
    resave: true,
    saveUninitialized: true
}))

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    if (req.session.loggedin) {
		res.send('Welcome back, ' + req.session.email + '!');
	} else {
		res.send('Please login to view this page!');
	}
});

app.get('/signup',async(req,res)=>{
    res.render(__dirname+'/public/views/signup/signup.ejs')
})

app.post('/signup',async(req,res)=>{
    var user = {
    name: req.body.name,
    contact:req.body.contact,
    email:req.body.email,
    password:req.body.password,
    dateofjoining: new Date() }
    
    connection.query('INSERT INTO STUDENT SET ?',user,function(error, results) {
        if (!error) {
            res.redirect('/login')
        }
        else {
            console.log(error);
            res.send("Nahi hua")
        }})
})

app.get('/login', async (req, res) => {
    res.render(__dirname+'/public/views/login/login.ejs')
})

connection.connect(function(err){
    if(!err) {
        console.log("Database is connected");
    } else {
        console.log("Error while connecting with database",err);
    }
    });

app.post('/login', async (req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {
        connection.query('SELECT * FROM student WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
            if (results.length > 0) {
                results=JSON.parse(JSON.stringify(results))
                console.log(results)
                req.session.loggedin = true;
                req.session.email = email;
                req.session.user_id=results[0].id;
                res.redirect('/')
            }
            else {
                res.send("Incorrect Credentials")
            }
            res.end()
        });
    }
    else {
        res.send("Incorrect Credentials")
    }
})

app.get('/createcomplaint', async(req,res)=>{
    if(req.session.loggedin){
    res.render(__dirname+'/public/views/complaint/createComplaint.ejs');
}
    
    else{
        res.send("Please login to view");
    }
})

app.post('/createcomplaint', async (req,res)=>{
    var image
    if (!req.files){
        image = null
    }
    else {
        image = req.files.image.data.toString('base64')
    }
    console.log(req.session.email)
    var complaint = {
        id:req.session.user_id,
        title: req.body.title,
        description:req.body.description,
        complaintdate: new Date(), 
    }
        
        connection.query('INSERT INTO COMPLAINT SET ?',complaint,function(error, results) {
            if (!error) {
                console.log('Post Created')
                res.redirect('/viewcomplaint')
            }
            else {
                console.log(error);
                res.send("Nahi hua")
            }})

})

app.get('/viewcomplaint', async(req,res)=>{
    connection.query('SELECT * FROM COMPLAINT WHERE id=?',req.session.user_id,function(error,results){
        if(!error){
            results=JSON.parse(JSON.stringify(results))
                res.render(__dirname+'/public/views/complaint/viewComplaint.ejs',{results})
        }
    })
})

app.listen(3000, console.log("Listening to Port 3000"))