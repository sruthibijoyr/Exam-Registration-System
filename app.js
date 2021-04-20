//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const _ = require("lodash");

var sess;

const app = express();

app.set('view engine','ejs');

app.use(express.static("public"));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.urlencoded({
  extended:true
}));

mongoose.connect("mongodb://localhost:27017/examregDB");


const examSchema = {
  ecode: String,
  ename: String,
  regnum: Number,
  edept: String,
  edate: Date,
  esess: String
};


const Exam = new mongoose.model("Exam", examSchema);


const userSchema = {
  username: String,
  password: String,
  usertype: String,
  exams: [String],
  payment: [Number]
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
    exams: [],
    payment: []
  });
  //console.log("llala",newUser.usertype);
  newUser.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      sess = req.session;
      sess.username = req.body.username;
      if(req.body.usertype == "student"){
      res.render("dashboard",{username:req.body.username});
    }
    else{
      res.render("coeinfo",{username:req.body.username});
    }
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
        else if(foundUser.usertype == "coe"){
          sess = req.session;
          sess.username = uname;
          res.render("coeinfo",{username:uname});
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
        const num = foundExam.regnum;
        User.findOne({username: uname}, function(err,foundUser){
          if(err){
            console.log(err);
          }
          else{
            if(foundUser){
              var exams = foundUser.exams;
              if(exams.includes(code)){
                res.render("details",{ecode:code,ename:name, username:uname, regnum: num, regval : 0});
              }
              else{
                res.render("details",{ecode:code,ename:name, username:uname, regnum: num, regval : 1});
              }
              //console.log(exams,val,code);
            }
        }});
      }
      else{
        res.render("details",{ecode:0});
      }
    }
  });
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
                  foundUser.payment.push(0);
                  foundExam.regnum += 1;
                  foundExam.save(function(err){
                    if(err){
                      res.send(err);
                    }
                  });
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

app.get("/viewreg", function(req,res){
  sess = req.session;
  const uname = sess.username;
  User.findOne({username:uname},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        const exams = foundUser.exams;
        const payment = foundUser.payment;
        var n = 12/exams.length;
        var classes = "pricing-col col-lg-"+n+" col-md-6";
        console.log(classes);
        res.render("viewreg",{regexams:exams,classes:classes,pay:payment});
      }
    }
  });
});


//------------------------COE---------------------------

app.get("/coeinfo",function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("coeinfo",{username:uname});
});

app.get("/viewcoe", function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("viewcoe",{username:uname});
});

app.get("/viewupdate", function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("viewupdate",{username:uname});
});

app.get("/viewdelete", function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("viewdelete",{username:uname});
});

app.get("/manage", function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("manage",{username:uname});
});

app.get("/addexam", function(req,res){
  sess = req.session;
  const uname = sess.username;
  res.render("addexam",{username:uname});
});


app.post("/searchcoe", function(req,res){
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
        const month = foundExam.edate.getMonth()+1
        const date = foundExam.edate.getDate() + "/" + month  // get full date
        const sess = foundExam.esess
        const dept = foundExam.edept
        res.render("detailscoe",{ecode:code,ename:name, edate: date, esess: sess, edept: dept, username:uname});
      }
      else{
        res.render("detailscoe",{ecode:0});
      }
    }
  })
});

app.post("/addexam", function(req,res){
    const newExam = new Exam({
      ename: req.body.ename,
      ecode: req.body.ecode,
      edate: req.body.edate,
      edept: req.body.edept,
      esess: req.body.esess,
      regnum: 0
    });
    console.log("Exam Added", newExam.ename);
    newExam.save(function(err){
      if(err){
        res.send(err);
      }
      else{
        sess = req.session;
        const uname = sess.username;
        res.render("coeinfo",{username:uname});
      }
    });
  });

  app.post("/updateexam", function(req,res){
    const code = req.body.code;
    sess = req.session;
    const uname = sess.username;
    Exam.findOneAndDelete({ecode:code}, function(err,foundExam){
      if(err){
        console.log(err);
      }
      else{
        if(foundExam){
          const name = foundExam.ename;
          const month = foundExam.edate.getMonth()+1
          const date = foundExam.edate.getDate() + "/" + month  // get full date
          const sess = foundExam.esess
          const dept = foundExam.edept
          res.render("updatedetailscoe",{ecode:code,ename:name, edate: date, esess: sess, edept: dept, username:uname});
        }
        else{
          res.render("updatedetailscoe",{ecode:0});
        }
      }
    })
  });

  app.post("/deleteexam", function(req,res){
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
          const month = foundExam.edate.getMonth()+1
          const date = foundExam.edate.getDate() + "/" + month  // get full date
          const sess = foundExam.esess
          const dept = foundExam.edept
          res.render("deletedetailscoe",{ecode:code,ename:name, edate: date, esess: sess, edept: dept, username:uname});
        }
        else{
          res.render("deletedetailscoe",{ecode:0});
        }
      }
    })
  });

  app.post("/confirmdelete", function(req,res){
    const code = req.body.code;
    sess = req.session;
    const uname = sess.username;
    Exam.deleteOne({ecode:code}, function(err,foundExam){
      if(err){
        console.log(err);
      }
      else{
        sess = req.session;
        const uname = sess.username;
        res.render("coeinfo",{username:uname});
      }
    })
  });

  app.get("/:examCode", function(req,res){
    const examCode = _.capitalize(req.params.examCode);
    console.log(examCode);
    sess = req.session;
    const uname = sess.username;
    var tempPayments;
    User.findOne({username: uname}, function(err, foundUser){
      if(!err){
          if(foundUser){
            tempPayments = foundUser.payment;
            for(var i=0;i<foundUser.exams.length;++i){
              if(foundUser.exams[i] == examCode){
                tempPayments[i]=1;
                break;
              }
            }
            console.log("temp",tempPayments);
            User.updateOne({username:uname},{payment:tempPayments}).exec((err, posts) => {
              if(err)
                console.log(err)
              else
                console.log(posts)
            })
            res.render("dashboard",{username:uname});
          }
        }
      });
  });

//-----------------------

app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
