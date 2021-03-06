//Account service

//Imports
const grpc = require('grpc');
const premisesHelper = require('./helpers/premises.helper.js');
const proto = grpc.load(__dirname + '/proto/premises.proto');
const server = new grpc.Server();
const mongoose = require('mongoose');
const dbUrl = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@" + process.env.DB_HOST;
mongoose.connect(dbUrl);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});


//define the callable methods that correspond to the methods defined in the protofile
server.addService(proto.premises.PremisesService.service, {
  get: function(call, callback){
    premisesHelper.get(call, callback);
  },
  create: function(call, callback){
    premisesHelper.create(call,callback);
  },
  update: function(call, callback){
    premisesHelper.update(call,callback);
  },
  delete: function(call, callback){
    premisesHelper.delete(call, callback);
  },
  getOwner: function(call, callback){
    premisesHelper.getOwner(call, callback);
  },
  getFromOwner: function(call, callback){
    premisesHelper.getFromOwner(call, callback);
  },
  getPremises: function(call, callback){
    premisesHelper.getPremises(call, callback);
  },
  open: function(call, callback){
    premisesHelper.openPremises(call, callback);
  },
  close: function(call, callback){
    premisesHelper.closePremises(call, callback);
  }
});

server.addService(proto.premises.GuestService.service, {
  get: function(call, callback){
    premisesGuestHelper.get(call, callback);
  }
});

//Specify the IP and and port to start the grpc Server, no SSL in test environment
server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());

//Start the server
server.start();
console.log('gRPC server running on port: 50051');


process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM. Graceful shutdown start', new Date().toISOString())
  server.tryShutdown(()=>{
    process.exit(1);
  })
});
