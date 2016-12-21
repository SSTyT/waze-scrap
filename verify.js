'use strict';

const request = require('request');
const config = require('./lib/config');
const schemas = require('./lib/schemas');
const mongo = require('./lib/mongo');

mongo.connect(config.db.connectionString).then(() => {
  schemas.alert.findOne({}, (err, alert) => err ? console.log(err.message) : console.log(JSON.stringify(alert)));
  schemas.jam.findOne({}, (err, jam) => err ? console.log(err.message) : console.log(JSON.stringify(jam)));
  schemas.irregularity.findOne({}, (err, irregularity) => err ? console.log(err.message) : console.log(JSON.stringify(irregularity)));
});
