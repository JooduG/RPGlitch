2026-04-08T07:11:43.7402116Z Current runner version: '2.333.1'
2026-04-08T07:11:43.7436127Z ##[group]Runner Image Provisioner
2026-04-08T07:11:43.7437498Z Hosted Compute Agent
2026-04-08T07:11:43.7438495Z Version: 20260213.493
2026-04-08T07:11:43.7439419Z Commit: 5c115507f6dd24b8de37d8bbe0bb4509d0cc0fa3
2026-04-08T07:11:43.7440790Z Build Date: 2026-02-13T00:28:41Z
2026-04-08T07:11:43.7441908Z Worker ID: {e8ae9043-5b67-4e3c-8d6a-3f58c9883bed}
2026-04-08T07:11:43.7443108Z Azure Region: westus
2026-04-08T07:11:43.7443947Z ##[endgroup]
2026-04-08T07:11:43.7446553Z ##[group]Operating System
2026-04-08T07:11:43.7447739Z Ubuntu
2026-04-08T07:11:43.7448542Z 24.04.4
2026-04-08T07:11:43.7449382Z LTS
2026-04-08T07:11:43.7450298Z ##[endgroup]
2026-04-08T07:11:43.7451157Z ##[group]Runner Image
2026-04-08T07:11:43.7452160Z Image: ubuntu-24.04
2026-04-08T07:11:43.7453245Z Version: 20260329.72.1
2026-04-08T07:11:43.7455249Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20260329.72/images/ubuntu/Ubuntu2404-Readme.md
2026-04-08T07:11:43.7458230Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20260329.72
2026-04-08T07:11:43.7459809Z ##[endgroup]
2026-04-08T07:11:43.7461950Z ##[group]GITHUB_TOKEN Permissions
2026-04-08T07:11:43.7464842Z Contents: write
2026-04-08T07:11:43.7466098Z Issues: write
2026-04-08T07:11:43.7467039Z Metadata: read
2026-04-08T07:11:43.7467938Z PullRequests: write
2026-04-08T07:11:43.7468828Z ##[endgroup]
2026-04-08T07:11:43.7471985Z Secret source: Actions
2026-04-08T07:11:43.7473214Z Prepare workflow directory
2026-04-08T07:11:43.8141170Z Prepare all required actions
2026-04-08T07:11:43.8199870Z Getting action download info
2026-04-08T07:11:44.4320067Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
2026-04-08T07:11:44.5874760Z Download action repository 'actions/setup-node@v4' (SHA:49933ea5288caeca8642d1e84afbd3f7d6820020)
2026-04-08T07:11:44.6839705Z Download action repository 'google-labs-code/jules-action@main' (SHA:bff7875eaa123cac6742b7cfc51005b95ba4d566)
2026-04-08T07:11:45.3072398Z Download action repository 'stefanzweifel/git-auto-commit-action@v5' (SHA:b863ae1933cb653a53c021fe36dbb774e1fb9403)
2026-04-08T07:11:45.8424439Z Getting action download info
2026-04-08T07:11:46.0192372Z Download action repository 'actions/checkout@v5' (SHA:93cb6efe18208431cddfb8368fd83d5badbf9bfd)
2026-04-08T07:11:46.1483137Z Complete job name: 🧠 Strategic Ops
2026-04-08T07:11:46.2300714Z ##[group]Run actions/checkout@v4
2026-04-08T07:11:46.2302173Z with:
2026-04-08T07:11:46.2303132Z   fetch-depth: 0
2026-04-08T07:11:46.2303937Z   repository: JooduG/RPGlitch
2026-04-08T07:11:46.2305052Z   token: ***
2026-04-08T07:11:46.2306025Z   ssh-strict: true
2026-04-08T07:11:46.2306785Z   ssh-user: git
2026-04-08T07:11:46.2307569Z   persist-credentials: true
2026-04-08T07:11:46.2308419Z   clean: true
2026-04-08T07:11:46.2309218Z   sparse-checkout-cone-mode: true
2026-04-08T07:11:46.2310131Z   fetch-tags: false
2026-04-08T07:11:46.2310914Z   show-progress: true
2026-04-08T07:11:46.2311744Z   lfs: false
2026-04-08T07:11:46.2312455Z   submodules: false
2026-04-08T07:11:46.2313241Z   set-safe-directory: true
2026-04-08T07:11:46.2314373Z ##[endgroup]
2026-04-08T07:11:46.3475848Z Syncing repository: JooduG/RPGlitch
2026-04-08T07:11:46.3479466Z ##[group]Getting Git version info
2026-04-08T07:11:46.3481413Z Working directory is '/home/runner/work/RPGlitch/RPGlitch'
2026-04-08T07:11:46.3484126Z [command]/usr/bin/git version
2026-04-08T07:11:46.3532544Z git version 2.53.0
2026-04-08T07:11:46.3563703Z ##[endgroup]
2026-04-08T07:11:46.3578969Z Temporarily overriding HOME='/home/runner/work/_temp/f0180407-201a-49ca-9329-e5a4d51677c1' before making global git config changes
2026-04-08T07:11:46.3586859Z Adding repository directory to the temporary git global config as a safe directory
2026-04-08T07:11:46.3590146Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/RPGlitch/RPGlitch
2026-04-08T07:11:46.3634589Z Deleting the contents of '/home/runner/work/RPGlitch/RPGlitch'
2026-04-08T07:11:46.3640669Z ##[group]Initializing the repository
2026-04-08T07:11:46.3645073Z [command]/usr/bin/git init /home/runner/work/RPGlitch/RPGlitch
2026-04-08T07:11:46.3760578Z hint: Using 'master' as the name for the initial branch. This default branch name
2026-04-08T07:11:46.3763462Z hint: will change to "main" in Git 3.0. To configure the initial branch name
2026-04-08T07:11:46.3766545Z hint: to use in all of your new repositories, which will suppress this warning,
2026-04-08T07:11:46.3768812Z hint: call:
2026-04-08T07:11:46.3770035Z hint:
2026-04-08T07:11:46.3771744Z hint:  git config --global init.defaultBranch <name>
2026-04-08T07:11:46.3773539Z hint:
2026-04-08T07:11:46.3775192Z hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
2026-04-08T07:11:46.3782306Z hint: 'development'. The just-created branch can be renamed via this command:
2026-04-08T07:11:46.3784750Z hint:
2026-04-08T07:11:46.3786169Z hint:  git branch -m <name>
2026-04-08T07:11:46.3787449Z hint:
2026-04-08T07:11:46.3789193Z hint: Disable this message with "git config set advice.defaultBranchName false"
2026-04-08T07:11:46.3792067Z Initialized empty Git repository in /home/runner/work/RPGlitch/RPGlitch/.git/
2026-04-08T07:11:46.3796996Z [command]/usr/bin/git remote add origin https://github.com/JooduG/RPGlitch
2026-04-08T07:11:46.3829778Z ##[endgroup]
2026-04-08T07:11:46.3832871Z ##[group]Disabling automatic garbage collection
2026-04-08T07:11:46.3834724Z [command]/usr/bin/git config --local gc.auto 0
2026-04-08T07:11:46.3869726Z ##[endgroup]
2026-04-08T07:11:46.3871765Z ##[group]Setting up auth
2026-04-08T07:11:46.3874080Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-04-08T07:11:46.3906965Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-04-08T07:11:46.4220544Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-04-08T07:11:46.4261678Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-04-08T07:11:46.4511782Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-04-08T07:11:46.4547293Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-04-08T07:11:46.4787721Z [command]/usr/bin/git config --local http.https://github.com/.extraheader AUTHORIZATION: basic***
2026-04-08T07:11:46.4830924Z ##[endgroup]
2026-04-08T07:11:46.4834337Z ##[group]Fetching the repository
2026-04-08T07:11:46.4842564Z [command]/usr/bin/git -c protocol.version=2 fetch --prune --no-recurse-submodules origin +refs/heads/*:refs/remotes/origin/* +refs/tags/*:refs/tags/*
2026-04-08T07:11:51.4030875Z From https://github.com/JooduG/RPGlitch
2026-04-08T07:11:51.4046246Z  * [new branch]        main       -> origin/main
2026-04-08T07:11:51.4082329Z [command]/usr/bin/git branch --list --remote origin/main
2026-04-08T07:11:51.4109986Z   origin/main
2026-04-08T07:11:51.4132513Z [command]/usr/bin/git rev-parse refs/remotes/origin/main
2026-04-08T07:11:51.4156220Z 8c869107264b3cb64e4331e23051f7c061a2f077
2026-04-08T07:11:51.4170212Z ##[endgroup]
2026-04-08T07:11:51.4181550Z ##[group]Determining the checkout info
2026-04-08T07:11:51.4184466Z ##[endgroup]
2026-04-08T07:11:51.4187021Z [command]/usr/bin/git sparse-checkout disable
2026-04-08T07:11:51.4244234Z [command]/usr/bin/git config --local --unset-all extensions.worktreeConfig
2026-04-08T07:11:51.4274091Z ##[group]Checking out the ref
2026-04-08T07:11:51.4279455Z [command]/usr/bin/git checkout --progress --force -B main refs/remotes/origin/main
2026-04-08T07:11:51.5457191Z Switched to a new branch 'main'
2026-04-08T07:11:51.5459951Z branch 'main' set up to track 'origin/main'.
2026-04-08T07:11:51.5486830Z ##[endgroup]
2026-04-08T07:11:51.5525245Z [command]/usr/bin/git log -1 --format=%H
2026-04-08T07:11:51.5551023Z 8c869107264b3cb64e4331e23051f7c061a2f077
2026-04-08T07:11:51.5862531Z ##[group]Run actions/setup-node@v4
2026-04-08T07:11:51.5862829Z with:
2026-04-08T07:11:51.5863015Z   node-version: 20
2026-04-08T07:11:51.5863208Z   cache: npm
2026-04-08T07:11:51.5863384Z   always-auth: false
2026-04-08T07:11:51.5863585Z   check-latest: false
2026-04-08T07:11:51.5863901Z   token: ***
2026-04-08T07:11:51.5864097Z ##[endgroup]
2026-04-08T07:11:51.7812834Z Found in cache @ /opt/hostedtoolcache/node/20.20.2/x64
2026-04-08T07:11:51.7818410Z ##[group]Environment details
2026-04-08T07:11:52.1831574Z node: v20.20.2
2026-04-08T07:11:52.1837246Z npm: 10.8.2
2026-04-08T07:11:52.1840264Z yarn: 1.22.22
2026-04-08T07:11:52.1843004Z ##[endgroup]
2026-04-08T07:11:52.1890031Z [command]/opt/hostedtoolcache/node/20.20.2/x64/bin/npm config get cache
2026-04-08T07:11:52.3612714Z /home/runner/.npm
2026-04-08T07:11:52.6866841Z npm cache is not found
2026-04-08T07:11:52.7024979Z ##[group]Run npm install
2026-04-08T07:11:52.7025590Z [36;1mnpm install[0m
2026-04-08T07:11:52.7063281Z shell: /usr/bin/bash -e {0}
2026-04-08T07:11:52.7063532Z ##[endgroup]
2026-04-08T07:11:55.7395817Z npm error code ERESOLVE
2026-04-08T07:11:55.7398387Z npm error ERESOLVE could not resolve
2026-04-08T07:11:55.7399542Z npm error
2026-04-08T07:11:55.7401733Z npm error While resolving: vite-plugin-devtools-json@1.0.0
2026-04-08T07:11:55.7403263Z npm error Found: vite@8.0.3
2026-04-08T07:11:55.7406188Z npm error node_modules/vite
2026-04-08T07:11:55.7406829Z npm error   dev vite@"^8.0.3" from the root project
2026-04-08T07:11:55.7408293Z npm error   peer vite@"^8.0.0-beta.7 || ^8.0.0" from @sveltejs/vite-plugin-svelte@7.0.0
2026-04-08T07:11:55.7409263Z npm error   node_modules/@sveltejs/vite-plugin-svelte
2026-04-08T07:11:55.7413544Z npm error     dev @sveltejs/vite-plugin-svelte@"^7.0.0" from the root project
2026-04-08T07:11:55.7414468Z npm error   5 more (@testing-library/svelte, @vitest/mocker, ...)
2026-04-08T07:11:55.7414822Z npm error
2026-04-08T07:11:55.7415082Z npm error Could not resolve dependency:
2026-04-08T07:11:55.7416059Z npm error peer vite@"^5.0.0 || ^6.0.0 || ^7.0.0" from vite-plugin-devtools-json@1.0.0
2026-04-08T07:11:55.7416809Z npm error node_modules/vite-plugin-devtools-json
2026-04-08T07:11:55.7417277Z npm error   dev vite-plugin-devtools-json@"^1.0.0" from the root project
2026-04-08T07:11:55.7417616Z npm error
2026-04-08T07:11:55.7417899Z npm error Conflicting peer dependency: vite@7.3.2
2026-04-08T07:11:55.7418214Z npm error node_modules/vite
2026-04-08T07:11:55.7418639Z npm error   peer vite@"^5.0.0 || ^6.0.0 || ^7.0.0" from vite-plugin-devtools-json@1.0.0
2026-04-08T07:11:55.7419132Z npm error   node_modules/vite-plugin-devtools-json
2026-04-08T07:11:55.7419619Z npm error     dev vite-plugin-devtools-json@"^1.0.0" from the root project
2026-04-08T07:11:55.7419972Z npm error
2026-04-08T07:11:55.7420281Z npm error Fix the upstream dependency conflict, or retry
2026-04-08T07:11:55.7420706Z npm error this command with --force or --legacy-peer-deps
2026-04-08T07:11:55.7421235Z npm error to accept an incorrect (and potentially broken) dependency resolution.
2026-04-08T07:11:55.7421627Z npm error
2026-04-08T07:11:55.7421797Z npm error
2026-04-08T07:11:55.7422017Z npm error For a full report see:
2026-04-08T07:11:55.7422461Z npm error /home/runner/.npm/_logs/2026-04-08T07_11_52_776Z-eresolve-report.txt
2026-04-08T07:11:55.7423271Z npm error A complete log of this run can be found in: /home/runner/.npm/_logs/2026-04-08T07_11_52_776Z-debug-0.log
2026-04-08T07:11:55.7628099Z ##[error]Process completed with exit code 1.
2026-04-08T07:11:55.7745078Z Post job cleanup.
2026-04-08T07:11:55.8758990Z [command]/usr/bin/git version
2026-04-08T07:11:55.8810120Z git version 2.53.0
2026-04-08T07:11:55.8863639Z Temporarily overriding HOME='/home/runner/work/_temp/15561bbe-1672-41fc-b790-da3538f9c614' before making global git config changes
2026-04-08T07:11:55.8866418Z Adding repository directory to the temporary git global config as a safe directory
2026-04-08T07:11:55.8870942Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/RPGlitch/RPGlitch
2026-04-08T07:11:55.8919685Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-04-08T07:11:55.8957375Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-04-08T07:11:55.9201019Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-04-08T07:11:55.9227644Z http.https://github.com/.extraheader
2026-04-08T07:11:55.9241009Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-04-08T07:11:55.9280906Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-04-08T07:11:55.9522947Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-04-08T07:11:55.9563031Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-04-08T07:11:55.9914140Z Cleaning up orphan processes
2026-04-08T07:11:56.0157503Z ##[warning]Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not work as expected: actions/checkout@v4, actions/setup-node@v4. Actions will be forced to run with Node.js 24 by default starting June 2nd, 2026. Node.js 20 will be removed from the runner on September 16th, 2026. Please check if updated versions of these actions are available that support Node.js 24. To opt into Node.js 24 now, set the FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true environment variable on the runner or in your workflow file. Once Node.js 24 becomes the default, you can temporarily opt out by setting ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
