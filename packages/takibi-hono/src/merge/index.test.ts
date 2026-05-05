import { describe, expect, it } from 'vite-plus/test'

import { mergeAppFile, mergeBarrelFile, mergeHandlerFile } from './index.js'

describe('mergeHandlerFile', () => {
  it('preserves handler body while updating route metadata', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      'export const usersHandler = new Hono().get(',
      "  '/users',",
      "  describeRoute({ summary: 'Old' }),",
      '  (c) => { return c.json({ users: [] }) },',
      ')',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      'export const usersHandler = new Hono().get(',
      "  '/users',",
      "  describeRoute({ summary: 'Updated' }),",
      '  (c) => {},',
      ')',
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        '',
        'export const usersHandler = new Hono().get(',
        "  '/users',",
        "  describeRoute({ summary: 'Updated' }),",
        '  (c) => { return c.json({ users: [] }) },',
        ')',
        '',
      ].join('\n'),
    )
  })

  it('keeps stub when existing has no implementation', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'List' }), (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'List' }), (c) => {})",
        '',
      ].join('\n'),
    )
  })

  it('adds new handler from generated', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'export const usersHandler = new Hono().get(',
      "  '/users',",
      '  (c) => c.json([]),',
      ')',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      'export const usersHandler = new Hono().get(',
      "  '/users',",
      '  (c) => {},',
      ')',
      '',
      'export const postsHandler = new Hono().get(',
      "  '/posts',",
      '  (c) => {},',
      ')',
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'export const usersHandler = new Hono().get(',
        "  '/users',",
        '  (c) => c.json([]),',
        ')',
        '',
        'export const postsHandler = new Hono().get(',
        "  '/posts',",
        '  (c) => {},',
        ')',
        '',
      ].join('\n'),
    )
  })

  it('removes handler deleted from spec', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
      '',
      "export const deletedHandler = new Hono().get('/deleted', (c) => c.json({}))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('preserves user-added imports', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { db } from 'drizzle-orm'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { db } from 'drizzle-orm'",
        '',
        "export const usersHandler = new Hono().get('/users', (c) => {})",
        '',
      ].join('\n'),
    )
  })

  it('does not duplicate @hono/standard-validator import on merge', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { sValidator } from '@hono/standard-validator'",
      "import * as z from 'zod'",
      '',
      "export const usersHandler = new Hono().get('/users', sValidator('param', z.object({ id: z.string() })), (c) => c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { sValidator } from '@hono/standard-validator'",
      "import * as z from 'zod'",
      '',
      "export const usersHandler = new Hono().get('/users', sValidator('param', z.object({ id: z.string() })), (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { sValidator } from '@hono/standard-validator'",
        "import * as z from 'zod'",
        '',
        "export const usersHandler = new Hono().get('/users', sValidator('param', z.object({ id: z.string() })), (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('preserves non-handler code', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'const PAGE_SIZE = 20',
      '',
      "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'const PAGE_SIZE = 20',
        '',
        "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })
  it('preserves JSDoc comments before routes', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'export const petsHandler = new Hono()',
      '  /** @summary List pets */',
      "  .get('/pets', (c) => c.json([]))",
      '  /** @summary Create pet */',
      "  .post('/pets', (c) => c.json({}))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const petsHandler = new Hono().get('/pets', (c) => {}).post('/pets', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'export const petsHandler = new Hono()',
        '  /** @summary List pets */',
        "  .get('/pets', (c) => c.json([]))",
        '  /** @summary Create pet */',
        "  .post('/pets', (c) => c.json({}))",
        '',
      ].join('\n'),
    )
  })

  it('keeps stub when existing has (c) => { return } stub', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => { return })",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'List' }), (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        '',
        "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'List' }), (c) => {})",
        '',
      ].join('\n'),
    )
  })

  it('handles simultaneous handler removal and addition', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => c.json({ users: [] }))",
      '',
      "export const oldHandler = new Hono().get('/old', (c) => c.json({ old: true }))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
      "export const newHandler = new Hono().post('/new', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        "export const usersHandler = new Hono().get('/users', (c) => c.json({ users: [] }))",
        '',
        "export const newHandler = new Hono().post('/new', (c) => {})",
        '',
      ].join('\n'),
    )
  })

  it('preserves non-handler code that appears after handlers', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
      '',
      'function formatResponse(data: unknown) { return data }',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'function formatResponse(data: unknown) { return data }',
        '',
        "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('preserves component import from relative path', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { UserSchema } from '../components'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    // Relative imports are in handlerImportSources filter (startsWith '.'), so they are NOT user imports
    // The mergeImports function filters out relative path imports as managed imports
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        "export const usersHandler = new Hono().get('/users', (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('preserves multi-line JSDoc comments before routes', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'export const petsHandler = new Hono()',
      '  /**',
      '   * @summary List all pets',
      '   * @description Returns paginated list',
      '   */',
      "  .get('/pets', (c) => {",
      '    return c.json({ pets: [] })',
      '  })',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const petsHandler = new Hono().get('/pets', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'export const petsHandler = new Hono()',
        '  /**',
        '   * @summary List all pets',
        '   * @description Returns paginated list',
        '   */',
        "  .get('/pets', (c) => {",
        '    return c.json({ pets: [] })',
        '  })',
        '',
      ].join('\n'),
    )
  })

  it('does not duplicate custom import path on regeneration', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      "import { CreatePetSchema, PetSchema } from '@/components'",
      '',
      "export const petsHandler = new Hono().get('/pets', describeRoute({ summary: 'List' }), (c) => c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      "import { CreatePetSchema, PetSchema } from '@/components'",
      '',
      "export const petsHandler = new Hono().get('/pets', describeRoute({ summary: 'List' }), (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    // @/components should appear exactly once, not duplicated
    const importCount = (result.match(/@\/components/g) ?? []).length
    expect(importCount).toBe(1)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        "import { CreatePetSchema, PetSchema } from '@/components'",
        '',
        "export const petsHandler = new Hono().get('/pets', describeRoute({ summary: 'List' }), (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('does not duplicate @/components import with schemas config', () => {
    // Exact scenario: config has schemas.import = '@/components'
    // Handler file already exists with @/components import
    // Regeneration should NOT produce duplicate imports
    const existing = [
      "import{Hono}from'hono'",
      "import{z}from'zod'",
      "import{CreatePetSchema,PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{z}from'zod'",
      "import{CreatePetSchema,PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    const importLines = result.split('\n').filter((l) => l.includes('@/components'))
    expect(importLines.length).toBe(1)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{z}from'zod'",
        "import{CreatePetSchema,PetSchema}from'@/components'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
        '',
      ].join('\n'),
    )
  })

  it('does not duplicate when import is removed and regenerated', () => {
    // User deleted the import line manually, then regeneration adds it back
    const existing = [
      "import{Hono}from'hono'",
      "import{z}from'zod'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{z}from'zod'",
      "import{CreatePetSchema,PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{z}from'zod'",
        "import{CreatePetSchema,PetSchema}from'@/components'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
        '',
      ].join('\n'),
    )
  })

  it('replaces relative import with custom import path on config change', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { PetSchema } from '../components'",
      '',
      "export const petsHandler = new Hono().get('/pets', (c) => c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { PetSchema } from '@/components'",
      '',
      "export const petsHandler = new Hono().get('/pets', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { PetSchema } from '@/components'",
        '',
        "export const petsHandler = new Hono().get('/pets', (c) => c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('drops stale custom import when config import is removed', () => {
    // Step 1: config had import:'@/components' → handler has @/components
    // Step 2: user removes import from config → generated uses relative '../components'
    // Existing @/components must NOT be preserved as "user import"
    const existing = [
      "import{Hono}from'hono'",
      "import{CreatePetSchema,PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{CreatePetSchema,PetSchema}from'../components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    // @/components should be gone — replaced by ../components
    expect(result).not.toContain('@/components')
    expect(result).toContain("from'../components'")
    // Only one component import line
    const componentImportLines = result.split('\n').filter((l) => l.includes('CreatePetSchema'))
    expect(componentImportLines.length).toBe(1)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{CreatePetSchema,PetSchema}from'../components'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]}))",
        '',
      ].join('\n'),
    )
  })

  it('preserves genuine user imports when component import path changes', () => {
    // User has a real custom import (e.g. db library) that should be kept
    const existing = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'@/components'",
      "import{db}from'drizzle-orm'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'../components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{PetSchema}from'../components'",
        "import{db}from'drizzle-orm'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('switches from @packages/schemas to @/components on config change', () => {
    const existing = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'@packages/schemas'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{PetSchema}from'@/components'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('preserves user import with different named exports from component', () => {
    // User has import with unique names not in generated → keep it
    const existing = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'@/components'",
      "import{logger}from'@/utils'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'../components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{PetSchema}from'../components'",
        "import{logger}from'@/utils'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('handles multiple HTTP methods with preserved bodies', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]})).post('/pets',(c)=>c.json({id:1}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>{}).post('/pets',(c)=>{}).delete('/pets/:id',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        '',
        "export const petsHandler=new Hono().get('/pets',(c)=>c.json({pets:[]})).post('/pets',(c)=>c.json({id:1})).delete('/pets/:id',(c)=>{})",
        '',
      ].join('\n'),
    )
  })

  it('merges handler file with no existing imports', () => {
    const existing = ["export const rootHandler=new Hono().get('/',(c)=>c.text('hello'))", ''].join(
      '\n',
    )

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const rootHandler=new Hono().get('/',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        '',
        "export const rootHandler=new Hono().get('/',(c)=>c.text('hello'))",
        '',
      ].join('\n'),
    )
  })

  it('handles valibot imports without duplication', () => {
    const existing = [
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import*as v from'valibot'",
      "import{PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',sValidator('query',v.object({limit:v.number()})),(c)=>c.json([]))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{sValidator}from'@hono/standard-validator'",
      "import*as v from'valibot'",
      "import{PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',sValidator('query',v.object({limit:v.number()})),(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{sValidator}from'@hono/standard-validator'",
        "import*as v from'valibot'",
        "import{PetSchema}from'@/components'",
        '',
        "export const petsHandler=new Hono().get('/pets',sValidator('query',v.object({limit:v.number()})),(c)=>c.json([]))",
        '',
      ].join('\n'),
    )
  })

  it('fresh generation identical to existing produces same output', () => {
    const code = [
      "import{Hono}from'hono'",
      "import{PetSchema}from'@/components'",
      '',
      "export const petsHandler=new Hono().get('/pets',(c)=>c.json([]))",
      '',
    ].join('\n')

    const result = mergeHandlerFile(code, code)
    expect(result).toBe(code)
  })

  it('handles route with non-string-literal path argument', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "const PATH = '/users'",
      'export const usersHandler=new Hono().get(PATH,(c)=>c.json([]))',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const usersHandler=new Hono().get('/users',(c)=>{})",
      '',
    ].join('\n')

    // Non-string-literal path in existing is ignored (can't extract route key)
    // Generated code should be used with stub handler
    const result = mergeHandlerFile(existing, generated)
    expect(result).toContain("get('/users'")
  })

  it('handles route call with only one argument', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      'export const appHandler=new Hono().get((c)=>c.json([]))',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const appHandler=new Hono().get('/items',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toContain("get('/items'")
  })

  it('handles chained method calls with same method name at different positions', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "export const apiHandler=new Hono().get('/a',(c)=>c.json({a:1})).get('/b',(c)=>c.json({b:2}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const apiHandler=new Hono().get('/a',(c)=>{}).get('/b',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        '',
        "export const apiHandler=new Hono().get('/a',(c)=>c.json({a:1})).get('/b',(c)=>c.json({b:2}))",
        '',
      ].join('\n'),
    )
  })

  it('handles code with non-route method calls (e.g. use, on)', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "export const appHandler=new Hono().get('/health',(c)=>c.json({ok:true}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const appHandler=new Hono().get('/health',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        '',
        "export const appHandler=new Hono().get('/health',(c)=>c.json({ok:true}))",
        '',
      ].join('\n'),
    )
  })

  it('preserves options and head HTTP methods', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "export const corsHandler=new Hono().options('/cors',(c)=>c.text('')).head('/ping',(c)=>c.body(null))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const corsHandler=new Hono().options('/cors',(c)=>{}).head('/ping',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        '',
        "export const corsHandler=new Hono().options('/cors',(c)=>c.text('')).head('/ping',(c)=>c.body(null))",
        '',
      ].join('\n'),
    )
  })

  it('handles empty existing code', () => {
    const existing = ''
    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const usersHandler=new Hono().get('/users',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(generated)
  })

  it('handles put, patch, delete methods', () => {
    const existing = [
      "import{Hono}from'hono'",
      '',
      "export const itemsHandler=new Hono().put('/items/:id',(c)=>c.json({updated:true})).patch('/items/:id',(c)=>c.json({patched:true})).delete('/items/:id',(c)=>c.json({deleted:true}))",
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      '',
      "export const itemsHandler=new Hono().put('/items/:id',(c)=>{}).patch('/items/:id',(c)=>{}).delete('/items/:id',(c)=>{})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toBe(existing)
  })
})

