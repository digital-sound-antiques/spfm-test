import { VGM, Chips } from "./vgm";

function getParamsCommon(d: DataView, clockIndex: number) {
  const clock = d.getUint32(clockIndex, true);
  if (clock) {
    return { clock };
  }
  return undefined;
}

function getParamsCommonWithFlags(
  d: DataView,
  clockIndex: number,
  flagsIndex: number
) {
  const clock = d.getUint32(clockIndex, true);
  if (clock) {
    return { clock, flags: d.getUint8(flagsIndex) };
  }
  return undefined;
}

function getParamsSn76489(d: DataView) {
  const obj = getParamsCommonWithFlags(d, 0x0c, 0x2b);
  if (obj) {
    return {
      ...obj,
      feedback: d.getUint16(0x28, true),
      shiftRegisterWidth: d.getUint8(0x2a),
    };
  }
  return undefined;
}

function getParamsSegaPcm(d: DataView) {
  const obj = getParamsCommon(d, 0x38);
  if (obj) {
    return {
      ...obj,
      interfaceRegister: d.getUint32(0x3c, true),
    };
  }
  return undefined;
}

function getParamsYm2151(d: DataView) {
  const obj = getParamsCommon(d, 0x30);
  if (obj) {
    const t = obj.clock >> 30;
    return {
      ...obj,
      clock: obj.clock & 0x7fffffff,
      chipType: {
        value: t,
        name: t ? "YM2164" : "YM2151",
      },
    };
  }
  return undefined;
}

function getParamsYm2203(d: DataView) {
  const obj = getParamsCommon(d, 0x44);
  if (obj) {
    return {
      ...obj,
      ssgFlags: d.getUint8(0x7a),
    };
  }
  return undefined;
}

function getParamsYm2608(d: DataView) {
  const obj = getParamsCommon(d, 0x48);
  if (obj) {
    return {
      ...obj,
      ssgFlags: d.getUint8(0x7b),
    };
  }
  return undefined;
}

function getParamsYm2610(d: DataView) {
  const obj = getParamsCommon(d, 0x48);
  if (obj) {
    const t = d.getUint8(0x4c);
    return {
      ...obj,
      clock: obj.clock & 0x7fffffff,
      chipType: {
        value: t,
        name: t ? "YM2610" : "YM2610B",
      },
    };
  }
  return undefined;
}

function getParamsYm2612(d: DataView) {
  const obj = getParamsCommon(d, 0x2c);
  if (obj) {
    const t = obj.clock >> 30;
    return {
      ...obj,
      clock: obj.clock & 0x7fffffff,
      chipType: {
        value: t,
        name: t ? "YM3438" : "YM2612",
      },
    };
  }
  return undefined;
}

function getParamsEs5503(d: DataView) {
  const obj = getParamsCommon(d, 0xcc);
  if (obj) {
    return {
      ...obj,
      numberOfChannels: d.getUint8(0xd4),
    };
  }
  return undefined;
}

function getParamsEs5505(d: DataView) {
  const obj = getParamsCommon(d, 0xd0);
  if (obj) {
    const t = obj.clock >> 30;
    return {
      ...obj,
      clock: obj.clock & 0x7fffffff,
      chipType: {
        value: t,
        name: t ? "ES5506" : "ES5505",
      },
      numberOfChannels: d.getUint8(0xd5),
    };
  }
  return undefined;
}

function getParamsAy8910(d: DataView) {
  const obj = getParamsCommon(d, 0x74);
  if (obj) {
    const t = d.getUint8(0x78);
    const flags = d.getUint8(0x79);
    return {
      ...obj,
      chipType: {
        value: t,
        name: ((t: number) => {
          switch (t) {
            case 0x00:
              return "AY8910";
            case 0x01:
              return "AY8912";
            case 0x02:
              return "AY8913";
            case 0x03:
              return "AY8930";
            case 0x10:
              return "YM2149";
            case 0x11:
              return "YM3439";
            case 0x12:
              return "YMZ284";
            case 0x13:
              return "YMZ294";
            default:
              return "UNKNOWN";
          }
        })(t),
      },
      flags,
    };
  }
  return undefined;
}

function getParamsC140(d: DataView) {
  const obj = getParamsCommon(d, 0xa8);
  if (obj) {
    const t = d.getUint8(0x96);
    return {
      ...obj,
      chipType: {
        value: t,
        name: ((t: number) => {
          switch (t) {
            case 0x00:
              return "C140, Namco System 2";
            case 0x01:
              return "C140, Namco System 21";
            case 0x02:
              return "219 ASIC, Namco NA-1/2";
            default:
              return "UNKNOWN";
          }
        })(t),
      },
    };
  }
  return undefined;
}

