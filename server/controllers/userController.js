const pool = require('../config/dbconfig')
var data = require('../data')
var richFunctions = require('../richardFunctions')
const bcrypt = require('bcryptjs');


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
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

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qry, [phone], (err, rows) => {
                if (!err) {
                    if (rows.length == 0) {
                        //inser query

                        connection.query(insert_qry, [phone, fulname, hash, phone, 1, 1, branch_id, company_id, user_id, user_id], (err, rows) => {
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
    var company_id = user_d.company_id;

    if (user != user_id) {

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
                            if (!err) {
                                //console.log(err);
                                return res.status(200).json({ success: true, code: 200, message: "Staff delete successfuly" })
                            } else {
                                console.log(err);
                                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                            }

                        });

                    } else {
                        return res.status(200).json({ success: false, code: 500, message: "Can't delete this user, hold events" })
                    }

                } else {
                    console.log(err);
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }

            });
        });

    } else {
        return res.status(200).json({ success: false, code: 409, message: "Can't delete yourself" })
    }

    //return res.status(400).send('No files were uploaded.');
}

exports.updateStaff = async (req, res) => {

    var { branch_id, role, fulname, status, id, created_by } = req.body;

    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;

    ////validate username
    var vusername = await richFunctions.validateUsername(fulname);
    if (vusername != true) {
        return res.status(200).json({ success: false, code: 409, message: vusername })
    }

    if(user_id != created_by){
        return res.status(200).json({ success: false, code: 409, message: "You can only update the staff you have created" })
    }

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

}

///////////////////customers////////////////////////////////

exports.topCustomers = (req, res) => {

    var user_d = req.user.user_data

    var user_id = user_d.id;
    var br_id = user_d.branch_id;
    var company_id = user_d.company_id;
   
    var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at ,us.fulname AS created_by FROM customers AS cu INNER JOIN users AS us ON cu.created_by = us.id WHERE cu.company_id = ? ORDER BY cu.invorved DESC LIMIT 30;"
    
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query,[company_id], (err, customers) => {
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
   
    var query = "SELECT cu.id, cu.fulname, cu.phone_no, cu.invorved, cu.created_at ,us.fulname AS created_by FROM customers AS cu INNER JOIN users AS us ON cu.created_by = us.id WHERE cu.company_id = ? AND (cu.fulname LIKE ?  OR cu.phone_no LIKE ?) ORDER BY cu.invorved DESC;"
    
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
   
      connection.query(query,[company_id,'%'+phone_name+'%','%'+phone_name+'%'], (err, customers) => {
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