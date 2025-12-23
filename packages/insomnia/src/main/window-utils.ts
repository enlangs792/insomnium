import electron, { type BrowserWindow as ElectronBrowserWindow, type MenuItemConstructorOptions } from 'electron';
import fs from 'fs';
import * as os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

import {
  changelogUrl,
  getAppBuildDate,
  getAppVersion,
  getLicenseURL,
  getProductName,
  isDevelopment,
  isLinux,
  isMac,
  MNEMONIC_SYM,
} from '../common/constants';
import { docsBase } from '../common/documentation';
import * as log from '../common/log';
import { type Locale } from '../common/i18n';
import { enTranslations } from '../common/i18n/en';
import { zhCNTranslations } from '../common/i18n/zh-CN';
import * as models from '../models';
import LocalStorage from './local-storage';

const { app, Menu, shell, dialog, clipboard, BrowserWindow } = electron;

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const MINIMUM_WIDTH = 500;
const MINIMUM_HEIGHT = 400;

let newWindow: ElectronBrowserWindow | null = null;
const windows = new Set<ElectronBrowserWindow>();
let localStorage: LocalStorage | null = null;

// 翻译函数 - 在 main 进程中使用
function getMenuTranslation(key: string, locale: Locale = 'zh-CN'): string {
  const translations = locale === 'zh-CN' ? zhCNTranslations : enTranslations;
  return translations[key as keyof typeof translations] || key;
}

interface Bounds {
  height?: number;
  width?: number;
  x?: number;
  y?: number;
}

export function init() {
  initLocalStorage();
}

export async function createWindow() {
  const { bounds, fullscreen, maximize } = getBounds();
  const { x, y, width, height } = bounds;

  // const appLogo = 'static/insomnia-core-logo_16x.png';
  let isVisibleOnAnyDisplay = true;

  for (const d of electron.screen.getAllDisplays()) {
    const isVisibleOnDisplay =
      // @ts-expect-error -- TSCONVERSION genuine error
      x >= d.bounds.x &&
      // @ts-expect-error -- TSCONVERSION genuine error
      y >= d.bounds.y &&
      // @ts-expect-error -- TSCONVERSION genuine error
      x + width <= d.bounds.x + d.bounds.width &&
      // @ts-expect-error -- TSCONVERSION genuine error
      y + height <= d.bounds.y + d.bounds.height;

    if (!isVisibleOnDisplay) {
      isVisibleOnAnyDisplay = false;
    }
  }

  newWindow = new BrowserWindow({
    // Make sure we don't initialize the window outside the bounds
    x: isVisibleOnAnyDisplay ? x : undefined,
    y: isVisibleOnAnyDisplay ? y : undefined,
    // Other options
    backgroundColor: '#2C2C2C',
    fullscreen: fullscreen,
    fullscreenable: true,
    title: getProductName(),
    width: width || DEFAULT_WIDTH,
    height: height || DEFAULT_HEIGHT,
    minHeight: MINIMUM_HEIGHT,
    minWidth: MINIMUM_WIDTH,
    acceptFirstMouse: true,
    icon: '',
    // path.resolve(__dirname, appLogo),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: getZoomFactor(),
      nodeIntegration: true,
      webviewTag: true,
      // TODO: enable context isolation
      contextIsolation: false,
      disableBlinkFeatures: 'Auxclick',
    },
  });

  // BrowserWindow doesn't have an option for this, so we have to do it manually :(
  if (maximize) {
    newWindow?.maximize();
  }

  newWindow?.on('resize', () => saveBounds());
  newWindow?.on('maximize', () => saveBounds());
  newWindow?.on('unmaximize', () => saveBounds());
  newWindow?.on('move', () => saveBounds());
  newWindow?.on('unresponsive', () => {
    showUnresponsiveModal();
  });

  // Open generic links (<a .../>) in default browser
  newWindow?.webContents.on('will-navigate', (event, url) => {
    // Prevents local dev full-reload events from opening browser window, see https://github.com/ArchGPT/insomnium/pull/4925
    if (url.startsWith(appUrl)) {
      return;
    }

    console.log('[app] Navigate to ' + url);
    event.preventDefault();
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') {
      // eslint-disable-next-line no-restricted-properties
      shell.openExternal(url);
    }
  });

  newWindow?.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Load the html of the app.
  const appPath = path.resolve(__dirname, './index.html');
  const appUrl = process.env.APP_RENDER_URL || pathToFileURL(appPath).href;

  console.log(`[main] Loading ${appUrl}`);
  newWindow?.loadURL(appUrl);
  // Emitted when the window is closed.
  newWindow?.on('closed', () => {
    if (newWindow) {
      windows.delete(newWindow);
      newWindow = windows.values().next().value || null;
    }
  });

  // 创建并设置菜单
  const template = await createMenuTemplate();
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  windows.add(newWindow);
  return newWindow;
}

