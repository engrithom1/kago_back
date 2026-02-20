const pool = require('../config/dbconfig')
const bcrypt = require('bcryptjs');
var data = require('../data')

const jwt = require('jsonwebtoken')

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    //console.log("from session checker ")
    //console.log(req.session.user)
    if (req.session.user.isLoged) {
        if (req.session.user.user.status == 'inactive') {
            res.redirect('/verify-account');
        } else {
            res.redirect('/');
        }
    } else {
        next();
    }
};

var old_ensureAuthenticated = (req, res, next) =>{
    const accessToken = req.headers.authorization

    if (!accessToken) {
        return res.status(200).json({success:false, code:409, message: 'Access token not found' })
    }

    var qq = "SELECT * FROM user_invalid_token WHERE user_token = ?;"

    pool.getConnection((err, connection) => {
        if (err) throw err;
        ///check if user exist/
        connection.query(qq, [accessToken], (err, rows) => {
            if (!err) {
                if (rows.length == 0) {

                    try {
                        const decodedAccessToken = jwt.verify(accessToken, data.accessTokenSecret)

                        req.accessToken = { value: accessToken, exp: decodedAccessToken.exp }
                        req.user = { user_data: decodedAccessToken.user_data }

                        next()
                        
                    } catch (error) {
                        if (error instanceof jwt.TokenExpiredError) {
                            return res.status(200).json({success:false, code:444, message: 'Access token expired' })
                        } else if (error instanceof jwt.JsonWebTokenError) {
                            return res.status(200).json({success:false, code:444, message: 'Access token invalid or expired' })
                        } else {
                            return res.status(200).json({success:false, code:500, message: error.message })
                        }
                    }

                } else {
                    return res.status(200).json({success:false, code:444, message: 'Access token invalid or expired' })
                }
            } else {
                console.log(err)
                return res.status(200).json({success:false, code:500, message: "Server or Database error" })
            }
        })
    })
}

var ensureAuthenticated = (req, res, next) => {
    const accessToken = req.headers.authorization

    if (!accessToken) {
        return res.status(200).json({ success: false, code: 409, message: 'Access Token Required' })
    }

    var qq = "SELECT * FROM user_invalid_token WHERE user_token = ?;"
    var query_check = "SELECT us.role, us.created_by AS creater, ro.name AS role_name, us.avator, us.id, us.phone1, us.username, us.fulname, " +
            "us.password, us.status AS user_status, us.branch_id, us.company_id, co.name AS company_name, " +
            "co.label AS company_label, co.status AS company_status, co.sms_code, co.logo AS company_logo, co.bundle, br.name AS branch_name, " +
            "br.thumbnail AS branch_image,br.district, br.location AS branch_location, br.region " +
            "FROM users AS us " +
            "INNER JOIN branches AS br ON us.branch_id = br.id " +
            "INNER JOIN company AS co ON us.company_id = co.id " +
            "INNER JOIN roles AS ro ON us.role = ro.id " +
            "WHERE us.id = ?;"

    pool.getConnection((err, connection) => {
        if (err) throw err;
        ///check if user exist/
        connection.query(qq, [accessToken], (err, rows) => {
            if (!err) {
                if (rows.length == 0) {

                    try {
                        const decodedAccessToken = jwt.verify(accessToken, data.accessTokenSecret)

                        req.accessToken = { value: accessToken, exp: decodedAccessToken.exp }

                        var _user_data = decodedAccessToken.user_data
                        var user_id = _user_data.id;

                        connection.query(query_check, user_id, (err, uza) => {
                            connection.release();
                            if (!err) {
                                if (uza.length == 0) {
                                    return res.status(200).json({ success: false, code: 444, message: 'Unknown or UnAthorized User' })
                                } else {
                                    var user_status = uza[0].user_status
                                    var company_status = uza[0].company_status
                                    var user_data = uza[0]

                                    if (user_status == 0 || company_status == 0) {

                                        return res.status(200).json({ success: false, code: 333, message: 'Account not Activated' })
                                    } else {
                                        req.user = { user_data }
                                        next()
                                    }
                                }
                            } else {
                                console.log(err)
                                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                            }
                        })

                    } catch (error) {
                        if (error instanceof jwt.TokenExpiredError) {
                            return res.status(200).json({ success: false, code: 444, message: 'Access token expired' })
                        } else if (error instanceof jwt.JsonWebTokenError) {
                            return res.status(200).json({ success: false, code: 444, message: 'Access token invalid or expired' })
                        } else {
                            return res.status(200).json({ success: false, code: 500, message: error.message })
                        }
                    }

                } else {
                    connection.release();
                    return res.status(200).json({ success: false, code: 444, message: 'Access token invalid or expired' })
                }
            } else {
                console.log(err)
                return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
            }
        })
    })
}

module.exports = { sessionChecker, ensureAuthenticated }