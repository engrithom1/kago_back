
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

function isNumeric(num) {
    return /^-?\d+$/.test(num)
}

/************************************MESSAGES FUNCTIONS */

exports.sendSMS = async (number, message) => {

    var reff = Math.floor(10000 + Math.random() * 90000)

    var phone = '255' + number.substring(1);

    var Url = 'https://messaging-service.co.tz/api/sms/v1/text/single';
    var auth = 'bmFzc2lidW1rYWxpOlNoaW5lcG9ydGFs';

    var res = await axios({
        method: "post",
        url: Url,
        data: {
            'from': 'ShinePortal',
            'to': phone,
            'text': message,
            'reference': reff
        },
        headers: {
            'Authorization': 'Basic bmFzc2lidW1rYWxpOlNoaW5lcG9ydGFs',
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
    var auth = 'bmFzc2lidW1rYWxpOlNoaW5lcG9ydGFs';

    var res = await axios({
        method: "post",
        url: Url,
        data: {
            'from': 'ShinePortal',
            'to': numberz,
            'text': message,
            'reference': reff
        },
        headers: {
            'Authorization': 'Basic bmFzc2lidW1rYWxpOlNoaW5lcG9ydGFs',
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

/******************************VALIDATION FUNCTIONS*/

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
        if (password.length <= "8" || password.length > 20) {
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
        if (name.length <= 2 || name.length > 200) {
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
