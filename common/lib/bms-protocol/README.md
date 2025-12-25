# BMS 通讯协议（JS）

基于：
- `doc/oriigin/device_comm_protocol_basic.md`（状态查询 0x03）
- `doc/oriigin/device_comm_protocol_write.md`（参数写入 0x10、UUID 0xFF、时间同步等）

## 目录结构（分层）
- `frame.js`：帧封装/解析（头 `7F 55`、尾 `FD`、CRC16-Modbus）
- `crc16modbus.js`：CRC 算法
- `param-registry.js`：语义化参数常量与寄存器映射
- `status-parser.js`：状态寄存器解析为语义化 JSON
- `client.js`：高层 API（读写寄存器、按类别读写参数、一次读取状态）
- `transport.js`：通讯层适配（`transport.request`）

## 使用方式

### 1) 注入通讯层（Transport）
只要实现一个 `transport.request(frameBytes)`，返回设备完整回复帧即可：

```js
import { BmsClient, createRequestTransport } from '@/common/lib/bms-protocol';

const transport = createRequestTransport(async (frameBytes) => {
	// TODO: 这里接入 BLE / 串口 / 485，发送 frameBytes，并等待回复帧 Uint8Array
	// return replyFrameBytes;
});

const client = new BmsClient({ transport, targetAddress: 0x01 });
```

### 1.1) 使用 uniapp BLE Transport（推荐）
该 transport 完全基于 uniapp 蓝牙 API，并内置：
- 分包写入（默认 20 字节）与分包接收缓冲
- 通过 `7F 55 ... FD` 自动拼帧，并用 CRC 校验过滤无效帧
- request 串行化，避免多指令并发导致回复串包

```js
import { BmsClient, createUniBleBmsTransport } from '@/common/lib/bms-protocol';

const transport = createUniBleBmsTransport({
	// 协议文档默认 UUID（可不填）
	serviceUUID: '0000ffc0-0000-1000-8000-00805f9b34fb',
	writeCharUUID: '0000ff03-0000-1000-8000-00805f9b34fb',
	notifyCharUUID: '0000ffc1-0000-1000-8000-00805f9b34fb',
});

// 扫描（可选）
const devices = await transport.discover({ durationMs: 3000 });
// 连接：选择你的设备 deviceId
await transport.connect({ deviceId: devices[0].deviceId });

const client = new BmsClient({ transport, targetAddress: 0x01 });
const status = await client.readAllStatus();
```

### 1.2) 使用 uniapp WebSocket MQTT Transport
该 transport 完全基于 uniapp WebSocket API，并内置一个轻量 MQTT v3.1.1 客户端（仅 QoS0）。
你只需要配置：
- `writeTopic`：写入（publish 请求 BMS 帧）
- `readTopic`：读取（subscribe 等待 BMS 回复帧）

```js
import { BmsClient, createUniMqttWsBmsTransport } from '@/common/lib/bms-protocol';

const transport = createUniMqttWsBmsTransport({
	wsUrl: 'wss://your-broker.example.com/mqtt', // broker 的 websocket 地址
	clientId: 'uniapp-bms-' + Date.now(),
	username: 'xxx', // 可选
	password: 'xxx', // 可选
	writeTopic: 'bms/downlink/xxx',
	readTopic: 'bms/uplink/xxx',
});

await transport.connect();
const client = new BmsClient({ transport, targetAddress: 0x01 });
const status = await client.readAllStatus();
```

### 2) 一次读取所有状态并解析为 JSON
```js
const status = await client.readAllStatus();
```

### 3) 读取/写入单个参数（语义化常量名）
```js
import { BMS_PARAM } from '@/common/lib/bms-protocol';

const v = await client.readParam(BMS_PARAM.CELL_OV_ALARM_V);
await client.writeParam(BMS_PARAM.CELL_OV_ALARM_V, 3.55);
```

### 4) 按类别批量读写（电压/电流/温度/其他）
写入与读取均为对象（key 支持 `CELL_OV_ALARM_V` 或其 camelCase：`cellOvAlarmV`）：
```js
await client.setVoltageParams({ cellOvAlarmV: 3.55 });
const vp = await client.getVoltageParams();
```

### 5) 其他语义化命令
```js
const uuidHex = await client.readUuid();
await client.syncTime(Math.floor(Date.now() / 1000));
await client.configureMeterMac({ meterAddress: 0xFC, mac: 'BC:EC:3A:4A:AB:AC' });
```
