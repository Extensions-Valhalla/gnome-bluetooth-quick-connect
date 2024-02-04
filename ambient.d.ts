import "@girs/gjs";
import "@girs/gjs/dom";
import "@girs/gnome-shell/ambient";
import "@girs/gnome-shell/extensions/global";
import "@girs/gjs/ambient";

declare global {
  interface SignalConnectable {
    connect(signal_name: string, method: (...args: any[]) => any): number;
    disconnect(signal_id: number): void;
  }
}
