# SPFM-TEST

A study of VGM player program for [SPFM Light] implemented with TypeScript.
It is tested only with:
- node v11.15.0 on macOS 10.14.4
- node v10.10.0 on Windows 10
- SPFM Light
- Re:Birth YM2413, AY8910 and YM2203 module.

Currently this may not work with node v12.x.

TypeScript で作成した [SPFM Light] 用の VGM プレイヤーのスタディです。
テストは以下の環境でのみ行っています。
- mac OS 10.14.4 & node v11.15.0
- node v10.10.0 on Windows 10
- SPFM Light
- Re:Birth YM2413, AY8910, YM2203 モジュール。

現在、node v12.x には対応していません。

[spfm light]: http://www.pyonpyon.jp/~gasshi/fm/spfmlight.html

# インストール / Install

node と npm コマンドが使える状態のターミナルで以下を実行します。

```
$ git clone https://github.com/okaxaki/spfm-test
$ cd spfm-test
$ npm install
```

# 設定 / Configuration

Modify the number of `slot` in `src/config.js` to specify the slot of the module on your SPFM device.

`src/config.js` 内の `slot` の番号を編集して、自分の SPFM 上のモジュールのスロット番号を指定してください。

```typescript
const config: Config = {
  devices: {
    0: { comName: "*", baudRate: 1500000 }, // use the first device found
    // 1: { comName: "/dev/tty.usbserial-XXXXYYYY", baudRate: 1500000 },
  },
  modules: {
    ym2413: { device: 0, slot: 0, clock: 3579545 },
    ay8910: { device: 0, slot: 1, clock: 1789750 },
    ym2608: { device: 0, slot: 0, clock: 4000000 }, // Implemented but not tested!
    ym2203: { device: 0, slot: 1, clock: 4000000 },
    ym2151: { device: 0, slot: 0, clock: 4000000 }, // Implemented but not tested!
    ym3526: { device: 0, slot: 0, clock: 4000000 }, // Implemented but not tested!
    ym3812: { device: 0, slot: 0, clock: 4000000 }, // Implemented but not tested!
    sn76489: { device: 0, slot: 0, clock: 3579545 }, // Implemented but not tested!
  },
  sleepMethod: "busyLoop",
};
```

# Run

Connect your SPFM to your machine and type the following command to play a vgm file through the SPFM device.

```
$ npm run spfm-test <vgmfile>
```

Both `.vgm` and `.vgz` are supported.
