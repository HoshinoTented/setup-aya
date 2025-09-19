import * as core from '@actions/core'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'

const ayaProver = 'aya-prover'
const ayaDev = 'aya-dev'
const fileName = 'cli-fatjar.jar'

type Aya = {
  cliJar: string
}

export async function setup(
  token: string,
  version: string
): Promise<Aya> {
  core.debug(
    'Setting up Aya with version: ' + version
  )

  const octokit = github.getOctokit(token)

  // Improve error message, but we need to deal with scope problem
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

  const cliJarAsset = assets.find((asset) => asset.name == fileName)

  if (cliJarAsset == undefined) {
    throw new Error(
      'Asset ' + fileName + ' in release ' + release.name + ' is found.'
    )
  }

  const assetsUrl = cliJarAsset.browser_download_url

  core.debug('Downloading ' + assetsUrl)
  const ayaJar = await tc.downloadTool(assetsUrl)
  core.debug('Downloaded to ' + ayaJar)

  core.debug('Setting up PATH')
  core.addPath(ayaJar)

  core.debug('Done setup Aya.')
  return {
    cliJar: ayaJar
  }
}
