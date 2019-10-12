import fs from "fs";
import zlib from "zlib";

import SPFM from "./spfm";
import VGMPlayer from "./vgm-player";
import VGMParser from "./vgm-parser";
import config from "./config";
import VGM from "./vgm";

async function sleep(msec: number) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
}

function printUsage() {
  console.info(`Usage: spfm-test VGMFILE`);
}

async function createSPFMObjects() {
  const ports = await SPFM.list();
  console.info(ports);
  if (ports.length === 0) {
    console.log("Missing serial device");
    process.exit(0);
  }
  const spfms: { [key: string]: SPFM } = {};
  for (const key in Object.keys(config.devices)) {
    const { comName, baudRate } = config.devices[key];
    const path = comName !== "*" ? comName : ports[0].comName;
    const spfm = new SPFM(path, baudRate);
    try {
      console.log(`Connecting: ${path}`);
      await spfm.open();
      spfms[key] = spfm;
    } catch (e) {
      console.error(e);
    }
  }
  return spfms;
}

function toArrayBuffer(b: Buffer) {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function loadVgm(input: string) {
  let vgmContext: Buffer;
  const buf = fs.readFileSync(input);
  try {
    vgmContext = zlib.gunzipSync(buf);
  } catch (e) {
    vgmContext = buf;
  }
  return VGMParser.parse(toArrayBuffer(vgmContext));
}

async function silentSPFMObjects(spfms: { [key: string]: SPFM }) {
  for (let key in spfms) {
    const spfm = spfms[key];
    await spfm.reset();
  }
}

async function main() {
  let vgm: VGM;

  const input = process.argv[2];
  if (!input) {
    printUsage();
    process.exit(0);
  }
  try {
    vgm = loadVgm(input);
    console.log(vgm);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const spfms = await createSPFMObjects();
  if (Object.keys(spfms).length === 0) {
    console.error("No SPFM device found.");
    process.exit(1);
  }

  const player = new VGMPlayer(spfms);
  player.setData(vgm!);

  process.on("SIGINT", async () => {
    await silentSPFMObjects(spfms);
    process.exit(0);
  });

  await player.exec();
  await silentSPFMObjects(spfms);
}

main();
