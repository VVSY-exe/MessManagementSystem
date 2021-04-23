require("dotenv").config();
const mysql = require("mysql");
const path = require("path");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var fileupload = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
const dbFunction=require('./database.js')


const { json } = require("body-parser");
const { render } = require("ejs");
const { totalmem } = require("os");
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});



var connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: process.env.dbpassword,
  database: "messmanagementsystem",
});


const publicDirectoryPath = path.join(__dirname, "./public")
var app = express();
app.set("view engine", "ejs");
app.use(fileupload());
app.use(
  session({
    secret: process.env.sessionsecret,
    resave: true,
    saveUninitialized: true,
    expires: new Date(Date.now() + 30 * 86400 * 1000),
  })
);

app.use(express.static(publicDirectoryPath));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  if (req.session.loggedin) {
    res.send("Welcome back, " + req.session.email + "!");
  } else {
    res.send("Please login to view this page!");
  }
});

app.get("/signup", async (req, res) => {
  res.render(__dirname + "/public/views/signup/signup.ejs");
});

app.post("/signup", async (req, res) => {
  var user = {
    name: req.body.name,
    contact: req.body.contact,
    email: req.body.email,
    password: req.body.password,
    dateofjoining: new Date(),
  };

  connection.query(
    "INSERT INTO STUDENT SET ?",
    user,
    function (error, results) {
      if (!error) {
        res.redirect("/login");
      } else {
        console.log(error);
        res.send("Nahi hua");
      }
    }
  );
});

app.get("/login", async (req, res) => {
  res.render(__dirname + "/public/views/login/login.ejs");
});

connection.connect(function (err) {
  if (!err) {
    console.log("Database is connected");
  } else {
    console.log("Error while connecting with database", err);
  }
});

app.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  if (email && password) {
    connection.query(
      "SELECT * FROM student WHERE email = ? AND password = ?",
      [email, password],
      function (error, results, fields) {
        if (results.length > 0) {
          results = JSON.parse(JSON.stringify(results));
          console.log(results);
          req.session.loggedin = true;
          req.session.email = email;
          req.session.user_id = results[0].id;
          res.redirect("/");
        } else {
          res.send("Incorrect Credentials");
        }
        res.end();
      }
    );
  } else {
    res.send("Incorrect Credentials");
  }
});

app.get("/createcomplaint", async (req, res) => {
  if (req.session.loggedin) {
    res.render(__dirname + "/public/views/complaint/createComplaint.ejs");
  } else {
    res.send("Please login to view");
  }
});

app.post("/createcomplaint", async (req, res) => {
  var image;
  if (!req.files) {
    image = null;
  } else {
    let response = await cloudinary.uploader.upload(
      "data:image/png;base64," + req.files.image.data.toString("base64")
    );
    console.log(response.url);
    image = response.url;
  }
  console.log(req.session.email);
  var complaint = {
    id: req.session.user_id,
    title: req.body.title,
    description: req.body.description,
    complaintdate: new Date(),
    image: image,
  };

  connection.query(
    "INSERT INTO COMPLAINT SET ?",
    complaint,
    function (error, results) {
      if (!error) {
        console.log("Post Created");
        res.redirect("/viewcomplaint");
      } else {
        console.log(error);
        res.send("Nahi hua");
      }
    }
  );
});

app.get("/viewcomplaint", async (req, res) => {
  connection.query(
    `SELECT * FROM COMPLAINT WHERE id = '${req.session.user_id}'`,
    function (error, results) {
      if (!error) {
        results = JSON.parse(JSON.stringify(results));
        console.log(results);
        res.render(__dirname + "/public/views/complaint/viewComplaint.ejs", {
          results,
        });
      } else {
        console.log(error);
      }
    }
  );
});

app.get("/feedback", async (req, res) => {

  if (req.session.loggedin) {
    res.render(__dirname + "/public/views/feedback/createFeedback.ejs");
  } else {
    res.send("Please login to view");
  }



});

app.post("/feedback", async (req, res) => {
  var feedback = {
    star: req.body.rating1,
    description: req.body.description,
    dateoffeedback: new Date(),
  };
  connection.query(
    "INSERT INTO feedback SET ?",
    feedback,
    function (error, results) {
      if (!error) {
        console.log("Feedback Created");
        res.redirect("/");
      } else {
        console.log(error);
        res.send("Nahi hua");
      }
    }
  );
});

app.get("/staffsignup", async (req, res) => {
  res.render(__dirname + "/public/views/signup/staffsignup.ejs");


});

app.post("/staffsignup", async (req, res) => {
  var user = {
    name: req.body.name,
    mobile: req.body.contact,
    email: req.body.email,
    password: req.body.password,
    doj: new Date(),
  };

  connection.query("INSERT INTO STAFF SET ?", user, function (error, results) {
    if (!error) {
      res.redirect("/stafflogin");
    } else {
      console.log(error);
      res.send("Nahi hua");
    }
  });
});

app.get("/stafflogin", async (req, res) => {
  res.render(__dirname + "/public/views/login/stafflogin.ejs");
});

app.post("/stafflogin", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  if (email && password) {
    connection.query(
      "SELECT * FROM STAFF WHERE email = ? AND password = ?",
      [email, password],
      function (error, results, fields) {
        if (results.length > 0) {
          results = JSON.parse(JSON.stringify(results));
          console.log(results);
          req.session.loggedin = true;
          req.session.email = email;
          req.session.user_id = results[0].id;
          res.redirect("/staffdashboard");
        } else {
          res.send("Incorrect Credentials");
        }
        res.end();
      }
    );
  } else {
    res.send("Incorrect Credentials");
  }
});

app.get("/staffdashboard", async (req, res) => {
  res.render(__dirname + "/public/views/dashboard/staffdashboard.ejs");
});

