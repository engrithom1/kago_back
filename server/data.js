
var userInfo = {isLoged:false,user:{}}

//var upload_path = "../new_forum/public"
var upload_path = "/home/shaiutya/shineportal/public"

module.exports = {
  upload_path,
  accessTokenSecret: 'myAccessTokenSecret',
  accessTokenExpiresIn: '54w',//30m
  refreshTokenSecret: 'myRefreshTokenSecret',
  refreshTokenExpiresIn: '60w',//1w
  cacheTemporaryTokenPrefix: 'temp_token:',
  cacheTemporaryTokenExpiresInSeconds: 180 }