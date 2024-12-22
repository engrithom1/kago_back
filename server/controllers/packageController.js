const pool = require('../config/dbconfig')
var data = require('../data')
var richFunctions = require('../richardFunctions')

const { Canvas } = require('canvas')
const JsBarcode = require('jsbarcode')

const axios = require('axios')

var userInfo = data.userInfo

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getDateTime() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var second = now.getSeconds();
  if (month.toString().length == 1) {
    month = '0' + month;
  }
  if (day.toString().length == 1) {
    day = '0' + day;
  }
  if (hour.toString().length == 1) {
    hour = '0' + hour;
  }
  if (minute.toString().length == 1) {
    minute = '0' + minute;
  }
  if (second.toString().length == 1) {
    second = '0' + second;
  }
  var dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
  return dateTime;
}

function genCode(cod) {

  try {

    var canvas = new Canvas()

    JsBarcode(canvas, cod, {
      format: "code128",
      lineColor: "#000",
      width: 2,
      height: 60,
      displayValue: true
    });

    return canvas.toDataURL('image/png')

  } catch (error) {
    console.log(error)
  }

}

async function insertCustomer(company_id, created_by, fulname, phone_no, connection, type) {

  //console.log('imerun ?'+type)
  var check_query = "SELECT invorved, id FROM customers WHERE phone_no = ? AND company_id = ?;"
  var insert_query = "INSERT INTO customers SET company_id = ?, phone_no = ?, fulname = ?, invorved = ?, created_by = ?;"
  var update_query = "UPDATE customers SET invorved = ? WHERE id = ?;"

  connection.query(check_query, [phone_no, company_id], (err, rows) => {
    //connection.release();
    if (!err) {
      //console.log('imechek true ?'+type)
      if (rows.length == 0) {

        connection.query(insert_query, [company_id, phone_no, fulname, 1, created_by], (err, rows) => {
          //connection.release();
          if (!err) {
            // console.log('ime insert true ?'+type)
            return true
          } else {
            console.log(err);
            //console.log('imefel insert true ?'+type)
            return true
          }
        })

      } else {

        var invoves = rows[0].invorved + 1
        var id = rows[0].id

        connection.query(update_query, [invoves, id], (err, rows) => {
          //connection.release();
          if (!err) {
            //console.log('ime update here ?'+type)
            return true
          } else {
            console.log(err);
            //console.log('ime fel update here ?'+type)
            return true

          }
        })

      }

    } else {
      console.log(err);
      //console.log('imechek false ?'+type)
      return true
    }
  })
}

function phoneListString(packages) {
  var list = ""
  for (let i = 0; i < packages.length; i++) {
    const phone = packages[i].receiver_phone;

    list += phone + ','
  }

  return list;
}

function phoneListArray(phone_list) {

  var array = phone_list.split(',')
  var list_arr = []

  for (let i = 0; i < array.length; i++) {
    var phone = array[i]
    console.log(phone)
    if (phone.length == 10) {
      phone = '255' + phone.substring(1);
      list_arr.push(phone)
    }
  }

  return list_arr

}

function getDateTomorrow() {
  var now = new Date();
  now.setDate(now.getDate() + 1);
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var second = now.getSeconds();
  if (month.toString().length == 1) {
    month = '0' + month;
  }
  if (day.toString().length == 1) {
    day = '0' + day;
  }
  if (hour.toString().length == 1) {
    hour = '0' + hour;
  }
  if (minute.toString().length == 1) {
    minute = '0' + minute;
  }
  if (second.toString().length == 1) {
    second = '0' + second;
  }
  var dateTime = year + '-' + month + '-' + day;
  return dateTime;
}

