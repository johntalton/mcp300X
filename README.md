# mcp300X

Implementation of the mcp3004/mcp3008 ADC chip.

[![npm Version](https://img.shields.io/npm/v/@johntalton/mcp300x.svg)](https://www.npmjs.com/package/@johntalton/mcp300x)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/mcp300x)
![CI](https://github.com/johntalton/mcp300x/workflows/CI/badge.svg)
![GitHub](https://img.shields.io/github/license/johntalton/mcp300x)
[![Downloads Per Month](https://img.shields.io/npm/dm/@johntalton/mcp300x.svg)](https://www.npmjs.com/package/@johntalton/mcp300x)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/mcp300x)
[![Package Quality](https://npm.packagequality.com/shield/%40johntalton%2Fmcp300x.svg)](https://packagequality.com/#?package=@johntalton/mcp300x)

Features:
- Provides access to pseudo differential mode
- Does not assume Vref and Vin are the same

And while this implementation is more verbose, it does so in order to aid in clarity of understanding and for learning.

## Sample Usage

```javascript
import { mcp300x } = from '@johntalton/mcp300X'
const spi = ...
const adc = mcp300X.from({ bus: spi, Vref: 5, channels: 8 })

const result = await dev.readADC(channel)

console.log('normalized value', result.normal)
console.log('voltage', result.V)
```

In the usage above our Analog circuitry is running at 5V, while the chip is running at 3.3V configuration.

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

