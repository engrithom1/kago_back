const pool = require('../config/dbconfig')
var data = require('../data')
var richFunctions = require('../richardFunctions')
const bcrypt = require('bcryptjs');


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getNiceTime(today){
  var yy = today.getFullYear()
  var dd = today.getDate()
  var mm = today.getMonth() + 1

  if (mm < 10) {
    mm = '0' + mm
  }

  if (dd < 10) {
    dd = '0' + dd
  }

  return yy + '-' + mm + '-' + dd
}

function smscodeString(sms_codes){
  var codes = []
  if (sms_codes.length > 0) {
    for (let i = 0; i < sms_codes.length; i++) {

      codes.push(sms_codes[i]['sms_code']);
      
    }
  }

  return codes.toString()
}

exports.activateSubscription = (req, res) => {

  var {company_id, month, amount, method, bundle, description, sms_code} =  req.body;

  var user = req.user.user_data
  var user_id = user.id;
  //var branch_id = user.branch_id;
  var _com_id = user.company_id;

  var description = description || "no comment"

  //console.log(_com_id)

  //console.log(req.body);

  if(_com_id == 1){

    if (amount > 5000000 || amount < 20000) {
      return res.status(200).json({ success: false, code: 409, message: 'Unexpected Amount' })
    }

    if (method > 3 || method < 1) {
      return res.status(200).json({ success: false, code: 409, message: 'Unknown Methode' })
    }

    if (bundle > 5 || bundle < 2) {
      return res.status(200).json({ success: false, code: 409, message: 'Unknown Bundle' })
    }


    if (month > 10 || month < 1) {
      return res.status(200).json({ success: false, code: 409, message: 'Incorrect Month' })
    }

    /////new data after subscription
    var new_sms = 0;
    var new_parcels = 0;
    var new_branches = 10000
    var new_users = 10000

    var time = new Date()
    var future = new Date();
    var _30_days = 2592000  // 30days sec 
    var sub_at_sec = Math.round(time.getTime() / 1000)
    var sub_at_date = getNiceTime(time)

    var sub_end_date = ""
    var sub_end_sec = 0

    var days = 0 ///subscription in days
 
    //change future as wel from 30 to 7

  var query = "SELECT * FROM company WHERE id = "+company_id+";"
      query += "SELECT * FROM bundles WHERE id = "+bundle+";"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, rows) => {
      //connection.release();
      if (!err) {
        //console.log(rows)
        var company = rows[0][0]
        var _bundle = rows[1][0]

        var c_sms = company.sms
        var c_parcels = company.parcels

        var bprice = _bundle.price
        var btext_sms = _bundle.text_sms
        var bbranches = _bundle.branches
        var busers = _bundle.users
        var bparcels = _bundle.parcels

        if(bundle == 2){

              days = (12 * 30) + 5

              future.setDate(future.getDate() + days).toString().slice(0, 10);
 
              sub_end_date = getNiceTime(future)
              sub_end_sec = sub_at_sec + (_30_days * 12)

            var insert_qry = "UPDATE company SET sms_code = "+sms_code+", bundle = "+bundle+", parcels = "+bparcels+", sms = "+btext_sms+", branches = "+bbranches+", users = "+busers+", sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+" WHERE id = "+company_id+";"
            insert_qry += "INSERT INTO sub_history SET amount = "+amount+", method = "+method+", company_id = '"+company_id+"', description = '"+description+"', approved_by = "+user_id+", bundle = "+bundle+", parcels = "+bparcels+", sms = "+btext_sms+", branches = "+bbranches+", users = "+busers+", sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+";"

        }else{
        ///if bundle is supper
          if(month == 10){

             if(amount == month * bprice){

              new_parcels = c_parcels + (bparcels * 12)
              new_sms = c_sms + (btext_sms * 12)

              days = (12 * 30) + 5

              future.setDate(future.getDate() + days).toString().slice(0, 10);
 
              sub_end_date = getNiceTime(future)
              sub_end_sec = sub_at_sec + (_30_days * 12)
              
             }else{
                return res.status(200).json({ success: false, code: 409, message: 'Amount and Period do not match a Bundle' })
             }

          }else{

            if(amount == month * bprice){

              new_parcels = c_parcels + (bparcels * month)
              new_sms = c_sms + (btext_sms * month)

              days = (month * 30) + 3
              future.setDate(future.getDate() + days).toString().slice(0, 10);
 
              sub_end_date = getNiceTime(future)
              sub_end_sec = sub_at_sec + (_30_days * month)

            }else{
              return res.status(200).json({ success: false, code: 409, message: 'Amount and Period do not match a Bundle' })
            }

          }
        //console.log({btext_sms, new_sms, c_sms})
        //console.log({sub_at_date, sub_end_date, sub_at_sec, sub_end_sec, new_parcels, new_sms})
        var insert_qry = "UPDATE company SET bundle = "+bundle+", parcels = "+new_parcels+", sms = "+new_sms+", branches = "+bbranches+", users = "+busers+", sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+" WHERE id = "+company_id+";"
            insert_qry += "INSERT INTO sub_history SET amount = "+amount+", method = "+method+", company_id = '"+company_id+"', description = '"+description+"', approved_by = "+user_id+", bundle = "+bundle+", parcels = "+bparcels+", sms = "+btext_sms+", branches = "+bbranches+", users = "+busers+", sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+";"
        }
        connection.query(insert_qry, (err, rows) => {
          connection.release();
          if (!err) {
        return res.status(200).json({ success: true, code: 200, message: "Subscription Updated Successfully" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })

      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })
}else{
  return res.status(200).json({ success: false, code: 409, message: "No permission for the action" })
}


}

//now is new companies and status
exports.topCompanies = (req, res) => {

    var user = req.user.user_data
  
    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;
  
   /* var query = "SELECT rg.name AS region, bd.id, co.id, co.name, co.sponcer_name, co.sponser_phone, co.location, co.sub_at_date, co.sub_end_date, " +
      "pcks FROM company AS co LEFT JOIN " +
      "(SELECT company_id, COUNT(company_id) AS pcks FROM packages GROUP BY company_id) AS pk ON pk.company_id = co.id " +
      "INNER JOIN region AS rg ON co.region = rg.id " +
      "INNER JOIN bundles AS bd ON co.bundle = bd.id " +
      "WHERE co.id != "+1+" ORDER BY pk.pcks DESC LIMIT 10;"*/

    var query = "SELECT rg.name AS region, bd.id, co.id, co.name, co.status, co.sponcer_name, co.created_at, co.sponser_phone, co.location, co.sub_at_date, co.sub_end_date " +
      "FROM company AS co " +
      "INNER JOIN region AS rg ON co.region = rg.id " +
      "INNER JOIN bundles AS bd ON co.bundle = bd.id " +
      "WHERE co.id != "+1+" ORDER BY co.created_at DESC LIMIT 15;"
  
  
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
  
      connection.query(query, (err, companies) => {
        connection.release();
        //console.log(companies)
        if (!err) {
          return res.status(200).json({ success: true, code: 200, companies, message: "top companies" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }
      })
    })
  
  
  }

  exports.activeCompanies = (req, res) => {

    var user = req.user.user_data
  
    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var time = new Date()
    var now_sec = Math.round(time.getTime() / 1000)

    //console.log(now_sec)
  
    var query = "SELECT rg.name AS region, bd.id AS bundle_id, co.id, co.status, co.name, co.sponcer_name, co.sponser_phone, co.location, co.sub_at_date, co.sub_end_date " +
      ",co.position, co.contacts, co.description, co.sms_code, co.sms, co.branches, co.parcels, co.users, co.status, bd.name AS bundle_name FROM company AS co " +
      "INNER JOIN region AS rg ON co.region = rg.id " +
      "INNER JOIN bundles AS bd ON co.bundle = bd.id " +
      "WHERE co.id != "+1+" AND co.sub_end_sec > "+now_sec+" ORDER BY co.sub_end_sec DESC;"
  
  
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
  
      connection.query(query, (err, companies) => {
        connection.release();
        if (!err) {
          //console.log(companies)
          return res.status(200).json({ success: true, code: 200, companies, message: "top companies" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }
      })
    })
  
  
  }  

  exports.expiredCompanies = (req, res) => {

    var user = req.user.user_data
  
    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var time = new Date()
    var now_sec = Math.round(time.getTime() / 1000)

    //console.log(now_sec)
  
    var query = "SELECT rg.name AS region, bd.id AS bundle_id, co.id, co.status, co.name, co.sponcer_name, co.sponser_phone, co.location, co.sub_at_date, co.sub_end_date " +
      ",co.position, co.contacts, co.description, co.sms_code, co.sms, co.branches, co.parcels, co.users, co.status, bd.name AS bundle_name FROM company AS co " +
      "INNER JOIN region AS rg ON co.region = rg.id " +
      "INNER JOIN bundles AS bd ON co.bundle = bd.id " +
      "WHERE co.id != "+1+" AND co.sub_end_sec < "+now_sec+" ORDER BY co.sub_end_sec DESC;"
  
  
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
  
      connection.query(query, (err, companies) => {
        connection.release();
        if (!err) {
          //console.log(companies)
          return res.status(200).json({ success: true, code: 200, companies, message: "top companies" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }
      })
    })
  
  
  } 

exports.companyData = (req, res) =>{

  var user = req.user.user_data
  var user_id = user.id;

  var company_id = req.body.company_id;

  //console.log(req.body)

  var queries = "SELECT COUNT(*) AS parcels FROM packages WHERE company_id = "+company_id+";"
      queries += "SELECT COUNT(*) AS staffs FROM users WHERE company_id = "+company_id+";"
      queries += "SELECT COUNT(*) AS branches FROM branches WHERE company_id = "+company_id+";"
      queries += "SELECT SUM(messages) AS messages FROM messages WHERE company_id = "+company_id+";"
      queries += "SELECT br.id,br.contacts, rg.name AS region, rg.id AS region_id, rg.district AS region_district, us.fulname AS created_by, br.created_at, br.name, br.thumbnail, br.description, br.district, br.location, br.status " +
      "FROM branches AS br " +
      "INNER JOIN region AS rg ON br.region = rg.id " +
      "INNER JOIN users AS us ON br.created_by = us.id " +
      "WHERE br.company_id = ? ORDER BY br.id DESC;"
      queries += "SELECT cu.fulname AS created_name, us.created_by, us.created_at, br.name AS bname, br.thumbnail AS bthumbnail, us.fulname, us.username,us.id, us.role, us.branch_id, us.avator, us.status, us.phone1, us.phone2, us.bio FROM users AS us INNER JOIN branches AS br ON us.branch_id = br.id INNER JOIN users AS cu ON us.created_by = cu.id WHERE us.company_id = ?;"
      queries += "SELECT sb.amount, sb.description, sb.sub_at_date, sb.sub_end_date, sb.parcels, sb.sms, sb.users, sb.branches, cu.fulname AS approved_by, bd.name AS bundle FROM sub_history AS sb INNER JOIN bundles AS bd ON sb.bundle = bd.id INNER JOIN users AS cu ON sb.approved_by = cu.id WHERE sb.company_id = ? ORDER BY sb.id DESC;"

      pool.getConnection((err, connection) => {
        if (err) throw err; // not connected 0,date_start30,date_end
  
        connection.query(queries, [company_id, company_id, company_id], (err, reults) => {
          connection.release();
          if (!err) {
  
            //console.log(reults)
  
                var parcels = reults[0][0].parcels || 0
                var staffs_ = reults[1][0].staffs || 0
                var branches_ = reults[2][0].branches || 0
                var messages = reults[3][0]['messages'] || 0
                var branches = reults[4]
                var staffs = reults[5]
                var subs = reults[6]
               
  
                var dataz = {
                  parcels, staffs_, branches_, messages
                }
  
                return res.status(200).json({ success: true, branches, staffs, subs ,code: 200, dataz, message: "data fetched successfully" })
                
            } else {
                //console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
            }
        });
    });

} 

exports.dashbordData = (req, res) =>{

  var user = req.user.user_data
  var user_id = user.id;
  var sms_code = user.sms_code;

var date_start30 = richFunctions.dateTimeDays(30)
var date_start = richFunctions.toDayDateTimes(0)
var date_end = richFunctions.toDayDateTimes(1)

var sms_1 = 0
var sms_30 = 0
  //console.log(req.body)

  var queries = "SELECT COUNT(*) AS parcels_1 FROM packages WHERE created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"
      queries += "SELECT COUNT(*) AS parcels_30 FROM packages WHERE created_at >= '" + date_start30 + "' AND created_at <= '" + date_end + "';"
      queries += "SELECT COUNT(*) AS staffs FROM users WHERE role = "+1+";"
      queries += "SELECT COUNT(*) AS admin FROM users WHERE role = "+2+";"
      queries += "SELECT COUNT(*) AS branches FROM branches;"
      queries += "SELECT COUNT(*) AS companies FROM company;"
      queries += "SELECT sms_code FROM company WHERE sms_code > 1;"
      

      pool.getConnection((err, connection) => {
        if (err) throw err; // not connected 0,date_start30,date_end
  
        connection.query(queries, async (err, reults) => {
          connection.release();
          if (!err) {
  
            //console.log(reults)
                var parcels_1 = reults[0][0].parcels_1 || 0
                var parcels_30 = reults[1][0].parcels_30 || 0
                var staffs = reults[2][0].staffs || 0
                var admin = reults[3][0].admin || 0
                var branches = reults[4][0].branches || 0
                var companies = reults[5][0].companies || 0
                var sms_codes = reults[6]

                if(sms_codes.length > 0){
                    sms_codes = smscodeString(sms_codes) 

                      var ress = await richFunctions.akiliSMSAdminData(sms_codes, sms_code)
                      //console.log(ress)
                      if (ress.data.success) {
                        sms_1 = ress.data.dataz.sms_1
                        sms_30 = ress.data.dataz.sms_30
                      }
                }
               
                var dataz = {
                  parcels_1, parcels_30, staffs, admin, branches, companies, sms_1, sms_30
                }
  
                return res.status(200).json({ success: true, code: 200, dataz, message: "data fetched successfully" })
                
            } else {
                //console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
            }
        });
    });

} 


exports.companyStatus = (req, res) =>{

  var user = req.user.user_data
  var user_id = user.id;

  var company_id = req.body.company_id;
  var status = req.body.status;

  //console.log(req.body)

  var queries = "UPDATE company SET status = ? WHERE id = "+company_id+";"
      

      pool.getConnection((err, connection) => {
        if (err) throw err; // not connected 0,date_start30,date_end
  
        connection.query(queries, [status, company_id], (err, reults) => {
          connection.release();
          if (!err) {

                return res.status(200).json({ success: true, code: 200, message: "Status Updated successfully" })
            } else {
                //console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
            }
        });
    });
}

exports.companySMSCode = (req, res) =>{

  var user = req.user.user_data
  var user_id = user.id;

  var company_id = req.body.company_id;
  var smscode = req.body.smscode;

  //console.log(req.body)

  var queries = "UPDATE company SET sms_code = ? WHERE id = "+company_id+";"
      

      pool.getConnection((err, connection) => {
        if (err) throw err; // not connected 0,date_start30,date_end
  
        connection.query(queries, [smscode], (err, reults) => {
          connection.release();
          if (!err) {

                return res.status(200).json({ success: true, code: 200, message: "SMSCode Updated successfully" })
            } else {
                //console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
            }
        });
    });
}

