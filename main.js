const path = require("path");
const os = require("os");
const fs = require("fs");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const resizeImg = require("resize-img");

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

const menu = [
    ...(isMac
        ? [
              {
                  label: app.name,
                  submenu: [
                      {
                          label: "About",
                          click: createAboutWindow
                      }
                  ]
              }
          ]
        : []),
    {
        role: "fileMenu"
    },
    ...(!isMac
        ? [
              {
                  label: "Help",
                  submenu: [
                      {
                          label: "About",
                          click: createAboutWindow
                      }
                  ]
              }
          ]
        : []),
    // {
    //   label: 'File',
    //   submenu: [
    //     {
    //       label: 'Quit',
    //       click: () => app.quit(),
    //       accelerator: 'CmdOrCtrl+W',
    //     },
    //   ],
    // },
    ...(isDev
        ? [
              {
                  label: "Developer",
                  submenu: [
                      { role: "reload" },
                      { role: "forcereload" },
                      { type: "separator" },
                      { role: "toggledevtools" }
                  ]
              }
          ]
        : [])
];

let mainWindow;
let aboutWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "Image Resizer",
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, "./preload.js")
        }
    });

    // Open dev-tools if in dev environment
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title: "Image Resizer",
        width: 300,
        height: 600
    });

    aboutWindow.loadFile(path.join(__dirname, "../about.html"));
}

app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // remove window on close
    mainWindow.on("closed", () => {
        mainWindow = null;
        aboutWindow = null;
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

// Respond to ipcRenderer resize
ipcMain.on("image:resize", (_event, options) => {
    options.dest = path.join(os.homedir(), "imageresizer");
    resizeImage(options);
});

async function resizeImage({ imgPath, width, height, dest }) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: Number(width),
            height: Number(height)
        });

        const filename = path.basename(imgPath);

        // create dest folder if it does nto exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // write file to destination
        fs.writeFileSync(path.join(dest, filename), newPath);

        // send success to renderer
        mainWindow.webContents.send("image:done");

        // Open dest folder
        shell.openPath(dest);
    } catch (error) {
        console.error(error);
    }
}
