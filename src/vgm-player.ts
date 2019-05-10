import VGM from "./vgm";
import SerialPort from "serialport";
import microtime from "microtime";
import sleep from "sleep";

const performance = {
  now: () => microtime.now() / 1000,
};

async function portWrite(port: SerialPort, data: string | number[] | Buffer) {
  return new Promise(function(resolve, reject) {
    port.write(data, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export default class VGMPlayer {
  _vgm?: VGM;
  _index: number = 0;
  _waitRequested: number = 0;
  _data?: DataView;
  _eos: boolean = false;
  _port: SerialPort;

  constructor(port: SerialPort) {
    this._port = port;
  }

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

  _sleep(n: number) {
    const till = performance.now() + n;
    while (till > performance.now());
  }

  async _waitSamples(frames: number) {
    if (this._lastWaitSamplesCalled) {
      this._waitRequested -= performance.now() - this._lastWaitSamplesCalled;
    }
    console.log(`wait ${frames}f`);
    this._waitRequested += (1000 / 44100) * frames;
    const n = Math.floor(this._waitRequested);

    if (n > 0) {
      this._waitRequested -= n;
      const start = performance.now();
      // Atomics.wait(this._sarray, 0, 0, n);
      this._sleep(n);
      const elapsed = performance.now() - start;
      this._waitRequested -= elapsed - n;
      console.log(`expect: ${n}ms result: ${elapsed}ms`);
    }
    this._lastWaitSamplesCalled = performance.now();
  }

  _writeGameGearPsg() {
    const d = this._readByte();
  }
  _writeSn76489() {
    const d = this._readByte();
  }

  async _writeAy8910() {
    const a = this._readByte();
    const d = this._readByte();
    const start = performance.now();
    await portWrite(this._port, [0x01, 0x00, a, d]);
    const elapsed = performance.now();
    console.log(
      `Write AY8910 ${a.toString(16)}, ${d.toString(16)} in ${elapsed}ms.`
    );
  }

  async _writeYm2203() {
    const a = this._readByte();
    const d = this._readByte();
    const start = performance.now();
    await portWrite(this._port, [0x01, 0x00, a, d]);
    const elapsed = performance.now();
    console.log(
      `Write Ym2203 ${a.toString(16)}, ${d.toString(16)} in ${elapsed}ms.`
    );
  }
  _writeYm2612(port: 0 | 1) {
    const a = this._readByte();
    const d = this._readByte();
  }
  _writeYm2608(port: 0 | 1) {
    const a = this._readByte();
    const d = this._readByte();
  }
  _writeYm2610(port: 0 | 1) {
    const a = this._readByte();
    const d = this._readByte();
  }
  _writeNesApu() {
    const a = this._readByte();
    const d = this._readByte();
  }

  async _writeYm2413() {
    const a = this._readByte();
    const d = this._readByte();
    const start = performance.now();
    await portWrite(this._port, [0x00, 0x00, a, d]);
    const elapsed = performance.now() - start;
    console.log(
      `Write YM2413 ${a.toString(16)}, ${d.toString(16)} in ${elapsed}ms.`
    );
  }

  _writeYm2612_2a(n: number) {
    this._waitSamples(n);
  }

  _seekPcmDataBank() {
    var offset = this._readDword();
    console.log("Seek PCM data block: 0x" + offset.toString(16));
    return offset;
  }

  async exec() {
    while (!this._eos && this._index < this._data!.byteLength) {
      const d = this._readByte();
      console.log(`Command: ${d.toString(16)}`);
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
        this._writeGameGearPsg();
      } else if (d == 0x50) {
        this._writeSn76489();
      } else if (d == 0x51) {
        await this._writeYm2413();
      } else if (d == 0x52) {
        this._writeYm2612(0);
      } else if (d == 0x53) {
        this._writeYm2612(1);
      } else if (d == 0x55) {
        await this._writeYm2203();
      } else if (d == 0x56) {
        this._writeYm2608(0);
      } else if (d == 0x57) {
        this._writeYm2608(1);
      } else if (d == 0xa0) {
        await this._writeAy8910();
      } else if (d == 0xb4) {
        this._writeNesApu();
      } else if (d == 0xe0) {
        this._seekPcmDataBank();
      } else if (0x70 <= d && d <= 0x7f) {
        this._waitSamples((d & 0xf) + 1);
      } else if (0x80 <= d && d <= 0x8f) {
        this._writeYm2612_2a(d & 0xf);
      } else if (d == 0x66) {
        console.log("Found: End of sound.");
        this._eos = true;
        break;
      } else {
        throw new Error("Unknown command: 0x" + d.toString(16));
      }
    }
  }
}
