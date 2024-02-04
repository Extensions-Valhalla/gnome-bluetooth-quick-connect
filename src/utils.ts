import type Settings from "./settings.js";

export class Logger {
  _enabled: boolean;
  constructor(settings: Settings) {
    this._enabled = settings.isDebugModeEnabled();
  }

  log(message: string) {
    if (!this._enabled) return;
    console.log(`[bluetooth-quick-connect] ${message}`);
  }

  warn(message: any) {
    console.warn(`[bluetooth-quick-connect WARNING] ${message}`);
  }
}
