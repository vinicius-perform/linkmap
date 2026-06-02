import { Octokit } from '@octokit/rest';
import { Project } from '@/types/project';
import { generateHtmlCode } from './export';

export async function pushStaticHtmlToGithub(
  token: string,
  project: Project,
  repoName: string,
  isPrivate: boolean
) {
  const octokit = new Octokit({ auth: token });

  // 1. Authenticate and get user
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const owner = user.login;

  // 2. Check if repo exists, if not, create it
  let repoExists = false;
  try {
    await octokit.rest.repos.get({ owner, repo: repoName });
    repoExists = true;
  } catch (error: any) {
    if (error.status === 404) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        private: isPrivate,
        auto_init: true, // Creates a README and default branch
      });
      // wait a moment for the initialization to complete on GitHub's side
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw error;
    }
  }

  // 3. Get the default branch ref (usually main, sometimes master)
  const repoData = await octokit.rest.repos.get({ owner, repo: repoName });
  const defaultBranch = repoData.data.default_branch;
  const ref = `heads/${defaultBranch}`;

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo: repoName,
    ref,
  });
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo: repoName,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // 4. Create blobs for our files
  const htmlContent = generateHtmlCode(project);
  
  // Extract base64 part of the image
  const base64Image = project.imageBase64.split(',')[1];
  const imageExtension = project.imageBase64.substring(
    project.imageBase64.indexOf('/') + 1,
    project.imageBase64.indexOf(';')
  );
  const imageFileName = `assets/bg.${imageExtension}`;

  // Fix HTML image reference if needed (by default generateHtmlCode uses assets/bg.png)
  // Let's replace it dynamically based on the exact extension
  const finalHtmlContent = htmlContent.replace('assets/bg.png', imageFileName);

  const htmlBlob = await octokit.rest.git.createBlob({
    owner,
    repo: repoName,
    content: finalHtmlContent,
    encoding: 'utf-8',
  });

  const imageBlob = await octokit.rest.git.createBlob({
    owner,
    repo: repoName,
    content: base64Image,
    encoding: 'base64',
  });

  // 5. Create a new Tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo: repoName,
    base_tree: baseTreeSha,
    tree: [
      {
        path: 'index.html',
        mode: '100644',
        type: 'blob',
        sha: htmlBlob.data.sha,
      },
      {
        path: imageFileName,
        mode: '100644',
        type: 'blob',
        sha: imageBlob.data.sha,
      },
    ],
  });

  // 6. Create the Commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo: repoName,
    message: `Deploy from LinkMap Studio - ${new Date().toLocaleString()}`,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // 7. Update Ref
  await octokit.rest.git.updateRef({
    owner,
    repo: repoName,
    ref,
    sha: newCommit.sha,
  });

  // Return the repository URL
  return `https://github.com/${owner}/${repoName}`;
}
