class User {
  constructor(username,password) {
    this.username = username;
    this.password = password;
  }
}

class Student extends User{
  constructor(name,regnum,dob,gender,department){
    this.name = name;
    this.regnum = regnum;
    this.dob = dob;
    this.gender = gender;
    this.department = department;
  }
}
