import { defineExtension } from 'reactive-vscode'
import { displayName, version } from './generated-meta'
import { logger } from './state'

export const { activate, deactivate } = defineExtension(() => {
  logger.info(`${displayName} Activated, v${version}`)
})