exports.createPackage = async (req, res) => {

  try {
    var { sender_name, sender_phone, receiver_name, receiver_phone, transporter_name,
      transporter_phone, name, price, branch_to, description, package_value, package_size,
      package_weight, package_tag, specific_location } = req.body;

      console.log(req.body)

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;
    var phone1 = user.phone1;
    var fulname = user.fulname;

    package_weight = package_weight || 1
    package_size = package_size.toLowerCase();

    transporter_name = transporter_name || fulname
    transporter_phone = transporter_phone || phone1
    description = description || "No package description"
    specific_location = specific_location || "Not specified"
    //console.log({ description, transporter_name, transporter_phone })

    var shipping_at = getDateTomorrow()

    ///////validation goes here
      var vname = await richFunctions.validateNames(sender_name,'Sender name');
        if (vname != true) {
            return res.status(200).json({success:false, code:409, message: vname })
        }
      
      var vname = await richFunctions.validateNames(receiver_name,'Receiver name');
        if (vname != true) {
            return res.status(200).json({success:false, code:409, message: vname })
        }
        
        var vphone = await richFunctions.validatePhone(receiver_phone, 'Receiver');
        if (vphone != true) {
            return res.status(200).json({success:false, code:409, message: vphone })
        }
        
        var vphone = await richFunctions.validatePhone(sender_phone, 'Sender');
        if (vphone != true) {
            return res.status(200).json({success:false, code:409, message: vphone })
        }
        
        var vprice = await richFunctions.validatePrice(price, 'Transportation Price');
        if (vprice != true) {
            return res.status(200).json({success:false, code:409, message: vprice })
        }
        
        var vprice = await richFunctions.validatePrice(package_value, 'Parcel value');
        if (vprice != true) {
            return res.status(200).json({success:false, code:409, message: vprice })
        }

        var vname = await richFunctions.validateNames(name,'Parcel name');
        if (vname != true) {
            return res.status(200).json({success:false, code:409, message: vname })
        }

        var vint_num = await richFunctions.validateIntNum(package_tag,'Parcel tag');
        if (vint_num != true) {
            return res.status(200).json({success:false, code:409, message: vint_num })
        }

        var vint_num = await richFunctions.validateIntNum(package_weight,'Parcel Weight');
        if (vint_num != true) {
            return res.status(200).json({success:false, code:409, message: vint_num })
        }

        if (!branch_to || branch_to == null || branch_to == '') {
          return res.status(200).json({success:false, code: 409,message: 'Select Destination' })
      }

        //parcel id 8 digits 4 company 4 random
        var _id = getRandomInt(1000, 10000);
        _id = parseInt(company_id+""+_id)


        var code = getRandomInt(100000, 1000000);/// 6 random digits
      var barcode_id = parseInt("" + company_id + code) //total 10 digits
        
        

    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      //console.log('Connected!');


      var query_branch = "SELECT * FROM branches where id = ?;"
      query_branch += "SELECT * FROM branches where id = ?"

      var code_data = genCode(barcode_id)
      var code128 = 'code128'

      connection.query(query_branch, [branch_id, branch_to], (err, rows) => {
        //connection.release();
        if (!err) {

          var bb_from = rows[0][0]
          var bb_to = rows[1][0]

          var nsender = '255' + sender_phone.substring(1);
          var nreceiver = '255' + receiver_phone.substring(1);

          var numberz = [nsender, nreceiver]
          var message = "Mzigo wenye jina " + name + " umetumwa kwa " + receiver_name + " (" + receiver_phone + ") na " + sender_name + " (" + sender_phone + "), Kupitia Kagopoint Tawi " + bb_from.name + "( " + bb_from.region + ") kwenda Tawi " + bb_to.name + "( " + bb_to.region + ") kwa Gharama ya Tsh " + price + " Utasafirishwa tare " + shipping_at + ". Karibu tukuhudumie."


          var filename = 'package.jpg'

          var query = "INSERT INTO packages SET id = ?, company_id = ?, barcode_id = ?, name = ?, price = ?,arive_at = ?,branch_to = ? ,branch_from = ?, description = ?, thumbnail = ?, created_by = ?, sender_name = ?,sender_phone = ?,receiver_name = ?,receiver_phone = ?,transporter_name = ?,transporter_phone = ?,status = ?, package_value = ?, package_size = ?, package_weight = ?, package_tag = ?, specific_location = ?, shipping_at = ?;"
          query += "INSERT INTO barcodes SET code_id = " + barcode_id + ", branch_id = " + branch_id + ", code_data = '" + code_data + "', status = " + 2 + ", code_type = '" + code128 + "', batch_no = " + branch_id + ", created_by = " + user_id + ";"

          connection.query(query, [_id, company_id, barcode_id, name, price, shipping_at, branch_to, branch_id, description, filename, user_id, sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone, 1, package_value, package_size, package_weight, package_tag, specific_location, shipping_at], async (err, rows) => {
            // Once done, release connection
            //connection.release();

            if (!err) {

              var rec_bool = await insertCustomer(company_id, user_id, sender_name, sender_phone, connection, 'sender info') || true
              var sen_bool = await insertCustomer(company_id, user_id, receiver_name, receiver_phone, connection, 'receiver info') || true
              var ress = await richFunctions.sendMultSMS(numberz, message) || true
              console.log(ress)

              //console.log(rec_bool+", "+sen_bool)

              if (rec_bool && sen_bool && ress) {
                /////goood ok ok
                return res.status(200).json({success:true, code:200, message: "Package has been created successfully" })
              } else {
                ////////somering wrong
                console.log('issue on insertion mbalimbali')
                return res.status(200).json({success:true, code:200, message: "Package has been created successfully" })

              }

            } else {
              console.log(err)
              return res.status(200).json({success:false, code:500, message: "Database or Server Error" })
            }

          });


        } else {
          console.log(err)
          return res.status(200).json({success:false, code:500, message: "Database or Server Error" })
        }

      })
    });

  } catch (error) {
    console.log(error)
    return res.status(200).json({success:false, code:500, message: error.message })
  }

}