function getParamsC352(d: DataView) {
  const obj = getParamsCommon(d, 0xdc);
  if (obj) {
    return {
      ...obj,
      clockDivider: d.getUint8(0xd6),
    };
  }
  return undefined;
}

export default class VGMParser {
  static parse(data: ArrayBuffer): VGM {
    const d = new DataView(data);

    const version = d.getUint32(0x08, true);
    const chips: Chips = {
      sn76489: getParamsSn76489(d),
      ym2413: getParamsCommon(d, 0x10),
    };

    const eof = d.getUint32(0x04, true);
    const gd3 = d.getUint32(0x14, true);
    const loop = d.getUint32(0x1c, true);

    const vgm = {
      version,
      offsets: {
        eof: eof ? 0x04 + eof : 0,
        gd3: gd3 ? 0x14 + gd3 : 0,
        loop: loop ? 0x1c + loop : 0,
        data: 0x40,
        extraHeader: 0,
      },
      samples: {
        total: d.getUint32(0x18, true),
        loop: d.getUint32(0x20, true),
      },
      rate: d.getUint32(0x24, true),
      chips,
      loopModifier: 0,
      loopBase: 0,
      volumeModifier: 0,
    };

    if (version >= 0x110) {
      chips.ym2612 = getParamsYm2612(d);
      chips.ym2151 = getParamsYm2151(d);
    }

    if (version >= 0x150) {
      vgm.offsets.data = 0x34 + d.getUint32(0x34, true);
    }

    if (version >= 0x151) {
      chips.segaPcm = getParamsSegaPcm(d);
      chips.rf5c68 = getParamsCommon(d, 0x40);
      chips.ym2203 = getParamsYm2203(d);
      chips.ym2608 = getParamsYm2608(d);
      chips.ym2610 = getParamsYm2610(d);

      chips.ym3812 = getParamsCommon(d, 0x50);
      chips.ym3526 = getParamsCommon(d, 0x54);
      chips.y8950 = getParamsCommon(d, 0x58);
      chips.ymf262 = getParamsCommon(d, 0x5c);
      chips.ymf278b = getParamsCommon(d, 0x60);
      chips.ymf271 = getParamsCommon(d, 0x64);
      chips.ymz280b = getParamsCommon(d, 0x68);
      chips.rf5c164 = getParamsCommon(d, 0x6c);
      chips.pwm = getParamsCommon(d, 0x70);
      chips.ay8910 = getParamsAy8910(d);
      vgm.loopModifier = d.getUint8(0x7f);
    }

    if (version >= 0x160) {
      vgm.volumeModifier = d.getUint8(0x7c);
      vgm.loopBase = d.getUint8(0x7e);
    }

    if (version >= 0x161) {
      chips.gameBoyDmg = getParamsCommon(d, 0x80);
      chips.nesApu = getParamsCommon(d, 0x84);
      chips.multiPcm = getParamsCommon(d, 0x88);
      chips.upd7759 = getParamsCommon(d, 0x8c);
      chips.okim6258 = getParamsCommonWithFlags(d, 0x90, 0x94);
      chips.c140 = getParamsC140(d);
      chips.okim6295 = getParamsCommon(d, 0x98);
      chips.k051649 = getParamsCommon(d, 0x9c);
      chips.k054539 = getParamsCommonWithFlags(d, 0xa0, 0x95);
      chips.huc6280 = getParamsCommon(d, 0xa4);
      chips.k053260 = getParamsCommon(d, 0xac);
      chips.pokey = getParamsCommon(d, 0xb0);
      chips.qsound = getParamsCommon(d, 0xb4);
    }

    if (version >= 0x170) {
      const v = d.getUint32(0xbc, true);
      vgm.offsets.extraHeader = v ? 0xbc + v : 0;
    }

    if (version >= 0x171) {
      chips.scsp = getParamsCommon(d, 0xb8);
      chips.wonderSwan = getParamsCommon(d, 0xc0);
      chips.vsu = getParamsCommon(d, 0xc4);
      chips.saa1099 = getParamsCommon(d, 0xc8);
      chips.es5505 = getParamsEs5505(d);
      chips.es5503 = getParamsEs5503(d);
      chips.x1_010 = getParamsCommon(d, 0xd8);
      chips.c352 = getParamsC352(d);
      chips.ga20 = getParamsCommon(d, 0xe0);
    }

    return {
      ...vgm,
      data: new DataView(data, vgm.offsets.data),
    };
  }
}
