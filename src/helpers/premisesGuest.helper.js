//Authenticate Router
//Username and Password Login

//imports
var jwt = require('jsonwebtoken'),
Premises = require('../models/premises.schema.js');



//var jwt = require('jsonwebtoken');
//var tokenService = require('bleuapp-token-service').createTokenHandler('service.token', '50051');

var premises = {};

premises.get = function(call, callback){
  Premises.findOne({_id: call.request._id}, function(err, premises){
    if(err){return callback(err, null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    return callback(null, stripPremises);
  })
}

module.exports = premises;
