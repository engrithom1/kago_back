const pool = require('../config/dbconfig')
const bcrypt = require('bcryptjs');
var data = require('../data')

const jwt = require('jsonwebtoken')
//const { authenticator } = require('otplib')
//const qrcode = require('qrcode')
//const crypto = require('crypto')
//const NodeCache = require('node-cache')

var richFunctions = require('../richardFunctions')

//const axios = require("axios");
//const https = require("https");
//var btoa = require("btoa");

exports.register = async (req, res) => {
    var { fullname, password, phone } = req.body;

    console.log(req.body);

    try {
        ////validate username
        var vusername = await richFunctions.validateUsername(fullname);
        if (vusername != true) {
            return res.status(200).json({ success: false, code: 409, message: vusername })
        }

        /////////varidate phone number
        var vphone = await richFunctions.validatePhone(phone);
        if (vphone != true) {
            return res.status(200).json({ success: false, code: 409, message: vphone })

        }

        /////////password validation
        var vpassword = await richFunctions.validatePassword(password);
        if (vpassword != true) {
            return res.status(200).json({ success: false, code: 409, message: vpassword })
        }

        const hash = await bcrypt.hash(password, 10)

        var qry = 'SELECT * FROM users WHERE username = ?;'
        var insert_qry = 'INSERT INTO users SET username = ? , fulname = ?, password = ? , phone1 = ?, status = ?;'

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qry, [phone], (err, rows) => {
                if (!err) {
                    if (rows.length == 0) {
                        //inser query

                        connection.query(insert_qry, [phone, fullname, hash, phone, 1], (err, rows) => {
                            if (!err) {
                                var id = rows.insertId
                                connection.query('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
                                    if (!err) {
                                        console.log(rows)

                                        var role = rows[0].role
                                        var avator = rows[0].avator
                                        var status = rows[0].status
                                        var id = rows[0].id

                                        return res.status(200).json({
                                            success: true,
                                            code: 200,
                                            message: 'User registered successfully',
                                            id: id
                                        })

                                    } else {
                                        console.log(err)
                                        return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                                    }

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

exports.login = (req, res) => {
    var { phone, password } = req.body;

    try {

        if (!phone || !password) {
            return res.status(200).json({ success: false, code: 409, message: 'Please fill in all fields (phone and password)' })
        }

        var qry = "SELECT us.role, us.created_by AS creater, ro.name AS role_name, us.avator, us.id, us.phone1, us.username, us.fulname, " +
            "us.password, us.status, us.branch_id, us.company_id, co.name AS company_name, " +
            "co.label AS company_label, co.logo AS company_logo, co.bundle, br.name AS branch_name, " +
            "br.thumbnail AS branch_image,br.district, br.location AS branch_location, br.region " +
            "FROM users AS us " +
            "INNER JOIN branches AS br ON us.branch_id = br.id " +
            "INNER JOIN company AS co ON us.company_id = co.id " +
            "INNER JOIN roles AS ro ON us.role = ro.id " +
            "WHERE us.username = ?;"

        var qq = "INSERT INTO users_token SET user_id = ?, refresh_token = ?;"
        qq += "SELECT name FROM region WHERE id = ?;"
        //connect to DB
        pool.getConnection((err, connection) => {
            if (err) throw err;

            //query
            connection.query(qry, [phone], async (err, rows) => {
                if (!err) {
                    if (rows.length != 0) {

                        console.log(rows)
                        var pass = rows[0].password
                        var status = rows[0].status

                        //console.log(pass+", "+password)
                        if (status == 0 || status == '0') {

                            return res.status(200).json({ success: false, code: 333, message: 'Account closed, contact admin' })

                        } else {

                            var doMatch = bcrypt.compareSync(password, pass)

                            if (doMatch) {
                                var role = rows[0].role
                                var role_name = rows[0].role_name
                                var avator = rows[0].avator
                                var id = rows[0].id
                                var creater = rows[0].creater
                                var phone1 = rows[0].phone1
                                var username = rows[0].phone1
                                var fulname = rows[0].fulname
                                var branch_name = rows[0].branch_name
                                var branch_image = rows[0].branch_image
                                var branch_location = rows[0].branch_location
                                var branch_district = rows[0].district
                                var region = rows[0].region
                                var branch_id = rows[0].branch_id
                                var company_id = rows[0].company_id
                                var company_name = rows[0].company_name
                                var company_label = rows[0].company_label
                                var company_logo = rows[0].company_logo

                                /*var user_data = {
                                    id, role, creater, company_name, role_name, phone1, username, fulname, branch_id, company_id
                                }
                                console.log(user_data)
*/
                                const accessToken = jwt.sign({ userId: id }, data.accessTokenSecret, { subject: 'accessApi', expiresIn: data.accessTokenExpiresIn })

                                const refreshToken = jwt.sign({ userId: id }, data.refreshTokenSecret, { subject: 'refreshToken', expiresIn: data.refreshTokenExpiresIn })

                                connection.query(qq, [id, refreshToken, region], (err, rows) => {
                                    if (!err) {

                                        var branch_region = rows[1][0].name

                                        return res.status(200).json({
                                            success: true,
                                            code: 200,
                                            user: {
                                                id, creater, fulname, phone, role, role_name, avator, phone1,
                                                username, branch_name, branch_district, branch_image, branch_location,
                                                branch_region, branch_id, company_id, company_name,
                                                company_label, company_logo
                                            },
                                            token: {
                                                accessToken,
                                                refreshToken
                                            }
                                        })

                                    } else {
                                        console.log(err)
                                        return res.status(200).json({ success: false, code: 500, message: 'Database or server error' })
                                    }
                                })

                            } else {
                                return res.status(200).json({ success: false, code: 409, message: 'phone or password is invalid' })
                            }
                        }

                    } else {
                        return res.status(200).json({ success: false, code: 409, message: 'phone or password is invalid' })
                    }

                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: 'Database or server error' })
                }

                //console.log('the data: \n',rows);
            })
        })

    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 500, message: error.message })
    }

}

exports.logout = (req, res) => {
    try {

        var user_id = req.body.id;
        var company_id = req.body.company_id;

        //console.log(req.body)

        if (!user_id || !company_id) {
            return res.status(200).json({ success: false, code: 409, message: 'Please fill all required information' })
        }

        var qry = "DELETE FROM users_token WHERE user_id = ?;"
        var check_qry = "SELECT id, company_id FROM users WHERE id = ? AND company_id = ?;"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(check_qry, [user_id, company_id], (err, rows) => {
                if (!err) {
                    if(rows.length == 0){
                        return res.status(200).json({ success: false, code: 409, message: "Incorrect User Information" })
                    }else{
                        connection.query(qry, [user_id], (err, rows) => {
                            if (!err) {
                                return res.status(200).json({ success: true, code: 200, message: "User loged out" })
                            } else {
                                console.log(err)
                                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                            }
                        })
                    }
                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }
            })
        })

    } catch (error) {
        return res.status(200).json({ success: false, code: 500, message: error.message })
    }
}
/*
login with token

exports.logout = (req, res) => {
    try {

        var qry = "DELETE FROM users_token WHERE user_id = ?;"
            qry += "INSERT INTO user_invalid_token SET user_id = ?, user_token = ?;"

            var user = req.user.user_data

            var user_id = user.id;
        var user_token = req.accessToken.value
        
        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qry, [user_id,user_id,user_token], (err, rows) => {
                if (!err) {
                    return res.status(200).json({success:true, code:200, message: "User loged out" })
                }else{
                    console.log(err)
                    return res.status(200).json({success:false, code:500, message: "Server or Database error" })
                }
            })
        })        

    } catch (error) {
        return res.status(200).json({ success:false, code:500, message: error.message }) 
    }
}*/

exports.changePassword = async (req, res) => {

    var { current_password, new_password, confirm_password } = req.body;

    console.log(req.body)

    var user = req.user.user_data
    var user_id = user.id;
    var username = user.username;

    if (!current_password || !new_password || !confirm_password) {
        return res.status(200).json({ success: false, code: 409, message: 'Please fill all required Information' })
    }

    /////////password validation
    var vpassword = await richFunctions.validatePassword(new_password);
    if (vpassword != true) {
        return res.status(200).json({ success: false, code: 409, message: vpassword })
    }

    if (new_password != confirm_password) {
        return res.status(200).json({ success: false, code: 409, message: "Confirm Password do not match" })
    }

    //connect to DB
    pool.getConnection((err, connection) => {
        if (err) throw err;
        //console.log('Connection as ID '+connection.threadId)

        //query
        connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
            if (!err) {
                if (rows.length != 0) {
                    var pass = rows[0].password

                    var doMatch = bcrypt.compareSync(current_password, pass)

                    if (doMatch) {
                        bcrypt.hash(new_password, 10, function (err, hash) {

                            connection.query("UPDATE users SET password = ? WHERE username = ?", [hash, username], (err, rows) => {
                                connection.release();
                                if (!err) {
                                    return res.status(200).json({ success: true, code: 200, message: "Password chenged successfully" })

                                } else {
                                    return res.status(200).json({ success: false, code: 500, message: "Database or server error" })
                                }
                            })

                        })

                    } else {
                        return res.status(200).json({ success: false, code: 409, message: "Current Password Doesn't Match" })
                    }
                } else {
                    return res.status(200).json({ success: false, code: 409, message: "Current Password Doesn't Match" })

                }
            } else {
                console.log(err)
                return res.status(200).json({ success: false, code: 500, message: "Database or server error" })
            }
        })
    })


}