// 创建菜单模板
async function createMenuTemplate(): Promise<MenuItemConstructorOptions[]> {
  const settings = await models.settings.getOrCreate();
  const locale: Locale = settings.locale || 'zh-CN';
  const t = (key: string) => getMenuTranslation(key, locale);

  // 定义 aboutMenuClickHandler
  const aboutMenuClickHandler = async () => {
    const copy = 'Copy';
    const ok = 'OK';
    const buttons = isLinux() ? [copy, ok] : [ok, copy];
    const detail = [
      `Version: ${getProductName()} ${getAppVersion()}`,
      `Build date: ${getAppBuildDate()}`,
      `OS: ${os.type()} ${os.arch()} ${os.release()}`,
      `Electron: ${process.versions.electron}`,
      `Node: ${process.versions.node}`,
      `Node ABI: ${process.versions.modules}`,
      `V8: ${process.versions.v8}`,
      `Architecture: ${process.arch}`,
    ].join('\n');

    const msgBox = await dialog.showMessageBox({
      type: 'info',
      title: getProductName(),
      message: getProductName(),
      detail,
      buttons,
      defaultId: buttons.indexOf(ok),
      cancelId: buttons.indexOf(ok),
      noLink: true,
    });

    if (msgBox.response === buttons.indexOf(copy)) {
      clipboard.writeText(detail);
    }
  };

  const applicationMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.application')}`,
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.preferences')}`,
        click: function (_menuItem, window) {
          if (!window || !window.webContents) {
            return;
          }

          window.webContents.send('toggle-preferences');
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.changelog')}`,
        click: function (_menuItem, window) {
          if (!window || !window.webContents) {
            return;
          }
          const href = changelogUrl();
          const { protocol } = new URL(href);
          if (protocol === 'http:' || protocol === 'https:') {
            // eslint-disable-next-line no-restricted-properties
            shell.openExternal(href);
          }
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'hide',
      },
      {
        // @ts-expect-error -- TSCONVERSION appears to be a genuine error
        role: 'hideothers',
      },
      {
        type: 'separator',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.quit')}`,
        accelerator: 'CmdOrCtrl+Q',
        click: () => app.quit(),
      },
    ],
  };

  const editMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.edit')}`,
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.undo')}`,
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.redo')}`,
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.cut')}`,
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.copy')}`,
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.paste')}`,
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.selectAll')}`,
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
    ],
  };

  const viewMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.view')}`,
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.toggleFullScreen')}`,
        role: 'togglefullscreen',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.actualSize')}`,
        accelerator: 'CmdOrCtrl+0',
        click: setZoom(() => 1),
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.zoomIn')}`,
        accelerator: 'CmdOrCtrl+=',
        click: setZoom(zoom => zoom * 1.2),
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.zoomOut')}`,
        accelerator: 'CmdOrCtrl+-',
        click: setZoom(zoom => zoom * 0.8),
      },
      {
        label: t('menu.specificZoomLevel'),
        submenu: [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 400, 500].map(item => ({
          label: `${item}%`,
          click: setZoom(() => item / 100),
        })),
      },
      {
        type: 'separator',
      },
      {
        label: t('menu.resizeToSmall'),
        click: () =>
          newWindow?.setBounds({
            width: 960,
            height: 540,
          }),
      },
      {
        label: t('menu.resizeToDefault'),
        click: () =>
          newWindow?.setBounds({
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
          }),
      },
      {
        label: t('menu.resizeToLarge'),
        click: () =>
          newWindow?.setBounds({
            width: 1920,
            height: 1080,
          }),
      },
      {
        type: 'separator',
      },
      {
        label: t('menu.toggleSidebar'),
        click: () => {
          const w = BrowserWindow.getFocusedWindow();

          if (!w || !w.webContents) {
            return;
          }

          w.webContents.send('toggle-sidebar');
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.toggleDevTools')}`,
        accelerator: 'Alt+CmdOrCtrl+I',
        click: () => {
          const window = BrowserWindow.getFocusedWindow();
          if (window) {
            // @ts-expect-error -- TSCONVERSION needs global module augmentation
            window.toggleDevTools();
          }
        },
      },
    ],
  };

  const windowMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.window')}`,
    role: 'window',
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.new')}`,
        click: async () => {
          await createWindow();
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.minimize')}`,
        role: 'minimize',
      },
      // @ts-expect-error -- TSCONVERSION missing in official electron types
      ...(isMac() ? [
        {
          label: `${MNEMONIC_SYM}${t('menu.close')}`,
          role: 'close',
        },
      ]
        : []),
    ],
  };

  const helpMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.help')}`,
    role: 'help',
    id: 'help',
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.helpAndSupport')}`,
        ...(isMac() ? {} : { accelerator: 'F1' }),
        click: () => {
          const { protocol } = new URL(docsBase);
          if (protocol === 'http:' || protocol === 'https:') {
            // eslint-disable-next-line no-restricted-properties
            shell.openExternal(docsBase);
          }
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.keyboardShortcuts')}`,
        accelerator: 'CmdOrCtrl+Shift+?',
        click: (_menuItem, w) => {
          if (!w || !w.webContents) {
            return;
          }

          w.webContents.send('toggle-preferences-shortcuts');
        },
      },
      {
        type: 'separator',
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.showAppDataFolder')}`,
        click: () => {
          const directory = process.env['INSOMNIA_DATA_PATH'] || electron.app.getPath('userData');
          shell.showItemInFolder(directory);
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.showAppLogsFolder')}`,
        click: () => {
          const directory = log.getLogDirectory();
          shell.showItemInFolder(directory);
        },
      },
      {
        type: 'separator',
      },
      {
        label: t('menu.showOpenSourceLicenses'),
        click: () => {
          const licensePath = path.resolve(app.getAppPath(), '../opensource-licenses.txt');
          shell.openPath(licensePath);
        },
      },
      {
        label: t('menu.showSoftwareLicense'),
        click: () => {
          // eslint-disable-next-line no-restricted-properties
          shell.openExternal(getLicenseURL());
        },
      },
    ],
  };

  if (isMac()) {
    // @ts-expect-error -- TSCONVERSION type splitting
    applicationMenu.submenu?.unshift(
      {
        label: `${MNEMONIC_SYM}${t('menu.about')} ${getProductName()}`,
        click: aboutMenuClickHandler,
      },
      {
        type: 'separator',
      },
    );
  } else {
    // @ts-expect-error -- TSCONVERSION type splitting
    helpMenu.submenu?.push({
      type: 'separator',
    },
      {
        label: `${MNEMONIC_SYM}${t('menu.about')}`,
        click: aboutMenuClickHandler,
      });
  }

  const developerMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.developer')}`,
    // @ts-expect-error -- TSCONVERSION missing in official electron types
    position: 'before=help',
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.reload')}`,
        accelerator: 'Shift+F5',
        click: () => {
          const window = BrowserWindow.getFocusedWindow();
          if (window) {
            window.reload();
          }
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.takeScreenshot')}`,
        click: function () {
          // @ts-expect-error -- TSCONVERSION not accounted for in the electron types to provide a function
          newWindow?.capturePage(image => {
            const buffer = image.toPNG();
            const dir = app.getPath('desktop');
            fs.writeFileSync(path.join(dir, `Screenshot-${new Date()}.png`), buffer);
          });
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.clearAModel')}`,
        click: function (_menuItem, window) {
          window?.webContents?.send('clear-model');
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.clearAllModels')}`,
        click: function (_menuItem, window) {
          window?.webContents?.send('clear-all-models');
        },
      },
      {
        label: `${MNEMONIC_SYM}${t('menu.restart')}`,
        click: window?.main.restart,
      },
      {
        label: t('menu.setWindowForFHDScreenshot'),
        click: () => {
          newWindow?.setBounds({
            width: 1920,
            height: 1080,
          });
          setZoom(() => 4)();
        },
      },
    ],
  };
  const toolsMenu: MenuItemConstructorOptions = {
    label: `${MNEMONIC_SYM}${t('menu.tools')}`,
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.reloadPlugins')}`,
        click: () => {
          const w = BrowserWindow.getFocusedWindow();

          if (!w || !w.webContents) {
            return;
          }

          w.webContents.send('reload-plugins');
        },
      },
    ],
  };

  const template: MenuItemConstructorOptions[] = [];
  template.push(applicationMenu);
  template.push({
    label: `${MNEMONIC_SYM}${t('menu.file')}`,
    submenu: [
      {
        label: `${MNEMONIC_SYM}${t('menu.newWindow')}`,
        click: async () => {
          await createWindow();
        },
      },
    ],
  });
  template.push(editMenu);
  template.push(viewMenu);
  template.push(windowMenu);
  template.push(toolsMenu);
  template.push(helpMenu);

  if (isDevelopment() || process.env.INSOMNIA_FORCE_DEBUG) {
    template.push(developerMenu);
  }

  return template;
}

