//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const _ = require("lodash");

var exams;
var students;
//classes ---------------------------------------------------------
class UserC{
  constructor(username,password,name) {
    this.username = username;
    this.password = password;
    this.name = name;
  }

  //getter methods
  getUsername(){
    return this.username;
  }
  getPassword(){
    return this.password;
  }
  getName(){
    return this.name;
  }
}

class Examination {
  constructor(name,code,numreg,department,date,session) {
    this.name = name;
    this.code = code;
    this.numreg = numreg;
    this.department = department;
    this.date = date;
    this.session = session;
  }

  //setter methods
  setDate(newdate){
    this.date = newdate;
  }
   setSession(newsess){
     this.session = newsess;
  }
  incNum(){
    this.numreg +=1;
  }

  //getter methods
  getName(){
    return this.name;
  }
  getCode(){
    return this.code
  }
  getNum(){
    return this.numreg;
  }
  getDepartment(){
    return this.department;
  }
  getDate(){
    return this.date;
  }
  getSession(){
    return this.session;
  }
}

class Student extends UserC{
  constructor(username,password,name,dob,gender,department){
    super(username,password,name);
    this.dob = dob;
    this.gender = gender;
    this.department = department;
    this.registrations = [];
    this.hallticket = [];
  }
  //getter methods
  getRegistrations(){
    return this.registrations;
  }
  getHallticket(){
    return this.hallticket;
  }
  getDOB(){
    return this.dob;
  }
  getGender(){
    return this.gender;
  }
  getDepartment(){
    return this.department;
  }

  setRegistrations(regs){
    this.registrations = regs;
  }
  setHallticket(hall){
    this.hallticket = hall;
  }
  //to register for exam
  registerExam(exam){
    this.registrations.push(exam);
  }
//add exam to hall ticket after payment
  addExam(exam){
    this.hallticket.push(exam)
  }
}

class CoE extends UserC{
  constructor(username,password,name){
    super(username,password,name);
  }
}

//--------------------------------------------


var sess;

const app = express();

app.set('view engine','ejs');

app.use(express.static("public"));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.urlencoded({
  extended:true
}));

//mongoose.connect("mongodb://localhost:27017/examregDB");

mongoose.connect("mongodb+srv://exam-admin:exam@cluster0.ocxae.mongodb.net/examDB");

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
  name : String,
  usertype: String,
  exams: [String],
  payment: [Number],
  dob : Date,
  gender : String,
  department: String
};

const User = new mongoose.model("User",userSchema);

const markSchema = {
  username : String,
  exam : String,
  mark : Number
}

const Mark = new mongoose.model("Mark",markSchema);

app.get("/",function(req,res){
  res.render("login");
});

//login

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/dashboard",function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "student"){
      res.render("error");
    }
    else{
        res.render("dashboard",{name:sess.user.name});
    }
  }
  else{
    res.render("error");
  }
});

