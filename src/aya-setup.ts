import * as core from "@actions/core";
import * as github from "@actions/github";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as path from "path";

const ayaProver = "aya-prover";
const ayaDev = "aya-dev";
const fileName = "cli-fatjar.jar";

type Aya = {
  ayaHome: string;
  cliJar: string;
};

export async function setup(
  token: string,
  home: string,
  version: string,
): Promise<Aya> {
  core.debug(
    "Setting up Aya with version: " + version + " for homedir: " + home,
  );

  const octokit = github.getOctokit(token);

  // Improve error message, but we need to deal with scope problem
  const { data: release } = await octokit.rest.repos.getReleaseByTag({
    owner: ayaProver,
    repo: ayaDev,
    tag: version,
  });

  const { data: assets } = await octokit.rest.repos.listReleaseAssets({
    owner: ayaProver,
    repo: ayaDev,
    release_id: release.id,
  });

  const cliJarAsset = assets.find((asset) => asset.name == fileName);

  if (cliJarAsset == undefined) {
    throw new Error(
      "Asset " + fileName + " in release " + release.name + " is found.",
    );
  }

  const assetsUrl = cliJarAsset.browser_download_url;
  const ayaHome = path.join(home, ".aya");
  const ayaJar = path.join(ayaHome, fileName);

  await io.mkdirP(ayaHome);

  core.debug("Downloading " + assetsUrl + " to " + ayaJar);
  const actualPath = await tc.downloadTool(assetsUrl, ayaJar);
  core.debug("Downloaded to " + actualPath);

  core.debug("Setting up PATH");
  core.addPath(ayaHome);

  core.debug("Done setup Aya.");
  return {
    ayaHome: ayaHome,
    cliJar: ayaJar,
  };
}
