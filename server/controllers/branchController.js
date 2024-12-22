const pool = require('../config/dbconfig')
var data = require('../data')
const fs = require('fs');

var richFunctions = require('../richardFunctions')

const axios = require('axios');
const { query } = require('express');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

exports.deleteBranch = async(req, res) =>{
  

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
 
  var id = req.body.id
  
  var vid = await richFunctions.validateIntNum(id, "Branch id");
    if (vid != true) {
      return res.status(200).json({ success: false, code: 409, message: vid })
    }

  var query = "SELECT * FROM users WHERE branch_id = ?;"
      query += "SELECT * FROM packages WHERE branch_from = ? OR branch_to = ?;"
      query += "SELECT thumbnail, company_id FROM branches WHERE company_id = ? AND id = ?;"

  pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
     
      connection.query(query,[id, id, id, company_id, id], (err, rows) => {
         connection.release();
        if (!err) {

          console.log(rows)
          var users = rows[0];
          var packages = rows[1];
          var branch = rows[2]

          if(branch.length == 0){
            return res.status(200).json({ success: false, code: 409, message: "Can't delete branch, not belong to your company" })
            
          }else{

            var branch_image = branch[0].thumbnail

          if(users.length != 0 || packages.length != 0){
            return res.status(200).json({ success: false, code: 409, message: "Can't delete branch which holds staffs or parcels. you may set branch to inactive" })
           
          }else{

            connection.query('DELETE FROM branches WHERE id = '+id, (err, rows) => {
              //connection.release();
              if (!err) {

                if(branch_image != 'branch.jpg'){

                  fs.unlink('./public/images/' + branch_image, function (err) {
                    if (err && err.code == 'ENOENT') {
                      // file doens't exist
                      //console.info("File doesn't exist, won't remove it.");
                      return res.status(200).json({ success: true, code: 200, message: "branch deleted Successfuly" })
                    } else if (err) {
                      // other errors, e.g. maybe we don't have enough permission
                      //console.error("Error occurred while trying to remove file");
                      return res.status(200).json({ success: true, code: 200, message: "branch deleted Successfuly" })
                    } else {
                      //console.info(`removed`);
                      return res.status(200).json({ success: true, code: 200, message: "branch deleted Successfuly" })
                    }
                  })

                }else{
                  return res.status(200).json({ success: true, code: 200, message: "branch deleted Successfuly" })
                }
                
              } else { 
                console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
              }
  
            });
          }
          }

        } else { 
          console.log(err);
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

      });    
    });

}

exports.updateBranch = async(req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { name,status, id, region, district, location, description } = req.body;

  //console.log(req.body)
  description = description || "New branch at " + location

  var vname = await richFunctions.validateNames(name, "Branch name");
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vdistrict = await richFunctions.validateNames(district, "District");
    if (vdistrict != true) {
      return res.status(200).json({ success: false, code: 409, message: vdistrict })
    }

    var vlocation = await richFunctions.validateNames(location, "Location");
    if (vlocation != true) {
      return res.status(200).json({ success: false, code: 409, message: vlocation })
    }

    var vdescription = await richFunctions.validateDescription(description, "Description");
    if (vdescription != true) {
      return res.status(200).json({ success: false, code: 409, message: vdescription })
    }

    var vregion = await richFunctions.validateIntNum(region, "Region");
    if (vregion != true) {
      return res.status(200).json({ success: false, code: 409, message: vregion })
    }
    
    var vid = await richFunctions.validateIntNum(id, "Branch id");
    if (vid != true) {
      return res.status(200).json({ success: false, code: 409, message: vid })
    }

    /*var vstatus = await richFunctions.validateStatus(status, "Branch status");
    if (vstatus != true) {
      return res.status(200).json({ success: false, code: 409, message: vstatus })
    }*/


  var update_qry = "UPDATE branches SET name = ?, region = ?,district = ?,location = ? , description = ?, updated_by = ?,status = ? WHERE id = ? AND company_id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');
      connection.query(update_qry, [name, region, district, location, description, user_id, status, id, company_id], (err, rows) => {
        // Once done, release connection
        connection.release();

        if (!err) {
          return res.status(200).json({ success: true, code: 200, message: "branch updated Successfuly" })
        } else {
          console.log(err);
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

      });

  });

}