app.get("/view", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error",{err:"session"});
    }
    else if(sess.usertype != "student"){
      res.render("error",{err:"access"});
    }
    else{
        res.render("view");
    }
  }
  else{
    res.render("error");
  }
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
    name : req.body.name,
    username: req.body.username,
    password: req.body.password,
    usertype: 'student',
    dob : req.body.dob,
    gender : req.body.gender,
    department : req.body.department,
    exams: [],
    payment: []
  });

  newUser.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      res.redirect("/");
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
        exams = [];
        Exam.find({}, function(err,foundExams){
          if(foundUser.usertype == "student"){

            var student = new Student(req.body.username,req.body.password,foundUser.name,foundUser.dob,foundUser.gender,foundUser.department);

            for(var i=0;i<foundExams.length;++i){
              var exam = new Examination(foundExams[i].ename,foundExams[i].ecode, foundExams[i].regnum,foundExams[i].edept, foundExams[i].edate, foundExams[i].esess);
              console.log("In student",exams);
              exams.push(exam);
              for(var j=0;j<foundUser.exams.length;++j)
              {
                if(foundExams[i].ecode == foundUser.exams[j]){
                  student.registerExam(exam);
                  if(foundUser.payment[j]==1){
                    student.addExam(exam);
                  }
                  break;
                }
              }
            }
            console.log(student);
            console.log(exams);
            sess = req.session;
            sess.user = student;
            sess.usertype = "student";
            res.redirect("/dashboard");
          }
          else if(foundUser.usertype == "coe"){
            var coe = new CoE(req.body.username,req.body.password,foundUser.name);
            students = [];
            User.find({usertype : 'student'}, function(err,foundUsers){
              for(var i=0;i<foundExams.length;++i){
                var exam = new Examination(foundExams[i].ename,foundExams[i].ecode, foundExams[i].regnum,foundExams[i].edept, foundExams[i].edate, foundExams[i].esess);
                exams.push(exam);
              }
              for(var i=0;i<foundUsers.length;++i){
                var student = new Student(foundUsers[i].username,foundUsers[i].password,foundUsers[i].name,foundUsers[i].dob,foundUsers[i].gender,foundUsers[i].department);
                for(var j=0;j<exams.length;++j){
                  for(var k=0;k<foundUsers[i].exams.length;++k){
                    if(exams[j].getCode() == foundUsers[i].exams[k]){
                      student.registerExam(exams[j]);
                      if(foundUsers[i].payment[k]==1){
                        student.addExam(exams[j]);
                      }
                      break;
                    }
                  }
                }
                students.push(student);
              }
              sess = req.session;
              sess.user = coe;
              sess.usertype = "coe";
              res.redirect("/coeinfo");
            });
          }
        });
    }
    else{
      res.render("login");
    }
  }});
});

app.post("/search", function(req,res){
  const code = req.body.code;
  sess = req.session;
  const user = sess.user;
  var val = -1;
  for(var i=0;i<exams.length;i++){
    if(exams[i].getCode() == code){
      val = 1;
      var regs = user.registrations;
      for(var j=0;j<regs.length;++j){
        console.log(regs[j].code);
        if(regs[j].code == code){
          val = 0;
          break;
        }
      }
      break;
    }
  }
  if(val == -1){
    res.render("details",{ecode:0});
  }
  else{
    res.render("details",{ecode:exams[i].getCode(),ename:exams[i].getName(), date :exams[i].getDate().toString().slice(0,15) , session : exams[i].getSession(),regnum: exams[i].getNum(), regval : val});
  }
});

app.post("/registerExam", function(req,res){
  const code = req.body.code;
  sess = req.session;
  const user = sess.user;
  for(var i=0;i<exams.length;i++){
    if(exams[i].getCode() == code){
      exams[i].incNum();
      break;
    }
  }
  sess.user.registrations.push(exams[i]);
  var n = exams[i].getNum();
  User.updateOne({username: user.username},{ $push: {exams: { $each: [code], $position: 0}}}).exec((err, posts) => { });
  User.updateOne({username: user.username},{ $push: {payment: { $each: [0], $position: 0}}}).exec((err, posts) => { });
  Exam.updateOne({ecode: code}, {regnum : n }).exec((err, posts) => { });
  res.redirect("/dashboard");
});

app.get("/viewreg", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error",{err:"session"});
    }
    else if(sess.usertype != "student"){
      res.render("error");
    }
    else{
      const user = sess.user;
      var regs = user.registrations;

      var hallticket = user.hallticket;
      var flag;
      var payments = [];

      for(i=0;i<regs.length;++i){
        flag = 0;
        for(j=0;j<hallticket.length;++j){
          if(hallticket[j].code == regs[i].code){
            flag = 1;
            break;
          }
        }
        payments.push(flag);
      }
      res.render("viewreg",{regexams:regs,pay:payments});
    }
  }
  else{
    res.render("error");
  }
});