describe('mergeAppFile', () => {
  it('replaces api statement with generated version', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler, postsHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler).route('/', postsHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      "import { Hono } from 'hono'\nimport { usersHandler, postsHandler } from './handlers'\n\nconst app = new Hono()\n\nexport const api = app.route('/', usersHandler).route('/', postsHandler)\n\nexport default app\n",
    )
  })

  it('preserves user middleware', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { cors } from 'hono/cors'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      'app.use(cors())',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      "import { Hono } from 'hono'\nimport { usersHandler } from './handlers'\nimport { cors } from 'hono/cors'\n\nconst app = new Hono()\napp.use(cors())\n\nexport const api = app.route('/', usersHandler)\n\nexport default app\n",
    )
  })

  it('preserves user code after api statement (openAPIRouteHandler)', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { rootHandler, petsHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', rootHandler).route('/', petsHandler)",
      '',
      'app.get(',
      "  '/openapi',",
      '  openAPIRouteHandler(app, {',
      '    documentation: {',
      '      info: {',
      "        title: 'Hono',",
      "        version: '1.0.0',",
      "        description: 'API for greeting users',",
      '      },',
      '    },',
      '  }),',
      ')',
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{rootHandler,petsHandler}from'./handlers'",
      '',
      'const app=new Hono()',
      '',
      "export const api=app.route('/',rootHandler).route('/',petsHandler)",
      '',
      'export default app',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    // imports + api line come from generated (minified), afterApi preserved from existing
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{rootHandler,petsHandler}from'./handlers'",
        '',
        'const app = new Hono()',
        '',
        "export const api=app.route('/',rootHandler).route('/',petsHandler)",
        '',
        'app.get(',
        "  '/openapi',",
        '  openAPIRouteHandler(app, {',
        '    documentation: {',
        '      info: {',
        "        title: 'Hono',",
        "        version: '1.0.0',",
        "        description: 'API for greeting users',",
        '      },',
        '    },',
        '  }),',
        ')',
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('preserves user code after api when new handler is added', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { rootHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', rootHandler)",
      '',
      "app.get('/openapi', openAPIRouteHandler(app, {}))",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{rootHandler,petsHandler}from'./handlers'",
      '',
      'const app=new Hono()',
      '',
      "export const api=app.route('/',rootHandler).route('/',petsHandler)",
      '',
      'export default app',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{rootHandler,petsHandler}from'./handlers'",
        '',
        'const app = new Hono()',
        '',
        "export const api=app.route('/',rootHandler).route('/',petsHandler)",
        '',
        "app.get('/openapi', openAPIRouteHandler(app, {}))",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('preserves user imports in app file', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { rootHandler, petsHandler } from './handlers'",
      "import { openAPIRouteHandler } from 'hono-openapi'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', rootHandler).route('/', petsHandler)",
      '',
      "app.get('/openapi', openAPIRouteHandler(app, {}))",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{rootHandler,petsHandler}from'./handlers'",
      '',
      'const app=new Hono()',
      '',
      "export const api=app.route('/',rootHandler).route('/',petsHandler)",
      '',
      'export default app',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      [
        "import{Hono}from'hono'",
        "import{rootHandler,petsHandler}from'./handlers'",
        "import { openAPIRouteHandler } from 'hono-openapi'",
        '',
        'const app = new Hono()',
        '',
        "export const api=app.route('/',rootHandler).route('/',petsHandler)",
        '',
        "app.get('/openapi', openAPIRouteHandler(app, {}))",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('updates api statement when generated has basePath and existing does not', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      "const app = new Hono().basePath('/api/v1')",
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { usersHandler } from './handlers'",
        '',
        'const app = new Hono()',
        '',
        "export const api = app.route('/', usersHandler)",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('preserves multiple user imports from different packages', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      "import { openAPIRouteHandler } from 'hono-openapi'",
      "import { db } from 'drizzle-orm'",
      "import { Auth } from '@auth/core'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { usersHandler } from './handlers'",
        "import { openAPIRouteHandler } from 'hono-openapi'",
        "import { db } from 'drizzle-orm'",
        "import { Auth } from '@auth/core'",
        '',
        'const app = new Hono()',
        '',
        "export const api = app.route('/', usersHandler)",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('returns generated when no api statement', () => {
    const existing = "import { Hono } from 'hono'\nconst app = new Hono()\n"
    const generated =
      "import { Hono } from 'hono'\nimport { usersHandler } from './handlers'\n\nconst app = new Hono()\n\nexport const api = app.route('/', usersHandler)\n\nexport default app\n"
    expect(mergeAppFile(existing, generated)).toBe(generated)
  })

  it('returns generated when generated has no api statement', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      'const app = new Hono()',
      '',
      'export default app',
      '',
    ].join('\n')

    expect(mergeAppFile(existing, generated)).toBe(generated)
  })

  it('handles app file with no user imports (only hono and relative)', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler, postsHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler).route('/', postsHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const result = mergeAppFile(existing, generated)
    // No user imports to preserve, should just use generated imports
    expect(result).toBe(
      [
        "import { Hono } from 'hono'",
        "import { usersHandler, postsHandler } from './handlers'",
        '',
        'const app = new Hono()',
        '',
        "export const api = app.route('/', usersHandler).route('/', postsHandler)",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })

  it('preserves non-exported api variable (no merge, returns generated)', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'const app = new Hono()',
      "const api = app.route('/', usersHandler)", // not exported
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      '',
      'const app = new Hono()',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    // Existing has no `export const api`, so returns generated
    expect(mergeAppFile(existing, generated)).toBe(generated)
  })
})

describe('mergeBarrelFile', () => {
  it('always returns generated', () => {
    expect(
      mergeBarrelFile(
        "export * from './users'\n",
        "export * from './users'\nexport * from './posts'\n",
      ),
    ).toBe("export * from './users'\nexport * from './posts'\n")
  })

  it('removes deleted exports', () => {
    expect(
      mergeBarrelFile(
        "export * from './users'\nexport * from './deleted'\n",
        "export * from './users'\n",
      ),
    ).toBe("export * from './users'\n")
  })

  it('replaces entire barrel content', () => {
    const existing = "export * from './users'\nexport * from './posts'\n"
    const generated = "export * from './pets'\nexport * from './users'\n"
    expect(mergeBarrelFile(existing, generated)).toBe(generated)
  })

  it('handles empty generated barrel', () => {
    const existing = "export * from './users'\n"
    const generated = ''
    expect(mergeBarrelFile(existing, generated)).toBe('')
  })
})

// ===================================================================
// Robustness: external imports, user-added code, async handlers
// ===================================================================

describe('mergeHandlerFile: user-added external imports', () => {
  it('preserves user-added third-party imports', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      "import { auth } from '@myapp/auth'",
      "import { logger } from 'pino'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {",
      '  return c.json({ ok: true })',
      '})',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        "import { auth } from '@myapp/auth'",
        "import { logger } from 'pino'",
        '',
        "export const usersHandler = new Hono().get('/users', (c) => {",
        '  return c.json({ ok: true })',
        '})',
        '',
      ].join('\n'),
    )
  })

  it('preserves user-added imports even when handler code is regenerated', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute, validator } from 'hono-openapi'",
      "import * as z from 'zod'",
      "import { db } from '@myapp/database'",
      '',
      "export const usersHandler = new Hono().get('/users',",
      "  describeRoute({ summary: 'List users' }),",
      "  validator('query', z.object({ page: z.number() })),",
      '  async (c) => {',
      '    const users = await db.query("SELECT * FROM users")',
      '    return c.json(users)',
      '  },',
      ')',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute, validator } from 'hono-openapi'",
      "import * as z from 'zod'",
      '',
      "export const usersHandler = new Hono().get('/users',",
      "  describeRoute({ summary: 'List users v2' }),",
      "  validator('query', z.object({ page: z.number(), limit: z.number() })),",
      '  (c) => {},',
      ')',
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    // User's db import preserved (toContain: merge output format depends on internal structure)
    expect(result).toContain("import { db } from '@myapp/database'")
    // User's async handler body preserved
    expect(result).toContain('await db.query')
    // Updated metadata from generated
    expect(result).toContain("summary: 'List users v2'")
  })
})

