require('dotenv').config()
const mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var fileupload = require('express-fileupload');
var cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
  });
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
    saveUninitialized: true,
    expires: new Date(Date.now() + (30 * 86400 * 1000))
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
        let response = await cloudinary.uploader.upload("data:image/png;base64,"+req.files.image.data.toString('base64'))
        console.log(response.url)
        image = response.url
    }
    console.log(req.session.email)
    var complaint = {
        id:req.session.user_id,
        title: req.body.title,
        description:req.body.description,
        complaintdate: new Date(),
        imageurl: image
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
    connection.query(`SELECT * FROM COMPLAINT WHERE id = '${req.session.user_id}'`,function(error,results){
        if(!error){
            results=JSON.parse(JSON.stringify(results))
            console.log(results)
            res.render(__dirname+'/public/views/complaint/viewComplaint.ejs',{results})
        }
        else {
            console.log(error)
        }
    })
})


app.get('/feedback', async(req,res)=>{
                res.render(__dirname+'/public/views/feedback/createFeedback.ejs')
})

app.post('/feedback', async(req,res)=>{
    var feedback = {
        star:req.body.rating1,
        description:req.body.description,
        dateoffeedback: new Date(), 
    }
        connection.query('INSERT INTO feedback SET ?',feedback,function(error, results) {
            if (!error) {
                console.log('Feedback Created')
                res.redirect('/')
            }
            else {
                console.log(error);
                res.send("Nahi hua")
            }})
})

app.get('/staffsignup', async(req,res)=>{
    res.render(__dirname+'/public/views/signup/staffsignup.ejs');
})

app.post('/staffsignup', async(req,res)=>{
    var user = {
        name: req.body.name,
        mobile:req.body.contact,
        email:req.body.email,
        password:req.body.password,
        doj: new Date() }
        
        connection.query('INSERT INTO STAFF SET ?',user,function(error, results) {
            if (!error) {
                res.redirect('/stafflogin')
            }
            else {
                console.log(error);
                res.send("Nahi hua")
            }})
})

app.get('/stafflogin',async(req,res)=>{
    res.render(__dirname+'/public/views/login/stafflogin.ejs');
})

app.post('/stafflogin',async(req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    if (email && password) {
        connection.query('SELECT * FROM STAFF WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
            if (results.length > 0) {
                results=JSON.parse(JSON.stringify(results))
                console.log(results)
                req.session.loggedin = true;
                req.session.email = email;
                req.session.user_id=results[0].id;
                res.redirect('/staffdashboard')
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

app.get('/staffdashboard',async(req,res)=>{
    res.render(__dirname+'/public/views/dashboard/staffdashboard.ejs');
})

app.get('/createroles', async(req,res)=>{
    res.render(__dirname+'/public/views/roles/roles.ejs');
})

app.post('/createroles', async(req,res)=>{
    var roles={
        role: req.body.rolename,
        salary: req.body.salary
    }
    connection.query("INSERT INTO ROLES SET ?",[roles],(error,results)=>{
        if(!error){
            res.send('Role Created Successfully');
        }
        else{
            console.log(error)
            res.send('Nahi hua');
        }
    })
})

app.get('/assignroles',async(req,res)=>{
    var staff,roles
    connection.query('SELECT * FROM STAFF',(err,results)=>{
        if(!err){
            staff=JSON.parse(JSON.stringify(results))
        }
        else{
            console.log(err)
            res.send('An error occured');
        }
    })

    connection.query('SELECT * FROM ROLES',(err,results)=>{
        if(!err){
            roles=JSON.parse(JSON.stringify(results))
        }
        else{
            console.log(err)
            res.send('An error occured');
        }
    })

    res.render(__dirname+'/public/views/roles/assignroles.ejs',{staff,roles});
})

app.post('/assignroles', async(req,res)=>{

})

app.listen(3000, console.log("Listening to Port 3000"))