import { Console, Effect, Option } from 'effect'
import { CliError, Command, Flag } from 'effect/cli'

import manifest from '../../package.json' with { type: 'json' }
import { DEFAULT_CONFIG_FILE, readConfig } from '../config/index.js'

const COMMAND_NAME = 'takibi-hono'

/** What `takibi-hono` accepts; each value is decoded before {@link generate} sees it. */
const commandLine = {
  config: Flag.File('config', { mustExist: true }).pipe(
    Flag.withAlias('c'),
    Flag.withDescription(`Config file to run (default: ./${DEFAULT_CONFIG_FILE})`),
    Flag.withMetavar('file'),
    Flag.optional,
  ),
} as const

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
 * Runs `takibi-hono`. The arguments come from the `Stdio` service — `process.argv` under
 * `NodeServices.layer`, a given list under `Stdio.layerTest` — and `--version` answers with
 * the version of the package manifest, which the build takes in with the source.
 */
export function takibiHono() {
  return Command.run(cli, { version: manifest.version })
}
