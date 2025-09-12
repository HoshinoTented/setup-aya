import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as os from 'os'
import { setup } from './aya-setup.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token')

    const home = os.homedir()
    const { cliJar: clijar } = await setup(token, home, 'nightly')

    await exec.exec(clijar, ['--version'])
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
