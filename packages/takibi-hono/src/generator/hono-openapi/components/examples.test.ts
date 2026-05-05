import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeExamplesCode } from './examples.js'

describe('makeExamplesCode', () => {
  it.concurrent('should generate example with value', () => {
    const examples: NonNullable<Components['examples']> = {
      UserExample: {
        summary: 'A sample user',
        value: { id: 1, name: 'John Doe', email: 'john@example.com' },
      },
    }
    const result = makeExamplesCode(examples)
    expect(result).toBe(
      'export const UserExampleExample = {summary:"A sample user",value:{"id":1,"name":"John Doe","email":"john@example.com"}}',
    )
  })

  it.concurrent('should generate example with externalValue', () => {
    const examples: NonNullable<Components['examples']> = {
      FileExample: {
        summary: 'External file',
        externalValue: 'https://example.com/sample.json',
      },
    }
    const result = makeExamplesCode(examples)
    expect(result).toBe(
      'export const FileExampleExample = {summary:"External file",externalValue:"https://example.com/sample.json"}',
    )
  })

  it.concurrent('should generate multiple examples', () => {
    const examples: NonNullable<Components['examples']> = {
      UserExample: {
        summary: 'A sample user',
        value: { id: 1, name: 'John' },
      },
      ErrorExample: {
        summary: 'A sample error',
        value: { code: 404, message: 'Not found' },
      },
    }
    expect(makeExamplesCode(examples)).toBe(
      'export const UserExampleExample = {summary:"A sample user",value:{"id":1,"name":"John"}}\n\nexport const ErrorExampleExample = {summary:"A sample error",value:{"code":404,"message":"Not found"}}',
    )
  })

  it.concurrent('should filter out $ref examples', () => {
    const examples: NonNullable<Components['examples']> = {
      SharedExample: { $ref: '#/components/examples/Shared' } as any,
      DirectExample: {
        summary: 'Direct',
        value: 42,
      },
    }
    expect(makeExamplesCode(examples)).toBe(
      'export const DirectExampleExample = {summary:"Direct",value:42}',
    )
  })

  it.concurrent('should append as const with readonly flag', () => {
    const examples: NonNullable<Components['examples']> = {
      UserExample: {
        summary: 'A user',
        value: { id: 1 },
      },
    }
    expect(makeExamplesCode(examples, true)).toBe(
      'export const UserExampleExample = {summary:"A user",value:{"id":1}} as const',
    )
  })

  it.concurrent('should generate example with description', () => {
    const examples: NonNullable<Components['examples']> = {
      DetailedExample: {
        summary: 'Summary',
        description: 'A detailed description',
        value: 'test',
      },
    }
    expect(makeExamplesCode(examples)).toBe(
      'export const DetailedExampleExample = {summary:"Summary",description:"A detailed description",value:"test"}',
    )
  })

  it.concurrent('should return empty string for empty examples', () => {
    expect(makeExamplesCode({})).toBe('')
  })
})
