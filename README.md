# SPFM-TEST

A study of VGM player program for [SPFM Light] implemented with TypeScript.

[SPFM Light]: http://www.pyonpyon.jp/~gasshi/fm/spfmlight.html

The tested environments are:
- node v11.15.0 on macOS 10.14.4
- node v10.10.0 on Windows 10
- node v12.2.0 on Debian9 (on VirtualBox)

The tested hardwares are:
- SPFM Light
- Re:Birth YM2413, AY8910 and YM2203 module.

TypeScript で作成した [SPFM Light] 用の VGM プレイヤーのスタディです。

次の環境で動作確認しています。

- node v11.15.0 on mac OS 10.14.4
- node v10.10.0 on Windows 10
- node v12.2.0 on Debian9 (on VirtualBox)

ハードウェア側は以下でテストしています。

- SPFM Light
- Re:Birth YM2413, AY8910, YM2203 モジュール。

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

# 実行 / Run

Connect your SPFM Light to your machine and type the following command to play a vgm file through the SPFM device.

SPFM Light を手持ちの端末に接続して、以下を実行してください。

```
$ npm run spfm-test <vgmfile>
```

Both `.vgm` and `.vgz` are supported.
