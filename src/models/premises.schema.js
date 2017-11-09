var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  name : { type : String, required : true },
  owner: { type : Number, required : true, index: {unique: true} },
  description: { type : String, required: false },
  open: { type: Boolean, required: true, default: false}
}, {
  timestamps: true
});

module.exports = mongoose.model('Premises', schema);
