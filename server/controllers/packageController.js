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
    //console.log(error)
  }

}

async function insertCustomer(company_id, created_by, fulname, phone_no, connection) {

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
          connection.release();
          if (!err) {
            // console.log('ime insert true ?'+type)
            return true
          } else {
            //console.log(err);
            //console.log('imefel insert true ?'+type)
            return true
          }
        })

      } else {

        var invoves = rows[0].invorved + 1
        var id = rows[0].id

        connection.query(update_query, [invoves, id], (err, rows) => {
          connection.release();
          if (!err) {
            //console.log('ime update here ?'+type)
            return true
          } else {
            //console.log(err);
            //console.log('ime fel update here ?'+type)
            return true

          }
        })

      }

    } else {
      //console.log(err);
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
    //console.log(phone)
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

exports.dashbordData = (req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var role = user.role;
  var creater = user.creater;

  //console.log(user_id+", "+branch_id+", "+company_id+", "+role+", "+creater)

  //console.log(branch_id)
  var date_start = richFunctions.toDayDateTimes(0)
  var date_end = richFunctions.toDayDateTimes(1)

  /////////////////7day////////////////////////////////////
  var date_start7 = richFunctions.dateTimeDays(7)
  /////////////////end-today/////////////////////////////// 
  var date_start30 = richFunctions.dateTimeDays(30)

  /////////////////////end 30day/////////////////////////

  //console.log(date_start+", "+date_end)
  //console.log(date_start7+", "+date_end)
  //console.log(date_start30+", "+date_end)

  if (creater == 1) {

    var queries = "SELECT COUNT(*) AS incoming FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_to = ?;"
    queries += "SELECT COUNT(*) AS outgoing FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_from = ?;"
    queries += "SELECT COUNT(*) AS received FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_to = ? AND created_at >= ? AND created_at <= ?;"
    queries += "SELECT COUNT(*) AS sent FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_from = ? AND created_at >= ? AND created_at <= ?;"
    queries += "SELECT COUNT(*) AS transit FROM packages WHERE company_id = " + company_id + " AND status = " + 1 + ";"
    queries += "SELECT SUM(price) AS revDay FROM packages WHERE company_id = " + company_id + " AND status <= " + 2 + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"
    queries += "SELECT SUM(price) AS rev7 FROM packages WHERE company_id = " + company_id + " AND status <= " + 2 + " AND created_at >= '" + date_start7 + "' AND created_at <= '" + date_end + "';"
    queries += "SELECT SUM(price) AS rev30 FROM packages WHERE company_id = " + company_id + " AND status <= " + 2 + " AND created_at >= '" + date_start30 + "' AND created_at <= '" + date_end + "';"

  } else {

    var queries = "SELECT COUNT(*) AS incoming FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_to = ?;"
    queries += "SELECT COUNT(*) AS outgoing FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_from = ?;"
    queries += "SELECT COUNT(*) AS received FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_to = ? AND created_at >= ? AND created_at <= ?;"
    queries += "SELECT COUNT(*) AS sent FROM packages WHERE company_id = " + company_id + " AND status = ? AND branch_from = ? AND created_at >= ? AND created_at <= ?;"
    queries += "SELECT COUNT(*) AS transit FROM packages WHERE company_id = " + company_id + " AND branch_from = " + branch_id + " OR branch_to = " + branch_id + " AND status = " + 1 + ";"
    queries += "SELECT SUM(price) AS revDay FROM packages WHERE company_id = " + company_id + " AND branch_from = " + branch_id + " AND status <= " + 2 + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"
    queries += "SELECT SUM(price) AS rev7 FROM packages WHERE company_id = " + company_id + " AND branch_from = " + branch_id + " AND status <= " + 2 + " AND created_at >= '" + date_start7 + "' AND created_at <= '" + date_end + "';"
    queries += "SELECT SUM(price) AS rev30 FROM packages WHERE company_id = " + company_id + " AND branch_from = " + branch_id + " AND status <= " + 2 + " AND created_at >= '" + date_start30 + "' AND created_at <= '" + date_end + "';"


  }



  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected 0,date_start30,date_end

    connection.query(queries, [1, branch_id, 1, branch_id, 2, branch_id, date_start30, date_end, 2, branch_id, date_start30, date_end], (err, reults) => {
      connection.release();
      if (!err) {

        //console.log(reults)

        var incoming = reults[0][0].incoming || 0
        var outgoing = reults[1][0].outgoing || 0
        var received_30 = reults[2][0].received || 0
        var sent_30 = reults[3][0].sent || 0
        var transit = reults[4][0].transit || 0
        var revDay = reults[5][0]['revDay'] || 0
        var rev7 = reults[6][0]['rev7'] || 0
        var rev30 = reults[7][0]['rev30'] || 0

        var dataz = {
          incoming, outgoing, received_30, sent_30, transit, revDay, rev7, rev30
        }

        return res.status(200).json({ success: true, code: 200, dataz, message: "Package has been created successfully" })

      } else {
        //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    });
  });

}

exports.companyProfile = async (req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var sms_code = user.sms_code;
  var role = user.role;
  var creater = user.creater;

  var sms_balance = 0
  var sms_lifetime = 0

  var ress = await richFunctions.akiliSMSData(sms_code)

  //console.log(ress)
  if (ress.data.success) {

    sms_balance = ress.data.dataz.sms_balance
    sms_lifetime = ress.data.dataz.sms_lifetime
  }

  var queries = "SELECT sh.id, sh.description, sh.amount, sh.sub_at_date, sh.sub_end_date, sh.users, " +
    "sh.branches, sh.sms, sh.parcels, sh.bundle, bs.name AS bundle_name FROM sub_history AS sh " +
    "INNER JOIN bundles AS bs ON sh.bundle = bs.id WHERE sh.company_id = " + company_id + " ORDER BY created_at DESC;"
  queries += "SELECT COUNT(*) AS staffs FROM users WHERE company_id = " + company_id + ";"
  queries += "SELECT COUNT(*) AS branches FROM branches WHERE company_id = " + company_id + ";"
  queries += "SELECT COUNT(*) AS parcels FROM packages WHERE company_id = " + company_id + ";"
  queries += "SELECT * FROM company WHERE id = " + company_id + ";"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected 0,date_start30,date_end

    connection.query(queries, (err, reults) => {
      connection.release();
      if (!err) {

        //console.log(reults)

        var bundles = reults[0]

        var current_bundle = bundles[0]
        var start_date = current_bundle.sub_at_date
        var expire_date = current_bundle.sub_end_date
        var current_package = current_bundle.bundle_name
        var bundle_id = current_bundle.bundle

        var first_bundle = bundles[(bundles.length - 1)]
        var start_sub = first_bundle.sub_at_date

        var staffs = reults[1][0].staffs || 0
        var branches = reults[2][0].branches || 0
        var parcels = reults[3][0].parcels || 0

        var company_info = reults[4][0] || {}

        var dataz = {
          start_date, expire_date, current_package, start_sub, staffs, branches, parcels, bundle_id, company_info, sms_balance, sms_lifetime
        }

        return res.status(200).json({ success: true, code: 200, dataz, bundles, message: "Package has been created successfully" })

      } else {
      //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    });
  });

}
//////////////////////////////////////////////////////////////////////////////////
exports.createPackage = async (req, res) => {

  try {
    var { sender_name, sender_phone, receiver_name, receiver_phone, transporter_name,
      transporter_phone, name, price, branch_to, description, package_value, package_size,
      package_weight, package_tag, specific_location } = req.body;

    //console.log(req.body)

    var bundles = req.bundles
    var _parcels = bundles.parcels
    var _sms = bundles.sms
    var _status = bundles.status
    var sms_code = bundles.sms_code

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;
    var company_name = user.company_name.toUpperCase();
    var phone1 = user.phone1;
    var fulname = user.fulname;

    var parcel = {}

    package_weight = package_weight || 1
    package_size = package_size.toLowerCase();

    transporter_name = transporter_name || fulname
    transporter_phone = transporter_phone || phone1
    description = description || "No package description"
    specific_location = specific_location || "Not specified"
    //console.log({ description, transporter_name, transporter_phone })

    var shipping_at = getDateTomorrow()

    ///////validation goes here
    var vname = await richFunctions.validateNames(sender_name, 'Sender name');
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vname = await richFunctions.validateNames(receiver_name, 'Receiver name');
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vphone = await richFunctions.validatePhone(receiver_phone, 'Receiver');
    if (vphone != true) {
      return res.status(200).json({ success: false, code: 409, message: vphone })
    }

    var vphone = await richFunctions.validatePhone(sender_phone, 'Sender');
    if (vphone != true) {
      return res.status(200).json({ success: false, code: 409, message: vphone })
    }
    
    var vprice = await richFunctions.validatePriceValue(price, package_value);
    if (vprice != true) {
      return res.status(200).json({ success: false, code: 409, message: vprice })
    }

    /*
    var vprice = await richFunctions.validatePrice(price, 'Transportation Price');
    if (vprice != true) {
      return res.status(200).json({ success: false, code: 409, message: vprice })
    }

    var vprice = await richFunctions.validatePrice(package_value, 'Parcel value');
    if (vprice != true) {
      return res.status(200).json({ success: false, code: 409, message: vprice })
    }*/

    var vname = await richFunctions.validateNames(name, 'Parcel Label');
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vint_num = await richFunctions.validateIntNum(package_tag, 'Parcel Name');
    if (vint_num != true) {
      return res.status(200).json({ success: false, code: 409, message: vint_num })
    }

    var vint_num = await richFunctions.validateIntNum(package_weight, 'Parcel Weight');
    if (vint_num != true) {
      return res.status(200).json({ success: false, code: 409, message: vint_num })
    }

    if (!branch_to || branch_to == null || branch_to == '') {
      return res.status(200).json({ success: false, code: 409, message: 'Select Destination' })
    }

    //parcel id 8 digits 4 company 5 random
    var _idP = getRandomInt(10000, 100000);
    var _id = parseInt(company_id + "" + _idP)


    var code = getRandomInt(100000, 1000000);/// 6 random digits
    var barcode_id = parseInt("" + company_id + code) //total 10 digits



    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected
      //console.log('Connected!');


      var query_branch = "SELECT br.name, br.id, br.contacts, rg.name AS region FROM branches AS br INNER JOIN region AS rg ON br.region = rg.id  WHERE br.id = ?;"
      query_branch += "SELECT br.name, br.contacts, br.id, rg.name AS region FROM branches AS br INNER JOIN region AS rg ON br.region = rg.id  WHERE br.id = ?;"
      query_branch += "SELECT name FROM package_tag WHERE id = ?;"

      var code_data = genCode(barcode_id)
      var code128 = 'code128'

      connection.query(query_branch, [branch_id, branch_to, package_tag], (err, rows) => {
        //connection.release();
        if (!err) {

          var bb_from = rows[0][0]
          var bb_to = rows[1][0]
          var pname = rows[2][0].name

          var nsender = '255' + sender_phone.substring(1);
          var nreceiver = '255' + receiver_phone.substring(1);

          var p_list = sender_phone + "," + receiver_phone
          var p_list255 = nsender + "," + nreceiver

          var bb_from_region = bb_from.region.toUpperCase();
          var bb_to_region = bb_to.region.toUpperCase();
          var from_name = bb_from.name.toUpperCase();
          var to_name = bb_to.name.toUpperCase();
          var contact_from = bb_from.contacts || '0xxxxxxxxxx'
          var contact_to = bb_to.contacts || '0xxxxxxxxxx'
          var sender_ = sender_name.toUpperCase();
          var receiver_ = receiver_name.toUpperCase();

          var numberz = [nsender, nreceiver]
          var message = " MZIGO NO: " + _id + " UMEPOKELEWA " + bb_from_region + " KUTOKA KWA " + sender_ + ", KWENDA " + bb_to_region + " KWA " + receiver_ +
            ", " + shipping_at + " CONTACTS: " + to_name + " " + contact_to + ", " + from_name + " " + contact_from + "."


          var filename = 'package.jpg'

          var sms_num = 1;
          var receivers = numberz.length


          sms_num = richFunctions.numberOfMessages(message)

          var messages = sms_num * receivers

          if (_status == 2) {
            var query = "INSERT INTO packages SET id = ?, company_id = ?, barcode_id = ?, name = ?, price = ?,arive_at = ?,branch_to = ? ,branch_from = ?, description = ?, thumbnail = ?, created_by = ?, sender_name = ?,sender_phone = ?,receiver_name = ?,receiver_phone = ?,transporter_name = ?,transporter_phone = ?,status = ?, package_value = ?, package_size = ?, package_weight = ?, package_tag = ?, specific_location = ?, shipping_at = ?;"
            query += "INSERT INTO barcodes SET code_id = " + barcode_id + ", branch_id = " + branch_id + ", code_data = '" + code_data + "', status = " + 2 + ", code_type = '" + code128 + "', batch_no = " + branch_id + ", created_by = " + user_id + ";"
            query += "INSERT INTO messages SET branch_id = " + branch_id + ", company_id = " + company_id + ", message = '" + message + "', messages = " + messages + ", receivers = " + receivers + ", receiver_list = '" + p_list + "', created_by = " + user_id + ";"
            query += "UPDATE company SET sms = " + (_sms - messages) + " WHERE id = " + company_id + ";"
          } else {
            var query = "INSERT INTO packages SET id = ?, company_id = ?, barcode_id = ?, name = ?, price = ?,arive_at = ?,branch_to = ? ,branch_from = ?, description = ?, thumbnail = ?, created_by = ?, sender_name = ?,sender_phone = ?,receiver_name = ?,receiver_phone = ?,transporter_name = ?,transporter_phone = ?,status = ?, package_value = ?, package_size = ?, package_weight = ?, package_tag = ?, specific_location = ?, shipping_at = ?;"
            query += "INSERT INTO barcodes SET code_id = " + barcode_id + ", branch_id = " + branch_id + ", code_data = '" + code_data + "', status = " + 2 + ", code_type = '" + code128 + "', batch_no = " + branch_id + ", created_by = " + user_id + ";"
            query += "UPDATE company SET parcels = " + (_parcels - 1) + " WHERE id = " + company_id + ";"
          }

          connection.query(query, [_id, company_id, barcode_id, name, price, shipping_at, branch_to, branch_id, description, filename, user_id, sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone, 1, package_value, package_size, package_weight, package_tag, specific_location, shipping_at], async (err, rows) => {
            // Once done, release connection
            //connection.release();

            if (!err) {

              var rec_bool = await insertCustomer(company_id, user_id, sender_name, sender_phone, connection) || true
             // var sen_bool = await insertCustomer(company_id, user_id, receiver_name, receiver_phone, connection, 'receiver info') || true
              
              if (_status == 2) {
                var ress = await richFunctions.sendToAkiliSingleSMS(p_list255, message, sms_code) || {data:{ success: true }}
              } else {
                var ress = {data:{ success: true }}
              }
              //console.log(ress)
              ///////////////receipt data here
              var arive_at = shipping_at
              package_tag = pname
              var created_at = shipping_at
              var id = _id
              var thumbnail = filename
              var bid = branch_id
              var from_region = bb_from_region.toLowerCase();
              var to_region = bb_to_region.toLowerCase();
              //var bb_from_region = 4
              //var bb_to_region = 2
              var bb_from_name = from_name.toLowerCase();
              var bb_to_name = to_name.toLowerCase();
              var bb_from_contact = contact_from 
              var bb_to_contact = contact_to 
              ///////////////////////end receipt data
              //console.log(rec_bool+", "+sen_bool)
              parcel = {fulname, phone1, shipping_at, arive_at,package_weight, barcode_id, sender_name, sender_phone, package_size, package_tag, created_at, receiver_name, price, receiver_phone, id, thumbnail, bid, name, bb_from_region, bb_from_name, bb_from_contact, bb_to_contact, bb_to_name, bb_to_region, from_region, to_region, code_data}

              //if (rec_bool && sen_bool && ress.success) {
              if (ress.data.success) {
                /////goood ok ok
                return res.status(200).json({ success: true, code: 200, parcel, message: "Package has been created successfully" })
              } else {
                ////////somering wrong
                //console.log('issue on insertion mbalimbali')
                return res.status(200).json({ success: true, code: 200, parcel, message: "Package has been created successfully" })

              }

            } else {
              //console.log(err)
              return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
            }

          });


        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

      })
    });

  } catch (error) {
    //console.log(error)
    return res.status(200).json({ success: false, code: 500, message: error.message })
  }

}

exports.incomingPackages = (req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var query = "SELECT us.fulname,pc.price,pc.barcode_id,pc.sender_name,pc.sender_phone, " +
    "pc.package_size, pt.name AS tag_name,pc.package_weight, pc.package_value," +
    " pc.description, pc.package_tag, pc.specific_location, pc.created_at, pc.receiver_name, " +
    "pc.receiver_phone, pc.id, pc.created_by, pc.thumbnail, pc.branch_from, pc.name," +
    " br.name AS bname, pc.transporter_name, pc.transporter_phone " +
    "FROM packages AS pc " +
    "INNER JOIN branches AS br ON pc.branch_from = br.id " +
    "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id " +
    "INNER JOIN users AS us ON pc.created_by = us.id  " +
    "WHERE pc.status = ? AND pc.branch_to = ? AND pc.company_id = ? " +
    "ORDER BY pc.created_at DESC;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [1, branch_id, company_id], (err, parcels) => {
      connection.release();
      if (!err) {
        //console.log(parcels)
        return res.status(200).json({ success: true, code: 200, parcels, message: "incomming parcel" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

exports.outgoingPackages = (req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

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

  var query = "SELECT us.fulname,pc.price,pc.barcode_id,pc.sender_name,pc.sender_phone, " +
    "pc.package_size, pt.name AS tag_name,pc.package_weight, pc.package_value," +
    " pc.description, pc.package_tag, pc.specific_location, pc.created_at, pc.receiver_name, " +
    "pc.receiver_phone, pc.id, pc.created_by, pc.thumbnail, br.id AS branch_to, pc.name," +
    " br.name AS bname, pc.transporter_name, pc.transporter_phone " +
    "FROM packages AS pc " +
    "INNER JOIN branches AS br ON pc.branch_to = br.id " +
    "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id " +
    "INNER JOIN users AS us ON pc.created_by = us.id  " +
    "WHERE pc.status = ? AND pc.branch_from = ? AND pc.company_id = ? " +
    "ORDER BY pc.created_at DESC LIMIT 30;"
    //"AND pc.created_at >= '" + date_start + "' AND pc.created_at <= '" + date_end + "' ORDER BY pc.created_at DESC;"


  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [1, branch_id, company_id], (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcels, message: "outgoing parcel" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })


}

exports.outgoingFilterPackages = (req, res) => {

  var user = req.user.user_data

  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { sdate, edate } = req.body

  var date_start = sdate + ' 00:00:00'
  var date_end = edate + ' 23:59:59'

  var query = "SELECT us.fulname,pc.price,pc.barcode_id,pc.sender_name,pc.sender_phone, " +
    "pc.package_size, pt.name AS tag_name,pc.package_weight, pc.package_value," +
    " pc.description, pc.package_tag, pc.specific_location, pc.created_at,pc.receiver_name, " +
    "pc.receiver_phone, pc.id, pc.created_by, pc.thumbnail, br.id AS branch_to, pc.name," +
    " br.name AS bname, pc.transporter_name, pc.transporter_phone " +
    "FROM packages AS pc " +
    "INNER JOIN branches AS br ON pc.branch_to = br.id " +
    "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id " +
    "INNER JOIN users AS us ON pc.created_by = us.id  " +
    "WHERE pc.status = ? AND pc.branch_from = ? AND pc.company_id = ? " +
    "AND pc.created_at >= '" + date_start + "' AND pc.created_at <= '" + date_end + "' ORDER BY pc.created_at DESC;"


  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [1, branch_id, company_id], (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcels, message: "outgoing parcel" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })


}

exports.updatePackage = async (req, res) => {

  var { id, sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone, branch_to, price, name, description, package_value, package_size, package_weight, package_tag, shipping_at, specific_location } = req.body;

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
  var vname = await richFunctions.validateNames(sender_name, 'Sender name');
  if (vname != true) {
    return res.status(200).json({ success: false, code: 409, message: vname })
  }

  var vname = await richFunctions.validateNames(receiver_name, 'Receiver name');
  if (vname != true) {
    return res.status(200).json({ success: false, code: 409, message: vname })
  }

  var vphone = await richFunctions.validatePhone(receiver_phone, 'Receiver');
  if (vphone != true) {
    return res.status(200).json({ success: false, code: 409, message: vphone })
  }

  var vphone = await richFunctions.validatePhone(sender_phone, 'Sender');
  if (vphone != true) {
    return res.status(200).json({ success: false, code: 409, message: vphone })
  }

  var vprice = await richFunctions.validatePrice(price, 'Transportation Price');
  if (vprice != true) {
    return res.status(200).json({ success: false, code: 409, message: vprice })
  }

  var vprice = await richFunctions.validatePrice(package_value, 'Parcel value');
  if (vprice != true) {
    return res.status(200).json({ success: false, code: 409, message: vprice })
  }

  var vname = await richFunctions.validateNames(name, 'Parcel name');
  if (vname != true) {
    return res.status(200).json({ success: false, code: 409, message: vname })
  }

  var vint_num = await richFunctions.validateIntNum(package_tag, 'Parcel tag');
  if (vint_num != true) {
    return res.status(200).json({ success: false, code: 409, message: vint_num })
  }

  var vint_num = await richFunctions.validateIntNum(package_weight, 'Parcel Weight');
  if (vint_num != true) {
    return res.status(200).json({ success: false, code: 409, message: vint_num })
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');

    var query = "UPDATE packages SET name = ?, price = ?,branch_to = ?, description = ?, edit_by = ?, sender_name = ?,sender_phone = ?,receiver_name = ?,receiver_phone = ?,transporter_name = ?,transporter_phone = ?, updated_at = ?, package_value = ?, package_size = ?, package_weight = ?, package_tag = ?, specific_location = ? WHERE id = ? AND company_id = ?;"

    connection.query(query, [name, price, branch_to, description, user_id, sender_name, sender_phone, receiver_name, receiver_phone, transporter_name, transporter_phone, updated_at, package_value, package_size, package_weight, package_tag, specific_location, id, company_id], async (err, rows) => {
      // Once done, release connection
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, message: "Package successful Updated" })
        //return res.json({ status: 'good', msg: "" });
      } else {
        //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Server or Database Error" })

      }

    });

  });

}

