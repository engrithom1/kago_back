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

exports.createAccount = async(req, res) =>{
  
  try{
   var {fulname, phone1, phone2, position, company_name, company_label, contacts, location, description, region, district} = req.body
  //4 digits
   var company_id = getRandomInt(1000, 10000);
   var _user = getRandomInt(1000, 10000);
   var _branch = getRandomInt(1000, 10000);

   var time = new Date()
   var ten_days = 864000 * 3  // 10days sec
   var sub_at_sec = Math.round(time.getTime() / 1000)

                //change future as wel from 30 to 7
                var future = new Date();
                future.setDate(future.getDate() + 30).toString().slice(0, 10);

   var sub_at_date = getNiceTime(time)
   var sub_end_date = getNiceTime(future)
   var sub_end_sec = sub_at_sec + ten_days

//console.log(sub_at_date+", "+sub_end_date)

   var user_id = parseInt("" + company_id + _user)
   var branch_id = parseInt("" + company_id + _branch)

   phone2 = phone2 || '0xxxxxxxxx'
   company_label = company_label || company_name

   var branch_desc = company_name+" main branch"
   var logo = "logo.jpg"
   var sub_description = "trial parckage"

   const hash = await bcrypt.hash(phone1, 10)    

    ////validate username
    var vusername = await richFunctions.validateUsername(fulname);
    if (vusername != true) {
      return res.json({status: 'bad', msg: vusername });
    }

    /////////varidate phone number
    var vphone = await richFunctions.validatePhone(phone1,'Sponcer');
    if (vphone != true) {
      return res.json({status: 'bad', msg: vphone });
    }

    var comp_name = await richFunctions.validateNames(company_name,"Company Name");
    if (comp_name != true) {
      return res.json({status: 'bad', msg: comp_name });
    }

    var conts = await richFunctions.validateNames(contacts,"Contacts");
    if (conts != true) {
      return res.json({status: 'bad', msg: conts });
    }

    var locs = await richFunctions.validateNames(location,"Location");
    if (locs != true) {
      return res.json({status: 'bad', msg: locs });
    }

    var comp_desc = await richFunctions.validateDescription(description,"Company Description");
    if (comp_desc != true) {
      return res.json({status: 'bad', msg: comp_desc });
    }

    var check_qry = "SELECT * FROM company WHERE id = ?;"
        check_qry += "SELECT * FROM users WHERE username = ?;"
        check_qry += "SELECT * FROM bundles WHERE id = ?;"

    var insert_qry = "INSERT INTO company SET id = "+company_id+", name = '"+company_name+"', label = '"+company_label+"', logo = '"+logo+"', sponcer_name = '"+fulname+"', sponser_phone = '"+phone1+"', position = '"+position+"', location = '"+location+"', region = "+region+", description = '"+description+"', contacts = '"+contacts+"', approved_by = "+1+", bundle = "+1+", parcels = ?, sms = ?, branches = ?, users = ?, sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+";"
        insert_qry += "INSERT INTO branches SET contacts = '"+contacts+"', name = '"+location+"', region = "+region+",district = '"+district+"',location = '"+location+"' , description = '"+branch_desc+"', company_id = "+company_id+", id = "+branch_id+", created_by = "+user_id+";"
        insert_qry += "INSERT INTO users SET id = "+user_id+", username = '"+phone1+"' , fulname = '"+fulname+"', password = '"+hash+"' , phone1 = '"+phone1+"', status = "+1+", role = "+2+", branch_id = "+branch_id+", company_id = "+company_id+", created_by = "+1+", updated_by = "+1+";"
        insert_qry += "INSERT INTO sub_history SET company_id = '"+company_id+"', description = '"+sub_description+"', approved_by = "+1+", bundle = "+1+", parcels = ?, sms = ?, branches = ?, users = ?, sub_at_date = '"+sub_at_date+"', sub_at_sec = "+sub_at_sec+", sub_end_date = '"+sub_end_date+"', sub_end_sec = "+sub_end_sec+";"
        
        var uphone = '255' + phone1.substring(1)
        var user_phone = [uphone];
        var owner_phone = ['255614928525','255686255811']

        var user_message = "Account imewezeshwa, sasa waweza ku login katika App na System kwakutumia "+phone1+" kama username na password kisha nenda profile kubadilisha password."
        var owner_message = "New Account created. company name "+company_name+", sponser name "+fulname+", namba ya simu "+phone1

    pool.getConnection((err, connection) => {
      if (err) throw err;
      ///check if user exist/
      connection.query(check_qry, [company_id, phone1, 1], (err, rows) => {
          if (!err) {
            console.log(rows)
              if (rows[0].length == 0 && rows[1].length == 0) {

                  var parcels = rows[2][0].parcels
                  var text_sms = rows[2][0].text_sms
                  var branches = rows[2][0].branches
                  var users = rows[2][0].users

                  var _users = users - 1
                  var _branches = branches - 1

                  connection.query(insert_qry,[parcels, text_sms, _branches, _users, parcels, text_sms, branches, users],async (err, rows) => {
                      connection.release();
                    if (!err) {

                        var user = await richFunctions.sendMultSMS(user_phone, user_message) || true
                        var owner = await richFunctions.sendMultSMS(owner_phone, owner_message) || true

                        if(user && owner){
                          return res.json({status: 'good', msg: "Account Created Successfull" });
                        }else{
                          return res.json({status: 'good', msg: "Account Created Successfull" });
                        }
                      } else {
                          console.log(err)
                          return res.json({status: 'bad', msg: "Server or Database Error" });

                      }
                  })

              } else {
                connection.release();
                 if(rows[0].length != 0){
                  return res.json({status: 'bad', msg: "Something wrong, try again" });
                 }

                 if(rows[1].length != 0){
                  return res.json({status: 'bad', msg: "Phone number aleady taken" });
                 }

              }
          } else {
              console.log(err)
              return res.json({status: 'bad', msg: "Server or Database error" });
             

          }
      })

  })
  
    //return res.json({status: 'bad', msg: "Ternminator" });

} catch (error) {
  console.log(error)
  return res.json({status: 'bad', msg: "Server or Database error" });
}
}


