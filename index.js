require('dotenv').config();

const express = require('express');
const exphbs = require("express-handlebars");
const cookieParser = require('cookie-parser');
var cors = require('cors');
////const session = require('express-session')
const bodyParser = require("body-parser");
//var { v4: uuidv4 } = require("uuid");
var moment = require("moment");

var path = require("path");

const app = express();
const PORT = 2025 || process.env.PORT;

//parsing middleware
///allow data to be sent by submit form
//app.use(express.urlencoded({extended:true}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(express.json());


app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method',
  );
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});




//add public media and resourse file
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, "/uploads")));
app.use(express.static(path.join(__dirname, "/node_modules")));

//template Engine
const handlebars = exphbs.create({
  extname: ".hbs",
  helpers: {
    substr: function (len, context) {
      if (context.length > len) {
        return context.substring(0, len) + "...";
      } else {
        return context;
      }
    },
    subdate: function (context) {
      //var context = context.toString()
      return moment(context).format("DD - MMMM - YYYY");
    },
    if_function: function (v1, v2) {
      if (v1 == v2) {
        return true;
      } else {
        return false;
      }
    },
    if_student_has_data: function (sl, re) {
      if (sl > 0 && re <= 2) {
        return true;
      } else {
        return false;
      }
    },
    index_of: function (arr, ind) {
      return arr[ind]
    },
    if_student_has_not_data: function (sl, re) {
      if (sl == 0 && re < 3) {
        return true;
      } else {
        return false;
      }
    },
    minus: function (v1, v2) {
        return (v1 - v2)
    },
    if_equal: function (v1, v2) {
      if (v1 == v2) {
        return true;
      } else {
        return false;
      }
    },
    if_greater: function (v1, v2) {
      if (v1 > v2) {
        return true;
      } else {
        return false;
      }
    },
    if_not_equal: function (v1, v2) {
      if (v1 != v2) {
        return true;
      } else {
        return false;
      }
    },
    price: function (price) {
      return price.toLocaleString();
    },
  },
});
app.engine(".hbs", handlebars.engine);
app.set("view engine", ".hbs");

//routs issues
app.use('/', require('./server/routes/main'));
app.use('/api', require('./server/routes/api'));
  
app.listen(PORT, ()=>{
    console.log(`Kagopoint. is now Running on Port ${PORT}`);
});

//app.listen();

/**
 *  "canvas": "^2.11.2",
 */