// 更新菜单（当语言更改时调用）
export async function updateMenu() {
  const template = await createMenuTemplate();
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function showUnresponsiveModal() {
  const settings = await models.settings.getOrCreate();
  const locale: Locale = settings.locale || 'zh-CN';
  const t = (key: string) => getMenuTranslation(key, locale);

  const id = await dialog.showMessageBox({
    type: 'info',
    buttons: [t('menu.cancel'), t('menu.reload')],
    defaultId: 1,
    cancelId: 0,
    title: t('menu.unresponsive'),
    message: t('menu.unresponsiveMessage'),
  });

  // @ts-expect-error -- TSCONVERSION appears to be a genuine error
  if (id === 1) {
    const browserWindow = BrowserWindow.getFocusedWindow();

    if (!browserWindow || !browserWindow.webContents) {
      return;
    }
    browserWindow?.destroy();
    await createWindow();
  }
}

function saveBounds() {
  const browserWindow = BrowserWindow.getFocusedWindow();

  if (!browserWindow || !browserWindow.webContents) {
    return;
  }
  if (!browserWindow) {
    return;
  }

  const fullscreen = browserWindow?.isFullScreen();

  // Only save the size if we're not in fullscreen
  if (!fullscreen) {
    localStorage?.setItem('bounds', browserWindow?.getBounds());
    localStorage?.setItem('maximize', browserWindow?.isMaximized());
    localStorage?.setItem('fullscreen', false);
  } else {
    localStorage?.setItem('fullscreen', true);
  }
}

function getBounds() {
  let bounds: Bounds = {};
  let fullscreen = false;
  let maximize = false;

  try {
    bounds = localStorage?.getItem('bounds', {});
    fullscreen = localStorage?.getItem('fullscreen', false);
    maximize = localStorage?.getItem('maximize', false);
  } catch (error) {
    // This should never happen, but if it does...!
    console.error('Failed to parse window bounds', error);
  }

  return {
    bounds,
    fullscreen,
    maximize,
  };
}

const ZOOM_MAX = 6;
const ZOOM_DEFAULT = 1;
const ZOOM_MIN = 0.05;

const getZoomFactor = () => {
  try {
    return localStorage?.getItem('zoomFactor', ZOOM_DEFAULT);
  } catch (error) {
    // This should never happen, but if it does...!
    console.error('Failed to parse zoomFactor', error);
  }

  return ZOOM_DEFAULT;
};

export const setZoom = (transformer: (current: number) => number) => () => {
  const browserWindow = BrowserWindow.getFocusedWindow();

  if (!browserWindow || !browserWindow.webContents) {
    return;
  }

  const current = getZoomFactor();
  const desired = transformer(current);
  const actual = Math.min(Math.max(ZOOM_MIN, desired), ZOOM_MAX);

  browserWindow.webContents.setZoomLevel(actual);
  localStorage?.setItem('zoomFactor', actual);
};

function initLocalStorage() {
  const localStoragePath = path.join(process.env['INSOMNIA_DATA_PATH'] || electron.app.getPath('userData'), 'localStorage');
  localStorage = new LocalStorage(localStoragePath);
}

export async function getOrCreateWindow() {
  return newWindow ?? await createWindow();
}