exports.createBranch = async(req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { name, region, district, location, description } = req.body;

  description = description || "New branch at " + location
  var _id = getRandomInt(1000, 10000);
  _id = parseInt(company_id+""+_id)

  var vname = await richFunctions.validateNames(name, "Destination name");
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vdistrict = await richFunctions.validateNames(district, "District");
    if (vdistrict != true) {
      return res.status(200).json({ success: false, code: 409, message: vdistrict })
    }

    var vlocation = await richFunctions.validateNames(location, "Location");
    if (vlocation != true) {
      return res.status(200).json({ success: false, code: 409, message: vlocation })
    }

    var vdescription = await richFunctions.validateDescription(description, "Description");
    if (vdescription != true) {
      return res.status(200).json({ success: false, code: 409, message: vdescription })
    }

    var vregion = await richFunctions.validateIntNum(region, "Region");
    if (vregion != true) {
      return res.status(200).json({ success: false, code: 409, message: vregion })
    }


  var insert_qry = "INSERT INTO branches SET name = ?, region = ?,district = ?,location = ? , description = ?, company_id = ?, id = ?, created_by = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');

    connection.query(insert_qry, [name, region, district, location, description, company_id, _id, user_id], (err, rows) => {
      // Once done, release connection
      connection.release();

      if (!err) {
        return res.status(200).json({ success: true, code: 200, message: "branch created Successfuly" })
      } else {

        console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }

    });

  });

}

