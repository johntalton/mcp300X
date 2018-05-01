const rasbus = require('rasbus');
const mcp300X = require('../src/mcp300X.js');

rasbus.byname('pi-spi').init('/dev/spidev0.42').then(spi => {
  return mcp300X.adc({ bus: spi, Vref: 5.0, channels: 8 }).then(dev => {
    return dev.readADC(2).then(console.log);
  });
}).catch(e => {
  console.log('error', e);
});


