// Copied from https://github.com/orta/vscode-jest/blob/master/src/helpers.ts
import { platform } from "os";
import { existsSync } from "fs";
import { normalize, join, resolve } from "path";
import { getTestPatterns } from "./jest";

export function pathToJest(rootPath: string, filePath: string) {
  let path = normalize(filePath);

  const defaultPath = normalize("node_modules/.bin/jest");
  if (path === defaultPath && isBootstrappedWithCreateReactApp(rootPath)) {
    // If it's the default, run the script instead
    return platform() === "win32" ? "npm.cmd test --" : "npm test --";
  }

  // For windows support, see https://github.com/orta/vscode-jest/issues/10
  if (!path.includes(".cmd") && platform() === "win32") {
    path = path + ".cmd";
  }
  return join(rootPath, path);
}

const replaceRootDirInPath = (rootDir: string, filePath: string): string => {
  if (!/^<rootDir>/.test(filePath)) {
    return filePath;
  }

  return resolve(
    rootDir,
    normalize("./" + filePath.substr("<rootDir>".length))
  );
};

function getConfig(rootPath) {
  const packageJsonObj = __non_webpack_require__(pathToPackageJSON(rootPath));
  if (packageJsonObj.jest) {
    return packageJsonObj.jest;
  }

  const configFilePath = getConfigFilePath(rootPath);
  if (configFilePath !== null) {
    return __non_webpack_require__(configFilePath);
  }
}

export function getMajesticConfig(rootPath) {
  const packageJsonObj = __non_webpack_require__(pathToPackageJSON(rootPath));
  return packageJsonObj.majestic;
}

export function getConfigFilePath(rootPath: string) {
  const defaultConfigPath = join(rootPath, "jest.config.js");
  if (existsSync(defaultConfigPath)) {
    return defaultConfigPath;
  }

  const packageJsonObj = __non_webpack_require__(pathToPackageJSON(rootPath));
  if (packageJsonObj.jestConfig) {
    return join(rootPath, packageJsonObj.jestConfig);
  }

  if (packageJsonObj.majestic && packageJsonObj.majestic.jestConfig) {
    return join(rootPath, packageJsonObj.majestic.jestConfig);
  }

  return "";
}

export function getTestFilePattern(rootPath: string) {
  let config: any = {};
  if (isBootstrappedWithCreateReactApp(rootPath)) {
    config.testMatch = [
      "<rootDir>/src/**/__tests__/**/*.{js,jsx,mjs}",
      "<rootDir>/src/**/?(*.)(spec|test).{js,jsx,mjs}"
    ].map(match => {
      return replaceRootDirInPath(rootPath, match);
    });
  } else {
    config = getConfig(rootPath);

    if (config && config.testMatch) {
      config.testMatch = config.testMatch.map(match => {
        return replaceRootDirInPath(rootPath, match);
      });
    }

    if (config && !config.testMatch && !config.testRegex) {
      config.testMatch = [
        "**/__tests__/**/*.js?(x)",
        "**/?(*.)(spec|test).js?(x)"
      ];
    }
  }

  return getTestPatterns(config);
}

function isBootstrappedWithCreateReactApp(rootPath: string): boolean {
  return (
    hasExecutable(rootPath, "node_modules/.bin/react-scripts") ||
    hasExecutable(
      rootPath,
      "node_modules/react-scripts/node_modules/.bin/jest"
    ) ||
    hasExecutable(rootPath, "node_modules/react-native-scripts")
  );
}

function hasExecutable(rootPath: string, executablePath: string): boolean {
  const ext = platform() === "win32" ? ".cmd" : "";
  const absolutePath = join(rootPath, executablePath + ext);
  return existsSync(absolutePath);
}

export function pathToConfig(filePath: string) {
  if (filePath !== "") {
    return normalize(filePath);
  }
  return "";
}

export function pathToPackageJSON(rootPath: string) {
  const path = normalize("package.json");
  return join(rootPath, path);
}

export function isPackageJSONExists(rootPath: string) {
  return existsSync(pathToPackageJSON(rootPath));
}
