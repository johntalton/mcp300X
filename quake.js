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
    channels: 8,
    channelmask: [ 0, 1, 6, 7 ],
    // differentialmask: [[2,3], 6], // [2,3] -> CH2 = IN+ CH3 = IN-
                                  // 6     -> CH4 = IN- CH5 = IN+
    Vref: 5,

    interval: 75,
    totalWidth: 100
  });
}

function linemaker(value, width) {
  const conv = Math.round(scale(value, 0, 1, 0, width - 1));
  let line = (new Array(width)).fill(' ');
/*
  if(value > config.prevv){
    line[conv] = '\\';
  } else if(value < config.prevv) {
    line[conv] = '/';
  } else {
    line[conv] = '|';
  }
*/
  line[conv] = '*';
  return line.join('');
}

function poll(config) {
  Promise.all(config.channelmask.map(ch => { return config.device.readADC(ch); })).then(results => {
    const width = Math.floor(config.totalWidth / results.length);

    // results.forEach(result => console.log(result.raw, result.V));
    const fullline = results.map(result => linemaker(result.normal, width));

    console.log('[' + fullline.join('|') + ']');
  }).catch(e => {
    console.log('error', e);
  });
}

defaultConfig().then(config => {
  spiImpl.init(config.devicename).then(spi => {
    config.bus = spi;
    // console.log(spi);
    mcp300X.adc({ bus: spi, Vref: config.Vref, channels: config.channels }).then(dev => {
      config.device = dev;

      // console.log(config);

      setInterval(poll, config.interval, config);
    });
  });
}).catch(e => {
  console.log('error', e);
});