app.get("/hallticket", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "student"){
      res.render("error");
    }
    else{
      const sess = req.session;
      const user = sess.user;
      var hallticket = user.hallticket;
      res.render("hallticket",{hallticket:hallticket, student: user});
    }
  }
  else{
    res.render("error");
  }
});

app.get("/viewResults",function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "student"){
      res.render("error");
    }
    else{
      const user = sess.user;
      Mark.find({username: user.username}, function(err,foundResults){
        if(foundResults){
          var foundExams = [];
          for(var i=0;i<foundResults.length;++i){
            for(var j=0;j<exams.length;++j){
              if(exams[j].getCode() == foundResults[i].exam){
                foundExams.push(exams[j]);
                break;
              }
            }
          }
          res.render("viewResults",{results:foundResults, exams:foundExams});
        }
        else{
          res.redirect("/dashboard");
        }
      });
    }
  }
  else{
    res.render("error");
  }
});

//------------------------COE---------------------------

app.get("/coeinfo",function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      const user = sess.user;
      res.render("coeinfo",{name:user.name});
    }
  }
});

app.get("/viewcoe", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("viewcoe");
    }
  }
});

app.get("/viewupdate", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("viewupdate");
    }
  }
});

app.get("/viewdelete", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("viewdelete");
    }
  }
});

app.get("/manage", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("manage");
    }
  }
});

app.get("/addexam", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("addexam");
    }
  }
});

app.get("/scheduleexam", function(req, res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      const uname = sess.username;
      res.render("scheduleexam", {username: uname});
    }
  }
});

app.get("/examentry", function(req, res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      const uname = sess.username;
      res.render("examentry", {username: uname});
    }
  }
});

app.get("/examfinal", function(req, res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      const uname = sess.username;
      res.render("examfinal", {username: uname});
    }
  }
});

app.get("/addresult", function(req,res){
  sess = req.session;
  if(sess){
    if(sess.usertype == null){
      res.render("error");
    }
    else if(sess.usertype != "coe"){
      res.render("error");
    }
    else{
      res.render("addresult");
    }
  }
});

