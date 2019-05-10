import SerialPort from "serialport";
import VGMPlayer from "./vgm-player";
import VGMParser from "./vgm-parser";

import fs from "fs";
import zlib from "zlib";

async function setup() {
  const ports = await SerialPort.list();
  console.log(ports);
}

async function sleep(msec: number) {
  return new Promise(function(resolve) {
    setTimeout(resolve, msec);
  });
}

async function test() {
  await setup();

  const port = new SerialPort("/dev/tty.usbserial-AL03BAAX", {
    baudRate: 1500000,
  });

  port.on("error", function(err) {
    console.log("Error: ", err.message);
  });

  port.setEncoding("utf-8");

  await portWrite(port, [0xff]);
  await portVerify(port, "LT");
  await sleep(100);
  await portWrite(port, [0xfe]);
  await portVerify(port, "OK");
  await sleep(500);

  const input = process.argv[2];
  console.log(input);
  const buf = fs.readFileSync(input);
  let vgmContext: Buffer;
  const m = input.match(/(.*)\.vgz$/);
  if (m) {
    vgmContext = zlib.gunzipSync(buf);
  } else {
    vgmContext = buf;
  }

  const vgm = VGMParser.parse(vgmContext!.buffer);
  console.log(vgm);
  const player = new VGMPlayer(port);
  player.setData(vgm);

  process.on("SIGINT", async () => {
    console.log("Ctrl+C pressed.");
    if (port.isOpen) {
      await portWrite(port, [0xfe]);
      port.close();
    }
    process.exit();
  });

  await player.exec();

  await portWrite(port, [0xfe]);
  port.close();

  // await portWrite(port, [
  //   0x00,
  //   0x00,
  //   0x20,
  //   0x00, // KEY OFF
  //   0x00,
  //   0x00,
  //   0x30,
  //   0x70, // @1 V15
  //   0x00,
  //   0x00,
  //   0x10,
  //   172, // TONE C
  //   0x00,
  //   0x00,
  //   0x20,
  //   0x16, // KEYON OCT2
  // ]);
  // await sleep(30000);
  // await portWrite(port, [
  //   0x00,
  //   0x00,
  //   0x20,
  //   0x04, // KEYOFF OCT2
  // ]);
}

async function portVerify(port: SerialPort, s: string) {
  return new Promise(async function(resolve, reject) {
    let d = port.read(s.length);
    while (d == null) {
      console.log("WAIT");
      await sleep(100);
      d = port.read(s.length);
    }
    if (d !== s) {
      console.log("FAIL");
      reject();
      return;
    }
    console.log("PASS");
    return resolve();
  });
}

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

test();
