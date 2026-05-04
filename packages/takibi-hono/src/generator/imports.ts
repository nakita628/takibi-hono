export function getLibraryConfig(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect') {
  const LIBRARY_CONFIG: {
    readonly [k in 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect']: {
      readonly modulePath: string
      readonly validatorAlias: string
      readonly resolverImport: string
      readonly validatorImport: string
      readonly schemaImport: string
    }
  } = {
    zod: {
      modulePath: 'hono-openapi',
      validatorAlias: 'validator',
      resolverImport: "import{describeRoute,resolver,validator}from'hono-openapi'",
      validatorImport: "import{describeRoute,validator}from'hono-openapi'",
      schemaImport: "import*as z from'zod'",
    },
    valibot: {
      modulePath: 'hono-openapi',
      validatorAlias: 'validator',
      resolverImport: "import{describeRoute,resolver,validator}from'hono-openapi'",
      validatorImport: "import{describeRoute,validator}from'hono-openapi'",
      schemaImport: "import*as v from'valibot'",
    },
    typebox: {
      modulePath: 'hono-openapi',
      validatorAlias: 'validator',
      resolverImport: "import{describeRoute,resolver,validator}from'hono-openapi'",
      validatorImport: "import{describeRoute,validator}from'hono-openapi'",
      schemaImport: "import Type from'typebox'",
    },
    arktype: {
      modulePath: 'hono-openapi',
      validatorAlias: 'validator',
      resolverImport: "import{describeRoute,resolver,validator}from'hono-openapi'",
      validatorImport: "import{describeRoute,validator}from'hono-openapi'",
      schemaImport: "import{type}from'arktype'",
    },
    effect: {
      modulePath: 'hono-openapi',
      validatorAlias: 'validator',
      resolverImport: "import{describeRoute,resolver,validator}from'hono-openapi'",
      validatorImport: "import{describeRoute,validator}from'hono-openapi'",
      schemaImport: "import{Schema}from'effect'",
    },
  }
  return LIBRARY_CONFIG[schemaLib]
}

export function getStandardValidatorConfig(
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const STANDARD_VALIDATOR_CONFIG: {
    readonly [k in 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect']: {
      readonly validatorFn: string
      readonly validatorImport: string
      readonly validatorPackage: string
    }
  } = {
    zod: {
      validatorFn: 'sValidator',
      validatorImport: "import{sValidator}from'@hono/standard-validator'",
      validatorPackage: '@hono/standard-validator',
    },
    valibot: {
      validatorFn: 'sValidator',
      validatorImport: "import{sValidator}from'@hono/standard-validator'",
      validatorPackage: '@hono/standard-validator',
    },
    typebox: {
      validatorFn: 'tbValidator',
      validatorImport: "import{tbValidator}from'@hono/typebox-validator'",
      validatorPackage: '@hono/typebox-validator',
    },
    arktype: {
      validatorFn: 'sValidator',
      validatorImport: "import{sValidator}from'@hono/standard-validator'",
      validatorPackage: '@hono/standard-validator',
    },
    effect: {
      validatorFn: 'effectValidator',
      validatorImport: "import{effectValidator}from'@hono/effect-validator'",
      validatorPackage: '@hono/effect-validator',
    },
  }
  return STANDARD_VALIDATOR_CONFIG[schemaLib]
}
