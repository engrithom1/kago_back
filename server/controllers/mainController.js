const pool = require('../config/dbconfig')
var data = require('../data')

var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');

const axios = require('axios')

var moment = require('moment');

var richFunctions = require('../richardFunctions')

var userInfo = data.userInfo

//home page
exports.home = (req, res) => {

    const seo_content = {
        title: "Home | Smart Cargo Management for Tanzanian Logistics Companies",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/index', { seo_content });
}

//home page
exports.about = (req, res) => {

    const seo_content = {
        title: "About Us",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/about', { userInfo: userInfo, seo_content });
}

exports.contact = (req, res) => {

    const seo_content = {
        title: "Contact Us",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/contact', { userInfo: userInfo, seo_content });
}

exports.price = (req, res) => {

    const seo_content = {
        title: "Price",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/price', { userInfo: userInfo, seo_content });
}

exports.blog = (req, res) => {

    const seo_content = {
        title: "Blog",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/blog', { userInfo: userInfo, seo_content });
}

exports.policy = (req, res) => {

    const seo_content = {
        title: "Terms conditionds and privacy policy",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/policy', { userInfo: userInfo, seo_content });
}

exports.dataSafety = (req, res) => {

    const seo_content = {
        title: "Terms conditionds and privacy policy",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/data_safety', { userInfo: userInfo, seo_content });
}

//home page
exports.apiDoc = (req, res) => {

    const seo_content = {
        title: "kagopoint doc api",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }

    res.render('general/api_doc', { layout: 'doc' });
}

exports.createAccount = (req, res) => {

    const seo_content = {
        title: "kagopoint create account | kagopoint.com",
        description: "Kusudi kuu la KAGOPOINT ni kuongeza uhakika, uwazi, kasi na ufanisi kwa kampuni zote za kusafirisha mizigo."
    }
    var query = "SELECT * FROM region ORDER BY id ASC"
    pool.getConnection((err, connection) => {
        if (err) throw err; // not connected
        //console.log('Connected!');

        connection.query(query, (err, regions) => {
connection.release();
            if (!err) {
                res.render('general/create_account',{seo_content,regions});
            } else {
                //console.log(err);
                res.render('general/create_account',{seo_content,regions:[]});
                //return res.status(200).json({ success: false, code: 500, message: "Server or Database error" })
            }

        });
    });

}
