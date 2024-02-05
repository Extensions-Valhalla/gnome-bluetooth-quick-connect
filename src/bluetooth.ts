import type Gio from "gi://Gio";
import GnomeBluetooth from "gi://GnomeBluetooth";
import * as Signals from "resource:///org/gnome/shell/misc/signals.js";

export default class BluetoothController extends Signals.EventEmitter {
  _client: GnomeBluetooth.Client;
  _deviceNotifyConnected: Set<string>;
  _store: Gio.ListStore<GnomeBluetooth.Device>;
  _signals: Array<{ subject: SignalConnectable; signal_id: number }> = [];

  constructor() {
    super();
    this._client = new GnomeBluetooth.Client();
    this._deviceNotifyConnected = new Set();
    this._store = this._client.get_devices();
  }

  enable() {
    this._connectSignal(this._client, "notify::default-adapter", () => {
      this._deviceNotifyConnected.clear();
      this.emit("default-adapter-changed");
    });
    this._connectSignal(this._client, "notify::default-adapter-powered", () => {
      this._deviceNotifyConnected.clear();
      this.emit("default-adapter-changed");
    });
    this._connectSignal(this._client, "device-removed", (c, path) => {
      this._deviceNotifyConnected.delete(path);
      this.emit("device-deleted", path);
    });
    this._connectSignal(this._client, "device-added", (c, device) => {
      this._connectDeviceNotify(device);
      this.emit("device-inserted", device);
    });
  }

  getDevices() {
    const devices = [];
    for (let i = 0; i < this._store.get_n_items(); i++) {
      const device = this._store.get_item(i) as GnomeBluetooth.Device;
      devices.push(device);
    }
    return devices;
  }

  getConnectedDevices() {
    return this.getDevices().filter(({ connected }) => connected);
  }

  destroy() {
    this._disconnectSignals();
  }

  _connectDeviceNotify(device: GnomeBluetooth.Device) {
    const path = device.get_object_path();

    if (this._deviceNotifyConnected.has(path)) return;

    this._deviceNotifyConnected.add(path);
    this._connectSignal(device, "notify", (device) => {
      this.emit("device-changed", device);
    });
  }

  _connectSignal<T extends keyof BluetoothClientEvents>(
    subject: SignalConnectable,
    signal_name: T,
    method: BluetoothClientEvents[T],
  ): void;
  _connectSignal<T extends keyof BluetoothControllerEvents>(
    subject: SignalConnectable,
    signal_name: T,
    method: BluetoothControllerEvents[T],
  ): void;
  _connectSignal(
    subject: SignalConnectable,
    signal_name: string,
    method: (...args: unknown[]) => unknown,
  ) {
    if (!this._signals) this._signals = [];

    const signal_id = subject.connect(signal_name, method);
    this._signals.push({
      subject,
      signal_id,
    });
  }

  _disconnectSignals() {
    if (!this._signals) return;

    for (const signal of this._signals) {
      signal.subject.disconnect(signal.signal_id);
    }

    this._signals = [];
  }
}
