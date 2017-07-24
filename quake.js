const rasbus = require('rasbus');
const spiImpl = rasbus.pispi;
const mcp300X = require('./src/mcp300X.js');

function scale(value, vmin, vmax, tomin, tomax) {
  const vrange = vmax - vmin;
  const torange = tomax - tomin;

  const normalv = (value - vmin) / vrange;
  const tov = (normalv * torange) + tomin;

  return tov;
}

function trunc(value) {
  return Math.floor(value * 100) / 100;
}

function defaultConfig() {
  return Promise.resolve({
    devicename: '/dev/spidev0.0',
    channelmask: [ 1, 1, 1, 0, 0, 0, 0, 0],
    Vref: 5.5,

    interval: 50
  });
}

function poll(config) {
  const width = 60;

  config.device.readADC(0, config.Vref).then(result => {
    const value = result.normal;
    const conv = Math.round(scale(value, 0, 1, 0, width - 1));
    let line = (new Array(width)).fill(' ');

    if(value > config.prevv){
      line[conv] = '\\';
    } else if(value < config.prevv) {
      line[conv] = '/';
    } else {
      line[conv] = '|';
    }

    config.prevv = value;

    console.log('[' + line.join('') + ']', trunc(value));
    // console.log(result);
  }).catch(e => {
    console.log('error', e);
  });
}

defaultConfig().then(config => {
  spiImpl.init(config.devicename).then(spi => {
    config.bus = spi;
    // console.log(spi);
    mcp300X.adc(spi).then(dev => {
      config.device = dev;

      // console.log(config);

      setInterval(poll, config.interval, config);
    });
  });
}).catch(e => {
  console.log('error', e);
});


