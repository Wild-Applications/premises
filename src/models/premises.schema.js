var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  name : { type : String, required : true },
  owner: { type : Number, required : true, index: true },
  descr: { type : string, required: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Premises', schema);
