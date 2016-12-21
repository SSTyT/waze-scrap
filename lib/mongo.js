'use strict';

const q = require('q');
const mongoose = require('mongoose');
const logger = require('./logger');

mongoose.Promise = require('q').Promise;

const connect = connecionString => {
  const deferred = q.defer();
  const db = mongoose.connection;

  mongoose.connect(connecionString);
  db.on('error', err => {
    logger.error(err.message)
    deferred.reject();
  });
  db.once('open', function() {
    logger.info('Conectado')
    deferred.resolve();
  });

  return deferred.promise;
}

module.exports = {
  connect
}
