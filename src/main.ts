import * as core from '@actions/core'
import { setup } from './aya-setup.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const version = core.getInput('version')
    const aya = await setup(token, version)

    await aya.run('--version')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
