//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');

var sess;

const app = express();

app.set('view engine','ejs');

app.use(express.static("public"));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB");


const examSchema = {
  ecode: String,
  ename: String
};



const Exam = new mongoose.model("Exam", examSchema);


const userSchema = {
  username: String,
  password: String,
  usertype: String,
  exams: [String]
};

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("login");
});

//login

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/dashboard",function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("dashboard",{username:uname});
});

app.get("/view", function(req,res){
    sess = req.session;
    const uname = sess.username;
    res.render("view",{username:uname});
});

app.get("/logout", function(req,res){
  req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        console.log("Session destroyed successfully");
        res.redirect('/');
  });
});

app.post("/register", function(req,res){
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
    usertype: req.body.usertype,
    exams: []
  });
  console.log("llala",newUser.usertype);
  newUser.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      sess = req.session;
      sess.username = req.body.username;
      res.render("dashboard",{username:req.body.username});
    }
  });
});


app.post("/login", function(req,res){
  const uname = req.body.username;
  const pwd = req.body.password;

  User.findOne({username: uname, password: pwd}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        console.log(foundUser.usertype);
          if(foundUser.usertype == "student"){
            sess = req.session;
            sess.username = uname;
            res.render("dashboard",{username:uname});
        }
      }
      else{
        res.render("login");
      }
  }});
});

app.post("/search", function(req,res){
  const code = req.body.code;
  sess = req.session;
  const uname = sess.username;
  Exam.findOne({ecode:code}, function(err,foundExam){
    if(err){
      console.log(err);
    }
    else{
      if(foundExam){
        const name = foundExam.ename;
        res.render("details",{ecode:code,ename:name, username:uname});
      }
      else{
        res.render("details",{ecode:0});
      }
    }
  })
});

app.post("/registerExam", function(req,res){
  const code = req.body.code;
  sess = req.session;
  const uname = sess.username;

  User.findOne({username: uname}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        console.log("user found",code);
            Exam.findOne({ecode:code}, function(err,foundExam){
              if(err){
                console.log(err);
              }
              else{
                if(foundExam){
                  foundUser.exams.push(code);
                  foundUser.save(function(err){
                    if(err){
                      res.send(err);
                    }
                    else{
                      res.render("dashboard",{username:uname});
                    }
                  });
                }

              }
            });
          }
          else{
            console.log("not found");
          }
        }
    });
  });

app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
