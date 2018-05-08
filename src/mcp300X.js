

/**
 *
 */
class Common {
  static single(ch) { return 0b1000 | (ch & 0b111); }
  static pseudoDifferential(pair) { return pair & ~0b1000; }

  static spiAlignControl(control) {
    return [1, ((control & 0b1111) << 4)];
  }

  static read10(msb, lsb) {
    if((msb & 0b100) !== 0) { throw new Error('10-bit missing leading null'); }
    return ((msb & 0b011) << 8) | lsb;
  }

  static channelSetToPair(posCh, negCh) {
    if(posCh === 0 && negCh === 1) { return 0; } // 0 1 -> 0
    if(posCh === 1 && negCh === 0) { return 1; } // 1 0 -> 1
    if(posCh === 2 && negCh === 3) { return 2; } // 2 3 -> 2
    if(posCh === 3 && negCh === 2) { return 3; } // 3 2 -> 3
    if(posCh === 4 && negCh === 5) { return 4; } // 4 5 -> 4
    if(posCh === 5 && negCh === 4) { return 5; } // 5 4 -> 5
    if(posCh === 6 && negCh === 7) { return 6; } // 6 7 -> 6
    if(posCh === 7 && negCh === 6) { return 7; } // 7 6 -> 7
    throw new Error('unknown channel set: +', posCh + ' -' + negCh);
  }
}

/**
 *
 */
class Converter {
  static precisionRound(number, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  static normalizeRaw(raw, range) {
    const tmp = raw / range;
    return Converter.precisionRound(tmp, 10); // todo hmmm
  }

  static valueToVoltage(value, Vref, range) {
    return Vref * Converter.normalizeRaw(value, range);
  }

  static format(sample, range, Vref) {
    const V = Converter.valueToVoltage(sample.raw, Vref, range);
    const normal = Converter.normalizeRaw(sample.raw, range);

    return {
      ...sample,
      normal: normal,
      V: V,
      Vref: Vref
    }
  }
}

/**
 *
 */
class mcp300X {
  static adc(config) {
    return Promise.resolve(new mcp300X(config));
  }

  constructor(config) {
    this.bus = config.bus;
    this.channels = config.channels;
    this.Vref = config.Vref;

    this.range = 1023; // from spec
  }

  readADCDiff(posChOrPair, negCh) {
    const pair = (negCh === undefined) ? posChOrPair : Common.channelSetToPair(posChOrPair, negCh);
    return this._read(Common.pseudoDifferential(pair)).then(sample => {
      return Converter.format(sample, this.range, this.Vref);
    });
  }

  readADC(channel) {
    return this._read(Common.single(channel)).then(sample => {
      return Converter.format(sample, this.range, this.Vref);
    });
  }

  _read(cmd) {
    return this.bus.read(Common.spiAlignControl(cmd), 2).then(buf => {
      const timestamp = Date.now();
      const raw = Common.read10(buf[0], buf[1]);
      return {
        timestamp: timestamp,
        raw: raw
      };
    });
  }
}

module.exports = {
  adc: mcp300X.adc,
  Common: Common,
  Converter: Converter
};
