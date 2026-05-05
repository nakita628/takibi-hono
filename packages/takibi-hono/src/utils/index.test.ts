import { describe, expect, it } from 'vite-plus/test'

import {
  makeHandlerFileName,
  renderNamedImport,
  resolveRef,
  toCamelCase,
  toHonoPath,
  toPascalCase,
} from './index.js'

describe('makeHandlerFileName', () => {
  it.concurrent('should return __root for root path', () => {
    expect(makeHandlerFileName('/')).toBe('__root')
  })

  it.concurrent('should return first segment', () => {
    expect(makeHandlerFileName('/users')).toBe('users')
  })

  it.concurrent('should return first segment for nested paths', () => {
    expect(makeHandlerFileName('/users/{id}')).toBe('users')
  })

  it.concurrent('should lowercase the segment', () => {
    expect(makeHandlerFileName('/Users')).toBe('users')
  })

  it.concurrent('should return first segment for deep paths', () => {
    expect(makeHandlerFileName('/api/v1/todos')).toBe('api')
  })
})

describe('toPascalCase', () => {
  it.concurrent('should convert hyphenated', () => {
    expect(toPascalCase('user-name')).toBe('UserName')
  })

  it.concurrent('should convert underscored', () => {
    expect(toPascalCase('get_users')).toBe('GetUsers')
  })

  it.concurrent('should handle single word', () => {
    expect(toPascalCase('users')).toBe('Users')
  })

  it.concurrent('should handle already PascalCase', () => {
    expect(toPascalCase('UserName')).toBe('UserName')
  })
})

describe('toCamelCase', () => {
  it.concurrent('should convert to camelCase', () => {
    expect(toCamelCase('user-name')).toBe('userName')
  })

  it.concurrent('should handle single word', () => {
    expect(toCamelCase('users')).toBe('users')
  })

  it.concurrent('should return empty string for empty input', () => {
    expect(toCamelCase('')).toBe('')
  })

  it.concurrent('should handle multiple separators', () => {
    expect(toCamelCase('get-user_name')).toBe('getUserName')
  })
})

describe('resolveRef', () => {
  it.concurrent('should resolve schema ref', () => {
    expect(resolveRef('#/components/schemas/Pet')).toBe('PetSchema')
  })

  it.concurrent('should resolve response ref', () => {
    expect(resolveRef('#/components/responses/NotFound')).toBe('NotFoundResponse')
  })

  it.concurrent('should resolve parameter ref', () => {
    expect(resolveRef('#/components/parameters/PageParam')).toBe('PageParamParamsSchema')
  })

  it.concurrent('should resolve header ref', () => {
    expect(resolveRef('#/components/headers/X-Rate-Limit')).toBe('XRateLimitHeaderSchema')
  })

  it.concurrent('should handle nested property refs by using top-level name', () => {
    expect(resolveRef('#/components/schemas/Pet/properties/name')).toBe('PetSchema')
  })

  it.concurrent('should handle URL-encoded names', () => {
    expect(resolveRef('#/components/schemas/My%20Schema')).toBe('MySchemaSchema')
  })

  it.concurrent('should handle URL-encoded names with nested path', () => {
    expect(resolveRef('#/components/schemas/My%20Schema/properties/field')).toBe('MySchemaSchema')
  })

  it.concurrent('should fallback for unknown prefix', () => {
    expect(resolveRef('#/unknown/path/Foo')).toBe('Foo')
  })

  it.concurrent('should return empty string for ref with no segments', () => {
    expect(resolveRef('')).toBe('')
  })
})

describe('toHonoPath', () => {
  it.concurrent('should convert {param} to :param', () => {
    expect(toHonoPath('/users/{id}')).toBe('/users/:id')
  })

  it.concurrent('should handle paths without params', () => {
    expect(toHonoPath('/todo')).toBe('/todo')
  })

  it.concurrent('should handle multiple params', () => {
    expect(toHonoPath('/users/{userId}/posts/{postId}')).toBe('/users/:userId/posts/:postId')
  })

  it.concurrent('should handle root path', () => {
    expect(toHonoPath('/')).toBe('/')
  })
})

describe('renderNamedImport', () => {
  it.concurrent('should render named import', () => {
    expect(renderNamedImport(['UserSchema', 'PostSchema'], '../schemas')).toBe(
      "import{UserSchema,PostSchema}from'../schemas'",
    )
  })

  it.concurrent('should deduplicate names', () => {
    expect(renderNamedImport(['UserSchema', 'UserSchema'], '../schemas')).toBe(
      "import{UserSchema}from'../schemas'",
    )
  })

  it.concurrent('should return empty string for empty names', () => {
    expect(renderNamedImport([], '../schemas')).toBe('')
  })

  it.concurrent('should handle single name', () => {
    expect(renderNamedImport(['ErrorSchema'], './schemas')).toBe(
      "import{ErrorSchema}from'./schemas'",
    )
  })
})

describe('resolveRef (additional cases)', () => {
  it.concurrent('should resolve requestBody ref', () => {
    expect(resolveRef('#/components/requestBodies/CreateUser')).toBe('CreateUserRequestBody')
  })

  it.concurrent('should resolve securityScheme ref', () => {
    expect(resolveRef('#/components/securitySchemes/bearerAuth')).toBe('BearerAuthSecurityScheme')
  })

  it.concurrent('should resolve example ref', () => {
    expect(resolveRef('#/components/examples/UserExample')).toBe('UserExampleExample')
  })

  it.concurrent('should resolve link ref', () => {
    expect(resolveRef('#/components/links/GetUserById')).toBe('GetUserByIdLink')
  })

  it.concurrent('should resolve callback ref', () => {
    expect(resolveRef('#/components/callbacks/WebhookEvent')).toBe('WebhookEventCallback')
  })

  it.concurrent('should resolve pathItem ref', () => {
    expect(resolveRef('#/components/pathItems/UserItem')).toBe('UserItemPathItem')
  })

  it.concurrent('should resolve mediaType ref', () => {
    expect(resolveRef('#/components/mediaTypes/JsonMedia')).toBe('JsonMediaMediaTypeSchema')
  })

  it.concurrent('should handle hyphenated names', () => {
    expect(resolveRef('#/components/schemas/user-profile')).toBe('UserProfileSchema')
  })

  it.concurrent('should handle underscored names', () => {
    expect(resolveRef('#/components/schemas/user_profile')).toBe('UserProfileSchema')
  })
})
