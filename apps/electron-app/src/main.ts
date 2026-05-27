import { app, BrowserWindow, protocol, net } from "electron";
import path from "path";

const isDev = !app.isPackaged;
const DIST = path.join(__dirname, "../../apps/astro-app/dist");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:4322");
    win.webContents.openDevTools();
  } else {
    win.loadURL("wywy:///");
  }
}

app.whenReady().then(() => {
  protocol.handle("wywy", (request) => {
    const url = new URL(request.url);
    const decodedPath = decodeURIComponent(url.pathname);
    let filePath = path.join(DIST, decodedPath);

    if (!path.extname(filePath)) {
      filePath = path.join(filePath, "index.html");
    }

    return net.fetch("file://" + filePath);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
