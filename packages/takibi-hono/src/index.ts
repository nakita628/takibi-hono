#!/usr/bin/env node
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as NodeServices from '@effect/platform-node/NodeServices'
import { Effect } from 'effect'

import { takibiHono } from './cli/index.js'

NodeRuntime.runMain(takibiHono().pipe(Effect.provide(NodeServices.layer)))
