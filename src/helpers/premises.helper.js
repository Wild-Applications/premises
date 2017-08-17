//Authenticate Router
//Username and Password Login

//imports
var jwt = require('jsonwebtoken');



//var jwt = require('jsonwebtoken');
//var tokenService = require('bleuapp-token-service').createTokenHandler('service.token', '50051');

var premises = {};

premises.get = function(call, callback){
  //protected route so verify token;
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback({message:err},null);
    }

  });
}

premises.create = function(call, callback){

}

premises.update = function(call, callback){

}

premises.delete = function(call, callback){

}


module.exports = premises;
