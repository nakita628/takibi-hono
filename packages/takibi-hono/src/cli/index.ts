import path from 'node:path'

import { Console, Effect, FileSystem, Option, Schema } from 'effect'
import { Argument, CliError, Command, Flag } from 'effect/cli'

import manifest from '../../package.json' with { type: 'json' }
import { DEFAULT_CONFIG_FILE, readConfig } from '../config/index.js'

const COMMAND_NAME = 'takibi-hono'

/** The libraries `defineHandler` can validate with: those with a Standard Schema interface. */
const SCHEMA_LIBRARIES = ['zod', 'valibot', 'arktype', 'effect'] as const

/**
 * The documents the one-shot mode looks for when it is given none: the conventional names of
 * an OpenAPI document and of a TypeSpec entry, in the current directory.
 */
const CONVENTIONAL_INPUTS = ['openapi.yaml', 'openapi.json', 'main.tsp'] as const

const InputSchema = Schema.String.pipe(
  Schema.refine(
    Schema.is(Schema.TemplateLiteral([Schema.String, Schema.Literals(['.yaml', '.json', '.tsp'])])),
    { message: 'an OpenAPI (.yaml, .json) or TypeSpec (.tsp) document' },
  ),
)

const OutputSchema = Schema.String.pipe(
  Schema.refine(Schema.is(Schema.TemplateLiteral([Schema.String, '.ts'])), {
    message: 'a TypeScript file path ending in .ts',
  }),
)

/** What `takibi-hono` accepts; each value is decoded before {@link generate} sees it. */
const commandLine = {
  input: Argument.File('input', { mustExist: true }).pipe(
    Argument.withSchema(InputSchema),
    Argument.withDescription(
      `OpenAPI (.yaml, .json) or TypeSpec (.tsp) document the one-shot mode generates from (default: the one of ${CONVENTIONAL_INPUTS.join(', ')} in the current directory)`,
    ),
    Argument.withMetavar('input.{yaml,json,tsp}'),
    Argument.optional,
  ),
  output: Flag.String('output').pipe(
    Flag.withAlias('o'),
    Flag.withSchema(OutputSchema),
    Flag.withDescription(
      'One-shot mode: write the schemas and the defineHandler definition of every operation to this file',
    ),
    Flag.withMetavar('output.ts'),
    Flag.optional,
  ),
  schema: Flag.Literals('schema', SCHEMA_LIBRARIES).pipe(
    Flag.withAlias('s'),
    Flag.withDescription('Schema library of the one-shot mode (default: zod)'),
    Flag.optional,
  ),
  config: Flag.File('config', { mustExist: true }).pipe(
    Flag.withAlias('c'),
    Flag.withDescription(`Config file to run (default: ./${DEFAULT_CONFIG_FILE})`),
    Flag.withMetavar('file'),
    Flag.optional,
  ),
} as const

type Args = Command.Command.Config.Infer<typeof commandLine>

/** The usage block with one sentence on what was wrong with the command line. */
function usageError(message: string) {
  return new CliError.ShowHelp({
    commandPath: [COMMAND_NAME],
    errors: [new CliError.UserError({ cause: new Error(message), userMessage: message })],
  })
}

/**
 * The document the one-shot mode generates from when the command line names none: the one
 * conventional document present in the current directory. None, or more than one, is a
 * question only the user can answer.
 */
function findInput() {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const present = yield* Effect.filter(CONVENTIONAL_INPUTS, (name) =>
      fs.exists(name).pipe(Effect.orElseSucceed(() => false)),
    )
    const [found, ...more] = present
    if (found !== undefined && more.length === 0) return found
    return yield* usageError(
      found === undefined
        ? `-o <output.ts> needs an <input> document: none of ${CONVENTIONAL_INPUTS.join(', ')} is in the current directory.`
        : `-o <output.ts> needs an <input> document: ${present.join(' and ')} are both in the current directory.`,
    )
  })
}

/**
 * The one-shot mode, `takibi-hono [input] -o <output.ts> [--schema <lib>]`: no config file,
 * one file holding the schemas and the `defineHandler` definition of every operation, for the
 * user's handlers to import. The library is zod unless the command line says otherwise.
 */
