const rasbus = require('rasbus');
const mcp300X = require('../src/mcp300X.js');

//rasbus.byname('spi-device').init(0, 42).then(spi => {
rasbus.byname('pi-spi').init(42).then(spi => {
  return mcp300X.adc({ bus: spi, Vref: 5.0, channels: 8 }).then(dev => {
    return dev.readADC(3).then(console.log).then(() => {
      let closed = false;
      if(dev.close !== undefined) { dev.close(); closed = true; }
      if(spi.close !== undefined) { spi.close(); closed = true; }
      if(!closed) { console.log(' ** no close function found... bad human'); }
    });
  });
}).catch(e => {
  console.log('error', e);
});


