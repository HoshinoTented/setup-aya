import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'
import path from 'path'

const ayaProver = 'aya-prover'
const ayaDev = 'aya-dev'
const toolName = 'aya'
const cliFileName = 'cli-fatjar.jar'

class Aya {
  cliJar: string

  constructor(cliJar: string) {
    this.cliJar = cliJar
  }

  async run(...args: string[]): Promise<number> {
    return exec.exec('java', ['-jar', this.cliJar, ...args])
  }

  async execOutput(...args: string[]): Promise<exec.ExecOutput> {
    return exec.getExecOutput('java', ['-jar', this.cliJar, ...args])
  }
}

export async function setup(token: string, version: string): Promise<Aya> {
  core.info('Setting up Aya with version: ' + version)

  const octokit = github.getOctokit(token)

  // Improve error message when getReleaseByTag fails, but we need to deal with scope problem
  const { data: release } = await octokit.rest.repos.getReleaseByTag({
    owner: ayaProver,
    repo: ayaDev,
    tag: version
  })

  const { data: assets } = await octokit.rest.repos.listReleaseAssets({
    owner: ayaProver,
    repo: ayaDev,
    release_id: release.id
  })

  const cliJarAsset = assets.find((asset) => asset.name == cliFileName)

  if (cliJarAsset == undefined) {
    throw new Error(
      'Asset ' + cliFileName + ' in release ' + release.name + ' is found.'
    )
  }

  const assetsUrl = cliJarAsset.browser_download_url

  core.info('Downloading ' + assetsUrl)
  const downloaded = await tc.downloadTool(assetsUrl)

  // Obtain aya version
  const tmpAya = new Aya(path.join(downloaded))
  const { exitCode: exitCode, stdout: realVersion } =
    await tmpAya.execOutput('--version')

  if (exitCode != 0) {
    throw new Error('Failed to get aya version')
  }

  // we need to use the real version in case `version == 'nightly-build'`
  const ayaHome = await tc.cacheFile(
    downloaded,
    cliFileName,
    toolName,
    realVersion.substring(4).trim()
  )
  core.info('Aya is setup at ' + ayaHome)

  const refind = tc.findAllVersions(toolName)
  core.info('Aya is found at: ' + refind.join(' '))

  core.info('Done setup Aya.')
  return new Aya(path.join(ayaHome, cliFileName))
}