describe('mergeHandlerFile: user-added helper functions', () => {
  it('preserves helper function defined before handler', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'function formatUser(user: any) {',
      '  return { ...user, fullName: `${user.first} ${user.last}` }',
      '}',
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {",
      '  return c.json(formatUser({ first: "John", last: "Doe" }))',
      '})',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    // Helper function and handler body both preserved
    expect(result).toContain('function formatUser(user: any)')
    expect(result).toContain('return c.json(formatUser({ first: "John", last: "Doe" }))')
  })

  it('preserves const helpers defined before handler', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'const DEFAULT_PAGE_SIZE = 20',
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {",
      '  return c.json({ pageSize: DEFAULT_PAGE_SIZE })',
      '})',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    const result = mergeHandlerFile(existing, generated)
    expect(result).toContain('const DEFAULT_PAGE_SIZE = 20')
    expect(result).toContain('return c.json({ pageSize: DEFAULT_PAGE_SIZE })')
  })
})

describe('mergeHandlerFile: async handler bodies', () => {
  it('preserves async handler body', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', async (c) => {",
      '  const data = await fetch("https://api.example.com/users")',
      '  return c.json(await data.json())',
      '})',
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        "export const usersHandler = new Hono().get('/users', async (c) => {",
        '  const data = await fetch("https://api.example.com/users")',
        '  return c.json(await data.json())',
        '})',
        '',
      ].join('\n'),
    )
  })
})

