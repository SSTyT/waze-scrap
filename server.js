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

      var alert = sanitize(Object.assign({}, alertModel, alertData));

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
    jams.forEach(function(jamData) {

          var jam = sanitize(Object.assign({}, jamModel, jamData));

          var coords = jam.line.map((coord) => {
            return `ST_MakePoint(${coord.x},${coord.y})`;
          }).join();

          var line = `ST_SetSRID(ST_MakeLine(ARRAY[${coords}]),4326)`

          var insertJam = `INSERT INTO public.jams(
      uuid, city, type, "turnType", street, "endNode", "roadType", 
      speed, delay, length, level, geom, ${jam.blockingAlertUuid?'"blockingAlertUuid",':''} "timestamp")
      VALUES ('${jam.uuid}', '${jam.city}', '${jam.type}', '${jam.turnType}', '${jam.street}', '${jam.endNode}', ${jam.roadType}, 
      ${jam.speed}, ${jam.delay}, ${jam.length}, ${jam.level}, (${line}), ${jam.blockingAlertUuid?`'${jam.blockingAlertUuid}',`:''} '${moment(jam.pubMillis).format('YYYY-MM-DD HH:mm:ss')}-3');`;


      var updateJam = `UPDATE public.jams
      SET city='${jam.city}', type='${jam.type}', "turnType"='${jam.turnType}', street='${jam.street}', "endNode"='${jam.endNode}', 
      "roadType"=${jam.roadType}, speed=${jam.speed}, delay=${jam.delay}, length=${jam.length}, level=${jam.level}, geom=(${line}), ${jam.blockingAlertUuid?`"blockingAlertUuid"='${jam.blockingAlertUuid}',`:''}  
      "timestamp"='${moment(jam.pubMillis).format('YYYY-MM-DD HH:mm:ss')}-3'
    WHERE uuid = '${jam.uuid}';`

      pool.query(`SELECT uuid FROM public.jams WHERE uuid = '${jam.uuid}'`, function(err, result) {
        if (err) {
          onError(err);
        } else if (result.rows[0]) {
          pool.query(updateJam, onError);
          console.log(updateJam);
        } else {
          pool.query(insertJam, onError);
          console.log(insertJam);
        }
      });
    });
  }

  if (irregularities) {
    irregularities.forEach(function(irregularityData) {

      var irregularity = sanitize(Object.assign({}, irregularityModel, irregularityData));

      var coords = irregularity.line.map((coord) => {
        return `ST_MakePoint(${coord.x},${coord.y})`;
      }).join();

      var line = `ST_SetSRID(ST_MakeLine(ARRAY[${coords}]),4326)`

      var insertIrregularity = `INSERT INTO public.irregularities(
      id, city, type, street, "endNode", "jamLevel", speed, "regularSpeed", 
      accuracy, severity, "driversCount", seconds, "delaySeconds", 
      length, highway, "alertsCount", geom, "detectionTime", "updateTime")
      VALUES ('${irregularity.id}', '${irregularity.city}', '${irregularity.type}', '${irregularity.street}', '${irregularity.endNode}', ${irregularity.jamLevel}, ${irregularity.speed}, ${irregularity.regularSpeed}, 
      ${irregularity.accuracy}, ${irregularity.severity}, ${irregularity.driversCount}, ${irregularity.seconds}, ${irregularity.delaySeconds}, 
      ${irregularity.length}, ${irregularity.highway}, ${irregularity.alertsCount}, (${line}), '${moment(irregularity.detectionDateMillis).format('YYYY-MM-DD HH:mm:ss')}-3', '${moment(irregularity.updateDateMillis).format('YYYY-MM-DD HH:mm:ss')}-3');`;

      var updateIrregularity = `UPDATE public.irregularities
      SET city='${irregularity.city}', type='${irregularity.type}', street='${irregularity.street}', "endNode"='${irregularity.endNode}', "jamLevel"=${irregularity.jamLevel}, speed=${irregularity.speed}, 
      "regularSpeed"=${irregularity.regularSpeed}, accuracy=${irregularity.accuracy}, severity=${irregularity.severity}, "driversCount"=${irregularity.driversCount}, 
      seconds=${irregularity.seconds}, "delaySeconds"=${irregularity.delaySeconds}, length=${irregularity.length}, highway=${irregularity.highway}, "alertsCount"=${irregularity.alertsCount}, 
      geom=(${line}), "detectionTime"='${moment(irregularity.detectionDateMillis).format('YYYY-MM-DD HH:mm:ss')}-3', "updateTime"='${moment(irregularity.updateDateMillis).format('YYYY-MM-DD HH:mm:ss')}-3'
      WHERE id = '${irregularity.id}';`

      pool.query(`SELECT id FROM public.irregularities WHERE id = '${irregularity.id}'`, function(err, result) {
        if (err) {
          onError(err);
        } else if (result.rows[0]) {
          pool.query(updateIrregularity, onError);
          console.log(updateIrregularity);
        } else {
          pool.query(insertIrregularity, onError);
          console.log(insertIrregularity);
        }
      });
    });
  } 
}

function sanitize(model){
  var keys = Object.keys(model);
  keys.forEach((key) => {
  if(typeof model[key] === 'string'){
    model[key] = model[key].replace(/'/gi,`''`);
    }
  });
  return model;
}
