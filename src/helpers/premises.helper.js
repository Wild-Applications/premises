//Authenticate Router
//Username and Password Login

//imports
var jwt = require('jsonwebtoken'),
Premises = require('../models/premises.schema.js'),
errors = require('../errors/errors.json');



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
        return callback({message:'err'}, null);
      }
      if(premises){
        var stripPremises = {};
        stripPremises._id = premises._id.toString();
        stripPremises.name = premises.name;
        stripPremises.description = premises.description;
        return callback(null, stripPremises);
      }else{
        return callback(null, null);
      }
    })
  });
};

premises.create = function(call, callback){
  //validation handled by database
  console.log(call.request);
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
};

premises.update = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback({message:err},null);
    }

    Premises.findOneAndUpdate({ owner: token.sub}, call.request, function(err, premises){

      if(err){

        console.log(err);
        return callback({message:'err'}, null);
      }

      var stripPremises = {};
      stripPremises._id = premises._id.toString();
      return callback(null, stripPremises);
    })
  });
};

premises.delete = function(call, callback){

};

premises.getOwner = function(call, callback){
  console.log(call.request.premisesId);
  Premises.findById(call.request.premisesId, function(err, premises){
    if(err){return callback(err, null)}
    callback(null, {ownerId: premises.owner});
  });
};

premises.getPremises = function(call, callback){
  Premises.findOne({_id: call.request.premisesId}, function(err, premises){
    if(err){return callback(err, null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    return callback(null, stripPremises);
  })
};

premises.getFromOwner = function(call, callback){
  Premises.findOne({owner: call.request._id}, function(err, premises){
    if(err){return callback(err, null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    return callback(null, stripPremises);
  })
};

premises.openPremises = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback({message:'Token invalids'},null);
    }

    Premises.findOne({ owner: token.sub}, function(err, premises){
      if(err){
        console.log(err);
        return callback({message:JSON.stringify({code:'10000001', error:errors['0001']})}, null);
      }
      if(premises){
        //verify payment details exist
        var paymentCall = function(metadata){
          return new Promise(function(resolve, reject){
            paymentClient.get({}, metadata, function(err, results){
              if(err){return reject(err);}
              if(results){
                return resolve(true);
              }
              return resolve(false);
            });
          });
        }
        //verify menu exists and is active
        var menuCall = function(metadata){
          return new Promise(function(resolve, reject){
            menuClient.getAll({}, metadata, function(err, results){
                if(err){return reject(err)}
                var hasActive = false;
                var hasMenu = false;
                console.log(results);
                if(results.menus.length != 0){
                  hasMenu = true;
                  for(var menuKey in results.menus){
                    if(results.menus[menuKey].active){
                      hasActive = true;
                      break;
                    }
                  }
                }

                return resolve({menu: hasMenu, active: hasActive});
            });
          });
        }
        var requests = [];
        requests[requests.length] = paymentCall(call.metadata);
        requests[requests.length] = menuCall(call.metadata);
        Promise.all(requests).then(allData => {
          if(allData[0] && allData[1].menu && allData[1].active){
            //premises can be opened
            premises.open = true;
            premises.save(function(err){
              if(err){
                return callback({message:JSON.stringify({code:'10010003', error:errors['0003']})}, null);
              }
              return callback(null, {});
            })
          }else{
            callback({message: JSON.stringify({code: '10000004', error:errors['0004']})}, null);
          }
        }, error => {
          callback({message:JSON.stringify({code:'10000003', error:errors['0003']})},null);
        })
      }else{
        return callback({message: JSON.stringify({code:'10000002', error:errors['0002']})},null);
      }
    })
  });
};


module.exports = premises;
