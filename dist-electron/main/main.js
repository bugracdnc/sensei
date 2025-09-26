"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
const appDir = electron_1.app.getAppPath();
const classesDir = path_1.default.join(electron_1.app.getAppPath(), "classes");
async function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path_1.default.join(appDir, "dist-electron/preload.js"),
        },
    });
    if (process.env.NODE_ENV === "development") {
        await mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        await mainWindow.loadFile(path_1.default.join(appDir, "../dist/index.html"));
    }
}
async function log(msg) {
    console.log(`${new Date().toISOString().slice(0, -5)}: ` + msg);
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.ipcMain.handle("save-class", async (_event, cls) => {
    const filepath = `${classesDir}/${cls.className}.json`;
    log(`Saving '${cls.className}' to '` + filepath + "'");
    await fs_1.promises.writeFile(filepath, JSON.stringify(cls, null, 2), "utf-8");
    return filepath;
});
electron_1.ipcMain.handle("list-classes", async () => {
    const files = await fs_1.promises.readdir(`${classesDir}`);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
});
electron_1.ipcMain.handle("load-class", async (_event, className) => {
    const filepath = `${classesDir}/${className}.json`;
    log(`Reading '` + filepath + "'");
    const content = await fs_1.promises.readFile(filepath, "utf-8");
    const cls = JSON.parse(content);
    return cls;
});
electron_1.ipcMain.handle("remove-class", async (_event, className) => {
    const filepath = `${classesDir}/${className}.json`;
    log(`Removing '` + filepath + "'");
    return fs_1.promises.rm(filepath);
});
electron_1.ipcMain.handle("log", async (_event, msg) => {
    log(msg);
});
