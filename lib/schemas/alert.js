'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = require('q').Promise;

const alertPropertiesSchema = new Schema({
  city: String,
  type: String,
  subtype: String,
  street: String,
  roadType: Number,
  confidence: Number,
  reliability: Number,
  reportDescription: String,
  reportRating: Number,
  magvar: Number,
  timestamp: Date
});

const alertGeometrySchema = new Schema({
  type: String,
  coordinates: [Number]
});

const alertSchema = new Schema({
  _id: String,
  type: String,
  properties: alertPropertiesSchema,
  geometry: alertGeometrySchema
});

module.exports = mongoose.model('Alert', alertSchema);