exports.allBranches = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT br.id, rg.name AS region, rg.id AS region_id, rg.district AS region_district, us.fulname AS created_by, br.created_at, br.name, br.thumbnail, br.description, br.district, br.location, br.status " +
      "FROM branches AS br " +
      "INNER JOIN region AS rg ON br.region = rg.id " +
      "INNER JOIN users AS us ON br.created_by = us.id " +
      "WHERE br.company_id = ? ORDER BY br.id DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, [company_id], (err, branches) => {
        //connection.release();
        if (!err) {
          console.log(err)
          return res.status(200).json({ success: true, code: 200, branches, message: "Successfuly fetch all branches" })
        } else {
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    console.log(err)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.usersAndStatistics = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;
////todays
var today = new Date();
var yy = today.getFullYear()
var dd = today.getDate()
var mm = today.getMonth() + 1

if (mm < 10) {
    mm = '0' + mm
}

if (dd < 10) {
    dd = '0' + dd
}

var date_start = yy + '-' + mm + '-' + dd + ' 00:00:00'
var date_end = yy + '-' + mm + '-' + dd + ' 23:59:59'
    ////last 30 days
    var last_30 = new Date();
    last_30.setDate(last_30.getDate() - 30);

    var yy30 = last_30.getFullYear()
    var dd30 = last_30.getDate()
    var mm30 = last_30.getMonth() + 1

    if (mm30 < 10) {
        mm30 = '0' + mm30
    }

    if (dd30 < 10) {
        dd30 = '0' + dd30
    }

    var date_start30 = yy30 + '-' + mm30 + '-' + dd30 + ' 00:00:00'

    var queries = "SELECT COUNT(*) AS received FROM packages WHERE company_id = "+company_id+" AND status = "+2+" AND branch_to = "+branch_id+";"
        queries += "SELECT COUNT(*) AS sent FROM packages WHERE company_id = "+company_id+" AND status = "+2+" AND branch_from = "+branch_id+";"
        queries += "SELECT SUM(price) AS rev30 FROM packages WHERE company_id = "+company_id+" AND status <= "+2+" AND created_at >= '"+date_start30+"' AND created_at <= '"+date_end+"';"
        queries += "SELECT SUM(price) AS life_time FROM packages WHERE company_id = "+company_id+" AND status <= "+2+";"
        queries += "SELECT cu.fulname AS created_by, us.fulname, us.username,us.created_at, us.id, us.role, us.branch_id, us.avator, us.status FROM users AS us INNER JOIN users AS cu ON us.created_by = cu.id WHERE us.company_id = "+company_id+" AND us.branch_id = "+branch_id+";"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(queries, [company_id], (err, data) => {
        //connection.release();
        if (!err) {
          var staffs = data[4]
          var statistics = {
            rev_30 : data[2][0]['rev30'] || 0,
            rev_time : data[3][0]['life_time'] || 0,
            received : data[0][0].received || 0,
            sent : data[1][0].sent || 0
          }
          return res.status(200).json({ success: true, code: 200, staffs, statistics, message: "Successfuly fetch all data" })
        } else {
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    console.log(error)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.otherBranches = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT br.id, rg.name AS region, rg.id AS region_id, rg.district AS region_district, us.fulname AS created_by, br.created_at, br.name, br.thumbnail, br.description, br.district, br.location, br.status " +
      "FROM branches AS br " +
      "INNER JOIN region AS rg ON br.region = rg.id " +
      "INNER JOIN users AS us ON br.created_by = us.id " +
      "WHERE br.company_id = ? AND br.id != ? ORDER BY br.id DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, [company_id, branch_id], (err, branches) => {
        //connection.release();
        if (!err) {
          
          return res.status(200).json({ success: true, code: 200, branches, message: "Successfuly fetch other branches" })
        } else {
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    console.log(error)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.allRegion = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT * FROM region ORDER BY id ASC"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, (err, regions) => {
        //connection.release();
        if (!err) {
          console.log(err)
          return res.status(200).json({ success: true, code: 200, regions, message: "Successfuly fetch all region" })
        } else {
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    console.log(err)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}
/*
exports.getEditBranch = (req, res)=>{

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var user_id = req.session.user.user.id;
  var role = req.session.user.user.role;
  var bname = req.session.user.user.bname;
  var bid = req.session.user.user.bid;

  var branch_id = req.body.branch_id

  if(role == 3 || (role == 2 && bid == branch_id)){

  pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      console.log('Connected!');

      connection.query('SELECT * FROM branches WHERE id = '+branch_id, (err, rows) => {
        //connection.release();
        if (!err) {
          console.log(rows[0])
          return res.json({data:rows[0],status:'good'});
          
        } else { 
          console.log(err);
          return res.json({data:{},status:'bad',msg:"Database or server error"});
        }

      });
    });
  }else{
    return res.json({data:{},status:'bad',msg:"You don't have permission"});
  }
  
}

exports.getViewBranch = (req, res)=>{

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var user_id = req.session.user.user.id;
  var role = req.session.user.user.role;
  var bname = req.session.user.user.bname;
  var bid = req.session.user.user.bid;

  var branch_id = req.body.branch_id

  if(role == 3){

  var query = 'SELECT * FROM branches WHERE id = '+branch_id+';'
      query += 'SELECT fulname, phone1, id, username, status, role FROM users WHERE branch_id = '+branch_id+';'
      query += "SELECT COUNT(*) AS received FROM packages WHERE branch_to = "+branch_id+' AND status = '+2+';'
      query += "SELECT COUNT(*) AS sent FROM packages WHERE branch_from = "+branch_id+' AND status = '+2+';'
      query += "SELECT COUNT(*) AS trashed FROM packages WHERE branch_from = "+branch_id+' AND status = '+3+';'
      query += "SELECT SUM(price) AS revenue FROM packages WHERE branch_from = "+branch_id+' AND status <= '+2+';'
      //queries += "SELECT SUM(price) AS revDay FROM packages WHERE status <= "+2+" AND created_at >= '"+date_start+"' AND created_at <= '"+date_end+"';"
        //queries += "SELECT SUM(price) AS rev7 FROM packages WHERE status <= "+2+" AND created_at >= '"+date_start7+"' AND created_at <= '"+date_end+"';"

  pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      console.log('Connected!');

      connection.query(query, (err, rows) => {
        //connection.release();
        if (!err) {
          console.log(rows)
          var data = rows[0][0]
          var staffs = rows[1]
          var received = rows[2][0]['received'] || 0
          var sent = rows[3][0]['sent'] || 0
          var revenue = rows[5][0]['revenue'] || 0
          var trashed = rows[4][0]['trashed'] || 0

          return res.render('partials/branch-content',{layout:false,data,staffs,received,sent,revenue,trashed,userInfo})
          //return res.json({data,staffs,received,sent,revenue,trashed,status:'good'});
          
        } else { 
          console.log(err);
            return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
        }

      });
    });
  }else{
    return res.json({data:{},status:'bad',msg:"You don't have permission"});
  }
  
}
*/