exports.receivePackage = (req, res) => {

  var { id, barcode_id, closed_description } = req.body;


  if (!id || !barcode_id) {
    return res.status(200).json({ success: false, code: 409, message: 'Parcel ID and Barcode Id are required' })
  }

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

    connection.query(query, [2, closed_description, user_id, closed_at, id, barcode_id, 3, barcode_id], async (err, rows) => {
      // Once done, release connection
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, message: "Parcel successful Received" })

      } else {
        //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Server or Database Error" })
      }

    });

  });

}

exports.removePackage = async (req, res) => {

  var updated_at = getDateTime()

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { barcode_id, id, description } = req.body;

  if (!id || !barcode_id) {
    return res.status(200).json({ success: false, code: 409, message: 'Parcel ID and Barcode Id are required' })
  }

  //console.log(req.body);

  var vname = await richFunctions.validateDescription(description, 'Remove Description');
  if (vname != true) {
    return res.status(200).json({ success: false, code: 409, message: vname })
  }

  var query = "UPDATE packages SET status = ?, updated_at = ?, remove_by = ?, remove_description = ? WHERE barcode_id = ? AND id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected
    //console.log('Connected!');

    connection.query(query, [3, updated_at, user_id, description, barcode_id, id], (err, rows) => {
      connection.release();
      if (!err) {

        return res.status(200).json({ success: true, code: 200, message: "Parcel successful Removed" })
      } else {
        //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Server or Database Error" })
      }

    });

  })
}
////////sms conversation////////////////////////////////////////////////
exports.sendMultSMS = async (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var sms_code = user.sms_code || 0

  var bundles = req.bundles
  //var _sms = bundles.sms


  var phone_list = req.body.phone_list
  var message = req.body.message

  if (!phone_list) {
    return res.status(200).json({ success: false, code: 409, message: 'Phone numbers list are required' })
  }

  var vname = await richFunctions.validateMessage(message);
  if (vname != true) {
    return res.status(200).json({ success: false, code: 409, message: vname })
  }

  var sms_num = 1;
  var list_arry = phoneListArray(phone_list)
  var receivers = list_arry.length
  var list_string = list_arry.toString()


  sms_num = richFunctions.numberOfMessages(message)

  var messages = sms_num * receivers
  /*
    if(messages > _sms){
      return res.status(200).json({ success: false, code: 409, message: "Can't send "+messages+" messages you have only "+_sms })
  }*/

  //var ress = await richFunctions.sendMultSMS(list_arry, message)
  var ress = await richFunctions.sendToAkiliSingleSMS(list_string, message, sms_code)
  //console.log(ress)

  var query = "INSERT INTO messages SET branch_id = ?, company_id = ?, message = ?, messages = ?, receivers = ?, receiver_list = ?, type = ?, created_by = ?;"
  /*query += "UPDATE company SET sms = "+(_sms - messages)+" WHERE id = "+company_id+";"*/

   if (ress.data.success) {
    pool.getConnection((err, connection) => {
      if (err) throw err; // not connected

      connection.query(query, [branch_id, company_id, message, messages, receivers, phone_list, 1, user_id], (err, row) => {
        connection.release();
        if (!err) {
          return res.status(200).json({ success: true, code: 200, message: 'Message sent successfully' })
        } else {
          //console.log(err);
          return res.status(200).json({ success: true, code: 200, message: 'Message sent, but records not saved' })
        }
      });
    });
  } else {
    return res.status(200).json({ success: false, code: 500, message: 'Message not sent, check your bundle or network connection try again' })

  }

}

