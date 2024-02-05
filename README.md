# 🧩 Bluetooth Quick Connect

This extension allows paired Bluetooth devices to be connected and disconnected via the GNOME system menu, Shows battery status and more.

---

<div align="center">
    <div>
        <a href="https://extensions.gnome.org/extension/1401/bluetooth-quick-connect">
            <img alt="Get it on Gnome Extensions" height="100" src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true">
        </a>
    </div>
    <a href="https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/Extensions-Valhalla/gnome-bluetooth-quick-connect?style=for-the-badge">
    </a>
    <a href="https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect/graphs/contributors">
        <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/Extensions-Valhalla/gnome-bluetooth-quick-connect?style=for-the-badge">
    </a>
    <a href="https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect/blob/master/LICENSE">
        <img alt="GitHub" src="https://img.shields.io/github/license/Extensions-Valhalla/gnome-bluetooth-quick-connect?style=for-the-badge">
    </a>
    <a href="https://github.com/sponsors/BlankParticle">
        <img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/BlankParticle?style=for-the-badge">
    </a>
</div>

> [!NOTE]
> This is a maintained fork of original Extension by [bjarosze](https://github.com/bjarosze).

## ❄️ Installation

### 🚧 Requirements

- Properly working `bluez` setup

### 🎋 Installation from source code

Make sure you have Node.js and `pnpm` installed

```bash
git clone https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect
cd gnome-bluetooth-quick-connect
pnpm install
pnpm extension-install
```

## 🛠️ Troubleshooting Guide

### 🔋 Battery Level Doesn't work

Headset battery (currently) requires enabling experimental features in `bluez`.

See <https://github.com/bjarosze/gnome-bluetooth-quick-connect/pull/42> for more details.

#### 📖 Guides

- [Enabling Experimental Features](https://wiki.archlinux.org/title/bluetooth#Enabling_experimental_features)
- [Check Bluetooth headphones battery status in Linux](https://askubuntu.com/questions/1117563/check-bluetooth-headphones-battery-status-in-linux)

### 🔍 Bluetooth Menu Disappears when turned Off (Pop!OS)

You may encounter an issue where the Bluetooth menu disappears when you turn off Bluetooth.

To fix this issue you need to do the following:

- Have **at-least one** device paired (this is important)
- Run this command in terminal

```bash
gsettings set org.gnome.shell had-bluetooth-devices-setup true
```

Now you can restart your system and the Bluetooth menu should be fixed.

## 🏗️ How to contribute

### 🐛 Reporting Bugs

If you encounter any bugs, please report them in the [Issues](https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect/issues). This will ensure a better experience for everyone.

### 📝 Translations

If you want to help translate this extension, carry on reading.

You need to first [fork](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#about-forking) this repository and then [clone](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#cloning-a-fork) it to your local machine.

```bash
git clone https://github.com/[your-username]/gnome-bluetooth-quick-connect
cd gnome-bluetooth-quick-connect
```

Now you need to create a new branch for your changes. For translations, you may want to use `translate/[language-code]` as the branch name.

```bash
git checkout -b translate/[language-code]
```

Now you might want to install a [translation editor](https://wiki.gnome.org/TranslationProject/LocalisationGuide#Translation_Editors) to make the process easier. We suggest using [Poedit](https://poedit.net/).

Open the translation app and choose Create new translation from POT file. Now select the `pot` file from the `assets/po` folder. Choose the language you want to translate to and start translating.

After you are done translating, save the file. You might want to preview the translations. See [Installation from Source Code](#🎋-installation-from-source-code) to get the local copy of the extension installed. Then restart the shell by logging out and logging back in. Then enable the extension.

```bash
gnome-extensions enable bluetooth-quick-connect@bjarosze.gmail.com
```

If everything looks good, you can commit your changes.

```bash
git add .
git commit -m "Add [language-name] translation"
```

Now you need to push the changes to your forked repository.

```bash
git push origin translate/[language-code]
```

Now you need to create a [Pull Request](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request) to the original repository. And you are done!

We will review your changes and merge them if everything looks good.

> [!IMPORTANT]
> After you are done you might want to remove the local installation of the extension. Then re-install it from the extensions website. This will ensure you receive future updates.

### 💸 Sponsorship

If you like this extension, please consider [sponsoring me](https://github.com/sponsors/BlankParticle). This will help me spend more time on this project.

## 📜 License

This project is licensed under the [GPL-3.0 license](https://github.com/Extensions-Valhalla/gnome-bluetooth-quick-connect/blob/master/LICENSE).
