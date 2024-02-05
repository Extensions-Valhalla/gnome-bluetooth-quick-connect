import type { Logger } from "./utils.js";
import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import type GnomeBluetooth from "gi://GnomeBluetooth";
import St from "gi://St";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

type PopupSwitchParams = {
  showRefreshButton: boolean;
  showBatteryValue: boolean;
  showBatteryIcon: boolean;
  closeMenuOnAction: boolean;
};

export class PopupSwitchWithButtonMenuItem extends PopupMenu.PopupSwitchMenuItem {
  _client: GnomeBluetooth.Client;
  _logger: Logger;
  _device: GnomeBluetooth.Device;
  _showRefreshButton: boolean;
  _closeMenuOnAction: boolean;
  _refreshButton: St.Button;
  _pendingLabel: St.Label;
  _batteryInfo: BatteryInfoWidgetClass;
  _afterReconnectTimeout: number | null = null;
  _afterToggleTimeout: number | null = null;
  _reconnectTimeout: number | null = null;

  constructor(
    client: GnomeBluetooth.Client,
    device: GnomeBluetooth.Device,
    logger: Logger,
    params: PopupSwitchParams,
  ) {
    const label = device.alias || device.name || "(unknown)";

    super(label, device.connected, {});

    this._handleIcon(device);

    this._client = client;
    this._logger = logger;
    this._device = device;

    this._showRefreshButton = params.showRefreshButton;
    this._closeMenuOnAction = params.closeMenuOnAction;

    this.actor.labelActor.x_expand = true;
    // @ts-expect-error, private property
    this.actor._statusBin.x_expand = false;

    this._refreshButton = this._buildRefreshButton();
    this._pendingLabel = this._buildPendingLabel();
    this._connectToggledEvent();

    this._batteryInfo = new BatteryInfoWidget(params.showBatteryValue, params.showBatteryIcon);
    this.insert_child_at_index(this._batteryInfo, this.get_n_children() - 1);

    this.insert_child_at_index(this._refreshButton, this.get_n_children() - 1);
    this.add_child(this._pendingLabel);

    this.sync(device);
  }

  _handleIcon(device: GnomeBluetooth.Device) {
    if (!device.icon) return;

    const deviceIcon = new St.Icon({
      style_class: "popup-menu-icon",
      icon_name: device.icon,
    });
    this.insert_child_at_index(deviceIcon, 1);
  }

  disconnectSignals() {
    if (this._afterReconnectTimeout != null) {
      GLib.Source.remove(this._afterReconnectTimeout);
      this._afterReconnectTimeout = null;
    }

    if (this._afterToggleTimeout != null) {
      GLib.Source.remove(this._afterToggleTimeout);
      this._afterToggleTimeout = null;
    }
  }

  sync(device: GnomeBluetooth.Device) {
    this.disconnectSignals();

    this._batteryInfo.visible = false;

    this._device = device;

    this.setToggleState(device.connected);
    this.visible = device.paired;
    if (this._showRefreshButton && device.connected) this._refreshButton.show();
    else this._refreshButton.hide();

    this._disablePending();

    if (device.connected) {
      if (device.battery_percentage && device.battery_percentage > 0) {
        this._batteryInfo.show();
        this._logger.log(
          `Battery percentage ${device.alias || device.name}: ${device.battery_percentage}`,
        );
        this._batteryInfo.setPercentage(device.battery_percentage);
      }
    }
  }