////////reports//////////////////////////////////////////

exports.receivedReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;


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

  var query = "SELECT us.fulname, rs.fulname AS receive_staff, pc.created_at,pc.closed_at, pc.closed_at, pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.company_id = ? AND pc.status = ? AND pc.closed_at >= ? AND pc.closed_at <= ? ORDER BY pc.closed_at DESC;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [company_id, 2, date_start, date_end], (err, parcels) => {
      connection.release();
      if (!err) {

        return res.status(200).json({ success: true, code: 200, parcels, message: "Received parcels" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

exports.filterReceivedPackages = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { fbranch, tbranch, sdate, edate } = req.body

  var date_start = sdate + ' 00:00:00'
  var date_end = edate + ' 23:59:59'

  //console.log(req.body)
  //console.log(date_start+", "+date_end)

  var query = ""

  if (fbranch == 0 && tbranch == 0) {
    query = "SELECT us.fulname, rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id  WHERE pc.company_id = " + company_id + " AND pc.status = " + 2 + " AND pc.closed_at >= '" + date_start + "' AND pc.closed_at <= '" + date_end + "' ORDER BY pc.closed_at DESC;"
  } else if (fbranch == 0 && tbranch != 0) {
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id  WHERE pc.company_id = " + company_id + " AND pc.status = " + 2 + " AND pc.branch_to = " + tbranch + " AND pc.closed_at >= '" + date_start + "' AND pc.closed_at <= '" + date_end + "' ORDER BY pc.closed_at DESC;"
  } else if (fbranch != 0 && tbranch == 0) {
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.company_id = " + company_id + " AND pc.status = " + 2 + " AND pc.branch_from = " + fbranch + " AND pc.closed_at >= '" + date_start + "' AND pc.closed_at <= '" + date_end + "' ORDER BY pc.closed_at DESC;"
  } else {
    query = "SELECT us.fulname,rs.fulname AS receive_staff, pc.created_at,pc.closed_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.closed_by = rs.id WHERE pc.company_id = " + company_id + " AND pc.status = " + 2 + " AND pc.branch_to = " + tbranch + " AND pc.branch_from = " + fbranch + " AND pc.closed_at >= '" + date_start + "' AND pc.close_at <= '" + date_end + "' ORDER BY pc.closed_at DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcels, message: "Received parcels" })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    });
  });


}

exports.revenueReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

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

  var query = "SELECT b.id, b.name, SUM(p.price) AS revenue, COUNT(p.branch_from) AS packages FROM branches AS b INNER JOIN packages AS p ON b.id = p.branch_from WHERE p.company_id = " + company_id + " AND p.status != " + 3 + " AND p.created_at >= '" + date_start + "' AND p.created_at <= '" + date_end + "' GROUP BY b.id ORDER BY revenue DESC;"
  query += "SELECT id, name FROM branches WHERE company_id = " + company_id + ";"

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

          var ave = Math.trunc(el.revenue / el.packages)

          obj = { 'id': el.id, 'name': el.name, 'revenue': el.revenue, 'packages': el.packages, 'average': ave }

          abpp.push(obj)

        });

        newb = allb.filter(x => {
          return bpp.findIndex(t => t.id === x.id) === -1;
        });

        newb.forEach(el => {
          obj = { 'id': el.id, 'name': el.name, 'revenue': 0, 'packages': 0, 'average': 0 }
          abpp.push(obj)
        });

        for (let index = 0; index < abpp.length; index++) {
          packs += abpp[index].packages;
          rev += abpp[index].revenue;

        }

        var avg = Math.trunc(rev / packs) || 0

        //console.log(bpp)
        //console.log(allb)
        //console.log(newb)

        var summary = {
          parcels: packs,
          revenue: rev,
          average: avg
        }

        return res.status(200).json({ success: true, code: 200, revenues: abpp, summary })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

