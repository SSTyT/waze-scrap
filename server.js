var request = require('request');
var winston = require('winston');
var Pool = require('pg').Pool;
var config = require('./config.json');

//Winston logger
var logger = new(winston.Logger)({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.logs.console })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: config.logs.exception })
  ]
});

var onError = function(err) {
  if (err) {
    logger.error(err.message);
  }
};

//Postgresql
var dbConfig = config.db;

dbConfig.poolLog = function(log, level) {
  if (level === 'error') {
    logger.error(log);
  } else if (level === 'warn') {
    logger.warn(log);
  }
}

var pool = new Pool(config.db);
pool.on('error', onError);

// Get data
logger.info('Server start');

var url = 'https://world-georss.waze.com/rtserver/web/TGeoRSS?tk=ccp_partner&ccp_partner_name=Hillsborough&format=JSON&types=traffic,alerts,irregularities&polygon=-58.456879,-34.532130;-58.493958,-34.546836;-58.531723,-34.615241;-58.526917,-34.659307;-58.458252,-34.706737;-58.406754,-34.659307;-58.339462,-34.649705;-58.362122,-34.579633;-58.409500,-34.559843;-58.456879,-34.532130;-58.456879,-34.532130';

setInterval(function() {
  var body = [];
  request
    .get(url)
    .on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      body = Buffer.concat(body).toString();
      scrap(JSON.parse(body));
    })
    .on('error', onError);
}, 60000 * 10);

var alertModel = {
  uuid: '',
  city: '',
  type: '',
  subtype: '',
  street: '',
  roadType: 0,
  confidence: 0,
  reliability: 0,
  reportRating: 0,
  magvar: 0,
  location: {
    x: 0,//long
    y: 0//lat
  },
  pubMillis: 0
}

var irregularityModel = {
  updateDate: '',
  city: '',
  line: [{
    x: 0,
    y: 0
  }],
  detectionDateMillis: 0,
  accuracy: 0
  type: '',
  endNode: '',
  speed: 0,
  seconds: 0,
  street: '',
  jamLevel: 0,
  id: 0,
  highway: false,
  delaySeconds: 0,
  severity: 0,
  driversCount: 0,
  alertsCount: 0,
  length: 0,
  updateDateMillis: 0,
  detectionDate: '',
  regularSpeed: 0
}

var jamModel = {
    city: '',
    level: ,
    line: [{
      x: 0,
      y: 0
    }],
    length: 0,
    turnType: '',
    type: '',
    uuid: '',
    endNode: '',
    speed: ,
    blockingAlertUuid: '', //fk de alert
    roadType: 0,
    delay: 0,
    street: '',
    pubMillis: 0
  },

  function scrap(data) {

  }
