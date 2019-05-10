import SerialPort, { parsers } from "serialport";

type SPFMType = "SPFM" | "SPFMLight" | null;

export default class SPFM {
  _path: string;
  _baudRate: number;
  _port: SerialPort;

  type: SPFMType = null;

  constructor(path: string, baudRate: number = 1500000) {
    this._path = path;
    this._baudRate = baudRate;
    this._port = new SerialPort(path, {
      baudRate: this._baudRate,
      autoOpen: false,
    });
    this._port.setEncoding("utf-8");
  }

  static async list() {
    const ports = await SerialPort.list();
    return ports.filter(p => p.vendorId === "0403");
  }

  get isHighSpeed() {
    return this._baudRate === 1500000;
  }

  async _identify() {
    const byteLength = new parsers.ByteLength({ length: 2 });
    const parser = this._port.pipe(byteLength);
    try {
      await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          reject(`Timeout`);
        }, 1000);

        parser.on("data", async chunk => {
          const res = chunk.toString();
          try {
            if (res === "LT") {
              this.type = "SPFMLight";
              await this.write([0xfe]);
            } else if (res === "OK") {
              if (this.type == null) {
                this.type = "SPFM";
              }
              resolve();
            } else {
              reject(`Unknown Response: ${res}`);
            }
          } catch (e) {
            reject(e);
          }
        });

        await this.write([0xff]);
      });
    } finally {
      console.debug(`Type: ${this.type}, Rate: ${this._baudRate}bps`);
      this._port.unpipe(byteLength);
    }
  }

  async open() {
    return new Promise(async (resolve, reject) => {
      this._port.open(async err => {
        if (err) {
          reject(err);
          return;
        }
        try {
          await this._identify();
          resolve();
        } catch (e) {
          await this.close();
          reject(e);
        }
      });
    });
  }

  async isOpen() {
    return this._port.isOpen;
  }

  async reset() {
    if (this.type === "SPFMLight") {
      await this.write([0xfe]);
    } else if (this.type === "SPFM") {
      await this.write([0xff]);
    } else {
      // Ignore
    }
  }

  // [WARNING] This method does not work properly. SerialPort#close() does not finish forever after SIGINT.
  async close() {
    return new Promise(async (resolve, reject) => {
      if (this._port.isOpen) {
        await this.reset();
        this._port.close(err => {
          if (err) {
            reject(err);
          } else {
            this.type = null;
            resolve();
          }
        });
      }
    });
  }

  async write(data: string | number[] | Buffer) {
    if (!this._port.isOpen) {
      return;
    }
    return new Promise((resolve, reject) => {
      this._port.write(data, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async writeReg(slot: number, port: number, a: number, d: number) {
    if (this.type === "SPFMLight") {
      await this.write([slot & 1, (port & 7) << 1, a, d, 0x80]);
    } else if (this.type === "SPFM") {
      if (this.isHighSpeed) {
        await this.write([((slot & 7) << 4) | (port & 3), a, d, 0x80]);
      } else {
        await this.write([((slot & 7) << 4) | (port & 3), a, d]);
      }
    }
  }

  async writeSn76489(slot: number, d: number) {
    if (this.type === "SPFMLight") {
      await this.write([slot & 1, 0x20, d, 0x80]);
    }
  }
}
