import "@girs/gjs";
import "@girs/gjs/ambient";
import "@girs/gjs/dom";
import "@girs/gnome-shell/ambient";
import "@girs/gnome-shell/extensions/global";

declare global {
  // Handy Type to ensure that the object has a connect/disconnect method
  interface SignalConnectable {
    connect(signal_name: string, method: (...args: unknown[]) => unknown): number;
    disconnect(signal_id: number): void;
  }

  // Event Maps
  interface BluetoothControllerEvents {
    "default-adapter-changed": (ctrl: BluetoothController) => void;
    "device-changed": (ctrl: BluetoothController, device: GnomeBluetooth.Device) => void;
    "device-deleted": (ctrl: BluetoothController, path: string) => void;
    "device-inserted": (ctrl: BluetoothController, device: GnomeBluetooth.Device) => void;
    notify: (ctrl: BluetoothController) => void;
  }

  interface BluetoothClientEvents {
    "device-added": (ctrl: GnomeBluetooth.Client, device: GnomeBluetooth.Device) => void;
    "device-removed": (ctrl: GnomeBluetooth.Client, path: string) => void;
    "notify::default-adapter": (ctrl: GnomeBluetooth.Client) => void;
    "notify::default-adapter-powered": (ctrl: GnomeBluetooth.Client) => void;
  }

  interface PopupMenuEvents {
    "open-state-changed": (menu: PopupMenu.PopupMenu, isOpen: boolean) => void;
  }
}
