'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = require('q').Promise;

const jamPropertiesSchema = new Schema({
  city: String,
  type: String,
  turnType: String,
  street: String,
  endNode: String,
  roadType: Number,
  speed: Number,
  delay: Number,
  length: Number,
  level: Number,
  blockingAlertUuid: String,
  timestamp: Date,
});

const jamGeometrySchema = new Schema({
  type: String,
  coordinates: [
    [Number]
  ]
});

const jamSchema = new Schema({
  _id: String,
  type: String,
  properties: jamPropertiesSchema,
  geometry: jamGeometrySchema
});

module.exports = mongoose.model('Jam', jamSchema);
