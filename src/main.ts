import * as core from '@actions/core'
import tc from '@actions/tool-cache'

const cliJarName = 'cli-fatjar.jar'

/**
 * 'cli-fatjar.jar' should exist in the current directory.
 */
export async function run(): Promise<void> {
  try {
    const ayaVersion = core.getInput('version')
    const ayaHome = await tc.cacheFile(
      cliJarName,
      cliJarName,
      'aya',
      ayaVersion
    )
    core.info('Aya is installed into: ' + ayaHome)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
