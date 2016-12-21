'use strict';

const config = require('./config');
const winston = require('winston');

module.exports = new(winston.Logger)({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.logs.console })
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.logs.exception })
  ]
});