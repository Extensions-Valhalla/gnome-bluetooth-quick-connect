import type { Extension } from "@girs/gnome-shell/extensions/extension";
import type Gio from "gi://Gio";

export default class Settings {
  settings: Gio.Settings;
  constructor(extension: Extension) {
    this.settings = extension.getSettings();
  }

  isAutoPowerOnEnabled() {
    return this.settings.get_boolean("bluetooth-auto-power-on");
  }

  isAutoPowerOffEnabled() {
    return this.settings.get_boolean("bluetooth-auto-power-off");
  }

  autoPowerOffCheckingInterval() {
    return this.settings.get_int("bluetooth-auto-power-off-interval");
  }

  isKeepMenuOnToggleEnabled() {
    return this.settings.get_boolean("keep-menu-on-toggle");
  }

  isShowRefreshButtonEnabled() {
    return this.settings.get_boolean("refresh-button-on");
  }

  isDebugModeEnabled() {
    return this.settings.get_boolean("debug-mode-on");
  }

  isShowBatteryValueEnabled() {
    return this.settings.get_boolean("show-battery-value-on");
  }

  isShowBatteryIconEnabled() {
    return this.settings.get_boolean("show-battery-icon-on");
  }
}
