
const axios = require("axios");
//var $ = require( "jquery" );

/*********************RENDOM FUNCTIONS */

exports.getSlug = (str, id, len) => {

    if (str.length > len) {
        str = str.substr(0, len)
    }
    str = str + '-' + id
    str = str.toString()                     // Cast to string
    str = str.toLowerCase()                  // Convert the string to lowercase letters
    str = str.normalize('NFD')       // The normalize() method returns the Unicode Normalization Form of a given string.
    str = str.trim()                         // Remove whitespace from both sides of a string
    str = str.replace(/\s+/g, '-')           // Replace spaces with -
    str = str.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    str = str.replace(/\-\-+/g, '-');     // Replace multiple - with single -

    return str
}

exports.getIdFromSlug = (slug) => {
    var strArry = slug.split("-")
    return strArry[strArry.length - 1]
}

exports.randomString = (length, chars) => {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

exports.numberOfMessages = (message) =>{
 //159
//Message length 153, 306, 459.
var sms_len = message.length
if(sms_len <= 153){
    return 1
}
if(sms_len > 153 && sms_len <= 306){
   return 2
}

if(sms_len > 306 && sms_len <= 459){
   return 3
}

if(sms_len >= 460){
    return 0
}

}

exports.toDay = () => {
    const dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; // months from 1-12
    var year = dateObj.getUTCFullYear();
    var day = dateObj.getUTCDate();

    if (day < 10) {
        day = '0' + day
    }
    if (month < 10) {
        month = '0' + month
    }
    var today = (year + "" + "" + month + "" + day)
    return parseInt(today)
}

exports.toDayDateTimes = (n) => {

    // n = 0 start time n= 1 end time
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

    var date_ = '0000-00-00 00:00:00'

    if(n == 0){
      date_ = yy + '-' + mm + '-' + dd + ' 00:00:00'
    }

    if(n == 1){
       date_ = yy + '-' + mm + '-' + dd + ' 23:59:59'
    }
    
    return date_
}

exports.dateTimeDays = (days) => {

     var last_n = new Date();
    last_n.setDate(last_n.getDate() - days);

    var yy = last_n.getFullYear()
    var dd = last_n.getDate()
    var mm = last_n.getMonth() + 1

    if (mm < 10) {
        mm = '0' + mm
    }

    if (dd < 10) {
        dd = '0' + dd
    }

    var date_start = yy + '-' + mm + '-' + dd + ' 00:00:00'
    return date_start
}

function isNumeric(num) {
    return /^-?\d+$/.test(num)
}

/************************************MESSAGES FUNCTIONS */

exports.sendSMS = async (number, message) => {

    var reff = Math.floor(10000 + Math.random() * 90000)

    var phone = '255' + number.substring(1);

    var Url = 'https://messaging-service.co.tz/api/sms/v1/text/single';
    var auth = 'YWtpbGlrdWJ3YTpuZXh0YWtpbGkwMzAxPyo=';

    var res = await axios({
        method: "post",
        url: Url,
        data: {
            'from': 'KAGOPOINT',
            'to': phone,
            'text': message,
            'reference': reff
        },
        headers: {
            'Authorization': 'Basic YWtpbGlrdWJ3YTpuZXh0YWtpbGkwMzAxPyo=',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        .catch((err) => {
            console.log(err)
            return err
        });
    return res

}

exports.sendMultSMS = async (numberz, message) => {

    var reff = Math.floor(10000 + Math.random() * 90000)

    var Url = 'https://messaging-service.co.tz/api/sms/v1/text/single';
    var auth = 'YWtpbGlrdWJ3YTpuZXh0YWtpbGkwMzAxPyo=';

    var res = await axios({
        method: "post",
        url: Url,
        data: {
            'from': 'KAGOPOINT',
            'to': numberz,
            'text': message,
            'reference': reff
        },
        headers: {
            'Authorization': 'Basic YWtpbGlrdWJ3YTpuZXh0YWtpbGkwMzAxPyo=',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        .catch((err) => {
            console.log(err)
            return err
        });
    return res
}

///send sngle message

exports.sendToAkiliSingleSMS = async(phone, message, sms_code) =>{

    var Url ='https://akilisms.com/api/clients/send-single-message';
    //var Url ='https://sms.akilisms.com/api/clients/send-message';
    //var Url ='http://192.168.0.2:2506/api/clients/send-single-message';

    var ress = await axios({
        method: "post",
        url: Url,
        data:{
            'company_code':sms_code,
            'phoneno':phone,
            'message':message,
            
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'   
        }
        
    })
    .catch((err) => {
        console.log(err)
        return { success: false, message: 'Failed to Sent Request' };
        //return err
    });

    return ress
}

//send mult message
exports.sendToAkiliMultSMS = async(phone,message) =>{

    //var Url ='https://akilisms.com/api/clients/send-mult-message';
    //var Url ='https://sms.akilisms.com/api/clients/send-message';
    var Url ='http://192.168.0.2:2506/api/clients/send-mult-message';

    var ress = await axios({
        method: "post",
        url: Url,
        data:{
            'company_code':'2',
            'phoneno':phone,
            'message':message,
            
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'   
        }
        
    })
    .catch((err) => {
        console.log(err)
        return {data:{ success: false, message: 'Failed to Sent Request' }};
        //return err
    });

    return ress
}

////get datas 
exports.akiliSMSData = async(sms_code) =>{

    var Url ='https://akilisms.com/api/clients/get-messages-data';
    //var Url ='http://192.168.0.2:2506/api/clients/get-messages-data';

    var ress = await axios({
        method: "post",
        url: Url,
        data:{
            'company_code':sms_code,   //112998 
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'   
        }
        
    })
    .catch((err) => {
        console.log(err)
        return {data:{ success: false, message: 'Failed to Sent Request' }};
        //return err
    });

    return ress
}

////get datas 
exports.akiliSMSAdminData = async(sms_codes, sms_code) =>{

    var Url ='https://akilisms.com/api/clients/get-admin-messages-data';
    //var Url ='http://192.168.0.2:2506/api/clients/get-admin-messages-data';

    var ress = await axios({
        method: "post",
        url: Url,
        data:{
            'sms_codes':sms_codes,   //112998 
            'company_code':sms_code,
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'   
        }
        
    })
    .catch((err) => {
        console.log(err)
        return {data:{ success: false, message: 'Failed to Sent Request' }};
        //return err
    });

    return ress
}

/******************************VALIDATION FUNCTIONS*/
exports.validatePriceValue = async (price, value) => {

    var _price = price.toString().slice(-2)
    var _value = value.toString().slice(-2)

    //console.log(_price+", "+_value)

    if (_price.toString() == '00' && _value.toString() == '00') {
        if(price > parseInt(value / 2)){
            return 'Price is too High' 
        }else{
            if (price < 4000) {
                return 'Price is too Low (must not be less than 4000)' 
            } else {
               return true 
            }
        }
    } else {
        if(_price.toString() != '00' && _value.toString() != '00'){
           return 'Package Value and Price are Incorrect'
        }else{
           if(_price.toString() != '00'){
               return 'Price is Incorrect '+price.toString()
           }else{
               return 'Package Value is Incorrect '+value.toString()
           }
        }

    }

}

exports.validatePhone = async (phone) => {

    if (!phone) {
        return 'Phone Number is required'
    } else {
        if (phone.length == "10") {
            var first = phone.slice(0, 1)
            var last = phone.slice(-9)

            if (first == '0' || first == 0) {
                //alert(first+" - "+last);
                if (isNumeric(last)) {
                    return true;
                } else {
                    return 'Phonenumber must be Integer value'

                }
            } else {
                return 'Phonenumber must begin with 0'

            }

        } else {
            return 'Enter correct Phone number'

        }
    }
}

exports.validateUsername = async (fullname) => {
    if (!fullname) {
        return 'Fulname is required'
    } else {
        if (fullname.length <= "4" || fullname.length > 50) {
            return 'Fullname is not correct'

        } else {
            return true
        }
    }
}

exports.validatePassword = async (password) => {
    if (!password) {
        return 'Fulname is required'
    } else {
        if (password.length < 8 || password.length > 20) {
            return 'Password must have 8 to 20 Character'

        } else {
            return true
        }
    }

}

exports.validateNames = async (name, label) => {
    if (!name) {
        return label + ' is required'
    } else {
        if (name.length <= 2 || name.length > 100) {
            return label + ' is not correct'

        } else {
            return true
        }
    }
}

exports.validateDescription = async (name, label) => {
    if (!name) {
        return label + ' is required'
    } else {
        if (name.length <= 2 || name.length > 450) {
            return label + ' is not correct'

        } else {
            return true
        }
    }
}

exports.validateMessage = async (name) => {
    if (!name) {
        return 'Message is required'
    } else {
        if (name.length > 360) {
            return ' Message is too long, must be less than 360 character. you have '+name.length

        } else {
            return true
        }
    }
}

exports.validateStatus = async (status, label) => {
   
        if (status === 0 || status === 1) {

            return true
            
        } else {
            return label + ' is not correct'

        }
    
}

exports.validatePhone = async (phone, label) => {

    if (!phone) {
        return label + ' Phone Number is required'
    } else {
        if (phone.length == "10") {
            var first = phone.slice(0, 1)
            var last = phone.slice(-9)

            if (first == '0' || first == 0) {
                //alert(first+" - "+last);
                if (isNumeric(last)) {
                    return true;
                } else {
                    return 'Phonenumber must be Integer value'

                }
            } else {
                return 'Phonenumber must begin with 0'

            }

        } else {
            return label + ' Phone number must have 10 digits'

        }
    }
}

exports.validatePrice = async (price, label) => {

    if (!price) {
        return label + ' is required'
    } else {

        //alert(first+" - "+last);
        if (isNumeric(price)) {
            if (price >= 1000) {
                return true;
            } else {
                return 'Minimum Prices is 1000'

            }
        } else {
            return 'Price must be Integer value'

        }



    }
}

exports.validateIntNum = async (int_num, label) => {

    if (!int_num) {
        return label + ' is required'
    } else {
        //alert(first+" - "+last);
        if (isNumeric(int_num)) {
            return true;
        } else {
            return label + ' must be Integer value'

        }

    }
}
