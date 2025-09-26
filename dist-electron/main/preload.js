"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    saveClass: (cls) => electron_1.ipcRenderer.invoke("save-class", cls),
    loadClass: (className) => electron_1.ipcRenderer.invoke("load-class", className),
    listClasses: () => electron_1.ipcRenderer.invoke("list-classes"),
    removeClass: (className) => electron_1.ipcRenderer.invoke("remove-class", className),
    log: (msg) => electron_1.ipcRenderer.invoke("log", msg),
});
