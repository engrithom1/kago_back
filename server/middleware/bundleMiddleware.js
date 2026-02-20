const pool = require('../config/dbconfig')
//const bcrypt = require('bcryptjs');
var richFunctions = require('../richardFunctions')
var data = require('../data')

//req.user = { user_data: decodedAccessToken.user_data }
/**/

var checkParcels = (req, res, next) => {

    try {

        var user = req.user.user_data

        var user_id = user.id;
        var company_id = user.company_id;
        var company_name = user.company_name;

        var time = new Date()
        var now_sec = Math.round(time.getTime() / 1000)


        var qq = "SELECT * FROM company WHERE id = ?;"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qq, [company_id], async (err, company) => {
                connection.release();
                if (!err) {

                    var branches = company[0].branches
                    var users = company[0].users
                    var parcels = company[0].parcels
                    var sms = company[0].sms
                    var status = company[0].status
                    var bundle = company[0].bundle
                    var sub_end_date = company[0].sub_end_date
                    var sub_end_sec = company[0].sub_end_sec
                    var sms_code = company[0].sms_code

                    //console.log(branches+", "+users+", "+parcels+", "+sms+", "+status+", "+bundle+", "+now_sec+", "+sub_end_sec);

                    if (status == 0) {
                       
                        return res.status(200).json({ success: false, code: 409, message: "Service is Closed for " + company_name })
                    }

                    //check if bandle has messages
                    if (bundle == 2) {
                        ///check if has message

                        var ress = await richFunctions.akiliSMSData(sms_code)

                        //console.log(ress.data)
                        if (ress.data.success) {

                            var sms_balance = ress.data.dataz.sms_balance
                            if (sms_balance >= 4) {
                                ////it send message
                                
                                req.bundles = { status: 2, parcels, sms:sms_balance, sms_code }
                                next()
                            } else {
                                return res.status(200).json({ success: false, code: 409, message: "Message bundle is Finished" })
                                //req.bundles = {status:1, parcels, sms}
                                //next() 
                            }

                        } else {
                            req.bundles = { status: 1, parcels, sms:0, sms_code:0 }
                            next()
                        }

                    } else {
/*check expired date
                        if (sub_end_sec < now_sec) {
                            return res.status(200).json({ success: false, code: 409, message: "Subscription expired on " + sub_end_date })
                        }*/

                        if (parcels >= 1) {

                            ///this do not send message
                            req.bundles = { status: 1, parcels, sms, sms_code }
                            next()
                        } else {
                            return res.status(200).json({ success: false, code: 409, message: "Parcels bundle is Finished" })
                        }
                    }

                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }
            })
        })

    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 409, message: 'Something wrong, try again' })

    }
}

///////////////////////////////

var checkBranch = (req, res, next) => {

    try {

        var user = req.user.user_data

        var user_id = user.id;
        var company_id = user.company_id;
        var company_name = user.company_name;

        var time = new Date()
        var now_sec = Math.round(time.getTime() / 1000)


        var qq = "SELECT * FROM company WHERE id = ?;"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qq, [company_id], (err, company) => {
                if (!err) {

                    var branches = company[0].branches
                    var users = company[0].users
                    var parcels = company[0].parcels
                    var sms = company[0].sms
                    var status = company[0].status
                    var bundle = company[0].bundle
                    var sub_end_date = company[0].sub_end_date
                    var sub_end_sec = company[0].sub_end_sec


                    if (status == 0) {
                        return res.status(200).json({ success: false, code: 409, message: "Service is Closed for " + company_name })
                    }

                    if (sub_end_sec < now_sec) {
                        return res.status(200).json({ success: false, code: 409, message: "Subscription expired on " + sub_end_date })
                    }

                    if (branches >= 1) {
                        ///this send message as wel
                        req.bundles = { status: 2, branches }
                        next()
                    } else {
                        return res.status(200).json({ success: false, code: 409, message: "Branch bundle is Finished" })
                    }

                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }
            })
        })

    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 409, message: 'Something wrong, try again' })

    }
}

var checkStaff = (req, res, next) => {

    try {

        var user = req.user.user_data

        var user_id = user.id;
        var company_id = user.company_id;
        var company_name = user.company_name;

        var time = new Date()
        var now_sec = Math.round(time.getTime() / 1000)


        var qq = "SELECT * FROM company WHERE id = ?;"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qq, [company_id], (err, company) => {
                if (!err) {

                    var branches = company[0].branches
                    var users = company[0].users
                    var parcels = company[0].parcels
                    var sms = company[0].sms
                    var status = company[0].status
                    var bundle = company[0].bundle
                    var sub_end_date = company[0].sub_end_date
                    var sub_end_sec = company[0].sub_end_sec


                    if (status == 0) {
                        return res.status(200).json({ success: false, code: 409, message: "Service is Closed for " + company_name })
                    }

                    if (sub_end_sec < now_sec) {
                        return res.status(200).json({ success: false, code: 409, message: "Subscription expired on " + sub_end_date })
                    }

                    if (users >= 1) {
                        ///this send message as wel
                        req.bundles = { status: 2, users }
                        next()
                    } else {
                        return res.status(200).json({ success: false, code: 409, message: "Staff bundle is Finished" })
                    }

                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }
            })
        })

    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 409, message: 'Something wrong, try again' })

    }
}

var checkSMS = (req, res, next) => {

    try {

        var user = req.user.user_data

        var user_id = user.id;
        var company_id = user.company_id;
        var company_name = user.company_name;

        var time = new Date()
        var now_sec = Math.round(time.getTime() / 1000)


        var qq = "SELECT * FROM company WHERE id = ?;"

        pool.getConnection((err, connection) => {
            if (err) throw err;
            ///check if user exist/
            connection.query(qq, [company_id], (err, company) => {
                if (!err) {

                    var branches = company[0].branches
                    var users = company[0].users
                    var parcels = company[0].parcels
                    var sms = company[0].sms
                    var status = company[0].status
                    var bundle = company[0].bundle
                    var sub_end_date = company[0].sub_end_date
                    var sub_end_sec = company[0].sub_end_sec


                    if (status == 0) {
                        return res.status(200).json({ success: false, code: 409, message: "Service is Closed for " + company_name })
                    }

                    if (sub_end_sec < now_sec) {
                        return res.status(200).json({ success: false, code: 409, message: "Subscription expired on " + sub_end_date })
                    }

                    if (sms > 1) {
                        ///this send message as wel
                        req.bundles = { status: 2, sms }
                        next()
                    } else {
                        return res.status(200).json({ success: false, code: 409, message: "Text SMS bundle is Finished" })
                    }

                } else {
                    console.log(err)
                    return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
                }
            })
        })

    } catch (error) {
        console.log(error)
        return res.status(200).json({ success: false, code: 409, message: 'Something wrong, try again' })

    }
}

module.exports = { checkParcels, checkBranch, checkStaff, checkSMS }