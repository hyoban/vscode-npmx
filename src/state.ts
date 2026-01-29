import type { NestedScopedConfigs } from './generated-meta'
import { defineConfigObject, defineLogger } from 'reactive-vscode'
import { scopedConfigs } from './generated-meta'

export const config = defineConfigObject<NestedScopedConfigs>(
  scopedConfigs.scope,
  scopedConfigs.defaults,
)

export const logger = defineLogger('npmx')
