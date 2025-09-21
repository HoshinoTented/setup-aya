import * as core from '@actions/core'
import tc from '@actions/tool-cache'
import exec from '@actions/exec'
import path from 'path'

const releaseDir = './cli-console/build/libs'
const cliJarName = 'cli-fatjar.jar'

/**
 * Current directory is the root of aya-dev, the jar is produced
 */
export async function run(): Promise<void> {
  try {
    const ayaVersion = core.getInput('version')
    // const { stdout: stdout } = await exec.getExecOutput('java', [
    //   '-jar',
    //   ayaJar,
    //   '--version'
    // ])
    // const version = stdout.substring(4).trim()
    const ayaHome = await tc.cacheFile(
      cliJarName,
      cliJarName,
      'aya',
      ayaVersion
    )
    core.info('Aya is installed into: ' + ayaHome)

    const refind = tc.find('aya', ayaVersion)
    core.info('Refind: ' + refind)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