exports.filterRevenueReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { sdate, edate } = req.body

  var date_start = sdate + ' 00:00:00'
  var date_end = edate + ' 23:59:59'

  var query = "SELECT b.id, b.name, SUM(p.price) AS revenue, COUNT(p.branch_from) AS packages FROM branches AS b INNER JOIN packages AS p ON b.id = p.branch_from WHERE p.company_id = " + company_id + " AND p.status != " + 3 + " AND p.created_at >= '" + date_start + "' AND p.created_at <= '" + date_end + "' GROUP BY b.id ORDER BY revenue DESC;"
  query += "SELECT id, name FROM branches WHERE company_id = " + company_id + ";"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, packages) => {
      connection.release();
      if (!err) {

        //console.log(packages)

        var bpp = packages[0]
        var allb = packages[1]
        var abpp = []
        var newb = []
        var packs = 0
        var rev = 0
        var avg = 0

        bpp.forEach(el => {

          var ave = Math.trunc(el.revenue / el.packages)
          obj = { 'id': el.id, 'name': el.name, 'revenue': el.revenue, 'packages': el.packages, 'average': ave }
          abpp.push(obj)

        });

        newb = allb.filter(x => {
          return bpp.findIndex(t => t.id === x.id) === -1;
        });

        newb.forEach(el => {
          obj = { 'id': el.id, 'name': el.name, 'revenue': 0, 'packages': 0, 'average': 0 }
          abpp.push(obj)
        });

        for (let index = 0; index < abpp.length; index++) {
          packs += abpp[index].packages;
          rev += abpp[index].revenue;

        }

        var avg = Math.trunc(rev / packs) || 0

        //console.log(bpp)
        //console.log(allb)
        //console.log(newb)

        var summary = {
          parcels: packs,
          revenue: rev,
          average: avg
        }

        return res.status(200).json({ success: true, code: 200, revenues: abpp, summary })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

exports.transitReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var query = "SELECT us.fulname, pc.created_at,pc.price, pc.id, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.company_id = ? AND pc.status = ? ORDER BY pc.created_at DESC;"


  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [company_id, 1], (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcels })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

//////messaging report

exports.messageReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;
  var sms_code = user.sms_code;

  var date_start = richFunctions.toDayDateTimes(0)
  var date_end = richFunctions.toDayDateTimes(1)

  var query = "SELECT m.id, m.message, m.messages, m.created_at, m.receivers, m.receiver_list," +
    " m.branch_id, us.fulname, br.name FROM messages AS m" +
    " INNER JOIN users AS us ON m.created_by = us.id" +
    " INNER JOIN branches AS br ON m.branch_id = br.id" +
    " WHERE m.company_id = " + company_id + " AND m.created_at >= '" + date_start + "' AND m.created_at <= '" + date_end + "' ORDER BY m.id DESC;"
  query += "SELECT SUM(receivers) AS total_receivers FROM messages WHERE company_id = " + company_id + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"
  query += "SELECT SUM(messages) AS total_messages FROM messages WHERE company_id = " + company_id + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, async (err, rows) => {
      connection.release();
      if (!err) {

        //console.log(rows)

        var messages = rows[0]
        var total_receivers = rows[1][0]['total_receivers'] || 0
        var total_messages = rows[2][0]['total_messages'] || 0
        var day30 = 0
        var day7 = 0
        var sms_balance = 0
        var sms_lifetime = 0

        var ress = await richFunctions.akiliSMSData(sms_code)
        //console.log(ress.data)
        if (ress.data.success) {

          sms_balance = ress.data.dataz.sms_balance
          day30 = ress.data.dataz.day30
          day7 = ress.data.dataz.day7
          sms_lifetime = ress.data.dataz.sms_lifetime

          var sms_data = { day30, day7, sms_balance, sms_lifetime }
          return res.status(200).json({ success: true, code: 200, messages, total_messages, total_receivers, sms_data })
        } else {

          var sms_data = { day30, day7, sms_balance, sms_lifetime }
          return res.status(200).json({ success: true, code: 200, messages, total_messages, total_receivers, sms_data })
        }
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }

    })
  })

}

