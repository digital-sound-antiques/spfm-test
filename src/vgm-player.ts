import VGM from "./vgm";
import SPFM from "./spfm";
import config from "./config";
import microtime from "microtime";

const performance = {
  now: () => microtime.now() / 1000,
};

const busySleep = (n: number) => {
  const till = performance.now() + n;
  while (till > performance.now());
};

export default class VGMPlayer {
  _vgm?: VGM;
  _index: number = 0;
  _waitRequested: number = 0;
  _data?: DataView;
  _eos: boolean = false;
  _spfms: { [key: string]: SPFM };

  constructor(arg: SPFM | { [key: string]: SPFM }) {
    if (arg instanceof SPFM) {
      this._spfms = { 0: arg };
    } else {
      this._spfms = arg;
    }
  }

  sleepMethod = config.sleepMethod;

  reset() {
    this._index = 0;
    this._waitRequested = 0;
    this._eos = false;
  }

  setData(vgm: VGM) {
    this._vgm = vgm;
    this._data = this._vgm.data;
    this.reset();
  }

  _peekByte() {
    return this._data!.getUint8(this._index);
  }

  _readByte() {
    return this._data!.getUint8(this._index++);
  }

  _peekWord() {
    return this._data!.getUint16(this._index, true);
  }

  _readWord() {
    const ret = this._data!.getUint16(this._index, true);
    this._index += 2;
    return ret;
  }

  _peekDword() {
    return this._data!.getUint32(this._index, true);
  }

  _readDword() {
    const ret = this._data!.getUint32(this._index, true);
    this._index += 4;
    return ret;
  }

  _processDataBlock() {
    if (this._readByte() != 0x66) {
      throw new Error();
    }
    return {
      type: this._readByte(),
      size: this._readDword(),
    };
  }

  _sarray = new Int32Array(new SharedArrayBuffer(4));
  _lastWaitSamplesCalled = 0;

  async _waitSamples(frames: number) {
    if (this._lastWaitSamplesCalled) {
      this._waitRequested -= performance.now() - this._lastWaitSamplesCalled;
    }
    this._waitRequested += (1000 / 44100) * frames;

    if (this._waitRequested > 0) {
      const start = performance.now();
      if (this.sleepMethod !== "busyLoop") {
        Atomics.wait(this._sarray, 0, 0, Math.floor(this._waitRequested));
      } else {
        busySleep(this._waitRequested);
      }
      const elapsed = performance.now() - start;
      this._waitRequested -= elapsed;
    }
    this._lastWaitSamplesCalled = performance.now();
  }

  _writeGameGearPsg() {
    const d = this._readByte();
  }
  _writeSn76489() {
    const d = this._readByte();

    const mod = config.modules.sn76489;
    if (!mod) return;
    const { device, slot } = mod;
    const spfm = this._spfms[device];
    if (spfm) {
      return spfm.writeSn76489(slot, d);
    }
  }

  async _write2(chip: string) {
    const p = this._readByte();
    const a = this._readByte();
    const d = this._readByte();

    const mod = config.modules[chip];
    if (!mod) return;
    const { device, slot } = mod;
    const spfm = this._spfms[device];
    if (spfm) {
      return spfm.writeReg(slot, p, a, d);
    }
    return;
  }

  async _write(chip: string, port: number = 0) {
    const a = this._readByte();
    const d = this._readByte();

    const mod = config.modules[chip];
    if (!mod) return;
    const { device, slot } = mod;
    const spfm = this._spfms[device];
    if (spfm) {
      return spfm.writeReg(slot, port, a, d);
    }
  }

  _writeYm2612_2a(n: number) {
    this._waitSamples(n);
  }

  _seekPcmDataBank() {
    var offset = this._readDword();
    return offset;
  }

  async exec() {
    while (!this._eos && this._index < this._data!.byteLength) {
      const d = this._readByte();
      if (d == 0x67) {
        var block = this._processDataBlock();
        this._index += block.size;
      } else if (d == 0x61) {
        this._waitSamples(this._readWord());
      } else if (d == 0x62) {
        this._waitSamples(735);
      } else if (d == 0x63) {
        this._waitSamples(882);
      } else if (d == 0x4f) {
        await this._writeGameGearPsg();
      } else if (d == 0x50) {
        await this._writeSn76489();
      } else if (d == 0x51) {
        await this._write("ym2413");
      } else if (d == 0x52) {
        await this._write("ym2612", 0);
      } else if (d == 0x53) {
        await this._write("ym2612", 1);
      } else if (d == 0x54) {
        await this._write("ym2151");
      } else if (d == 0x55) {
        await this._write("ym2203");
      } else if (d == 0x56) {
        await this._write("ym2608", 0);
      } else if (d == 0x57) {
        await this._write("ym2608", 1);
      } else if (d == 0x58) {
        await this._write("ym2610", 0);
      } else if (d == 0x59) {
        await this._write("ym2610", 1);
      } else if (d == 0x5a) {
        await this._write("ym3812");
      } else if (d == 0x5b) {
        await this._write("ym3526");
      } else if (d == 0x5c) {
        await this._write("y8950");
      } else if (d == 0x5d) {
        await this._write("ymz280b");
      } else if (d == 0x5e) {
        await this._write("ymf262", 0);
      } else if (d == 0x5f) {
        await this._write("ymz262", 1);
      } else if (d == 0xa0) {
        await this._write("ay8910");
      } else if (d == 0xb4) {
        await this._write("nesApu");
      } else if (d == 0xd2) {
        await this._write2("scc1");
      } else if (d == 0xe0) {
        await this._seekPcmDataBank();
      } else if (0x70 <= d && d <= 0x7f) {
        this._waitSamples((d & 0xf) + 1);
      } else if (0x80 <= d && d <= 0x8f) {
        await this._writeYm2612_2a(d & 0xf);
      } else if (d == 0x66) {
        if (this._vgm!.offsets.loop) {
          this._index = this._vgm!.offsets.loop - this._vgm!.offsets.data;
        } else {
          this._eos = true;
          break;
        }
      } else {
        throw new Error("Unknown command: 0x" + d.toString(16));
      }
    }
  }
}
