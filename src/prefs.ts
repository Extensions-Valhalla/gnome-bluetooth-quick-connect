import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import type { ExtensionMetadata } from "resource:///org/gnome/shell/extensions/extension.js";

export default class BluetoothQuickConnectPreferences extends ExtensionPreferences {
  _extension: ExtensionMetadata;
  _settings: Gio.Settings | null = null;
  _builder: Gtk.Builder | null = null;
  _widget: Gtk.Widget | null = null;

  constructor(extension: ExtensionMetadata) {
    super(extension);
    this._extension = extension;
  }

  _build(settings: Gio.Settings) {
    this._settings = settings;
    this._builder = new Gtk.Builder();
    this._builder.add_from_file(`${this._extension.path}/Settings.ui`);

    this._widget = this._builder.get_object("items_container") as Gtk.Widget;

    this._builder.get_object("auto_power_off_settings_button")?.connect("clicked", () => {
      const dialog = new Gtk.Dialog({
        title: "Auto power off settings",
        // @ts-expect-error, wrong types maybe
        transient_for: this._widget?.get_ancestor(Gtk.Window),
        // @ts-expect-error, technical limitation, uses boolean
        use_header_bar: true,
        modal: true,
      });

      const box = this._builder?.get_object("auto_power_off_settings") as Gtk.Box;
      dialog.get_content_area().append(box);

      dialog.connect("response", (dialog) => {
        dialog.get_content_area().remove(box);
        dialog.destroy();
      });

      dialog.show();
    });

    this._bind();

    return this._widget;
  }

  _bind() {
    if (!this._settings || !this._builder) return;

    const autoPowerOnSwitch = this._builder.get_object("auto_power_on_switch")!;
    this._settings.bind(
      "bluetooth-auto-power-on",
      autoPowerOnSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const autoPowerOffSwitch = this._builder.get_object("auto_power_off_switch")!;
    this._settings.bind(
      "bluetooth-auto-power-off",
      autoPowerOffSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const autoPowerOffInterval = this._builder.get_object("auto_power_off_interval")!;
    this._settings.bind(
      "bluetooth-auto-power-off-interval",
      autoPowerOffInterval,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const keepMenuOnToggleSwitch = this._builder.get_object("keep_menu_on_toggle")!;
    this._settings.bind(
      "keep-menu-on-toggle",
      keepMenuOnToggleSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const refreshButtonOnSwitch = this._builder.get_object("refresh_button_on")!;
    this._settings.bind(
      "refresh-button-on",
      refreshButtonOnSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const debugModeOnSwitch = this._builder.get_object("debug_mode_on")!;
    this._settings.bind(
      "debug-mode-on",
      debugModeOnSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const batteryValueOnSwitch = this._builder.get_object("show_battery_value_on")!;
    this._settings.bind(
      "show-battery-value-on",
      batteryValueOnSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const batteryIconOnSwitch = this._builder.get_object("show_battery_icon_on")!;
    this._settings.bind(
      "show-battery-icon-on",
      batteryIconOnSwitch,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    const widget = this._build(this.getSettings());
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    group.add(widget);
    page.add(group);
    window.add(page);
    window.connect("close-request", () => {
      // @ts-expect-error, GJS disposal
      this._extension = null;
      this._settings = null;
      this._builder = null;
      this._widget = null;
    });
  }
}
