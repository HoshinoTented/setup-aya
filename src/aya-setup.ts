import * as core from '@actions/core'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'
import * as io from '@actions/io'
import * as path from 'path'

const fileName = 'cli-fatjar.jar'

type Aya = {
  ayaHome: string
  cliJar: string
}

export async function setup(
  token: string,
  home: string,
  version: string
): Promise<Aya> {
  const octokit = github.getOctokit(token)
  const { data: release } = await octokit.rest.repos.getReleaseByTag({
    owner: 'aya-prover',
    repo: 'aya-dev',
    tag: version
  })

  const ayaHome = path.join(home, '.aya')
  await io.mkdirP(ayaHome)

  const ayaJar = await tc.downloadTool(
    release.assets_url + '/' + fileName,
    path.join(ayaHome, fileName)
  )

  core.addPath(ayaHome)

  return {
    ayaHome: ayaHome,
    cliJar: ayaJar
  }
}
