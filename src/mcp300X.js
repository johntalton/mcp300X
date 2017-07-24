
function valueToVoltage(value, Vref) {
  return value * Vref / 1023;
}

function adc(config) {
  return Promise.resolve(new mcp300X(config));
}

class mcp300X {
  constructor(config) {
    this.bus = config.bus;
    this.Vref = config.Vref;
  }

  readINL() {}

  readDNL() {}

  readADC(channel) {
    const ch = channel & 0b111; //  3-bit
    const chselect =  (0b1000 | ch) << 4; // single
    const cmd = [1, chselect]; // push an alignment 8bit first so result 10bit is aligned (start bit align)

    return this.bus.read(cmd, 6).then(buf => {
      // console.log(buf);
      const raw = ((buf[1] & 3) << 8) + buf[2];
      const normal = raw / 1023;
      const v = valueToVoltage(raw, this.Vref);
      return {
        raw: raw,
        normal: normal,
        v: v
      }
    });
  }
}

module.exports = {
  adc: adc
};
