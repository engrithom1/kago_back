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
        title:"Home",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/index',{seo_content});
} 

//home page
exports.about = (req, res) => {

    const seo_content = {
        title:"About Us",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/about',{userInfo:userInfo,seo_content});
} 

exports.contact = (req, res) => {

    const seo_content = {
        title:"Contact Us",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/contact',{userInfo:userInfo,seo_content});
} 

exports.price = (req, res) => {

    const seo_content = {
        title:"Price",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/price',{userInfo:userInfo,seo_content});
} 

exports.blog = (req, res) => {

    const seo_content = {
        title:"Blog",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/blog',{userInfo:userInfo,seo_content});
}

//home page
exports.apiDoc = (req, res) => {
         
    const seo_content = {
        title:"kagopoint doc api",
        description:"Kagopoint is the solution to securely store information about your cargo, revenue and customers. with affordable price"
    }

    res.render('general/api_doc',{layout:'doc'});
} 