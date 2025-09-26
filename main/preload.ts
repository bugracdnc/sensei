import { contextBridge, ipcRenderer } from "electron";
import type { Classes } from "../src/components/models";

contextBridge.exposeInMainWorld("electronAPI", {
    saveClass: (cls: Classes) => ipcRenderer.invoke("save-class", cls),
    loadClass: (className: string) => ipcRenderer.invoke("load-class", className),
    listClasses: () => ipcRenderer.invoke("list-classes"),
    removeClass: (className: string) => ipcRenderer.invoke("remove-class", className),
    log: (msg: string) => ipcRenderer.invoke("log", msg),
});