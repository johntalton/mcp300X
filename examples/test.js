const rasbus = require('rasbus');
const mcp300X = require('../src/mcp300X.js');

const pins = [0, 1, 2, 3, 4, 5, 6, 7];

//rasbus.byname('spi-device').init(0, 42).then(spi => {
rasbus.byname('pi-spi').init(42).then(spi => {
  return mcp300X.adc({ bus: spi, Vref: 5.0, channels: 8 }).then(dev => {
    return Promise.all(pins.map(pin => {
      return dev.readADC(pin).then(result => console.log(pin, result)).then(() => {
        //let closed = false;
        //if(dev.close !== undefined) { dev.close(); closed = true; }
        //if(spi.close !== undefined) { spi.close(); closed = true; }
        //if(!closed) { console.log(' ** no close function found... bad human'); }
      })
      .catch(e => {
        console.log('pin', pin, 'error', e);
      });
    }));
  });
}).catch(e => {
  console.log('error', e);
});


