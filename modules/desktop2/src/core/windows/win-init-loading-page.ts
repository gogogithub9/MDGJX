import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { DMainPassProps } from "../d-types";
import { isDevEnv, isProductionEnv } from "../web2share-copy/env";
import { cfg_getAppClientEntryPage, cfg_getAppLocalLoadingPage, cfg_getAppMainHost, cfg_getIconImg, cfg_getMinimalMDGJXRootDir, cfg_getRootFolder, CONFIG_OBJ } from "../d-config";
import { APP_WIN_REF } from "../d-winref";
import { logger } from "../utils/logger";
import { registerIpcMainOn } from "../d-main-msg";
import { existsSync } from "original-fs";
import { MSG_REF } from "../../lib2/msg";
import { sleep } from "../d-utils";
import { RES_PushMDGJXStatus } from "src/lib2/types";
import winWebSetup from "./win-web-setup";
var tcpPortUsed = require("tcp-port-used");
import axios from 'axios'


const RefStartStatus = {
  startChecking: false,
  serverRunning: false,
  msg: ''
}
const fn_startMinimalService = async () => {
  const fn_updateMsgToRenderer = (msg: string, pct: number) => {
    const v: RES_PushMDGJXStatus = {
      msg: msg,
      pct: pct
    }
    MSG_REF.ipcMain_send('pushInitStatusToRender', v)
  }
  try {
    if (RefStartStatus.serverRunning) {
      logger.info(`startMinimalService: already running, do not start again`)
      fn_updateMsgToRenderer('服务已经启动，无需再次启动', 100)
      return
    }
    if (RefStartStatus.startChecking) {
      logger.info(`startMinimalService: already started, do not start again`)
      return
    }

    RefStartStatus.startChecking = true
    logger.debug(`startMinimalService: start`)
    fn_updateMsgToRenderer('正在启动本地核心服务...', 5)
    fn_updateMsgToRenderer('正在检查服务端口可用性...', 10)
    let finalPort = -1;
    for (let port = 32016, j = 0; port < 42020; port++, j++) {
      fn_updateMsgToRenderer('正在测试端口' + port + '中...', 10 + j)
      try {
        await tcpPortUsed.waitUntilUsed(44204, 200, 800)
        logger.info(`startMinimalService: the port is used: ${port}`)
        continue;
      } catch (e) {
        // get errors means the port is not used
        finalPort = port
        logger.info(`startMinimalService: port ${port} is available`)
        break;
      }
    }
    if (isDevEnv()) {
      finalPort = 5173
    }
    if (finalPort == -1) {
      throw new Error('无法找到可用端口')
    } else {
      logger.info(`startMinimalService: finalPort is ${finalPort}`)
      fn_updateMsgToRenderer('端口测试完毕(' + finalPort + ')，准备启动服务...', 40)
    }
    CONFIG_OBJ.APP_MAIN_HOST_PORT = finalPort
    fn_updateMsgToRenderer(`服务模块读取完毕`, 90)

    const finalEntryPageLink = cfg_getAppClientEntryPage()
    logger.info(`startMinimalService: finalEntryPageLink is ${finalEntryPageLink}`)
    const systemHost = '127.0.0.1'
    if (isProductionEnv()) {
      const rootDir = cfg_getMinimalMDGJXRootDir()
      process.env.HOSTNAME = systemHost
      process.env.PORT = finalPort + ''
      process.env.NODE_ENV = 'production'
      const bootEntryFile = path.join(rootDir, 'boot', 'pre-entrypoint.js')
      // const bootEntryFile = 'C:\\Users\\jerrylai\\AppData\\Local\\Programs\\MDGJX\\resources\\app\\minimal-dist\\MDGJX\\boot\\pre-entrypoint.js'
      logger.info(`startMinimalService: bootEntryFile is ${bootEntryFile}`)
      if (!existsSync(bootEntryFile)) {
        throw new Error('启动文件不存在: ' + bootEntryFile)
      } else {
        logger.info(`startMinimalService: starting server... by using ${bootEntryFile}`)
        fn_updateMsgToRenderer(`启动服务中...`, 90)
        setTimeout(() => {
          try {
            require(bootEntryFile)
          } catch (e) {
            logger.error(`startMinimalService require bootEntryFile: ${e.message} ${e}`)
          }
        }, 0)
        await sleep(800)
        logger.info(`startMinimalService: server started`)
      }
    } else {
      logger.info(`startMinimalService: is not production env, skip starting server`)
    }


    fn_updateMsgToRenderer(`检测本地服务连通性...`, 90)
    const tryTimes = 20;
    let isOK = false;
    let lastErr = ''
    for (let i = 0; i < tryTimes; i++) {
      try {
        await tcpPortUsed.waitUntilUsed(finalPort, 500, 1000)
        lastErr = `端口${finalPort}无法占用，请检查防火墙或安全软件添加白名单`
        fn_updateMsgToRenderer(`检测本地服务连通性[${i}]次...`, 90)
        logger.error(`startMinimalService: server is not running, tryTimes: ${i}/${tryTimes}, failed to listen to port ${finalPort}`)
        await sleep(800)
      } catch (e) {
        // if the port is used, then the server is running
        logger.info(`startMinimalService: server is running ${e.message} ${e}`)
        logger.info(`startMinimalService: server is running`)
        RefStartStatus.serverRunning = true
        isOK = true;
        break;
      }
    }
    if (!isOK) {
      fn_updateMsgToRenderer(`服务启动失败: ${lastErr}`, 20)
      throw new Error('无法连接到本地服务，请尝试关闭所有相关进程')
    }
    fn_updateMsgToRenderer(`本地服务启动成功，将跳转至主页面`, 90)
    RefStartStatus.serverRunning = true
    RefStartStatus.startChecking = false
    await sleep(500)
    APP_WIN_REF.setupWin.close()

    const webSetupFn = winWebSetup()
    webSetupFn.show()
  } catch (e) {
    logger.error(`startMinimalService: ${e.message} ${e}`)
    RefStartStatus.startChecking = false
    fn_updateMsgToRenderer('无法启动，错误原因： ' + (e.message || e), 20)
  }
}

export default () => {
  let iconImg = cfg_getIconImg()

  const display = screen.getPrimaryDisplay()
  const appScreenWidth = display.bounds.width
  const appScreenHeight = display.bounds.height
  const dPreloadJS = path.join(__dirname, "preload-loading-pages.js")
  if (!existsSync(dPreloadJS)) {
    logger.error(`preload file not found: ${dPreloadJS}`)
    return
  }
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // full width and height
    // width: appScreenWidth,
    // height: appScreenHeight,
    width: 620,
    height: 330,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    icon: iconImg,
    webPreferences: {
      nodeIntegration: true, // is default value after Electron v5
      contextIsolation: false, // protect against prototype pollution
      preload: dPreloadJS,
    },
  });

  registerIpcMainOn('setup', async (key, values) => {
    switch (key) {
      case 'updateTitle':
        mainWindow.setTitle(values)
        return true;
      case 'startRunMDGJXMinimal':
        logger.debug(`ok, ipcMain has received the request startRunMDGJXMinimal`)
        fn_startMinimalService()
        return true;
      default:
        return false;
    }
  })

  APP_WIN_REF.setupWin = mainWindow;

  mainWindow.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    require("electron").shell.openExternal(url);
  });

  mainWindow.loadURL(cfg_getAppLocalLoadingPage());

  if (isDevEnv()) {
    mainWindow.webContents.openDevTools();
  }
};