exports.staffMembers = (req, res) => {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var query = "SELECT cu.fulname AS created_name, us.created_by, us.created_at, br.name AS bname, br.thumbnail AS bthumbnail, us.fulname, us.username,us.id, us.role, us.branch_id, us.avator, us.status, us.phone1, us.phone2, us.bio FROM users AS us INNER JOIN branches AS br ON us.branch_id = br.id INNER JOIN users AS cu ON us.created_by = cu.id WHERE us.company_id = ?;"

    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected

        connection.query(query, [company_id], (err, staffs) => {
            connection.release();
            if (!err) {
                return res.status(200).json({
                    success: true,
                    code: 200,
                    message: 'Staffs fetched successfully',
                    staffs
                })
            } else {
                console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
            }

        });
    });

}

exports.createStaff = async (req, res) => {

    var { fulname, branch_id, phone } = req.body;

    var user = req.user.user_data

    var user_id = user.id;
    var br_id = user.branch_id;
    var company_id = user.company_id;

    var bundles = req.bundles
    var _users = bundles.users

    try {
        ////validate username
        var vusername = await richFunctions.validateUsername(fulname);
        if (vusername != true) {
            return res.status(200).json({ success: false, code: 409, message: vusername })
        }

        /////////varidate phone number
        var vphone = await richFunctions.validatePhone(phone);
        if (vphone != true) {
            return res.status(200).json({ success: false, code: 409, message: vphone })

        }

        const hash = await bcrypt.hash(phone, 10)

        var qry = 'SELECT * FROM users WHERE username = ?;'

        var insert_qry = 'INSERT INTO users SET username = ? , fulname = ?, password = ? , phone1 = ?, status = ?, role = ?, branch_id = ?, company_id = ?, created_by = ?, updated_by = ?;'
            insert_qry += "UPDATE company SET users = "+(_users - 1)+" WHERE id = "+company_id+";"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qry, [phone], (err, rows) => {
                if (!err) {
                    if (rows.length == 0) {
                        //inser query

                        connection.query(insert_qry, [phone, fulname, hash, phone, 1, 1, branch_id, company_id, user_id, user_id], (err, rows) => {
                            connection.release();
                          if (!err) {


                                return res.status(200).json({
                                    success: true,
                                    code: 200,
                                    message: 'User registered successfully',
                                })


                            } else {
                                console.log(err)
                                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })

                            }
                        })

                    } else {
                        return res.status(200).json({ success: false, code: 409, message: "Phone number aleady exist" })

                    }
                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })

                }
            })

        })


    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 500, message: error.message })
    }


}

