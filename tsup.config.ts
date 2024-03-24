import { defineConfig } from "tsup";
import { fs, $ } from "zx";

export default defineConfig({
  entry: ["src/*.ts"],
  format: ["esm"],
  outDir: "dist",
  bundle: false,
  banner: {
    js: [
      "// Copyright 2018 Bartosz Jaroszewski",
      "// SPDX-License-Identifier: GPL-2.0-or-later",
      "//",
      "// This program is free software: you can redistribute it and/or modify",
      "// it under the terms of the GNU General Public License as published by",
      "// the Free Software Foundation, either version 2 of the License, or",
      "// (at your option) any later version.",
      "//",
      "// This program is distributed in the hope that it will be useful,",
      "// but WITHOUT ANY WARRANTY; without even the implied warranty of",
      "// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
      "// GNU General Public License for more details.",
      "//",
      "// You should have received a copy of the GNU General Public License",
      "// along with this program.  If not, see <https://www.gnu.org/licenses/>.",
      "",
    ].join("\n"),
  },
  onSuccess: async () => {
    await fs.copy("./assets", "./dist");
    await $`cd dist && glib-compile-schemas schemas && zip -r ./shell-extension.zip . -9r`;
  },
});