exports.incomingPackages = (req, res) => {

  var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

  var query = "SELECT us.fulname,pc.price,pc.barcode_id,pc.sender_name,pc.sender_phone, "+
              "pc.package_size, pt.name AS package_tag, pc.created_at, pc.receiver_name, "+
              "pc.receiver_phone,pc.created_by, pc.id, pc.thumbnail,br.id AS bid, pc.name, br.name AS bname "+
              "FROM packages AS pc INNER JOIN branches AS br ON pc.branch_from = br.id "+ 
              "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id "+
              "INNER JOIN users AS us ON pc.created_by = us.id "+
              "WHERE pc.status = ? AND pc.branch_to = ? AND pc.company_id = ?"+
              " ORDER BY pc.created_at DESC;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [1, branch_id,company_id], (err, parcels) => {
      connection.release();
      if (!err) {
        //console.log(parcels)
        return res.status(200).json({success:true, code:200, parcels, message: "incomming parcel" })
      } else {
        console.log(err)
        return res.status(200).json({success:false, code:500, message: "Database or Server Error" })
      }
    })
  })

}

exports.outgoingPackages = (req, res) => {

  var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

   var query = "SELECT us.fulname,pc.price,pc.barcode_id,pc.sender_name,pc.sender_phone, "+
              "pc.package_size, pt.name AS tag_name,pc.package_weight, pc.package_value,"+
              " pc.description, pc.package_tag, pc.specific_location, pc.created_at,pc.receiver_name, "+
              "pc.receiver_phone, pc.id, pc.created_by, pc.thumbnail, br.id AS branch_to, pc.name,"+
              " br.name AS bname, pc.transporter_name, pc.transporter_phone "+
              "FROM packages AS pc "+
              "INNER JOIN branches AS br ON pc.branch_to = br.id "+
              "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id "+
              "INNER JOIN users AS us ON pc.created_by = us.id  "+
              "WHERE pc.status = ? AND pc.branch_from = ? AND pc.company_id = ? "+
              "ORDER BY pc.created_at DESC;"
   

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [1, branch_id, company_id], (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({success:true, code:200, parcels, message: "outgoing parcel" })
      } else {
        console.log(err)
        return res.status(200).json({success:false, code:500, message: "Database or Server Error" })
      }
    })
  })


}

exports.updatePackage = async(req, res) => {

  var { id,sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone, branch_to, price, name, description, package_value, package_size, package_weight, package_tag, shipping_at, specific_location } = req.body;

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var phone1 = user.phone1;
  var fulname = user.fulname;

  var updated_at = getDateTime()

  package_weight = package_weight || 1
  package_size = package_size.toLowerCase();

  transporter_name = transporter_name || fulname
  transporter_phone = transporter_phone || phone1
  description = description || "No package description"
  specific_location = specific_location || "Not specified"

  ///////validation goes here
    var vname = await richFunctions.validateNames(sender_name,'Sender name');
      if (vname != true) {
          return res.status(200).json({success:false, code:409, message: vname })
      }
    
    var vname = await richFunctions.validateNames(receiver_name,'Receiver name');
      if (vname != true) {
          return res.status(200).json({success:false, code:409, message: vname })
      }
      
      var vphone = await richFunctions.validatePhone(receiver_phone, 'Receiver');
      if (vphone != true) {
          return res.status(200).json({success:false, code:409, message: vphone })
      }
      
      var vphone = await richFunctions.validatePhone(sender_phone, 'Sender');
      if (vphone != true) {
          return res.status(200).json({success:false, code:409, message: vphone })
      }
      
      var vprice = await richFunctions.validatePrice(price, 'Transportation Price');
      if (vprice != true) {
          return res.status(200).json({success:false, code:409, message: vprice })
      }
      
      var vprice = await richFunctions.validatePrice(package_value, 'Parcel value');
      if (vprice != true) {
          return res.status(200).json({success:false, code:409, message: vprice })
      }

      var vname = await richFunctions.validateNames(name,'Parcel name');
      if (vname != true) {
          return res.status(200).json({success:false, code:409, message: vname })
      }

      var vint_num = await richFunctions.validateIntNum(package_tag,'Parcel tag');
      if (vint_num != true) {
          return res.status(200).json({success:false, code:409, message: vint_num })
      }

      var vint_num = await richFunctions.validateIntNum(package_weight,'Parcel Weight');
      if (vint_num != true) {
          return res.status(200).json({success:false, code:409, message: vint_num })
      }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');
   
      var query = "UPDATE packages SET name = ?, price = ?,branch_to = ?, description = ?, edit_by = ?, sender_name = ?,sender_phone = ?,receiver_name = ?,receiver_phone = ?,transporter_name = ?,transporter_phone = ?, updated_at = ?, package_value = ?, package_size = ?, package_weight = ?, package_tag = ?, specific_location = ? WHERE id = ? AND company_id = ?;"     

      connection.query(query, [name, price, branch_to, description, user_id, sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone,updated_at, package_value, package_size, package_weight, package_tag, specific_location, id, company_id], async (err, rows) => {
        // Once done, release connection
        connection.release();
        if (!err) {
          return res.status(200).json({success:true, code:200, message: "Package successful Updated" })
          //return res.json({ status: 'good', msg: "" });
        } else {
          console.log(err);
          return res.status(200).json({success:false, code:500, message: "Server or Database Error" })
         
        }

      });

  });

}

