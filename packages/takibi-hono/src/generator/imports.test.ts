import { describe, expect, it } from 'vite-plus/test'

import { getLibraryConfig, getStandardValidatorConfig } from './imports.js'

describe('getLibraryConfig', () => {
  const libraries: ('zod' | 'valibot' | 'typebox' | 'arktype' | 'effect')[] = [
    'zod',
    'valibot',
    'typebox',
    'arktype',
    'effect',
  ]

  for (const lib of libraries) {
    it.concurrent(`should return config for ${lib}`, () => {
      const config = getLibraryConfig(lib)
      expect(typeof config.modulePath).toBe('string')
      expect(typeof config.validatorAlias).toBe('string')
      expect(typeof config.resolverImport).toBe('string')
      expect(typeof config.validatorImport).toBe('string')
      expect(typeof config.schemaImport).toBe('string')
    })
  }

  it.concurrent('zod config should have correct values', () => {
    const config = getLibraryConfig('zod')
    expect(config.modulePath).toBe('hono-openapi')
    expect(config.validatorAlias).toBe('validator')
    expect(config.resolverImport).toBe("import{describeRoute,resolver,validator}from'hono-openapi'")
    expect(config.validatorImport).toBe("import{describeRoute,validator}from'hono-openapi'")
    expect(config.schemaImport).toBe("import*as z from'zod'")
  })

  it.concurrent('valibot config should have correct values', () => {
    const config = getLibraryConfig('valibot')
    expect(config.modulePath).toBe('hono-openapi')
    expect(config.validatorAlias).toBe('validator')
    expect(config.resolverImport).toBe("import{describeRoute,resolver,validator}from'hono-openapi'")
    expect(config.validatorImport).toBe("import{describeRoute,validator}from'hono-openapi'")
    expect(config.schemaImport).toBe("import*as v from'valibot'")
  })

  it.concurrent('typebox config should have correct values', () => {
    const config = getLibraryConfig('typebox')
    expect(config.modulePath).toBe('hono-openapi')
    expect(config.validatorAlias).toBe('validator')
    expect(config.resolverImport).toBe("import{describeRoute,resolver,validator}from'hono-openapi'")
    expect(config.validatorImport).toBe("import{describeRoute,validator}from'hono-openapi'")
    expect(config.schemaImport).toBe("import Type from'typebox'")
  })

  it.concurrent('arktype config should have correct values', () => {
    const config = getLibraryConfig('arktype')
    expect(config.modulePath).toBe('hono-openapi')
    expect(config.validatorAlias).toBe('validator')
    expect(config.resolverImport).toBe("import{describeRoute,resolver,validator}from'hono-openapi'")
    expect(config.validatorImport).toBe("import{describeRoute,validator}from'hono-openapi'")
    expect(config.schemaImport).toBe("import{type}from'arktype'")
  })

  it.concurrent('effect config should have correct values', () => {
    const config = getLibraryConfig('effect')
    expect(config.modulePath).toBe('hono-openapi')
    expect(config.validatorAlias).toBe('validator')
    expect(config.resolverImport).toBe("import{describeRoute,resolver,validator}from'hono-openapi'")
    expect(config.validatorImport).toBe("import{describeRoute,validator}from'hono-openapi'")
    expect(config.schemaImport).toBe("import{Schema}from'effect'")
  })
})

describe('getStandardValidatorConfig', () => {
  it.concurrent('zod', () => {
    const config = getStandardValidatorConfig('zod')
    expect(config.validatorFn).toBe('sValidator')
    expect(config.validatorImport).toBe("import{sValidator}from'@hono/standard-validator'")
    expect(config.validatorPackage).toBe('@hono/standard-validator')
  })

  it.concurrent('valibot', () => {
    const config = getStandardValidatorConfig('valibot')
    expect(config.validatorFn).toBe('sValidator')
    expect(config.validatorImport).toBe("import{sValidator}from'@hono/standard-validator'")
    expect(config.validatorPackage).toBe('@hono/standard-validator')
  })

  it.concurrent('typebox', () => {
    const config = getStandardValidatorConfig('typebox')
    expect(config.validatorFn).toBe('tbValidator')
    expect(config.validatorImport).toBe("import{tbValidator}from'@hono/typebox-validator'")
    expect(config.validatorPackage).toBe('@hono/typebox-validator')
  })

  it.concurrent('arktype', () => {
    const config = getStandardValidatorConfig('arktype')
    expect(config.validatorFn).toBe('sValidator')
    expect(config.validatorImport).toBe("import{sValidator}from'@hono/standard-validator'")
    expect(config.validatorPackage).toBe('@hono/standard-validator')
  })

  it.concurrent('effect', () => {
    const config = getStandardValidatorConfig('effect')
    expect(config.validatorFn).toBe('effectValidator')
    expect(config.validatorImport).toBe("import{effectValidator}from'@hono/effect-validator'")
    expect(config.validatorPackage).toBe('@hono/effect-validator')
  })
})
