'use strict';

const request = require('request');
const config = require('./lib/config');
const logger = require('./lib/logger');
const schemas = require('./lib/schemas');
const mongo = require('./lib/mongo');

const url = 'https://world-georss.waze.com/rtserver/web/TGeoRSS?tk=ccp_partner&ccp_partner_name=Hillsborough&format=JSON&types=traffic,alerts,irregularities&polygon=-58.456879,-34.532130;-58.493958,-34.546836;-58.531723,-34.615241;-58.526917,-34.659307;-58.458252,-34.706737;-58.406754,-34.659307;-58.339462,-34.649705;-58.362122,-34.579633;-58.409500,-34.559843;-58.456879,-34.532130;-58.456879,-34.532130';

const onError = err => err ? logger.error(err.message) : undefined;

const wazeRequest = () => {
  let body = [];
  request
    .get(url)
    .on('data', chunk => body.push(chunk))
    .on('end', () => scrap(JSON.parse(Buffer.concat(body).toString())))
    .on('error', onError);
}

mongo.connect(config.db.connectionString).then(() => {
  logger.info('Scrap start');
  wazeRequest();
  setInterval(wazeRequest, 60000 * 10);
});

const scrap = data => {
  const alerts = data.alerts;
  const jams = data.jams;
  const irregularities = data.irregularities;

  if (alerts) {
    alerts.forEach(alertData => {
      schemas.alert.findById(alertData.uuid, (err, alert) => {
        if (!alert) {
          console.log('creando alert ' + alertData.uuid);
          alert = new schemas.alert({ _id: alertData.uuid });
        } else {
          console.log('modificando alert ' + alertData.uuid)
        }

        alert.type = 'Feature';
        alert.properties = {
          city: alertData.city,
          type: alertData.type,
          subtype: alertData.subtype,
          street: alertData.street,
          roadType: alertData.roadType,
          confidence: alertData.confidence,
          reliability: alertData.reliability,
          reportDescription: alertData.reportDescription,
          reportRating: alertData.reportRating,
          magvar: alertData.magvar,
          timestamp: new Date(alertData.pubMillis)
        };
        alert.geometry = {
          type: 'Point',
          coordinates: [alertData.location.x, alertData.location.y]
        };

        alert.save(err => err ? logger.error(err.message) : undefined);

      })
    });
  }

  if (jams) {
    jams.forEach(jamData => {
      schemas.jam.findById(jamData.uuid, (err, jam) => {
        if (!jam) {
          console.log('creando jam ' + jamData.uuid);
          jam = new schemas.jam({ _id: jamData.uuid });
        } else {
          console.log('modificando jam ' + jamData.uuid)
        }

        jam.type = 'Feature';
        jam.properties = {
          city: jamData.city,
          type: jamData.type,
          turnType: jamData.turnType,
          street: jamData.street,
          endNode: jamData.endNode,
          roadType: jamData.roadType,
          speed: jamData.speed,
          delay: jamData.delay,
          length: jamData.length,
          level: jamData.level,
          blockingAlertUuid: jamData.blockingAlertUuid,
          timestamp: new Date(jamData.pubMillis),
        };
        jam.geometry = {
          type: 'LineString ',
          coordinates: jamData.line.map(coords => [coords.x, coords.y])
        };

        jam.save(err => err ? logger.error(err.message) : undefined);

      })
    });
  }

  if (irregularities) {
    irregularities.forEach(irregularityData => {
      schemas.jam.findById(irregularityData.id, (err, irregularity) => {
        if (!irregularity) {
          console.log('creando irregularity ' + irregularityData.id);
          irregularity = new schemas.irregularity({ _id: irregularityData.id });
        } else {
          console.log('modificando irregularity ' + irregularityData.id)
        }

        irregularity.type = 'Feature';
        irregularity.properties = {
          city: irregularityData.city,
          type: irregularityData.type,
          street: irregularityData.street,
          endNode: irregularityData.endNode,
          jamLevel: irregularityData.jamLevel,
          speed: irregularityData.speed,
          regularSpeed: irregularityData.regularSpeed,
          accuracy: irregularityData.accuracy,
          severity: irregularityData.severity,
          driversCount: irregularityData.driversCount,
          seconds: irregularityData.seconds,
          delaySeconds: irregularityData.delaySeconds,
          length: irregularityData.length,
          highway: irregularityData.highway,
          alertsCount: irregularityData.alertsCount,
          detectionTime: new Date(irregularityData.detectionDateMillis),
          updateTime: new Date(irregularityData.updateDateMillis),
        };
        irregularity.geometry = {
          type: 'LineString ',
          coordinates: irregularityData.line.map(coords => [coords.x, coords.y])
        };

        irregularity.save(err => err ? logger.error(err.message) : undefined);

      })
    });
  }
}
