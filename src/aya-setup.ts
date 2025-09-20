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
    if (args == undefined) args = []
    return exec.exec('java', ['-jar', this.cliJar, ...args])
  }
}

export async function setup(token: string, version: string): Promise<Aya> {
  core.debug('Setting up Aya with version: ' + version)

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

  core.debug('Downloading ' + assetsUrl)
  const downloaded = await tc.downloadTool(assetsUrl)
  const ayaHome = await tc.cacheFile(downloaded, cliFileName, toolName, version)
  core.debug('Aya is setup at ' + ayaHome)

  const refind = tc.find(toolName, cliFileName, 'x64')
  core.debug('Aya is found at: ' + refind)

  core.debug('Done setup Aya.')
  return new Aya(path.join(ayaHome, cliFileName))
}
