
const rasbus = require('rasbus');
const spiImpl = rasbus.byname('pi-spi');
const mcp300X = require('../src/mcp300X.js');

function rangeArray(cnt) {
  const a = new Array(cnt);
  a.fill(0);
  return a;
}

function scale0(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function scale(value, vmin, vmax, tomin, tomax) {
  const vrange = vmax - vmin;
  const torange = tomax - tomin;

//  const normalv = (value - vmin) / vrange;
//  const tov = (normalv * torange) + tomin;

  const ratio = torange / vrange;
  const tov = (value - vmin) * ratio + tomin;

  const alt = scale0(value, vmin, vmax, tomin, tomax);
  const err = alt - tov;
  if(err !== 0) { console.log(' ** err ', err); }

  return tov;
}

// function trunc(value) { return Math.floor(value * 100.0) / 100.0; }

function defaultConfig() {
  return Promise.resolve({
    deviceprams: [ 42 ],
    //deviceprams: [0, 42],
    channels: 8,
    channelmask: [ 0, 1, 2, 3, 4, 5, 6, 7 ],
    // differentialmask: [[2,3], 6], // [2,3] -> CH2 = IN+ CH3 = IN-
                                  // 6     -> CH4 = IN- CH5 = IN+
    Vref: 5,

    interval: 100,
    totalWidth: 90
  });
}

function linemaker(value, width) {
  // return trunc(value).toString().padStart(width, ' ');


  const conv = Math.round(scale(value, 0, 1, 0, width - 1));
  const line = (new Array(width)).fill(' ');
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

const q = [];

async function poll(config) {
  await Promise.all(rangeArray(50).map(() => {
//    console.log('doing a time')
    return Promise.all(config.channelmask.map(ch => config.device.readADC(ch)))
      .then(results => {
        //console.log(results);
        q.push(results);
      });
  }))
  .catch(e => {
    console.log('error', e);
  });
}

function log(config) {
  //if(q.length <= 0) { console.log('****'); }

//  return console.log(q); q = [];
  //q.slice(Math.max(q.length - 50, 1)).forEach(results => {

  rangeArray(Math.min(q.length, 15)).forEach(() => {
    const results = q.pop();
    const width = Math.floor(config.totalWidth / results.length);
    const fullline = results.map(result => linemaker(result.normal, width));
    console.log('[' + fullline.join('|') + ']');
  });
  //q.length = 0;
}

defaultConfig().then(config => {
  return spiImpl.init(...config.deviceprams).then(spi => {
    config.bus = spi;
    // console.log(spi);
    mcp300X.adc({ bus: spi, Vref: config.Vref, channels: config.channels }).then(dev => {
      config.device = dev;

      // console.log(config);
      config._startTime = Date.now();

      setInterval(log, 50, config);
      setInterval(poll, 250, config);
    });
  });
}).catch(e => {
  console.log('error', e);
});