function generateFile(args: Args, output: string) {
  return Effect.gen(function* () {
    const named = Option.getOrUndefined(args.input)
    const input = named ?? (yield* findInput())
    const lib = Option.getOrElse(args.schema, () => 'zod' as const)
    const { honoFile } = yield* Effect.promise(() => import('../core/index.js'))
    yield* honoFile(input, output, lib)
    // `Argument.File` resolves the document to an absolute path; the report names it as typed.
    const shown = path.isAbsolute(input) ? path.relative(process.cwd(), input) : input
    return yield* Console.log(`🔥 takibi-hono: ${shown} (${lib}) → ${output} ✅`)
  })
}

/**
 * Reads the config and runs every generator it opts into.
 *
 * The generator pipeline pulls in the OpenAPI parser, the TypeSpec compiler and oxc-parser.
 * `--help`, `--version`, `--completions` and every rejected command line must not pay for
 * that, so it is loaded here rather than at module scope.
 *
 * A config that is absent and was never asked for is the "ran `takibi-hono` with nothing"
 * case, the one place where the usage block is the answer; `ShowHelp` asks the runner for
 * it. Everything else fails with a sentence, turned into CLI output by the final
 * `mapError`.
 */
function generate(args: Args) {
  return Effect.gen(function* () {
    const configPath = Option.getOrUndefined(args.config)
    const output = Option.getOrUndefined(args.output)
    const oneShot = [args.input, args.output, args.schema].some(Option.isSome)
    if (oneShot && configPath !== undefined) {
      return yield* usageError(
        '--config cannot be combined with <input>, --output or --schema: a config file names its own input, outputs and schema library.',
      )
    }
    if (output !== undefined) return yield* generateFile(args, output)
    if (oneShot) {
      return yield* usageError(
        '<input> and --schema are the one-shot mode, which writes to -o <output.ts>. Without -o, takibi-hono runs a config file.',
      )
    }
    const config = yield* readConfig(configPath).pipe(
      Effect.mapError((error) =>
        configPath === undefined && error.notFound === true
          ? new CliError.ShowHelp({
              commandPath: [COMMAND_NAME],
              errors: [new CliError.UserError({ cause: error, userMessage: error.message })],
            })
          : error,
      ),
    )
    const { hono } = yield* Effect.promise(() => import('../core/index.js'))
    yield* hono(config)
    return yield* Console.log(`🔥 takibi-hono: ${config.input} (${config.schema}) ✅`)
  }).pipe(
    Effect.mapError((error) =>
      CliError.isCliError(error)
        ? error
        : new CliError.UserError({ cause: error, userMessage: error.message }),
    ),
  )
}

/**
 * The `takibi-hono` command: parsing, validation, `--help`, `--version` and shell
 * completions are owned by `effect/unstable/cli`, {@link generate} is the rest.
 */
const cli = Command.make(COMMAND_NAME, commandLine, generate).pipe(
  Command.withDescription('Generate Hono handlers from an OpenAPI or TypeSpec document'),
  Command.withExamples([
    {
      command: COMMAND_NAME,
      description: `Run the generators declared in ./${DEFAULT_CONFIG_FILE}`,
    },
    {
      command: `${COMMAND_NAME} --config config/api.config.ts`,
      description: 'Run a config file from another location',
    },
    {
      command: `${COMMAND_NAME} openapi.yaml -o src/routes.ts`,
      description: 'Write the schemas and a defineHandler definition per operation to one file',
    },
    {
      command: `${COMMAND_NAME} -o src/routes.ts --schema valibot`,
      description:
        'The same, from the openapi.yaml / openapi.json / main.tsp in the current directory',
    },
  ]),
)

/**
 * Runs `takibi-hono`. The arguments come from the `Stdio` service — `process.argv` under
 * `NodeServices.layer`, a given list under `Stdio.layerTest` — and `--version` answers with
 * the version of the package manifest, which the build takes in with the source.
 */
export function takibiHono() {
  return Command.run(cli, { version: manifest.version })
}
