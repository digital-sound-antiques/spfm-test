export type Config = {
  devices: { [key: string]: { comName: string; baudRate?: number } };
  modules: {
    [key: string]: { device: number | string; slot: number; clock: number };
  };
  sleepMethod: "standard" | "busyLoop";
};

const config: Config = {
  devices: {
    0: { comName: "*", baudRate: 1500000 }, // use the first device found
    // 1: { comName: "/dev/tty.usbserial-XXXXYYYY", baudRate: 1500000 },
  },
  modules: {
    ym2413: { device: 0, slot: 0, clock: 3579545 },
    ay8910: { device: 0, slot: 1, clock: 1789750 },
    ym2608: { device: 0, slot: 0, clock: 8000000 },
    ym2203: { device: 0, slot: 0, clock: 4000000 },
    ym2151: { device: 0, slot: 0, clock: 4000000 },
    ym3526: { device: 0, slot: 0, clock: 3579545 },
    ym3812: { device: 0, slot: 0, clock: 3579545 },
    y8950: { device: 0, slot: 0, clock: 3579545 },
    sn76489: { device: 0, slot: 0, clock: 3579545 },
  },
  sleepMethod: "busyLoop",
};

export default config;