exports.filterMessageReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { sdate, edate } = req.body

  var date_start = sdate + ' 00:00:00'
  var date_end = edate + ' 23:59:59'

  var query = "SELECT m.id, m.message, m.created_at, m.messages, m.receivers, m.receiver_list," +
    " m.branch_id, us.fulname, br.name FROM messages AS m" +
    " INNER JOIN users AS us ON m.created_by = us.id" +
    " INNER JOIN branches AS br ON m.branch_id = br.id" +
    " WHERE m.company_id = " + company_id + " AND m.created_at >= '" + date_start + "' AND m.created_at <= '" + date_end + "' ORDER BY m.id DESC;"
  query += "SELECT SUM(receivers) AS total_receivers FROM messages WHERE company_id = " + company_id + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"
  query += "SELECT SUM(messages) AS total_messages FROM messages WHERE company_id = " + company_id + " AND created_at >= '" + date_start + "' AND created_at <= '" + date_end + "';"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, rows) => {
      connection.release();
      if (!err) {

        //console.log(rows)

        var messages = rows[0]
        var total_receivers = rows[1][0]['total_receivers'] || 0
        var total_messages = rows[2][0]['total_messages'] || 0

        return res.status(200).json({ success: true, code: 200, messages, total_messages, total_receivers })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }

    })
  })

}

