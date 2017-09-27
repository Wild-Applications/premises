//Authenticate Router
//Username and Password Login

//imports
var jwt = require('jsonwebtoken'),
Premises = require('../models/premises.schema.js');



//var jwt = require('jsonwebtoken');
//var tokenService = require('bleuapp-token-service').createTokenHandler('service.token', '50051');

var premises = {};

premises.get = function(call, callback){
  //protected route so verify token;
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback({message:err},null);
    }
    console.log(token.sub);
    Premises.findOne({ owner: token.sub}, function(err, premises){
      if(err){
        console.log(err);
        return callback({message:'err'}, null);
      }
      var stripPremises = {};
      stripPremises._id = premises._id.toString();
      stripPremises.name = premises.name;
      stripPremises.description = premises.description;
      return callback(null, stripPremises);
    })
  });
}

premises.create = function(call, callback){
  //validation handled by database
  var newPremises = new Premises(call.request);
  console.log('created new premises');
  newPremises.save(function(err, result){
    console.log('saved new premises');
    if(err){
      console.log(err);
      return callback({message:'err'},null);
    }
    return callback(null, {_id: result._id.toString()});
  });
}

premises.update = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback({message:err},null);
    }
    console.log('1');
    console.log('owner: ' + JSON.stringify(call.request));
    Premises.findOneAndUpdate({ owner: token.sub}, call.request, function(err, premises){
      console.log('2');
      if(err){
        console.log('3');
        console.log(err);
        return callback({message:'err'}, null);
      }
      console.log('4');
      var stripPremises = {};
      stripPremises._id = premises._id.toString();
      return callback(null, stripPremises);
    })
  });
}

premises.delete = function(call, callback){

}

premises.getOwner = function(call, callback){
  console.log(call.request.premisesId);
  Premises.findById(call.request.premisesId, function(err, premises){
    if(err){return callback(err, null)}
    callback(null, {ownerId: premises.owner});
  });
}

premises.getPremises = function(call, callback){
  Premises.findOne({owner: call.request._id}, function(err, premises){
    if(err){return callback(err, null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    return callback(null, stripPremises);
  })
}


module.exports = premises;
