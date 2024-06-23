// Date: Thu, 22 Feb 2024
// Author:
// Description:
// License: AGPLv3
// Copyright (C) 2024 - Present, https://laftools.dev and https://codegen.cc

import fs from "fs";
import path from "path";
import os from "os";
import fsutils from "./FileUtils";
import { isDevEnv, isTestEnv } from "./env";

let userHome = os.homedir();

export let getUserHomeDir: () => string = () => {
  return userHome;
};

export let getLafToolsDataDir = (): string => {
  let n = path.join(userHome, isTestEnv() ? '.test-miaoda' : isDevEnv() ? '.dev-miaoda' : ".miaoda");
  return fsutils.mkdir(n);
};



export let devonly_getLafToolsExtDir = (): string => {
  if (isDevEnv()) {
    if (process.env.MDGJX_EXT_ROOT) {
      return path.join(process.env.MDGJX_EXT_ROOT,'extensions');
    }
  }
  throw new Error('not in dev env');
};

// 下载好，解压之后会放在这里，目前后续使用都是在这里使用的
export let getLocalPkgExtract = (): string => {
  let n = path.join(getLafToolsDataDir(), 'pkg-extract');
  return fsutils.mkdir(n);
};

// 下载好的包，会放在这里，等待解压
export let getLocalPkgRepo = (): string => {
  let n = path.join(getLafToolsDataDir(), 'pkg-repo');
  return fsutils.mkdir(n);
};

