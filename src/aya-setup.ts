import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'

const ayaProver = 'aya-prover'
const ayaDev = 'aya-dev'
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
  const ayaJar = await tc.cacheFile(downloaded, cliFileName, 'aya', version)
  core.debug('Aya is setup at ' + ayaJar)

  core.debug('Setting up PATH')
  core.addPath(ayaJar)

  core.debug('Done setup Aya.')
  return new Aya(ayaJar)
}