////////trashed reports//////////////////////////////////////////

exports.removedReports = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

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

  var query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.company_id = ? AND pc.status = ? ORDER BY pc.id DESC LIMIT 20;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [company_id, 3], (err, parcels) => {
      connection.release();
      if (!err) {

        return res.status(200).json({ success: true, code: 200, parcels })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    })
  })

}

exports.filterRemovedPackages = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var { branch, sdate, edate } = req.body

  var date_start = sdate + ' 00:00:00'
  var date_end = edate + ' 23:59:59'

  //console.log(req.body)
  //console.log(date_start+", "+date_end)

  var query = ""

  if (branch == 0) {
    query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.company_id = " + company_id + " AND pc.status = " + 3 + " AND pc.updated_at >= '" + date_start + "' AND pc.updated_at <= '" + date_end + "' ORDER BY pc.id DESC;"
  } else {
    query = "SELECT us.fulname, rs.fulname AS remove_staff, pc.created_at,pc.updated_at, pc.closed_at, pc.price, pc.id,pc.remove_description, pc.thumbnail, bf.id AS bfid,  bt.id AS btid, pc.name, bf.name AS bfname, bt.name AS btname  FROM packages AS pc INNER JOIN branches AS bf ON pc.branch_from = bf.id INNER JOIN branches AS bt ON pc.branch_to = bt.id INNER JOIN users AS us ON pc.created_by = us.id INNER JOIN users AS rs ON pc.remove_by = rs.id WHERE pc.company_id = " + company_id + " AND pc.status = " + 3 + " AND pc.branch_from = " + branch + " AND pc.updated_at >= '" + date_start + "' AND pc.updated_at <= '" + date_end + "' ORDER BY pc.id DESC;"
  }

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, (err, parcels) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcels })
      } else {
        //console.log(err)
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    });
  });


}