exports.deleteStaff = (req, res) => {

    var user = req.body.user;


    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var creater = user_d.creater;
    var company_id = user_d.company_id;

    if (user == user_id) {
      return res.status(200).json({ success: false, code: 409, message: "Can't delete yourself" })
    }

    if (creater != 1 ) {
      return res.status(200).json({ success: false, code: 409, message: "Only Super Admin can delete Users" })
    }

        var query = "SELECT * FROM barcodes  WHERE created_by = ?;"
        query += "SELECT * FROM branches  WHERE created_by = ? OR updated_by = ?;"
        query += "SELECT * FROM customers  WHERE created_by = ?;"
        query += "SELECT * FROM packages  WHERE created_by = ?;"
        query += "SELECT * FROM users  WHERE created_by = ?;"


        pool.getConnection((err, connection) => {
            if (err) throw err; // not connected
            //console.log('Connected!');

            connection.query(query, [user, user, user, user, user, user], (err, rows) => {

                if (!err) {
                    //console.log(rows)
                    ///check contribution
                    if (rows[0].length == 0 && rows[1].length == 0 && rows[2].length == 0 && rows[3].length == 0 && rows[4].length == 0) {

                        connection.query('DELETE FROM users  WHERE id = ?;', [user], (err, rows) => {
                            connection.release();
                          if (!err) {
                                //console.log(err);
                                return res.status(200).json({ success: true, code: 200, message: "Staff delete successfuly" })
                            } else {
                                console.log(err);
                                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                            }

                        });

                    } else {
                      connection.release();
                        return res.status(200).json({ success: false, code: 500, message: "Can't delete this user, hold events" })
                    }

                } else {
                    console.log(err);
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }

            });
        });

   

    //return res.status(400).send('No files were uploaded.');
}

exports.updateStaff = async (req, res) => {

    var { branch_id, role, fulname, status, id, created_by } = req.body;

    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var creater = user_d.creater;
    var company_id = user_d.company_id;

    ////validate username
    var vusername = await richFunctions.validateUsername(fulname);
    if (vusername != true) {
        return res.status(200).json({ success: false, code: 409, message: vusername })
    }

    if(user_id == created_by || creater == 1){
        
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
        //console.log('Connected!');

        connection.query('UPDATE users SET fulname = ?, status = ?, role = ?, updated_by = ?, branch_id = ? WHERE id = ? AND company_id = ?;', [fulname, status, role, user_id, branch_id, id, company_id], (err, rows) => {
            // Once done, release connection
            connection.release();

            if (!err) {
                return res.status(200).json({ success: true, code: 200, message: "Staff updated successfuly" })
            } else {
                console.log(err);
                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
               
            }

        });
    });
  }else{
    return res.status(200).json({ success: false, code: 409, message: "You can only update the staff you have created" })
    }

}

///////////////////customers////////////////////////////////