exports.receivePackage = (req, res) => {

  var { id,barcode_id, closed_description } = req.body;

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var phone1 = user.phone1;
  var fulname = user.fulname;

  var closed_at = getDateTime()
  //var closed_at = new Date().toLocaleString();

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');
   

      var query = "UPDATE packages SET status = ?, closed_description = ?, closed_by = ?, closed_at = ?  WHERE id = ? AND barcode_id = ?;"
          query += "UPDATE barcodes SET status = ? WHERE code_id = ?;"

      connection.query(query, [2, closed_description, user_id, closed_at, id, barcode_id, 3 , barcode_id], async (err, rows) => {
        // Once done, release connection
        connection.release();
        if (!err) {
          return res.status(200).json({success:true, code:200, message: "Parcel successful Received" })
        
        } else {
          console.log(err);
          return res.status(200).json({success:false, code:500, message: "Server or Database Error" })
        }

      });

  });

}


/*



exports.redirectPackage = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var { barcode_id, pid, redirect_description, branch_to} = req.body;

  var branch_id = req.session.user.user.bid;
  var user_id = req.session.user.user.id;

 // var closed_at = new Date().toLocaleString();

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');
   

      var query = "UPDATE packages SET edit_description = ?, edit_by = ?, branch_to = ?, branch_from = ?,created_by = ?  WHERE id = ? AND barcode_id = ?;"

      connection.query(query, [redirect_description, user_id,branch_to, branch_id,user_id, pid,barcode_id], async (err, rows) => {
        // Once done, release connection
        //connection.release();
        if (!err) {

          return res.json({ status: 'good', msg: "Package successful Redirected" });
        
        } else {
          console.log(err);
          return res.json({ status: 'bad', msg: "Server or Database Error" });
        }

      });

  });

}

exports.removePackage = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var updated_at = getDateTime()

  var { barcode_id, pid, description } = req.body;
  var branch_id = req.session.user.user.bid;
  var user_id = req.session.user.user.id;

  var query = "UPDATE packages SET status = ?, updated_at = ?, remove_by = ?, remove_description = ? WHERE barcode_id = ? AND id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');

    connection.query(query, [3, updated_at, user_id, description, barcode_id, pid], (err, rows) => {
      connection.release();
      if (!err) {

        return res.json({ data: {}, status: 'good', msg: "Package successful removed" });
      } else {
        console.log(err);
        return res.json({ data: {}, status: 'bad', msg: "Database or server error" });
      }

    });

  })
}


////////reports//////////////////////////////////////////

exports.receivedReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

  var today = new Date();
    var yy = today.getFullYear()
    var dd = today.getDate()
    var mm = today.getMonth() + 1

    if(mm < 10){
       mm = '0'+mm
    }
    
    if(dd < 10){
        dd = '0'+dd
    }

    var date_start = yy+'-'+mm+'-'+dd+' 00:00:00' 
    var date_end = yy+'-'+mm+'-'+dd+' 23:59:59' 

  var query = "SELECT us.fulname, rs.fulname AS receive_staff, pc.created_at,pc.closed_at, pc.closed_at, pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.status = ? AND pc.closed_at >= ? AND pc.closed_at <= ? ORDER BY pc.closed_at DESC;"
  query += "SELECT id, name FROM branches;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [2,date_start,date_end], (err, packages) => {
      connection.release();
      if (!err) {
        console.log(packages)
        res.render('received_reports', { userInfo: userInfo, seo_data, packages: packages[0], branches: packages[1] });
      } else {
        console.log(err)
        res.render('received_reports', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
      }
    })
  })

}

exports.transitReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

   var query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = ? ORDER BY pc.created_at DESC;"
      query += "SELECT id, name FROM branches;"

      pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
    
        connection.query(query, [1], (err, packages) => {
          connection.release();
          if (!err) {
            console.log(packages)
            res.render('transit_reports', { userInfo: userInfo, seo_data, packages: packages[0], branches: packages[1] });
          } else {
            console.log(err)
            res.render('transit_reports', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
          }
        })
      })

}

exports.filterTransitPackages = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var {fbranch, tbranch, fdate, tdate} = req.body

  var date_start = fdate+' 00:00:00' 
  var date_end = tdate+' 23:59:59' 

  console.log(req.body)
  console.log(date_start+", "+date_end)
 

  var query = ""

  if(fbranch == 0 && tbranch == 0){
    query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }else if(fbranch == 0 && tbranch != 0){
    query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_to = "+tbranch+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }else if(fbranch != 0 && tbranch == 0){
    query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_from = "+fbranch+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }else{
    query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_to = "+tbranch+" AND pc.branch_from = "+fbranch+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        if(packages.length > 0){
            return res.render('partials/transit_list',{layout:false,packages,userInfo})
        }else{
            return res.render('partials/info_message',{layout:false,message:'No Package found on transit'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}

exports.filterReceivedPackages = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var {fbranch, tbranch, fdate, tdate} = req.body

  var date_start = fdate+' 00:00:00' 
  var date_end = tdate+' 23:59:59' 

  //console.log(req.body)
  //console.log(date_start+", "+date_end)

  var query = ""

  if(fbranch == 0 && tbranch == 0){
    query = "SELECT us.fulname, rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id  WHERE pc.status = "+2+" AND pc.closed_at >= '"+date_start+"' AND pc.closed_at <= '"+date_end+"' ORDER BY pc.closed_at DESC;"
  }else if(fbranch == 0 && tbranch != 0){
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id  WHERE pc.status = "+2+" AND pc.branch_to = "+tbranch+" AND pc.closed_at >= '"+date_start+"' AND pc.closed_at <= '"+date_end+"' ORDER BY pc.closed_at DESC;"
  }else if(fbranch != 0 && tbranch == 0){
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.status = "+2+" AND pc.branch_from = "+fbranch+" AND pc.closed_at >= '"+date_start+"' AND pc.closed_at <= '"+date_end+"' ORDER BY pc.closed_at DESC;"
  }else{
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.status = "+2+" AND pc.branch_to = "+tbranch+" AND pc.branch_from = "+fbranch+" AND pc.closed_at >= '"+date_start+"' AND pc.close_at <= '"+date_end+"' ORDER BY pc.closed_at DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        if(packages.length > 0){
            return res.render('partials/received_list',{layout:false,packages,userInfo})
        }else{
            return res.render('partials/info_message',{layout:false,message:'No Package found on received'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}

///////////////bm////////////////////

exports.bmReceivedReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }

  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

  var branch_id = req.session.user.user.bid

  var today = new Date();
    var yy = today.getFullYear()
    var dd = today.getDate()
    var mm = today.getMonth() + 1

    if(mm < 10){
       mm = '0'+mm
    }
    
    if(dd < 10){
        dd = '0'+dd
    }

    var date_start = yy+'-'+mm+'-'+dd+' 00:00:00' 
    var date_end = yy+'-'+mm+'-'+dd+' 23:59:59' 

  var query = "SELECT us.fulname, rs.fulname AS receive_staff, pc.created_at, pc.closed_at, pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id  WHERE pc.status = ? AND pc.branch_to = ? AND pc.closed_at >= ? AND pc.closed_at <= ? ORDER BY pc.closed_at DESC;"
  query += "SELECT id, name FROM branches WHERE id != ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [2,branch_id,date_start,date_end, branch_id], (err, packages) => {
      connection.release();
      if (!err) {
        console.log(packages)
        res.render('bm_received_reports', { userInfo: userInfo, seo_data, packages: packages[0], branches: packages[1] });
      } else {
        console.log(err)
        res.render('bm_received_reports', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
      }
    })
  })

}

exports.filterBmReceivedPackages = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var tbranch = req.session.user.user.bid

  var {fbranch, fdate, tdate} = req.body

  var date_start = fdate+' 00:00:00' 
  var date_end = tdate+' 23:59:59' 

  //console.log(req.body)
  //console.log(date_start+", "+date_end)

  var query = ""

  if(fbranch == 0 ){
   query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at, pc.closed_at, pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.status = "+2+" AND pc.branch_to = "+tbranch+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }else{
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at, pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.status = "+2+" AND pc.branch_to = "+tbranch+" AND pc.branch_from = "+fbranch+" AND pc.created_at >= '"+date_start+"' AND pc.created_at <= '"+date_end+"' ORDER BY pc.created_at DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        if(packages.length > 0){
            return res.render('partials/received_list',{layout:false,packages,userInfo})
        }else{
            return res.render('partials/info_message',{layout:false,message:'No Package found on received'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}

///////////revenue report//////////////////////////

exports.revenueReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

  var today = new Date();
    var yy = today.getFullYear()
    var dd = today.getDate()
    var mm = today.getMonth() + 1

    if(mm < 10){
       mm = '0'+mm
    }
    
    if(dd < 10){
        dd = '0'+dd
    }

    var date_start = yy+'-'+mm+'-'+dd+' 00:00:00' 
    var date_end = yy+'-'+mm+'-'+dd+' 23:59:59' 

  var query = "SELECT b.id, b.name, SUM(p.price) AS revenue, COUNT(p.branch_from) AS packages FROM branches AS b INNER JOIN packages AS p ON b.id = p.branch_from WHERE p.status <= "+2+" AND p.created_at >= '"+date_start+"' AND p.created_at <= '"+date_end+"' GROUP BY b.id ORDER BY revenue DESC;"
  query += "SELECT id, name FROM branches;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      connection.release();
      if (!err) {

        var bpp = packages[0]
        var allb = packages[1]
        var abpp = []
        var newb = []
        var packs = 0
        var rev = 0
        var avg = 0

        bpp.forEach(el => {

          var ave = Math.trunc(el.revenue/el.packages)

          obj = {'id':el.id, 'name':el.name, 'revenue':el.revenue, 'packages':el.packages, 'average':ave}

          abpp.push(obj)
          
        });

        newb = allb.filter(x => {
          return bpp.findIndex(t => t.id === x.id) === -1;
      });
       
        newb.forEach(el => {
          obj = {'id':el.id, 'name':el.name, 'revenue':0, 'packages':0, 'average':0}
          abpp.push(obj)
        });

        for (let index = 0; index < abpp.length; index++) {
          packs += abpp[index].packages;
          rev += abpp[index].revenue;
          
        }

        var avg = Math.trunc(rev/packs)

        //console.log(bpp)
        //console.log(allb)
        //console.log(newb)

        res.render('revenue_report', { userInfo: userInfo, seo_data, packages: abpp, branches: allb,packs, rev, avg });
      } else {
        console.log(err)
        res.render('revenue_report', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
      }
    })
  })

}

exports.filterRevenueReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

  var {sdate, edate} = req.body

  var date_start = sdate+' 00:00:00' 
  var date_end = edate+' 23:59:59' 

  var query = "SELECT b.id, b.name, SUM(p.price) AS revenue, COUNT(p.branch_from) AS packages FROM branches AS b INNER JOIN packages AS p ON b.id = p.branch_from WHERE p.status <= "+2+" AND p.created_at >= '"+date_start+"' AND p.created_at <= '"+date_end+"' GROUP BY b.id ORDER BY revenue DESC;"
  query += "SELECT id, name FROM branches;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      connection.release();
      if (!err) {

        console.log(packages)

        var bpp = packages[0]
        var allb = packages[1]
        var abpp = []
        var newb = []
        var packs = 0
        var rev = 0
        var avg = 0

        bpp.forEach(el => {

          var ave = Math.trunc(el.revenue/el.packages)
          obj = {'id':el.id, 'name':el.name, 'revenue':el.revenue, 'packages':el.packages, 'average':ave}
          abpp.push(obj)
          
        });

        newb = allb.filter(x => {
          return bpp.findIndex(t => t.id === x.id) === -1;
      });
       
        newb.forEach(el => {
          obj = {'id':el.id, 'name':el.name, 'revenue':0, 'packages':0, 'average':0}
          abpp.push(obj)
        });

        for (let index = 0; index < abpp.length; index++) {
          packs += abpp[index].packages;
          rev += abpp[index].revenue;
          
        }

        var avg = Math.trunc(rev/packs)

        //console.log(bpp)
        //console.log(allb)
        //console.log(newb)

        console.log(packs)
        console.log(rev)
        console.log(avg)

        //res.render('revenue_report', { userInfo: userInfo, seo_data, packages: abpp, branches: allb,packs, rev, avg });
        return res.render('partials/revenue_list',{layout:false,userInfo: userInfo, seo_data, packages: abpp,packs,rev,avg })
      } else {
        console.log(err)
        return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
        //res.render('revenue_report', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
      }
    })
  })

}

////////trashed reports//////////////////////////////////////////

exports.removedReports = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var seo_data = {
    title: "outgoing packages",
    description: "landing page of this simple payment apprication"
  }

  var today = new Date();
    var yy = today.getFullYear()
    var dd = today.getDate()
    var mm = today.getMonth() + 1

    if(mm < 10){
       mm = '0'+mm
    }
    
    if(dd < 10){
        dd = '0'+dd
    }

    var date_start = yy+'-'+mm+'-'+dd+' 00:00:00' 
    var date_end = yy+'-'+mm+'-'+dd+' 23:59:59' 

  var query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.status = ? ORDER BY pc.id DESC LIMIT 20;"
  query += "SELECT id, name FROM branches;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [3], (err, packages) => {
      connection.release();
      if (!err) {
        console.log(packages)
        res.render('removed_packages', { userInfo: userInfo, seo_data, packages: packages[0], branches: packages[1] });
      } else {
        console.log(err)
        res.render('removed_packages', { userInfo: userInfo, seo_data, packages: [], branches:[], staffs:[] });
      }
    })
  })

}

exports.filterRemovedPackages = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var {branch, fdate, tdate} = req.body

  var date_start = fdate+' 00:00:00' 
  var date_end = tdate+' 23:59:59' 

  //console.log(req.body)
  //console.log(date_start+", "+date_end)

  var query = ""

  if(branch == 0){
    query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.status = "+3+" AND pc.updated_at >= '"+date_start+"' AND pc.updated_at <= '"+date_end+"' ORDER BY pc.id DESC;"
  }else{  
   query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.status = "+3+" AND pc.branch_from = "+branch+" AND pc.updated_at >= '"+date_start+"' AND pc.updated_at <= '"+date_end+"' ORDER BY pc.id DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        if(packages.length > 0){
            return res.render('partials/removed_list',{layout:false,packages,userInfo})
        }else{
            return res.render('partials/info_message',{layout:false,message:'No Package found on received'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}

////////sms conversation////////////////////////////////////////////////
exports.sendMultSMS = async (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid
  var user_id = req.session.user.user.id

  var phone_list = req.body.phone_list
  var message = req.body.message

  var sms_num = 1;
  var list_arry = phoneListArray(phone_list)
  var receivers = list_arry.length

  if(message.length > 160){
    sms_num = 2;
  }
  var messages = sms_num * receivers

  var ress = await richFunctions.sendMultSMS(list_arry, message)
  console.log(ress.status)

  var query = "INSERT INTO messages SET branch_id = ?, message = ?, messages = ?, receivers = ?, receiver_list = ?, created_by = ?;"

  if(ress.status == 200){
  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query,[bid ,message, messages, receivers, phone_list, user_id], (err,row) => {
      if (!err) {
          return res.json({ status: 'good', msg: 'Message sent successfully' });
      }else{
          console.log(err);
          return res.json({ status: 'good', msg: 'Message sent, but records not saved' });
      }  
    });
  });
}else{
  return res.json({ status: 'bad', msg: 'Message not sent, check your bundle or network connection try again' });
}

}

exports.pdfOutgoingPackages = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid
  var bregion = req.session.user.user.bregion

  var branch_id = req.body.branch_id
  var staff_id = req.body.staff_id
  var to_branch_name = req.body.to_branch_name

  var query = ""
  var heading = ""

  if(branch_id == 0){
    heading = "On Transit Packages From "+bregion+" To All Destination"
  }else{
     heading = "On Transit Packages From "+bregion+" To "+to_branch_name
  }

  if(branch_id == 0 && staff_id == 0){
    query = "SELECT us.fulname,pc.package_size,pc.package_value,pc.package_weight,pc.barcode_id, pt.name AS package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.sender_name, pc.sender_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name, br.name AS branch_to_name, bf.name AS branch_from_name, br.region AS branch_to_region, bf.region AS branch_from_region, br.contact AS branch_to_contact, br.contact AS branch_from_contact FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN package_tag AS pt ON pc.package_tag = pt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" ORDER BY pc.created_at DESC;"
  }else if(branch_id == 0 && staff_id != 0){
    query = "SELECT us.fulname,pc.package_size,pc.package_value,pc.package_weight,pc.barcode_id, pt.name AS package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.sender_name, pc.sender_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name, br.name AS branch_to_name, bf.name AS branch_from_name, br.region AS branch_to_region, bf.region AS branch_from_region, br.contact AS branch_to_contact, br.contact AS branch_from_contact FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN package_tag AS pt ON pc.package_tag = pt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.created_by = "+staff_id+" ORDER BY pc.created_at DESC;"
  }else if(branch_id != 0 && staff_id == 0){
    query = "SELECT us.fulname,pc.package_size,pc.package_value,pc.package_weight,pc.barcode_id, pt.name AS package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.sender_name, pc.sender_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name, br.name AS branch_to_name, bf.name AS branch_from_name, br.region AS branch_to_region, bf.region AS branch_from_region, br.contact AS branch_to_contact, br.contact AS branch_from_contact FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN package_tag AS pt ON pc.package_tag = pt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.branch_to = "+branch_id+" ORDER BY pc.created_at DESC;"
  }else{
     query = "SELECT us.fulname,pc.package_size,pc.package_value,pc.package_weight,pc.barcode_id, pt.name AS package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.sender_name, pc.sender_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name, br.name AS branch_to_name, bf.name AS branch_from_name, br.region AS branch_to_region, bf.region AS branch_from_region, br.contact AS branch_to_contact, br.contact AS branch_from_contact FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN package_tag AS pt ON pc.package_tag = pt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.created_by = "+staff_id+" AND pc.branch_to = "+branch_id+" ORDER BY pc.created_at DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        console.log(packages[0])
        if(packages.length > 0){
            return res.render('partials/outgoing_pdf',{layout:false,packages,userInfo,heading})
        }else{
          return res.render('partials/info_message',{layout:false,message:'No Packages found on selected Desination and Staff'})
        }
      }else{
          console.log(err);
          return res.render('partials/danger_message',{layout:false,message:'Database or server error'})
      }  
    });
  });


}

exports.filterReceiverPhones = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var branch_id = req.body.branch_id
  var staff_id = req.body.staff_id
  var type = req.body.type

  console.log(req.body)

  var query = ""

 if(type == 'outgoing'){
  if(branch_id == 0 && staff_id == 0){
    query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" ORDER BY pc.created_at DESC;"
  }else if(branch_id == 0 && staff_id != 0){
    query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.created_by = "+staff_id+" ORDER BY pc.created_at DESC;"
  }else if(branch_id != 0 && staff_id == 0){
    query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.branch_to = "+branch_id+" ORDER BY pc.created_at DESC;"
  }else{
     query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_from = "+bid+" AND pc.created_by = "+staff_id+" AND pc.branch_to = "+branch_id+" ORDER BY pc.created_at DESC;"
  }
 }

 if(type == 'incomming'){
  if(branch_id == 0){
    query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_to = "+bid+" ORDER BY pc.created_at DESC;"
  }else{
    query = "SELECT pc.receiver_phone FROM packages AS pc WHERE pc.status = "+1+" AND pc.branch_to = "+bid+" AND pc.branch_from = "+branch_id+" ORDER BY pc.created_at DESC;"
  }
 }


  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      if (!err) {
        if(packages.length > 0){
          console.log(packages)
          var phone_list = phoneListString(packages)
          return res.json({ status: 'good', phone_list });
        }else{
          return res.json({ status: 'bad', msg: "No Package receivers found" });
        }
      }else{
          console.log(err);
          return res.json({ status: 'bad', msg: "Server or Database Error" });
      }  
    });
  });
}
//getPackageEditData
exports.getPackageEditData = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var pid = req.body.pid

   query = "SELECT us.fulname,us.phone1,pc.shipping_at,pc.description, pc.arive_at,pc.shipping_at,pc.package_value, pc.package_weight,pc.sender_name,pc.sender_phone,pc.package_size, pc.package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name FROM packages AS pc INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [pid], (err, packages) => {
      if (!err) {
        console.log(packages)
        return res.json({ status: 'good',data:packages[0] , msg: "Package successful Updated" });
      }else{
          console.log(err);
          return res.json({ status: 'bad', msg: "Database or server error" });
      }  
    });
  });


}

//////receipt print
exports.getReceiptData = (req, res) => {

  if (req.session.user) {
    userInfo.isLoged = req.session.user.isLoged
    userInfo.user = req.session.user.user
  }
  var bid = req.session.user.user.bid

  var pid = req.body.pid

   query = "SELECT us.fulname,us.phone1,pc.shipping_at, pc.arive_at, pc.package_weight, pc.barcode_id,pc.sender_name,pc.sender_phone,pc.package_size, pt.name AS package_tag, pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.id, pc.thumbnail, br.id AS bid, pc.name, br.name AS bb_to_name, bt.name AS bb_from_name, br.region AS bb_to_region, bt.region AS bb_from_region, bt.contact AS bb_from_contact, br.contact AS bb_to_contact, bc.code_data  FROM packages AS pc INNER JOIN branches AS br ON pc.branch_to = br.id INNER JOIN branches AS bt ON pc.branch_from = bt.id INNER JOIN package_tag AS pt ON pc.package_tag = pt.id INNER JOIN barcodes AS bc ON pc.barcode_id = bc.code_id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [pid], (err, packages) => {
      if (!err) {
        console.log(packages)
        return res.json({ status: 'good',data:packages[0] , msg: "Package successful Updated" });
      }else{
          console.log(err);
          return res.json({ status: 'bad', msg: "Database or server error" });
      }  
    });
  });


}*/