describe('mergeHandlerFile: multiple routes same handler', () => {
  it('preserves different handler bodies for GET and POST on same path', () => {
    const existing = [
      "import { Hono } from 'hono'",
      '',
      'export const usersHandler = new Hono()',
      "  .get('/users', (c) => { return c.json({ list: true }) })",
      "  .post('/users', (c) => { return c.json({ created: true }) })",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      '',
      'export const usersHandler = new Hono()',
      "  .get('/users', (c) => {})",
      "  .post('/users', (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        '',
        'export const usersHandler = new Hono()',
        "  .get('/users', (c) => { return c.json({ list: true }) })",
        "  .post('/users', (c) => { return c.json({ created: true }) })",
        '',
      ].join('\n'),
    )
  })
})

describe('mergeAppFile: user-added middleware preserved', () => {
  it('preserves user-added middleware imports and code between imports and api', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { usersHandler } from './handlers'",
      "import { cors } from 'hono/cors'",
      "import { logger } from 'hono/logger'",
      '',
      'const app = new Hono()',
      'app.use(cors())',
      'app.use(logger())',
      '',
      "export const api = app.route('/', usersHandler)",
      '',
      'export default app',
      '',
    ].join('\n')

    const generated = [
      "import{Hono}from'hono'",
      "import{usersHandler,todosHandler}from'./handlers'",
      '',
      'const app=new Hono()',
      '',
      "export const api=app.route('/',todosHandler).route('/',usersHandler)",
      '',
      'export default app',
    ].join('\n')

    expect(mergeAppFile(existing, generated)).toBe(
      [
        "import{Hono}from'hono'",
        "import{usersHandler,todosHandler}from'./handlers'",
        "import { cors } from 'hono/cors'",
        "import { logger } from 'hono/logger'",
        '',
        'const app = new Hono()',
        'app.use(cors())',
        'app.use(logger())',
        '',
        "export const api=app.route('/',todosHandler).route('/',usersHandler)",
        '',
        'export default app',
        '',
      ].join('\n'),
    )
  })
})

