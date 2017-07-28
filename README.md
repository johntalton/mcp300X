# mcp300X

Implemntation of the mcp3004/mcp3008 ADC chip.

Features:
- Provides access to pseudo differential mode 
- Does not assume Vref and Vin are the same
- User selectable SPI bus implementation (spi, pi-spi, spi-device ... via rasbus)

And while this implementation is more verbose, it does so in order to aid in clarity of understanding and for learning.

## Sample Usage

```
const mcp300X = require('./mcp300X.js');
const spi = ...

mcp300X.adc({ bus: spi, Vref: 5, channels: 8 }).then(dev => {
  ...
  dev.readADC(channel).then(result => {
     console.log('normalized value', result.normal);
     console.log('voltage', result.V);
  })
});
```
In the usage above our Analog circitry is running at 5V, while the chip is running at 3.3V configuration.  

The returned ```result``` object holds the ```normal```-ized value, as well as the ```raw``` ADC value and the ```V``oltage as calculated.

## Psuedo Differential Mode

The mode allows the bonding of two channels in +/- or -/+ configurations.

### Reference by channel pair or index

The ```readADCDiff``` method can be passed a single "index-channel" or the order +/- pair.

From the spec:

| Idx | +ch / -ch |
| --- | --- |
| 1st | Ch0 / Ch1 |
| 2nd | Ch1 / Ch0 |
| 3rd | Ch2 / Ch3 |
| etc ... |


```
  ...
  dev.readADCDiff(6).then(result => { ... }) // index-channel 6 or +Ch5 / -Ch4 
```

