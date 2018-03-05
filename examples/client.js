"use strict";

const fs = require('fs');
const { EventEmitter } = require('events');

const mqtt = require('mqtt');

const rasbus = require('rasbus');

const mcp300x = require('../src/mcp300X.js');

class Config {
  static config(p) {
    return new Promise((resolve, reject) => {
      fs.readFile(p, 'utf-8', (err, data) => {
        if(err) { reject(err); return; }
        resolve(data);
      });
    })
    .then(JSON.parse)
    .then(Config._normalize);
  }

  static _normalize(config) {
    if(config.name === undefined) { throw Error('missing name'); }
    if(config.bus === undefined) { throw Error('missing bus'); }

    let Vref = config.Vref;
    if(config.Vref === undefined) { console.log('assuming 3.3V reference'); Vref = 3.3; }

    if(config.channels === undefined) { throw Error('undefined channels array'); }
    const channels = config.channels.map(channel => {
      if(channel.name === undefined) { throw Error('channel missing name'); }
      if(channel.id === undefined) { throw Error('channel missing id'); }

      const S = channel.intervalS ? channel.intervalS : 0;
      const Ms = channel.intervalMs ? channel.intervalMs : 0;
      const intervalMs = S * 1000 + Ms;

      let active = true;
      if(channel.active !== undefined) { active = channel.active; }

      return {
        name: channel.name,
        id: channel.id,
        intervalMs: intervalMs,
        active: active
      };
    });

    let mqtt = {
      url: process.env.mqtturl,
      reconnectMs: 30 * 1000
    };
    if(config.mqtt !== undefined) {
      if(config.mqtt.url !== undefined) { mqtt.url = config.mqtt.url; }

      const S = config.mqtt.reconnectS ? config.mqtt.reconnectS : 0;
      const Ms = config.mqtt.reconnectlMs ? config.mqtt.reconnectMs : 0;
      mqtt.reconnectMS = S * 1000 + Ms;
    }

    return {
      name: config.name,
      bus: config.bus,
      Vref: Vref,
      channels: channels,
      mqtt: mqtt
    }
  }
}

class Store {
  static setupWithRetry(config) {
    const client = mqtt.connect(process.env.mqtturl, { reconnextPeriod: config.mqtt.reconnectMs });
    client.on('connect', () => { config.emitter.emit('online'); });
    client.on('offline', () => { config.emitter.emit('offline'); });
    client.on('error', e => { console.log(e); process.exit(-1); });

    config.mqtt.client = client;
  }
}

class Sensor {
  static setupWithRetry(config) {
    return Sensor.setup(config)
      .then(() => { console.log('sensor up on first try'); })
      .catch(e => {
        console.log('first setup failure - retry', e);
        // setInterval
      });
  }

  static setup(config) {
    const driver = rasbus.byname(config.bus.driver);
    return driver.init(...config.bus.id)
      .then(bus => mcp300x.adc({ bus: bus, Vref: config.Vref }))
      .then(adc => { config.client = adc; config.emitter.emit('up'); });
  }

  static retry(config) {}

  static start(config) {
    console.log('START');
    return Promise.all(config.channels
      .filter(ch => ch.active)
      .map(ch => {
      console.log(' start ch', ch.name);
      ch.timmer = setInterval(Sensor.poll, ch.intervalMs, config, ch);
    }));
  }

  static stop() {}

  static poll(config, channel) {
    //console.log('poll channel', channel.name);
    config.client.readADC(channel.id)
      .then(results => {
        //console.log('results', results);
        config.emitter.emit('data', channel.name, results);
      })
      .catch(e => {
        console.log('error in poll', e);
      });
  }

}

function configure(config) {
  config.emitter = new EventEmitter();
  config.state = 'init';

  config.emitter.on('data', (chname, data) => {
    const topic = '/ADC/demo/' + chname; // config.mqtt.topic .replace + with chname
    const message = JSON.stringify({
      name: chname,
      raw: data.raw,
      normal: data.normal,
      V: data.V
    });
    config.mqtt.client.publish(topic, message, {}, err => {
      if(err) {}
      console.log('published', topic, message)
    });
  });
}

function configureSensor(config) {
  config.emitter.on('up', () => {
    if(config.state === 'init') { config.state = 'up'; }
    else if(config.state === 'online') { config.state = 'go'; }
    else { throw Error('unknown up state: ' + config.state); }
  });
  config.emitter.on('down', () => {
    throw Error('down');
  });

  return Sensor.setupWithRetry(config);
}

function configureStore(config) {
  config.emitter.on('online', () => {
    if(config.state === 'init') { config.state = 'online'; }
    else if(config.state === 'up') { Sensor.start(config).catch(e => {}); config.state = 'go'; }
    else { throw Error('unknown up state: ' + config.state); }
  });
  config.emitter.on('offline', () => {
    throw Error('offline');
  });

  return Store.setupWithRetry(config);
}

Config.config('./client.json').then(config => {
  configure(config);

  return Promise.all([
    configureSensor(config),
    configureStore(config)
  ]);
})
.catch(e => {
  console.log('top-level error', e);
});
