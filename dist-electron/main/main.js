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
const classesDir = path_1.default.join(appDir, "classes");
const deletedDir = path_1.default.join(classesDir, ".deleted");
async function log(msg) {
    console.log(`${new Date().toISOString().slice(0, -1)}: ` + msg);
}
async function ensureDirs() {
    try {
        await fs_1.promises.mkdir(classesDir, { recursive: true });
        await fs_1.promises.mkdir(deletedDir, { recursive: true });
    }
    catch (err) {
        await log(`Error ensuring dirs: ${err}`);
    }
}
// -----------------------
//  Window setup
// -----------------------
async function createWindow() {
    await ensureDirs();
    mainWindow = new electron_1.BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            webSecurity: false,
            preload: path_1.default.join(appDir, "dist-electron/main/preload.js"),
        },
    });
    if (process.env.NODE_ENV === "development") {
        await mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        await mainWindow.loadFile(path_1.default.join(appDir, "./dist/index.html"));
    }
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
// -----------------------
//  IPC handlers
// -----------------------
// Save a class - writes JSON file
electron_1.ipcMain.handle("save-class", async (_event, cls) => {
    try {
        const filepath = path_1.default.join(classesDir, `${cls.className}.json`);
        await fs_1.promises.writeFile(filepath, JSON.stringify(cls, null, 2), "utf-8");
        log(`Saved '${cls.className}' to '${filepath}'`);
        return filepath;
    }
    catch (err) {
        await log(`Error saving class: ${err}`);
        throw err;
    }
});
// List all classes - reads JSON files from folder
electron_1.ipcMain.handle("list-classes", async () => {
    try {
        const files = await fs_1.promises.readdir(`${classesDir}`);
        await log("Reading classes directory...");
        const jsonFiles = files.filter((f) => f.endsWith(".json"));
        const classes = await Promise.all(jsonFiles.map(async (file) => {
            const content = await fs_1.promises.readFile(`${classesDir}/${file}`, "utf-8");
            return JSON.parse(content);
        }));
        log(`Loaded ${classes.length} classes`);
        return classes;
    }
    catch (err) {
        await log(`Error listing classes: ${err}`);
        throw err;
    }
});
// Load a single class
electron_1.ipcMain.handle("load-class", async (_event, className) => {
    try {
        const filepath = path_1.default.join(classesDir, `${className}.json`);
        const content = await fs_1.promises.readFile(filepath, "utf-8");
        const cls = JSON.parse(content);
        await log(`Loaded '${cls.className} from ${filepath}`);
        return cls;
    }
    catch (err) {
        await log(`Error loading class '${className}: ${err}`);
        throw err;
    }
});
// Remove a class - deletes a JSON file
electron_1.ipcMain.handle("remove-class", async (_event, className) => {
    try {
        const srcPath = path_1.default.join(classesDir, `${className}.json`);
        const timestamp = new Date().toISOString().slice(0, -1).replace(/[:.]/g, "-");
        const destPath = path_1.default.join(deletedDir, `${className}.json.${timestamp}`);
        await fs_1.promises.rename(srcPath, destPath);
        await log(`Soft-removed '${className}' (into .deleted subfolder)`);
        return true;
    }
    catch (err) {
        await log(`Error removing class: ${className}: ${err}`);
        throw err;
    }
});
// Log handler, passes the logs to backed
electron_1.ipcMain.handle("log", async (_event, msg) => {
    await log(msg);
});
