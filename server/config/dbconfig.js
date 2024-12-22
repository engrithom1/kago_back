const mysql = require('mysql');
//connection pool
const pool = mysql.createPool({
    connectionLimit : 100,
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASS,
    database        : process.env.DB_NAME,
    multipleStatements: true 
})

module.exports = pool
/*module.exports = {
    pool, 
    accessTokenSecret: 'myAccessTokenSecret',
    accessTokenExpiresIn: '30m',
    refreshTokenSecret: 'myRefreshTokenSecret',
    refreshTokenExpiresIn: '1w',
    cacheTemporaryTokenPrefix: 'temp_token:',
    cacheTemporaryTokenExpiresInSeconds: 180
}*/