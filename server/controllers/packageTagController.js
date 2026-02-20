const pool = require('../config/dbconfig')
//var data = require('../data')
//const fs = require('fs');

var richFunctions = require('../richardFunctions')


exports.deleteTag = async (req, res) => {

  var { id } = req.body

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;


    if (!id) {
      return res.status(200).json({ success: false, code: 409, message: 'Tag ID is required' })
    }

    var quer = "SELECT id, barcode_id FROM packages WHERE package_tag = ?;"
    quer += "SELECT id, company_id FROM package_tag WHERE id = ?;"

    var delete_qry = "DELETE FROM package_tag WHERE id = ? AND company_id = ?;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(quer, [id, id], (err, packages) => {
        //connection.release();
        if (!err) {
          if (packages[0].length != 0) {
            //console.log(tags)
             connection.release();
            return res.status(200).json({ success: false, code: 409, message: "Can't delete tag which hold packages" })
          } else {
            if (packages[1].length == 0) {
              return res.status(200).json({ success: false, code: 409, message: "Tag id is not correct" })
            } else {

              if (packages[1][0].company_id == 1 && company_id != 1) {
                return res.status(200).json({ success: false, code: 409, message: "Can't delete default tag" })
              } else {

                //query
                connection.query(delete_qry, [id, company_id], (err, tags) => {
                  connection.release();
                  if (!err) {
                    return res.status(200).json({ success: true, code: 200, message: "Tag deleted successfuly" })
                  } else {
                    //console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
                  }
                  //console.log('the data: \n',rows);
                })

              }

            }

          }
        } else {
         // console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

      })
    })

  } catch (error) {
    //console.log(error)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.updateTag = async (req, res) => {

  var { name, description, status, id } = req.body

  //console.log(req.body)

  name = name.toLowerCase()
  description = description || name

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var vname = await richFunctions.validateNames(name, "Tag name");
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vstatus = await richFunctions.validateStatus(status, "Status");
    if (vstatus != true) {
      return res.status(200).json({ success: false, code: 409, message: vstatus })
    }

    if (!id) {
      return res.status(200).json({ success: false, code: 409, message: 'Tag ID is required' })
    }

    var vdescription = await richFunctions.validateDescription(description, "Description");
    if (vdescription != true) {
      return res.status(200).json({ success: false, code: 409, message: vdescription })
    }

    var quer = "UPDATE package_tag SET name = ?, description = ?, status = ?, created_by = ? WHERE id = ? AND company_id = ?;"

    pool.getConnection((err, connection) => {
      if (err) throw err;

      //query
      connection.query(quer, [name, description, status, user_id, id, company_id], (err, tags) => {
        connection.release();
        if (!err) {
          return res.status(200).json({ success: true, code: 200, message: "Tag updated successfuly" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })
  } catch (error) {
    //console.log(error)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.createTag = async (req, res) => {

  var { name, description } = req.body

  name = name.toLowerCase()
  description = description || name

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var vname = await richFunctions.validateNames(name, "Tag name");
    if (vname != true) {
      return res.status(200).json({ success: false, code: 409, message: vname })
    }

    var vdescription = await richFunctions.validateDescription(description, "Description");
    if (vdescription != true) {
      return res.status(200).json({ success: false, code: 409, message: vdescription })
    }

    var quer = "INSERT INTO package_tag SET name = ?, description = ?, company_id = ?, created_by = ?;"
    var check_qry = "SELECT * FROM package_tag WHERE name = ? AND (company_id = ? OR company_id = ?);"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      connection.query(check_qry, [name, company_id, 1], (err, tags) => {
        
        if (!err) {
          if (tags.length != 0) {
            //console.log(tags)
            connection.release();
            return res.status(200).json({ success: false, code: 409, message: "Tag name aleady exist" })
          } else {
            //query
            connection.query(quer, [name, description, company_id, user_id], (err, tags) => {
              connection.release();
              if (!err) {
                return res.status(200).json({ success: true, code: 200, message: "Tag created successfuly" })
              } else {
                //console.log(err)
                return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
              }

              //console.log('the data: \n',rows);
            })
          }
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

      })
    })

  } catch (error) {
    //console.log(error)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.allTags = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT tg.id, tg.name, tg.company_id, tg.description, tg.status, us.fulname AS created_by " +
      "FROM package_tag AS tg " +
      "INNER JOIN users AS us ON tg.created_by = us.id " +
      "WHERE tg.company_id = ? OR tg.company_id = ? ORDER BY tg.id DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, [company_id, 1], (err, tags) => {
        //connection.release();
        if (!err) {
          //console.log(err)
          return res.status(200).json({ success: true, code: 200, tags, message: "Successfuly fetch all tags" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    //console.log(err)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.defaultTags = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT tg.id, tg.name, tg.company_id, tg.description, tg.status, us.fulname AS created_by " +
      "FROM package_tag AS tg " +
      "INNER JOIN users AS us ON tg.created_by = us.id " +
      "WHERE tg.company_id = ? ORDER BY tg.id DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, [1], (err, tags) => {
        connection.release();
        if (!err) {
          //console.log(err)
          return res.status(200).json({ success: true, code: 200, tags, message: "Successfuly fetch default tags" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    //console.log(err)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

exports.customTags = (req, res) => {

  try {

    var user = req.user.user_data

    var user_id = user.id;
    var branch_id = user.branch_id;
    var company_id = user.company_id;

    var quer = "SELECT tg.id, tg.name, tg.company_id, tg.description, tg.status, us.fulname AS created_by " +
      "FROM package_tag AS tg " +
      "INNER JOIN users AS us ON tg.created_by = us.id " +
      "WHERE tg.company_id = ? ORDER BY tg.id DESC;"

    pool.getConnection((err, connection) => {
      if (err) throw err;
      //query
      connection.query(quer, [company_id], (err, tags) => {
        connection.release();
        if (!err) {
          //console.log(err)
          return res.status(200).json({ success: true, code: 200, tags, message: "Successfuly fetch default tags" })
        } else {
          //console.log(err)
          return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
        }

        //console.log('the data: \n',rows);
      })
    })

  } catch (error) {
    //console.log(err)
    return res.status(200).json({ success: false, code: 500, message: "Database or Server Error" })
  }

}

