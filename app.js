//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.set('view engine','ejs');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = {
  username: String,
  password: String,
  usertype: String
};

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

//login

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/view", function(req,res){
    res.render("view");
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
            res.render("dashboard",{username:uname});
        }
      }
      else{
        res.render("login");
      }
  }});
});

app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