//////receipt print
exports.getReceiptData = (req, res) => {

  var user = req.user.user_data
  var user_id = user.id;
  var branch_id = user.branch_id;
  var company_id = user.company_id;

  var pid = req.body.id

  if (!pid) {
    return res.status(200).json({ success: false, code: 409, message: 'Parcel id is required' })
  }

  query = "SELECT us.fulname,us.phone1,pc.shipping_at, pc.arive_at, pc.package_weight, " +
    "pc.barcode_id,pc.sender_name,pc.sender_phone,pc.package_size, pt.name AS package_tag, " +
    "pc.created_at,pc.receiver_name,pc.price, pc.receiver_phone, pc.id, pc.thumbnail, br.id AS bid, " +
    "pc.name, br.name AS bb_to_name, bt.name AS bb_from_name, br.region AS bb_to_region, " +
    "bt.region AS bb_from_region, bt.contacts AS bb_from_contact, br.contacts AS bb_to_contact, " +
    "rt.name AS to_region, rf.name AS from_region, bc.code_data FROM packages AS pc " +
    "INNER JOIN branches AS br ON pc.branch_to = br.id " +
    "INNER JOIN branches AS bt ON pc.branch_from = bt.id " +
    "INNER JOIN package_tag AS pt ON pc.package_tag = pt.id " +
    "INNER JOIN barcodes AS bc ON pc.barcode_id = bc.code_id " +
    "INNER JOIN region AS rt ON br.region = rt.id " +
    "INNER JOIN region AS rf ON bt.region = rf.id " +
    "INNER JOIN users AS us ON pc.created_by = us.id  WHERE pc.id = ?;"

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected

    connection.query(query, [pid], (err, packages) => {
      connection.release();
      if (!err) {
        return res.status(200).json({ success: true, code: 200, parcel: packages[0] })
      } else {
        //console.log(err);
        return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
      }
    });
  });


}

/*

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

*/