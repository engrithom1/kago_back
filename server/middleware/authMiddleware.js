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

var ensureAuthenticated = (req, res, next) =>{
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

module.exports = { sessionChecker, ensureAuthenticated }