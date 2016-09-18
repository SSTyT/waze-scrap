var request = require('request');
var winston = require('winston');
var moment = require('moment');
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

function wazeRequest() {
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
}

wazeRequest();
setInterval(wazeRequest, 60000 * 10);

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
    x: 0, //long
    y: 0 //lat
  },
  pubMillis: 0
}

var irregularityModel = {
  id: 0,
  city: '',
  type: '',
  street: '',
  endNode: '',
  jamLevel: 0,
  speed: 0,
  regularSpeed: 0,
  accuracy: 0,
  severity: 0,
  driversCount: 0,
  seconds: 0,
  delaySeconds: 0,
  length: 0,
  highway: false,
  alertsCount: 0,
  line: [{
    x: 0,
    y: 0
  }],
  detectionDate: '',
  detectionDateMillis: 0,
  updateDate: '',
  updateDateMillis: 0,
}

var jamModel = {
  uuid: '',
  city: '',
  type: '',
  turnType: '',
  street: '',
  endNode: '',
  roadType: 0,
  speed: 0,
  delay: 0,
  length: 0,
  level: 0,
  line: [{
    x: 0,
    y: 0
  }],
  blockingAlertUuid: '', //fk de alert
  pubMillis: 0
};

function scrap(data) {

  var alerts = data.alerts;
  var jams = data.jams;
  var irregularities = data.irregularities;

  if (alerts) {
    alerts.forEach(function(alertData) {

      var alert = Object.assign({}, alertModel, alertData);

      var insertAlert = `INSERT INTO public.alerts(
      uuid, city, type, subtype, street, "roadType", confidence, reliability, 
      "reportRating", magvar, geom, "timestamp")
      VALUES ('${alert.uuid}', '${alert.city}', '${alert.type}', '${alert.subtype}', '${alert.street}', ${alert.roadType}, ${alert.confidence}, ${alert.reliability}, 
      ${alert.reportRating}, ${alert.magvar}, (ST_SetSRID(ST_MakePoint(${alert.location.x},${alert.location.y}),4326)), 
      '${moment(alert.pubMillis).format('YYYY-MM-DD HH:mm:ss')}-3');`;


      var updateAlert = `UPDATE public.alerts
      SET city='${alert.city}', type='${alert.type}', subtype='${alert.subtype}', street='${alert.street}', "roadType"='${alert.roadType}', confidence=${alert.confidence}, 
      reliability=${alert.reliability}, "reportRating"=${alert.reportRating}, magvar=${alert.magvar}, geom=(ST_SetSRID(ST_MakePoint(${alert.location.x},${alert.location.y}),4326)), 
      "timestamp"='${moment(alert.pubMillis).format('YYYY-MM-DD HH:mm:ss')}-3'
      WHERE uuid='${alert.uuid}';`

      pool.query(`SELECT uuid FROM public.alerts WHERE uuid = '${alert.uuid}'`, function(err, result) {
        if (err) {
          onError(err);
        } else if (result.rows[0]) {
          pool.query(updateAlert, onError);
          console.log(updateAlert);
        } else {
          pool.query(insertAlert, onError);
          console.log(insertAlert);
        }
      });
    });
  }

  if (jams) {
    jams.forEach(function(jam) {
      console.log("un jam");
    });
  }

  if (irregularities) {
    irregularities.forEach(function(irregularity) {
      console.log("un irregularity");
    });
  }
}
