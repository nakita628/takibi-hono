import { fileURLToPath } from 'node:url'

import { Console, Effect, FileSystem, Option, Runtime, Schema } from 'effect'
import { CliError, CliOutput, Command, Flag } from 'effect/unstable/cli'

import { DEFAULT_CONFIG_FILE, readConfig } from '../config/index.js'

const COMMAND_NAME = 'takibi-hono'

/** What `takibi-hono` accepts; each value is decoded before {@link generate} sees it. */
const commandLine = {
  config: Flag.file('config', { mustExist: true }).pipe(
    Flag.withAlias('c'),
    Flag.withDescription(`Config file to run (default: ./${DEFAULT_CONFIG_FILE})`),
    Flag.withMetavar('file'),
    Flag.optional,
  ),
} as const

/**
 * Reads the config and runs every generator it opts into.
 *
 * The generator pipeline pulls in the OpenAPI parser, the TypeSpec compiler and ts-morph.
 * `--help`, `--version`, `--completions` and every rejected command line must not pay for
 * that, so it is loaded here rather than at module scope.
 *
 * A config that is absent and was never asked for is the "ran `takibi-hono` with nothing"
 * case, the one place where the usage block is the answer; `ShowHelp` asks the runner for
 * it. Everything else fails with a sentence, turned into CLI output by the final
 * `mapError`.
 */
function generate(args: Command.Command.Config.Infer<typeof commandLine>) {
  return Effect.gen(function* () {
    const configPath = Option.getOrUndefined(args.config)
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
  ]),
)

/**
 * The version could not be read: the manifest beside the entry is missing, is not JSON,
 * or carries no `version` — a broken install, not anything the caller typed. It is raised
 * before the command runs, so it is rendered here through the same formatter and marked as
 * reported, so `runMain` does not print it a second time.
 */
function reportBrokenInstall(cause: { readonly message: string }) {
  return Effect.gen(function* () {
    const error = new CliError.UserError({
      cause,
      userMessage: `Cannot read the version from package.json: ${cause.message}`,
    })
    error[Runtime.errorReported] = false
    const formatter = yield* CliOutput.Formatter
    yield* Console.error(formatter.formatError(error))
    return yield* error
  })
}

/**
 * Runs `takibi-hono` against an argument list.
 *
 * `entryUrl` is the `import.meta.url` of the executable; `--version` is read from the
 * `package.json` beside it. Only the entry can supply that: `src/index.ts` and the
 * `dist/index.js` it is packed into both sit one directory below the manifest.
 */
export function takibiHono(argv: readonly string[], entryUrl: string) {
  return Effect.gen(function* () {
    const manifestPath = fileURLToPath(new URL('../package.json', entryUrl))
    const fs = yield* FileSystem.FileSystem
    const source = yield* fs.readFileString(manifestPath)
    const manifest = yield* Effect.try({
      try: (): unknown => JSON.parse(source),
      catch: (cause) => new Error(`${manifestPath} is not valid JSON`, { cause }),
    })
    const { version } = yield* Schema.decodeUnknownEffect(
      Schema.Struct({ version: Schema.String }),
    )(manifest)
    return yield* Command.runWith(cli, { version })(argv)
  }).pipe(Effect.catchIf((error) => !CliError.isCliError(error), reportBrokenInstall))
}
