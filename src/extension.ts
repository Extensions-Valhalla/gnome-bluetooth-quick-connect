import BluetoothController from "./bluetooth.js";
import Settings from "./settings.js";
import { PopupBluetoothDeviceMenuItem, type PopupSwitchWithButtonMenuItem } from "./ui.js";
import { Logger } from "./utils.js";
import GLib from "gi://GLib";
import type GnomeBluetooth from "gi://GnomeBluetooth";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

export default class BluetoothQuickConnect extends Extension {
  _settings!: Settings;
  _logger!: Logger;
  _controller!: BluetoothController;
  _menu!: PopupMenu.PopupMenuSection;
  _proxy!: { BluetoothAirplaneMode: boolean };
  _items: Record<string, PopupSwitchWithButtonMenuItem> = {};
  _signals: Array<{ subject: SignalConnectable; signal_id: number }> = [];
  _idleMonitorId: number | null = null;

  enable() {
    this._settings = new Settings(this);
    this._logger = new Logger(this._settings);
    this._controller = new BluetoothController();
    this._logger.log("Enabling extension");
    this._queueModify();
    this._menu = new PopupMenu.PopupMenuSection();
    this._items = {};
    this._controller.enable();
    this._refresh();
    this._connectControllerSignals();
    this._connectIdleMonitor();
    this._connectMenuSignals();
  }

  disable() {
    this._logger.log("Disabling extension");
    this._removeDevicesFromMenu();
    this._disconnectIdleMonitor();
    // @ts-expect-error, GJS disposal
    this._settings = null;
    // @ts-expect-error, GJS disposal
    this._logger = null;
    this._controller?.destroy();
    // @ts-expect-error, GJS disposal
    this._controller = null;
    // @ts-expect-error, GJS disposal
    this._menu = null;
    this._disconnectSignals();
  }

  _queueModify() {
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      if (!Main.panel.statusArea.quickSettings._bluetooth) {
        return GLib.SOURCE_CONTINUE;
      }
      const btIndicator = Main.panel.statusArea.quickSettings._bluetooth;
      const bluetoothToggle = btIndicator.quickSettingsItems[0];
      bluetoothToggle._updateDeviceVisibility = () => {
        bluetoothToggle._deviceSection.actor.visible = false;
        bluetoothToggle._placeholderItem.actor.visible = false;
      };
      bluetoothToggle._updateDeviceVisibility();

      this._proxy = bluetoothToggle._client._proxy;

      bluetoothToggle.menu.addMenuItem(this._menu, 0);
      return GLib.SOURCE_REMOVE;
    });
  }

  _connectMenuSignals() {
    this._connectSignal(this._menu, "open-state-changed", (_menu, isOpen) => {
      this._logger.log(`Menu toggled: ${isOpen}`);
      if (isOpen) {
        this._disconnectIdleMonitor();
      } else {
        this._connectIdleMonitor();
      }

      if (isOpen && this._settings.isAutoPowerOnEnabled() && this._proxy.BluetoothAirplaneMode) {
        this._logger.log("Disabling airplane mode");
        this._proxy.BluetoothAirplaneMode = false;
      }
    });
  }

  _connectControllerSignals() {
    this._logger.log("Connecting bluetooth controller signals");

    this._connectSignal(this._controller, "default-adapter-changed", (_ctrl) => {
      this._logger.log("Default adapter changed event");
      this._refresh();
    });

    this._connectSignal(this._controller, "device-inserted", (_ctrl, device) => {
      this._logger.log(`Device inserted event: ${device.alias || device.name}`);
      if (device.paired) {
        this._addMenuItem(device);
      } else {
        this._logger.log(`Device ${device.alias || device.name} not paired, ignoring`);
      }
    });

    this._connectSignal(this._controller, "device-changed", (_ctrl, device) => {
      this._logger.log(`Device changed event: ${device.alias || device.name}`);

      if (device.paired) this._syncMenuItem(device);
      else
        this._logger.log(
          `Skipping change event for unpaired device ${device.alias || device.name}`,
        );
    });

    this._connectSignal(this._controller, "device-deleted", (_ctrl, skipDevicePath) => {
      this._logger.log("Device deleted event");
      this._refresh(skipDevicePath);
    });
  }

  _syncMenuItem(device: GnomeBluetooth.Device) {
    this._logger.log(`Synchronizing device menu item: ${device.alias || device.name}`);
    const item = this._items[device.address || ""] || this._addMenuItem(device);
    item.sync(device);
  }

  _addMenuItem(device: GnomeBluetooth.Device) {
    this._logger.log(`Adding device menu item: ${device.alias || device.name} ${device.address}`);

    const menuItem = new PopupBluetoothDeviceMenuItem(
      this._controller._client,
      device,
      this._logger,
      {
        showRefreshButton: this._settings.isShowRefreshButtonEnabled(),
        closeMenuOnAction: !this._settings.isKeepMenuOnToggleEnabled(),
        showBatteryValue: this._settings.isShowBatteryValueEnabled(),
        showBatteryIcon: this._settings.isShowBatteryIconEnabled(),
      },
    );

    this._items[device.address || ""] = menuItem;
    this._menu.addMenuItem(menuItem);
    return menuItem;
  }

  _connectIdleMonitor() {
    if (this._idleMonitorId) return;
    this._logger.log("Connecting idle monitor");
    this._idleMonitorId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      this._settings.autoPowerOffCheckingInterval() * 1000,
      () => {
        if (
          this._settings.isAutoPowerOffEnabled() &&
          this._controller.getConnectedDevices().length === 0
        ) {
          this._proxy.BluetoothAirplaneMode = true;
        }

        return true;
      },
    );
  }

  _disconnectIdleMonitor() {
    if (!this._idleMonitorId) return;

    this._logger.log("Disconnecting idle monitor");

    GLib.Source.remove(this._idleMonitorId);
    this._idleMonitorId = null;
  }

  _connectSignal<T extends keyof BluetoothControllerEvents>(
    subject: SignalConnectable,
    signal_name: T,
    method: BluetoothControllerEvents[T],
  ): void;
  _connectSignal<T extends keyof PopupMenuEvents>(
    subject: SignalConnectable,
    signal_name: T,
    method: PopupMenuEvents[T],
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

  _refresh(skipDevice: string | null = null) {
    this._removeDevicesFromMenu();
    this._addDevicesToMenu(skipDevice);
    this._logger.log("Refreshing devices list");
  }

  _addDevicesToMenu(skipDevice: string | null = null) {
    for (const device of this._controller.getDevices().sort((a, b) => {
      if (!a.name) return 0;
      return a.name.localeCompare(b.name || "");
    })) {
      if (device.paired && device.get_object_path() !== skipDevice) {
        this._addMenuItem(device);
      } else {
        this._logger.log(`skipping adding device ${device.alias || device.name}`);
      }
    }
  }

  _removeDevicesFromMenu() {
    for (const item of Object.values(this._items)) {
      item.destroy();
    }

    this._items = {};
  }
}