app.get("/createroles", async (req, res) => {
  res.render(__dirname + "/public/views/roles/roles.ejs");
});

app.post("/createroles", async (req, res) => {
  var roles = {
    role: req.body.rolename,
    salary: req.body.salary,
  };
  connection.query("INSERT INTO ROLES SET ?", [roles], (error, results) => {
    if (!error) {
      res.send("Role Created Successfully");
    } else {
      console.log(error);
      res.send("Nahi hua");
    }
  });
});

app.get("/assignroles", async (req, res) => {
  var staff, roles;
  connection.query("SELECT * FROM STAFF", (err, results) => {
    if (!err) {

      staff = JSON.parse(JSON.stringify(results));
      console.log(staff);

    } else {
      console.log(err);
      res.send("An error occured");
    }
  });

  connection.query("SELECT * FROM ROLES", (err, results) => {
    if (!err) {
      roles = JSON.parse(JSON.stringify(results));
    } else {
      console.log(err);
      res.send("An error occured");
    }
  });

  res.render(__dirname + "/public/views/roles/assignroles.ejs", {
    staff,
    roles,
  });
});

app.post("/assignroles", async (req, res) => { });

var items = [];

app.get("/createorder", async (req, res) => {

  if (req.session.loggedin) {
    res.render(__dirname + "/public/views/order/createOrder.ejs", { items });
  } else {
    res.send("Please login to view");
  }
});

app.post("/createorder", async (req, res) => {
  items.push({
    itemname: req.body.itemname,
    quantity: req.body.quantity,
    price: req.body.price,
  });
  console.log(items[0]["itemname"]);
  res.redirect("/createorder");
});

app.post("/orderdone", async (req, res) => {
  let orderid;
  connection.query(
    "SELECT Max(orderid) as max FROM messmanagementsystem.orders", "y",
    (err, results) => {
      results = JSON.parse(JSON.stringify(results));
      console.log(items.length);
      console.log(results[0].max);
      orderid = results[0].max;
      var oid = parseInt(orderid) + 1;


      //   items.forEach((value, index) => {
      //     console.log("hii");
      //   });

      for (var i = 0; i < items.length; i++) {
        var order = {
          orderid: oid,
          itemname: items[i]["itemname"],
          orderdate: new Date(),
          quantity: items[i]["quantity"],
          price: items[i]["price"],
        };

        connection.query("INSERT INTO ORDERS SET ?", order, async (error, result) => {
          if (!error) {
            console.log("order successfull");
          } else {
            console.log(error);
            console.log("nhhi huaa");
          }
        });
      }


      items = [];

      res.redirect("/createorder");
    }
  );


});

app.get("/vieworder", async (req, res) => {



  connection.query("SELECT * From  orders ORDER BY orderid Asc", (error, results) => {


    results = JSON.parse(JSON.stringify(results));
    // console.log(results);

    var allorder = [];
    console.log(results[0]);
    for (var i = 0; i < results.length; i++) {
      var sameorderid = [];
      sameorderid.push(results[i]);
      i++;
      while (i < results.length && results[i]['orderid'] == results[i - 1]['orderid']) {
        sameorderid.push(results[i]);
        // console.log('x')
        i++;
      }
      allorder.push(sameorderid);
     
      if(i<results.length)
      {
        i--;
      }

    }
    console.log('aaaaa')
    console.log(allorder[0][0]['orderid']);
    
    res.render(__dirname + "/public/views/order/vieworder.ejs", { allorder });
  }

  )

}


)



app.get("/allcomplaints", async (req, res) => {

  connection.query("SELECT * From  messmanagementsystem.complaint  Where issolved='NO' ORDER BY complaintdate Asc", (error, results) =>{

                results= JSON.parse(JSON.stringify(results))
                console.log(results[0])  
        
               
                res.render(__dirname + "/public/views/complaint/allComplaints.ejs", {results} );
                })


                
              })



app.get("/viewfeedback", async (req, res) => {
  
  const pool=await dbFunction.connectToDb();
  var [[count1]]=await pool.execute('SELECT count(star) as count FROM messmanagementsystem.feedback')
var [[avg1]]=await pool.query('SELECT avg(star) as avg FROM messmanagementsystem.feedback')
var counteach=[];
var countforeach=[];
var count=count1['count'];
var avg=avg1['avg'];
console.log(count1['count'])
console.log(avg1['avg'])
for(var i=1;i<=5;i++)
{

 var [[val]]= await pool.query(`SELECT count(star) as val FROM messmanagementsystem.feedback where star=${i}`)
 countforeach.push(val['val'])
 
 console.log(Math.round((val['val']/count)*100));
 counteach.push(Math.round((val['val']/count)*100));

}
await dbFunction.disconnectFromDb(pool)
var star =Math.round(avg);
  res.render(__dirname + "/public/views/feedback/viewFeedback.ejs",{count,avg,counteach,star,countforeach});

})

app.post("/resolvecomplaint", async (req, res) => {

  const pool=await dbFunction.connectToDb();

var id=req.body['complaint_id'];

console.log(req.body['complaint_id']);


 var results = await pool.query(`update messmanagementsystem.complaint set issolved='YES' where complaintid=${id}`)


//update the isresolved value

await dbFunction.disconnectFromDb(pool)

res.redirect('/allcomplaints')


})


app.get("/oldcomplaints", async (req, res) =>{

  connection.query("SELECT * From  messmanagementsystem.complaint  Where issolved='YES' ORDER BY complaintdate Asc", (error, results) =>{

    results= JSON.parse(JSON.stringify(results))
    console.log(results[0])  

    res.render(__dirname + "/public/views/complaint/oldComplaints.ejs",{results});
 
    })


})


app.listen(3000, console.log("Listening to Port 3000"));