exports.topCustomers = (req, res) => {

    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;
   
    var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at, cu.company_id, "+
                "us.fulname AS created_by, sents, paids FROM customers AS cu "+
                "INNER JOIN users AS us ON cu.created_by = us.id LEFT JOIN "+
                "(SELECT sender_phone, COUNT(sender_phone) AS sents FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS ap " +
                "ON ap.sender_phone = cu.phone_no LEFT JOIN "+
                "(SELECT sender_phone, SUM(price) AS paids FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS am " +
                "ON am.sender_phone = cu.phone_no "+
                "WHERE cu.company_id = "+company_id+" AND sents > 0 ORDER BY sents DESC LIMIT 30;"
    
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query, (err, customers) => {
        connection.release();
        if (!err) {
          //console.log(customers)
          return res.status(200).json({ success: true, code: 200, customers, message: "Customer fetched successfuly" })
        }else{
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
        }
      })
    })    
   
  
  }
  
  exports.customerEvents = (req, res) => {
  
    var phone = req.body.phone
    
    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;
   
     query = "SELECT us.fulname, pc.status, us.phone1, pc.sender_name, pc.sender_phone, pc.transporter_name, pc.transporter_phone, pc.receiver_name, pc.receiver_phone, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.company_id = ? AND (pc.sender_phone = "+phone+" OR pc.receiver_phone = "+phone+") ORDER BY pc.created_at DESC;"
    
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query,[company_id], (err, events) => {
        connection.release();
        if (!err) {
            return res.status(200).json({ success: true, code: 200, events, message: "Events featched successfuly" })
          
        }else{
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
        }
      })
    })    
   
  }

  exports.searchCustomers = (req, res) =>{
    var phone_name = req.body.phone_name
    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;
   
    /*var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at ,us.fulname AS created_by FROM customers AS cu INNER JOIN users AS us ON cu.created_by = us.id WHERE cu.company_id = ? AND (cu.fulname LIKE ?  OR cu.phone_no LIKE ?) ORDER BY cu.invorved DESC;"*/
    
     var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at, cu.company_id, "+
                "us.fulname AS created_by, sents, paids FROM customers AS cu "+
                "INNER JOIN users AS us ON cu.created_by = us.id LEFT JOIN "+
                "(SELECT sender_phone, COUNT(sender_phone) AS sents FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS ap " +
                "ON ap.sender_phone = cu.phone_no LEFT JOIN "+
                "(SELECT sender_phone, SUM(price) AS paids FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS am " +
                "ON am.sender_phone = cu.phone_no "+
                "WHERE cu.company_id = "+company_id+" AND sents > 0 AND (cu.fulname LIKE ?  OR cu.phone_no LIKE ?) ORDER BY sents DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query,['%'+phone_name+'%','%'+phone_name+'%'], (err, customers) => {
        connection.release();
        if (!err) {
          //console.log(customers)
          return res.status(200).json({ success: true, code: 200, customers, message: "Customer fetched successfuly" })
        }else{
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
        }
      })
    })    
   
  }

    exports.filterCustomers = (req, res) =>{

    var {sdate, edate, filter_type} = req.body

    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;

    var date_start = sdate+' 00:00:00' 
    var date_end = edate+' 23:59:59' 

    //console.log(filter_type)
   
    if (filter_type == 1) {
      ///created at
        var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at, cu.company_id, "+
                "us.fulname AS created_by, sents, paids FROM customers AS cu "+
                "INNER JOIN users AS us ON cu.created_by = us.id LEFT JOIN "+
                "(SELECT sender_phone, COUNT(sender_phone) AS sents FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS ap " +
                "ON ap.sender_phone = cu.phone_no LEFT JOIN "+
                "(SELECT sender_phone, SUM(price) AS paids FROM packages WHERE company_id = "+company_id+" GROUP BY sender_phone) AS am " +
                "ON am.sender_phone = cu.phone_no "+
                "WHERE cu.company_id = "+company_id+" AND sents > 0 AND cu.created_at >= '" + date_start + "' AND cu.created_at <= '" + date_end + "' ORDER BY cu.created_at DESC;"
    }else{

      //var query =  "SELECT * FROM packages WHERE company_id = "+company_id+";"

      var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at, cu.company_id, "+
                "us.fulname AS created_by, paids, sents FROM packages AS ps "+
                "INNER JOIN customers AS cu ON ps.sender_phone = cu.phone_no AND ps.company_id = cu.company_id "+
                "INNER JOIN users AS us ON cu.created_by = us.id LEFT JOIN "+
                "(SELECT sender_phone, COUNT(sender_phone) AS sents FROM packages WHERE company_id = "+company_id+" AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "' GROUP BY sender_phone) AS ap " +
                "ON ap.sender_phone = cu.phone_no LEFT JOIN"+
                "(SELECT sender_phone, SUM(price) AS paids FROM packages WHERE company_id = "+company_id+" AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "' GROUP BY sender_phone) AS am " +
                "ON am.sender_phone = cu.phone_no "+
                "WHERE ps.company_id = "+company_id+" AND ps.created_at >= '" + date_start + "' AND ps.created_at <= '" + date_end + "' ORDER BY ps.created_at DESC;"
               //ps.company_id = "+company_id+" AND ps.created_at >= '" + date_start + "' AND ps.created_at <= '" + date_end + "' ORDER BY ps.created_at DESC
    }
    
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query, (err, customerZ) => {
        connection.release();
        if (!err) {
          
          var customers = customerZ.filter((obj, index, self) =>
            index === self.findIndex((o) => o.id == obj.id)
          );

          console.log(customers)
          return res.status(200).json({ success: true, code: 200, customers, message: "Customer fetched successfuly" })
        }else{
          console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
        }
      })
    })    
   
  }
