# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.9](https://github.com/ssalka/unigraph-dev/compare/v0.2.8...v0.2.9) (2022-04-14)


### Bug Fixes

* **commands:** fix server compiling ([10884b4](https://github.com/ssalka/unigraph-dev/commit/10884b4b2a6efe967b3eec5f94c6144fca50f71c))


### Features

* **commands:** dispatchCommand now able to run lambdas and client execs ([b0848e0](https://github.com/ssalka/unigraph-dev/commit/b0848e0d97aa516630978c4f834c5735b07f42f4))
* **hotkeys:** call omnibar with new hotkey architecture ([c6e0b33](https://github.com/ssalka/unigraph-dev/commit/c6e0b33d7c208681da30b1ba57a4b4a3d27c2bef))





## [0.2.8](https://github.com/ssalka/unigraph-dev/compare/v0.2.7...v0.2.8) (2022-04-05)

**Note:** Version bump only for package unigraph-dev-backend





## [0.2.6](https://github.com/ssalka/unigraph-dev/compare/v0.2.5...v0.2.6) (2022-03-19)


### Features

* **api:** http json api, docs ([efda92d](https://github.com/ssalka/unigraph-dev/commit/efda92dcd97ab387585be61525b5558f750afbfe))
* **sync:** add framework for bi-directional sync service ([2086682](https://github.com/ssalka/unigraph-dev/commit/208668241d76e98b5e545b88553d6796222beda3))





## [0.2.5](https://github.com/ssalka/unigraph-dev/compare/v0.2.4...v0.2.5) (2022-03-13)

**Note:** Version bump only for package unigraph-dev-backend





## [0.2.4](https://github.com/ssalka/unigraph-dev/compare/v0.2.3...v0.2.4) (2022-03-13)

**Note:** Version bump only for package unigraph-dev-backend





## [0.2.3](https://github.com/ssalka/unigraph-dev/compare/v0.2.2...v0.2.3) (2022-03-11)


### Bug Fixes

* change websocket port to less common port ([4c98406](https://github.com/ssalka/unigraph-dev/commit/4c98406dae11819ec8a45be8acd53d2d2dd2e162))





## [0.2.2](https://github.com/ssalka/unigraph-dev/compare/v0.2.1...v0.2.2) (2022-03-09)


### Bug Fixes

* **backend:** executable early raise error ([3229517](https://github.com/ssalka/unigraph-dev/commit/322951776efb9481dd01ff963af9d6632379aac5))
* **backend:** import/export objects now use proper format ([5db704e](https://github.com/ssalka/unigraph-dev/commit/5db704e876fe639739106bd628cd6b57864c0be4))
* **packages:** package declaration now independent from unigraph versioning ([141bd18](https://github.com/ssalka/unigraph-dev/commit/141bd18adb1734db6b3d0280e0bd1104feca1adf))





## [0.2.1](https://github.com/ssalka/unigraph-dev/compare/v0.2.0...v0.2.1) (2022-03-09)

**Note:** Version bump only for package unigraph-dev-backend





# [0.2.0](https://github.com/ssalka/unigraph-dev/compare/v0.1.0...v0.2.0) (2022-03-07)


### Bug Fixes

* **api:** add option to select subscription IDs for adding objects ([7933ae9](https://github.com/ssalka/unigraph-dev/commit/7933ae92bc24769b5f9c4c1d837af105b342f5d8))
* **editor:** sometimes clicking on empty notes don't focus ([52b14a9](https://github.com/ssalka/unigraph-dev/commit/52b14a9b7360e57cfda5d891be954611820c1c13))
* **search:** speedup query, search result balancing relevance and recency ([8cd0855](https://github.com/ssalka/unigraph-dev/commit/8cd0855a8d660b3048b21e9de7ac849bda81c9de))


### Features

* **backend:** auto group and batch subscriptions ([8336cf6](https://github.com/ssalka/unigraph-dev/commit/8336cf6c127d8f086f669c21dde095fd5c643c3b))
* **backend:** auto update default packages if new version exists ([1065a46](https://github.com/ssalka/unigraph-dev/commit/1065a468f1ae8bd8ae55f29d7555850e841b1603))
* **backend:** auto update when new version is found ([a4b89b5](https://github.com/ssalka/unigraph-dev/commit/a4b89b5441f71de250320fc7e42f697569b34838))
* **semantic:** add generic entity renaming with all references ([da91571](https://github.com/ssalka/unigraph-dev/commit/da915716e0a952dcc914987d950c8c6483e7e265))


### Performance Improvements

* tidy up subscription on client side ([8d2de57](https://github.com/ssalka/unigraph-dev/commit/8d2de5727a81cd0d7715100200a5d2b982cf7d57))





# [0.1.0](https://github.com/ssalka/unigraph-dev/compare/v0.1.10...v0.1.0) (2022-02-21)


### Bug Fixes

* **backend:** minor search speedup ([9044221](https://github.com/ssalka/unigraph-dev/commit/9044221525edfd7336701c459c5fd6b2fa170d99))
* **backend:** namespace subscription slow ([a606132](https://github.com/ssalka/unigraph-dev/commit/a606132db018d5e8dc9008ed1e183b004db94989))
* **backend:** websocket error handling ([20c826e](https://github.com/ssalka/unigraph-dev/commit/20c826ece38917b77bd893ce7511df801bbe7df8))
* **data:** fix broken schema ([0affd4f](https://github.com/ssalka/unigraph-dev/commit/0affd4f9b105a6daeb0d45da0b964eba7b73bf1c))
* **datamodel:** allow linked objects within upsert queries ([c47e0d3](https://github.com/ssalka/unigraph-dev/commit/c47e0d3863c059e2e3fddd3d00cce19fcea53761))
* delete array issues and note editor states ([2edfecd](https://github.com/ssalka/unigraph-dev/commit/2edfecd498467b31e86777da7336cbc2379a32eb))
* **email:** gmail inbox sync should work now ([9d22bcc](https://github.com/ssalka/unigraph-dev/commit/9d22bcc4534bf1b28f9db9ec431229399e9c78d9))
* **executable:** live updates for executables ([37bdc75](https://github.com/ssalka/unigraph-dev/commit/37bdc75aaa268fb5c4b80ab7d28a5057ce97bca3))
* gmail update fixes and ux fixes ([858b93a](https://github.com/ssalka/unigraph-dev/commit/858b93a137d4272f860914828543bf0271885741))
* merger and uid leasing fixes ([b61100e](https://github.com/ssalka/unigraph-dev/commit/b61100ed74bc32ee6844073c4bb050a9a4abe975))
* **packages:** use less insert to add package ([3a4f21a](https://github.com/ssalka/unigraph-dev/commit/3a4f21a76bf7627d9392ce92fbd5b497f0f13c23))
* **search:** don't show deleted items in search results ([0c75477](https://github.com/ssalka/unigraph-dev/commit/0c7547799a70c655f4cd5110303b9ac42663016f))
* **search:** speed up queries ([d7e2ad8](https://github.com/ssalka/unigraph-dev/commit/d7e2ad8034809960330582c335e8ce1e86bfde8f))
* **server, kanban:** increased executable performance ([b4f0731](https://github.com/ssalka/unigraph-dev/commit/b4f0731dca1d94a6c909506b208f5ede47f86684))
* **server:** client lease uid ([7e6be32](https://github.com/ssalka/unigraph-dev/commit/7e6be3252631c93357eef8fdcdaebee9538a1971))
* **server:** don't throw when secrets are not found ([a3cfe27](https://github.com/ssalka/unigraph-dev/commit/a3cfe27742ed8cbe6f6a7293e53f57a2d64720dd))
* **server:** metadata query should show whether hidden ([b63fa60](https://github.com/ssalka/unigraph-dev/commit/b63fa60c7d57c9eb504fe31e181539b198c80a0b))
* **server:** multiple client leasing UIDs ([09f2673](https://github.com/ssalka/unigraph-dev/commit/09f2673d0112f28cae929383df494b5988bf0641))
* **server:** update triplet support designating uids ([20055a5](https://github.com/ssalka/unigraph-dev/commit/20055a5e6ea48045782dbb5f926223ac0608da7f))
* **subscriptions:** better subscriptions on revival ([577dc3b](https://github.com/ssalka/unigraph-dev/commit/577dc3ba6872a4f115f06a22bbf23d6e327839a3))
* **ux:** various ux and usability fixes ([5bfe822](https://github.com/ssalka/unigraph-dev/commit/5bfe82223030037df4ff2d6bcfdd5959b28978b7))


### Features

* add complex search for http api ([34d16e2](https://github.com/ssalka/unigraph-dev/commit/34d16e2c72254bc341decbd3c6ef7e59f38031da))
* **api:** add method to bulk update last edited metadata ([62cbb0c](https://github.com/ssalka/unigraph-dev/commit/62cbb0c6db9e69c984bb41ea201cc9ce19af972c))
* **api:** add optional common variables in query ([2edfe5a](https://github.com/ssalka/unigraph-dev/commit/2edfe5a584567ba44e8938e83ba6826dd07d8e87))
* **api:** allow manually leasing UIDs ([1966366](https://github.com/ssalka/unigraph-dev/commit/19663669ca30272acfce37bfcc25d4dd2746e14d))
* **api:** getObject available in frontend ([f3d5f74](https://github.com/ssalka/unigraph-dev/commit/f3d5f74e223ed3e948e05d4e3253fdcb07a52a75))
* **backend:** add debug mode for function execution with console log redirects ([0abd4b6](https://github.com/ssalka/unigraph-dev/commit/0abd4b65e3a0689c91bb6423c0a5d51e0d51fe46))
* **contacts:** add person as contact in context menu ([513c095](https://github.com/ssalka/unigraph-dev/commit/513c095dad27aeaac06f7c5c0737c14e2ccf4e27))
* **contacts:** initial contact book & automation support ([067efd5](https://github.com/ssalka/unigraph-dev/commit/067efd5dd6826974c6f179621eb23be6fdbece24))
* **dev:** add current subscriptions view for debug ([35f09fa](https://github.com/ssalka/unigraph-dev/commit/35f09fa1eb2ab8a1272266198b47168180d5a287))
* **frontend:** add block-level backlink indicator ([2b009c8](https://github.com/ssalka/unigraph-dev/commit/2b009c8d40e4c189c1a1fe9e4f4032463e19a3bc))
* new UID leasing, add experimental state sync between client and server ([d5c2a4d](https://github.com/ssalka/unigraph-dev/commit/d5c2a4de9afe27bf1fc6272ead6cfd0367ddf549))
* **notes:** complete daily notes feature ([83a1445](https://github.com/ssalka/unigraph-dev/commit/83a14454325a60e9bf362f7166213330af4cf87b))
* **packages:** add option to delete previous versions ([dd4a972](https://github.com/ssalka/unigraph-dev/commit/dd4a972f797ae966cb257b1cb760a3a6b31e81f5))
* prepare datatypes for contact app ([084163a](https://github.com/ssalka/unigraph-dev/commit/084163a18c9b477889057807c294c01968279d93))
* **search:** basic relevance-based search ([eb72245](https://github.com/ssalka/unigraph-dev/commit/eb72245dd5ac0e463a814c22e99e63ce38597e8a))
* **server, api:** add api for custom hibernated subscriptions ([136341c](https://github.com/ssalka/unigraph-dev/commit/136341cce7e4808109de6f9ade4f937e1cdac918))
* **server:** add hooks for all object created ([bc8848e](https://github.com/ssalka/unigraph-dev/commit/bc8848ed9c23ca6728f9d1317bcfe837b07f8cb3))
* **subscriptions:** auto hibernate subscriptions based on visibility ([4f59e0e](https://github.com/ssalka/unigraph-dev/commit/4f59e0e20c28c457b94c6a8076e4f84e9fae0443))
* **subs:** structural subscriptions & delta subscriptions ([4909235](https://github.com/ssalka/unigraph-dev/commit/49092354bf86b1235796aedd137c5b07506d2c25))
* **todo:** allow converting anything into a followup todo ([d780f65](https://github.com/ssalka/unigraph-dev/commit/d780f659b2af1dae3a900880790dce40aeb5d8e4))
* **unigraph:** make getObject available on frontend, promise not resolving correctly yet ([86af735](https://github.com/ssalka/unigraph-dev/commit/86af735fc1f385090f5f182e85ab480b94bc5d91))


### Performance Improvements

* better insert performance ([de8fdfe](https://github.com/ssalka/unigraph-dev/commit/de8fdfeae1b38d42e498392058cd446e889ba760))
* **server:** schema refresh query speedup ([c40903f](https://github.com/ssalka/unigraph-dev/commit/c40903f1d76f0d1331660e35a5e4b477e018e4e4))


### Reverts

* Revert "docs: changelogs initialized properly" ([e5b8921](https://github.com/ssalka/unigraph-dev/commit/e5b89215d19fb7478cd76898e6473544f21c773e))
