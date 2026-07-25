const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

function categoryToClient(doc) {
  const id = doc._id.toString();
  return { _id: id, id, name: doc.name };
}

categorySchema.statics.toClient = categoryToClient;

module.exports = mongoose.model('Category', categorySchema);
module.exports.categoryToClient = categoryToClient;
