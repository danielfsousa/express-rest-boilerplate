import fs from 'fs'
import path from 'path'
import pino from 'pino'
import config from '#config'

const escapeCodes = {
  reset: '\u001b[0m',
  cyan: '\u001b[36m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  brightRed: '\u001b[31;1m',
}

const escapeCodeByLevel = {
  10: escapeCodes.reset,
  20: escapeCodes.reset,
  30: escapeCodes.green,
  40: escapeCodes.yellow,
  50: escapeCodes.red,
  60: escapeCodes.brightRed,
}

function getAppVersion() {
  const packageJsonPath = path.join(config.appPath, '../package.json')
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath))
  return pkg.version
}

function messageFormat(log) {
  const uid = `${escapeCodes.reset}[${log.uid}]`
  const message = escapeCodeByLevel[log.level] + (log.msg ?? log.err?.message ?? '')

  if (log.uid) {
    return `${uid} ${message}`
  }

  return message
}

const logger = pino({
  timestamp: true,
  level: config.logLevel,
  base: {
    appVersion: getAppVersion(),
  },
  prettyPrint: !config.isProduction && {
    messageFormat,
    colorize: true,
    hideObject: false,
    ignore: 'appVersion,uid',
    translateTime: 'SYS:HH:MM:ss.l',
  },
})

export default logger
