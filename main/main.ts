import { app, BrowserWindow, ipcMain } from "electron";
import { promises as fs } from "fs";
import path from "path";
import type { Classes } from "../src/components/models";

let mainWindow: BrowserWindow | null = null;

const appDir = app.getAppPath();
const classesDir = path.join(appDir, "classes");
const deletedDir = path.join(classesDir, ".deleted");

async function log(msg: string) {
    console.log(`${new Date().toISOString().slice(0, -1)}: ` + msg);
}

async function ensureDirs() {
    try {
        await fs.mkdir(classesDir, { recursive: true });
        await fs.mkdir(deletedDir, { recursive: true });
    } catch (err) {
        await log(`Error ensuring dirs: ${err}`);
    }
}

// -----------------------
//  Window setup
// -----------------------
async function createWindow() {
    await ensureDirs();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            webSecurity: false,
            preload: path.join(appDir, "dist-electron/main/preload.js"),
        },
    });

    if (process.env.NODE_ENV === "development") {
        await mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    } else {
        await mainWindow.loadFile(path.join(appDir, "./dist/index.html"));
    }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// -----------------------
//  IPC handlers
// -----------------------

// Save a class - writes JSON file
ipcMain.handle("save-class", async (_event, cls: Classes) => {
    try {
        const filepath = path.join(classesDir, `${cls.className}.json`);
        await fs.writeFile(filepath, JSON.stringify(cls, null, 2), "utf-8");
        log(`Saved '${cls.className}' to '${filepath}'`);
        return filepath;
    } catch (err) {
        await log(`Error saving class: ${err}`);
        throw err;
    }
});

// List all classes - reads JSON files from folder
ipcMain.handle("list-classes", async () => {
    try {
        const files = await fs.readdir(`${classesDir}`);
        await log("Reading classes directory...")

        const jsonFiles = files.filter((f) => f.endsWith(".json"));

        const classes: Classes[] = await Promise.all(
            jsonFiles.map(async file => {
                const content = await fs.readFile(`${classesDir}/${file}`, "utf-8");
                return JSON.parse(content) as Classes;
            })
        );

        log(`Loaded ${classes.length} classes`);
        return classes;
    } catch (err) {
        await log(`Error listing classes: ${err}`);
        throw err;
    }
});

// Load a single class
ipcMain.handle("load-class", async (_event, className: string) => {
    try {
        const filepath = path.join(classesDir, `${className}.json`);
        const content = await fs.readFile(filepath, "utf-8");
        const cls: Classes = JSON.parse(content);
        await log(`Loaded '${cls.className} from ${filepath}`);
        return cls;
    } catch (err) {
        await log(`Error loading class '${className}: ${err}`);
        throw err;
    }
});

// Remove a class - deletes a JSON file
ipcMain.handle("remove-class", async (_event, className: string) => {
    try {
        const srcPath = path.join(classesDir, `${className}.json`);
        const timestamp = new Date().toISOString().slice(0, -1).replace(/[:.]/g, "-");
        const destPath = path.join(deletedDir, `${className}.json.${timestamp}`);
        await fs.rename(srcPath, destPath);
        await log(`Soft-removed '${className}' (into .deleted subfolder)`);
        return true;
    } catch (err) {
        await log(`Error removing class: ${className}: ${err}`);
        throw err;
    }
});

// Log handler, passes the logs to backed
ipcMain.handle("log", async (_event, msg: string) => {
    await log(msg);
});