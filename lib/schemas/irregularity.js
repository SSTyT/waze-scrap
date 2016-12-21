'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = require('q').Promise;

const irregularityPropertiesSchema = new Schema({
  city: String,
  type: String,
  street: String,
  endNode: String,
  jamLevel: Number,
  speed: Number,
  regularSpeed: Number,
  accuracy: Number,
  severity: Number,
  driversCount: Number,
  seconds: Number,
  delaySeconds: Number,
  length: Number,
  highway: Boolean,
  alertsCount: Number,
  detectionTime: Date,
  updateTime: Date
});

const irregularityGeometrySchema = new Schema({
  type: String,
  coordinates: [
    [Number]
  ]
});

const irregularitySchema = new Schema({
  _id: Number,
  type: String,
  properties: irregularityPropertiesSchema,
  geometry: irregularityGeometrySchema
});

module.exports = mongoose.model('Irregularity', irregularitySchema);