/*

exports.filterStaffMembers = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var branch_id = req.body.branch_id
  var query = ""
  if(branch_id == 0){
     query = "SELECT br.name AS bname, br.thumbnail AS bthumbnail, br.region AS bregion, us.fulname, us.username,us.id, us.role, us.branch_id, us.avator, us.status, us.phone1, us.phone2, us.bio FROM users AS us INNER JOIN branches AS br ON us.branch_id = br.id;"
  }else{
     query = "SELECT br.name AS bname, br.thumbnail AS bthumbnail, br.region AS bregion, us.fulname, us.username, us.role, us.branch_id, us.avator, us.status, us.phone1, us.phone2, us.bio FROM users AS us INNER JOIN branches AS br ON us.branch_id = br.id WHERE us.branch_id = "+branch_id+";"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, staffs) => {
      if (!err) {
        if(staffs.length > 0){
            return res.render('partials/staff_list',{layout:false,staffs,userInfo})
        }else{
            return res.render('partials/info_message',{layout:false,message:'No staff found'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}  

exports.getUserEdit = (req, res) => {
  var id = req.body.id

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected!');

    connection.query('SELECT * FROM users WHERE id = ' + id, (err, rows) => {
      // Once done, release connection
      connection.release();
      if (!err) {
        return res.json(rows);
      } else {
        console.log("get feed errors---------------------------------------");
        console.log(err);
      }

    });
  });

}


exports.updateUser = (req, res) => {
  var { fulname, position, status, company, role, contacts, user } = req.body;

  console.log(req.body)
  var user_id = req.session.user.user.id;
  //never change the slug
  ///var slug = richFunctions.getSlug(title,feed_id,60)

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');

    connection.query('UPDATE users SET fulname = ?, status = ?, company = ?, position = ?, role = ?, created_by = ?, contacts = ? WHERE id = ?;', [fulname, status, company, position, role, user_id, contacts, user], (err, rows) => {

      if (!err) {

        res.redirect('/account/user');
      } else {
        console.log("errors---------------------------------------");
        console.log(err);
      }

    });
  })

}


exports.updateStaffMember = (req, res)=>{
  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var { branch_id,role,phone1,phone2,fulname,status,staff_id,ogrole,ogbranch_id } = req.body;

  console.log(req.body)
  var phone_2 = phone2 || '0xxxxxxxxx'
  
  var user_id = req.session.user.user.id;
  var brole = req.session.user.user.role;
  var bid = req.session.user.user.bid;
  var bname = req.session.user.user.bname;


  if(brole > 1){

    if(staff_id != user_id){

    if((brole == 2 && bid == branch_id) || brole == 3){
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      //console.log('Connected!');

      connection.query('UPDATE users SET fulname = ?, phone1 = ? ,phone2 = ?, status = ?, role = ?, updated_by = ?, branch_id = ? WHERE id = ?;', [fulname, phone1, phone_2, status, role, user_id, branch_id,staff_id], (err, rows) => {
                // Once done, release connection
                connection.release();

                if (!err) {
                  return res.json({status:'good',msg:"Staff updated successful"});
                } else {
                  console.log(err);
                  return res.json({status:'bad',msg:"Server or Database error"});
                }

              });
            });
        
  }else{
    return res.json({status:'bad',msg:"You can only add staff in your branch"});
  }

  }else{
    return res.json({status:'bad',msg:"Edit in your profile not here"});
  }
}else{
  return res.json({status:'bad',msg:"You don't have permission"});
}

}



}*/