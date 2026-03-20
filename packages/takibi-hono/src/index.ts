#!/usr/bin/env node
import { takibiHono } from './cli/index.js'

void takibiHono().then((result) => {
  if (result.ok) {
    console.log(result.value)
    process.exit(0)
  } else {
    console.error(result.error)
    process.exit(1)
  }
})
