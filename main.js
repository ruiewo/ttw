const { app, dialog, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");

initialize();

function initialize() {
  autoUpdater.checkForUpdates();

  autoUpdater.on("update-downloaded", (info) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Restart", "Later"],
      message: "UPDATE",
      detail:
        "A new version has been downloaded. Restart the application to apply the updates."
    };

    dialog.showMessageBox(mainWin, dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("error", (err) => {
    console.error("There was a problem updating the application!");
    console.error(err);
  });

  app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });

  win.loadFile("index.html");
}
