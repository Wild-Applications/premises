//Authenticate Router
//Username and Password Login

//imports
var jwt = require('jsonwebtoken'),
Premises = require('../models/premises.schema.js'),
errors = require('../errors/errors.json');



//var jwt = require('jsonwebtoken');
//var tokenService = require('bleuapp-token-service').createTokenHandler('service.token', '50051');

var grpc = require("grpc");
var paymentDescriptor = grpc.load(__dirname + '/../proto/payment.proto').payment;
var paymentClient = new paymentDescriptor.PaymentService('service.payment:1295', grpc.credentials.createInsecure());

var menuDescriptor = grpc.load(__dirname + '/../proto/menu.proto').menu;
var menuClient = new menuDescriptor.MenuService('service.menu:1295', grpc.credentials.createInsecure());

var premises = {};

premises.get = function(call, callback){
  //protected route so verify token;
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback(errors['0006'],null);
    }
    Premises.findOne({ owner: token.sub}, function(err, premises){
      if(err){
        return callback(errors['0001'], null);
      }
      if(premises){
        var stripPremises = {};
        stripPremises._id = premises._id.toString();
        stripPremises.name = premises.name;
        stripPremises.description = premises.description;
        stripPremises.open = premises.open;
        return callback(null, stripPremises);
      }else{
        return callback(errors['0002'], null);
      }
    })
  });
};

premises.create = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      console.log('error here');
      return callback(errors['0006'],null);
    }
    //validation handled by database
    call.request.owner = token.sub;
    var newPremises = new Premises(call.request);
    newPremises.save(function(err, result){
      if(err){
        console.log('actually here ', err);
        return callback(errors['0007'],null);
      }
      return callback(null, {_id: result._id.toString()});
    });
  });
};

premises.update = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      console.log('update rrr', err);
      return callback(errors['0006'],null);
    }

    var objToSave = {};

    if(call.metadata.get('present')){
      //we have been passed information about what should be updated
      var presentString = call.metadata.get('present').toString();
      console.log(presentString.toString());
      var present = presentString.split(',');
      for(var item in present){
        objToSave[present[item]] = call.request[present[item]];
      }
    }else{
      objToSave = call.request;
    }
    console.log(objToSave);

    Premises.findOneAndUpdate({ owner: token.sub}, objToSave, function(err, premises){

      if(err){
        console.log('1st', err);
        return callback(errors['0001'], null);
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
  Premises.findById(call.request.premisesId, function(err, premises){
    if(err){return callback(errors['0009'], null)}
    callback(null, {ownerId: premises.owner});
  });
};

premises.getPremises = function(call, callback){
  Premises.findOne({_id: call.request.premisesId}, function(err, premises){
    if(err){return callback(errors['0010'], null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    stripPremises.open = premises.open;
    return callback(null, stripPremises);
  })
};

premises.getFromOwner = function(call, callback){
  Premises.findOne({owner: call.request._id}, function(err, premises){
    if(err){return callback(errors['0010'], null)}
    var stripPremises = {};
    stripPremises._id = premises._id.toString();
    stripPremises.name = premises.name;
    stripPremises.description = premises.description;
    stripPremises.open = premises.open;
    return callback(null, stripPremises);
  })
};

premises.openPremises = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback(errors['0006'],null);
    }

    Premises.findOne({ owner: token.sub}, function(err, premises){
      if(err){
        console.log('1 ', err);
        return callback(errors['0003'], null);
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
                return callback(errors['0003'], null);
              }
              return callback(null, {});
            })
          }else{
            return callback(errors['0004'], null);
          }
        }, error => {
          console.log('2', error);
          callback(errors['0003'],null);
        })
      }else{
        console.log('3');
        return callback(errors['0002'],null);
      }
    })
  });
};

premises.closePremises = function(call, callback){
  jwt.verify(call.metadata.get('authorization')[0], process.env.JWT_SECRET, function(err, token){
    if(err){
      return callback(errors['0006'],null);
    }

    Premises.findOneAndUpdate({ owner: token.sub}, {open: false}, function(err, premises){

      if(err){
        return callback(errors['0005'], null);
      }
      return callback(null, {});
    })
  });
}


module.exports = premises;