app.post("/searchcoe", function(req,res){
  const code = req.body.code;
  sess = req.session;
  const user = sess.user;
  var flag = 0;
  for(var i=0;i<exams.length;i++){
    if(exams[i].getCode() == code){
      const name = exams[i].getName();
      const date = exams[i].getDate().toString().slice(0,15);
      const sess = exams[i].getSession();
      const dept = exams[i].getDepartment();
      const num = exams[i].getNum();
      res.render("detailscoe",{ecode:code,ename:name, edate: date, esess: sess, edept: dept, numreg : num});
      flag = 1;
      break;
    }
  }
  if(flag == 0)
    res.render("detailscoe",{ecode:0});
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
        var exam = new Examination(newExam.ename,newExam.ecode, newExam.regnum,newExam.edept, newExam.edate, newExam.esess);
        exams.push(exam);
        console.log(exams);
        sess = req.session;
        res.redirect("/addexam");
      }
    });
  });

  app.post("/updateexam", function(req,res){
    const code = req.body.code;
    var flag = 0;
    for(var i=0;i<exams.length;++i){
      if(exams[i].getCode() == code ){
        flag = 1;
        break;
      }
    }
    if(flag == 1)
      res.render("updatedetailscoe",{ecode:exams[i].getCode(),ename:exams[i].getName(), edate: exams[i].getDate().toString().slice(0,15), esess: exams[i].getSession(), edept: exams[i].getDepartment()});
    else
      res.render("updatedetailscoe",{ecode:0});
  });

  app.post("/confirmupdate", function(req,res){
    const code = req.body.ecode;
    console.log(code);
    var exam;
    var new_exams = [];
    const date = req.body.edate;
    const sess = req.body.esess;
    for(var i=0;i<exams.length;++i){
      if(exams[i].getCode() == code ){
        exam = exams[i];
        exam.setDate(date);
        exam.setSession(sess);
        new_exams.push(exam);
      }
      else{
        new_exams.push(exams[i]);
      }
    }
    console.log(new_exams);
    exams = new_exams;
    Exam.updateOne({ecode: code}, {edate : date }).exec((err, posts) => { });
    Exam.updateOne({ecode: code}, {esess : sess }).exec((err, posts) => { });
    res.redirect("/viewupdate");
  });

  app.post("/deleteexam", function(req,res){
    const code = req.body.code;
    var flag = 0;
    for(var i=0;i<exams.length;++i){
      if(exams[i].getCode() == code ){
        flag = 1;
        break;
      }
    }
    if(flag == 1)
      res.render("deletedetailscoe",{ecode:exams[i].getCode(),ename:exams[i].getName(), edate: exams[i].getDate().toString().slice(0,15), esess: exams[i].getSession(), edept: exams[i].getDepartment(), num: exams[i].getNum()});
    else
      res.render("deletedetailscoe",{ecode:0});
  });

  app.post("/confirmdelete", function(req,res){
    const code = req.body.code;
    var exam;
    var new_exams = [];
    var i,j;
    for(i=0;i<exams.length;++i){
      if(exams[i].getCode() != code ){
        new_exams.push(exams[i]);
      }
    }
    exams = new_exams;
    for(i=0;i<students.length;++i){
      var regs = students[i].getRegistrations();
      var new_regs = [];
      var codes =[];
      var paid = [];
      var hall = students[i].getHallticket();
      var new_hall = [];
      for(j=0;j<regs.length;++j){
        if(regs[j].getCode() != code){
          new_regs.push(regs[j]);
          codes.push(regs[j].getCode());
        }
      }
      for(j=0;j<hall.length;++j){
        if(hall[j].getCode() != code){
          new_hall.push(hall[j]);
          paid.push(hall[j].getCode())
        }
      }
      var payments = [];
      for(j=0;j<codes.length;++j){
        if(codes[j] in paid){
          payments.push(1);
        }
        else{
          payments.push(0);
        }
      }
      students[i].setRegistrations(new_regs);
      students[i].setHallticket(new_hall);
      User.updateOne({username:students[i].getUsername()},{exams:codes}).exec((err, posts) => {});
      User.updateOne({username:students[i].getUsername()},{payment:payments}).exec((err, posts) => {});
    }
    Mark.deleteMany({exam: code}, function(err, foundExams){});
    Exam.deleteOne({ecode:code}, function(err,foundExam){res.redirect("/viewdelete");});
  });

  app.get("/studentsearch",function(req,res){
    sess = req.session;
    if(sess){
      if(sess.usertype == null){
        res.render("error");
      }
      else if(sess.usertype != "coe"){
        res.render("error");
      }
      else{
        res.render("displayStudents", {students : students});
      }
    }
  });

  app.post("/examentry", function(req,res){
    sess = req.session;
    const user = sess.user;
    const uname = user.username;
    const no_exams = req.body.no_exams;
    const no_dates = req.body.no_dates;
    const sdate = req.body.startdate;
    const mleave = req.body.minleave;
    const m = parseInt(mleave) + 1

    var holidays =  []

    for(var i=0; i<no_dates; i++) {
      var name = "date" + i
      holidays.push(req.body[name])
    }

    // holidays
    console.log(holidays)

    var examdates = []
    examdates.push(sdate)

    for(var i=1; i<no_exams; i++) {
      var next_date = new Date(examdates[i-1]);
      next_date.setDate(next_date.getDate() + m)
      var mon = next_date.getMonth() + 1
      var date = next_date.getDate()
      if(mon < 10) {
        mon = "0" + mon
      }
      if(date < 10) {
        date = "0" + date
      }
      n = next_date.getFullYear() + "-" + mon + "-" + date
      nday = next_date.getDay()
      if(holidays.includes(n) || nday == 0) {
        while(holidays.includes(n) || nday == 0) {
          var next_date = new Date(n);
          next_date.setDate(next_date.getDate() + 1)
          var mon = next_date.getMonth() + 1
          var date = next_date.getDate()
          if(mon < 10) {
            mon = "0" + mon
          }
          if(date < 10) {
            date = "0" + date
          }
          n = next_date.getFullYear() + "-" + mon + "-" + date
          nday = next_date.getDay()
        }
      }
      examdates.push(n)
    }

    console.log(examdates);

    res.render("examentry",{username:uname, nexams:no_exams, start:sdate, edates:examdates});
  });

  app.get("/viewResultscoe",function(req,res){
    sess = req.session;
    if(sess){
      if(sess.usertype == null){
        res.render("error");
      }
      else if(sess.usertype != "coe"){
        res.render("error");
      }
      else{
        Mark.find({}, function(err,foundResults){
          if(foundResults){
            var foundExams = [];
            for(var i=0;i<foundResults.length;++i){
              for(var j=0;j<exams.length;++j){
                if(exams[j].getCode() == foundResults[i].exam){
                  foundExams.push(exams[j]);
                  break;
                }
              }
            }
            res.render("viewResultscoe",{results:foundResults, exams:foundExams});
          }
          else{
            res.redirect("/dashboard");
          }
        });
      }
    }
  });

  app.post("/examfinal", function(req,res){
    const nexams = req.body.nexams;
    sess = req.session;
    const user = sess.user
    const uname = user.username;

    console.log(req.body)

    for (let i = 0; i < nexams; i++) {
      var ecode = "ecode" + i;
      var ename = "ename" + i;
      var esess = "esess" + i;
      var edate = "edate" + i;

      const newExam = new Exam({
        ename: req.body[ename],
        ecode: req.body[ecode],
        edate: req.body[edate],
        edept: req.body.edept,
        esess: req.body[esess],
        regnum: 0
      });

      newExam.save(function(err) {});
      var exam = new Examination(newExam.ename,newExam.ecode, newExam.regnum,newExam.edept, newExam.edate, newExam.esess);
      exams.push(exam);
    }
    console.log(exams);
    res.render("examfinal",{username:uname, examlist:exams});
  });


    app.post("/addresult", function(req,res){
      const newMark = new Mark({
        username: req.body.sname,
        exam: req.body.ecode,
        mark: req.body.marks
      });
      console.log("Result Added", newMark.ename);
      newMark.save(function(err){
        if(err){
          res.send(err);
        }
        else{
          res.redirect("/addresult");
        }
      });
    });

  app.get("/:url", function(req,res){
    sess = req.session;
    if(sess){
      if(sess.usertype == null){
        res.render("error");
      }
      else if(sess.usertype != "student"){
        res.render("error");
      }
      else{
        const url = req.params.url;
        newUrl = url.slice(0, 3);
        arg = url.slice(3,);
        console.log(newUrl, arg);
        sess = req.session;
        const user = sess.user;
        if(newUrl == "pay")
        {
          const examCode = arg;
          var regs = user.registrations;
          var i,j;
          for(i=0;i<regs.length;++i){
            if(regs[i].code == examCode){
              sess.user.hallticket.push(regs[i]);
            }
          }
          var hallticket = user.hallticket;
          var flag;
          var payments = [];

          for(i=0;i<regs.length;++i){
            flag = 0;
            for(j=0;j<hallticket.length;++j){
              if(hallticket[j].code == regs[i].code){
                flag = 1;
                break;
              }
            }
            payments.push(flag);
          }
          User.updateOne({username:user.username},{payment:payments}).exec((err, posts) => {});
          res.redirect("/viewreg");
        }
      }
    }
  });


//-----------------------

app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