  _buildRefreshButton() {
    const icon = new St.Icon({
      icon_name: "view-refresh",
      style_class: "popup-menu-icon",
      opacity: 155,
    });

    const button = new St.Button({
      child: icon,
      x_align: 2, // Align.END
    });

    button.connect("enter-event", (widget) => {
      widget.child.ease({
        opacity: 255,
        time: 0.05,
        transition: Clutter.AnimationMode.LINEAR,
      });
    });

    button.connect("leave-event", (widget) => {
      widget.child.ease({
        opacity: 155,
        time: 0.05,
        transition: Clutter.AnimationMode.LINEAR,
      });
    });

    button.connect("clicked", () => {
      this._enablePending();
      // Reconnect Logic
      this._logger.log(`Reconnecting to ${this._device.alias || this._device.name}`);
      // First disconnect
      this._client.connect_service(this._device.get_object_path(), false, null, () => {
        // Wait and reconnect in callback after 7 seconds
        this._reconnectTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 7000, () => {
          this._logger.log(`Trying to Reconnect to ${this._device.alias || this._device.name}`);
          this._client.connect_service(this._device.get_object_path(), true, null, () => {});
          this._logger.log(`Reconnected to ${this._device.alias || this._device.name}`);
          this.sync(this._device);
          return GLib.SOURCE_REMOVE;
        });
      });

      this._afterReconnectTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10000, () => {
        this._disablePending();
        this._afterReconnectTimeout = null;
        return GLib.SOURCE_REMOVE;
      });

      if (this._closeMenuOnAction) this.emit("activate", Clutter.get_current_event());
    });

    return button;
  }

  _buildPendingLabel() {
    const label = new St.Label({ text: _("Wait") });
    label.hide();

    return label;
  }

  _connectToggledEvent() {
    this.connect("toggled", (item, state) => {
      this._client.connect_service(this._device.get_object_path(), state, null, () => {});

      // in case there is no change on device
      this._afterToggleTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10000, () => {
        this._disablePending();
        this._afterToggleTimeout = null;
        return GLib.SOURCE_REMOVE;
      });
    });
  }

  activate(event: Clutter.Event) {
    // @ts-expect-error, private property
    if (this.actor._switch.mapped) {
      this.toggle();
      // @ts-expect-error, private property
      this.actor._switch.toggle(); // toggle back, state will be updated by signal
    }

    // we allow pressing space to toggle the switch
    // without closing the menu
    if (
      event.type() === Clutter.EventType.KEY_PRESS &&
      event.get_key_symbol() === Clutter.KEY_space
    )
      return;

    if (this._closeMenuOnAction) this.emit("activate", event);
  }

  toggle() {
    super.toggle();
    this._enablePending();
  }

  _enablePending() {
    this._refreshButton.reactive = false;
    // @ts-expect-error, private property
    this.actor._switch.hide();
    this._pendingLabel.show();
    this.reactive = false;
  }

  _disablePending() {
    this._refreshButton.reactive = true;
    // @ts-expect-error, private property
    this.actor._switch.show();
    this._pendingLabel.hide();
    this.reactive = true;
  }

  destroy() {
    if (this._reconnectTimeout) {
      GLib.Source.remove(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    this.disconnectSignals();
    super.destroy();
  }
}

export const PopupBluetoothDeviceMenuItem = GObject.registerClass(PopupSwitchWithButtonMenuItem);

class BatteryInfoWidgetClass extends St.BoxLayout {
  _icon: St.Icon;
  _label: St.Label;
  constructor(showBatteryValue: boolean, showBatteryIcon: boolean) {
    super({ visible: false, style: "spacing: 3px;" });

    this._icon = new St.Icon({ style_class: "popup-menu-icon" });
    this.add_child(this._icon);
    this._icon.icon_name = null;

    // dirty trick: instantiate the label with text 100%, so we can set
    // the natural width of the label in case monospace has no effect
    this._label = new St.Label({
      x_align: Clutter.ActorAlign.START,
      y_align: Clutter.ActorAlign.CENTER,
      text: "100%",
      style_class: "monospace",
    });

    this._label.natural_width = this._label.width;
    this._label.text = "";

    this.add_child(this._label);

    if (!showBatteryValue) this._label.hide();
    if (!showBatteryIcon) this._icon.hide();
  }

  setPercentage(value: number | null) {
    if (value == null) {
      this._label.text = "";
      this._icon.icon_name = "battery-missing-symbolic";
    } else {
      this._label.text = `${value}%`;

      const fillLevel = 10 * Math.floor(value / 10);
      const iconName = `battery-level-${fillLevel}-symbolic`;
      this._icon.icon_name = iconName;
    }
  }
}

const BatteryInfoWidget = GObject.registerClass(BatteryInfoWidgetClass);