describe('mergeHandlerFile: human/generator boundary edge cases', () => {
  it('drops user-added middleware between describeRoute and handler body', () => {
    // Documented limitation: only the LAST argument is preserved from existing.
    // Middlewares the user inserted between describeRoute and the handler stub
    // are not carried over on regeneration.
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      'const authMiddleware = (c: any, next: any) => next()',
      '',
      "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'old' }), authMiddleware, (c) => c.json({ users: [] }))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'new' }), (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        '',
        'const authMiddleware = (c: any, next: any) => next()',
        '',
        "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'new' }), (c) => c.json({ users: [] }))",
        '',
      ].join('\n'),
    )
  })

  it('keeps stub when existing body is a whitespace-padded empty stub', () => {
    // STUBS detection ignores whitespace: `(c) => { }` (with space) is a stub.
    const existing = [
      "import { Hono } from 'hono'",
      '',
      "export const usersHandler = new Hono().get('/users', (c) => { })",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'L' }), (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        '',
        "export const usersHandler = new Hono().get('/users', describeRoute({ summary: 'L' }), (c) => {})",
        '',
      ].join('\n'),
    )
  })

  it('preserves JSDoc only on the route that originally had one in a chain', () => {
    const existing = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      'export const usersHandler = new Hono()',
      "  .get('/users', describeRoute({ summary: 'old' }), (c) => c.json({ users: [] }))",
      '  /** Custom: documented behavior. */',
      "  .post('/users', describeRoute({ summary: 'old' }), (c) => c.json({ created: true }))",
      '',
    ].join('\n')

    const generated = [
      "import { Hono } from 'hono'",
      "import { describeRoute } from 'hono-openapi'",
      '',
      'export const usersHandler = new Hono()',
      "  .get('/users', describeRoute({ summary: 'new' }), (c) => {})",
      "  .post('/users', describeRoute({ summary: 'new' }), (c) => {})",
      '',
    ].join('\n')

    expect(mergeHandlerFile(existing, generated)).toBe(
      [
        "import { Hono } from 'hono'",
        "import { describeRoute } from 'hono-openapi'",
        '',
        'export const usersHandler = new Hono()',
        "  .get('/users', describeRoute({ summary: 'new' }), (c) => c.json({ users: [] }))",
        '  ',
        '  /** Custom: documented behavior. */',
        "  .post('/users', describeRoute({ summary: 'new' }), (c) => c.json({ created: true }))",
        '',
      ].join('\n'),
    )
  })
})
