# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.6](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.5...v0.2.6) (2022-03-19)


### Features

* **api:** http json api, docs ([efda92d](https://github.com/unigraph-dev/unigraph-dev/commit/efda92dcd97ab387585be61525b5558f750afbfe))
* better error display with datamodels ([5f2b22c](https://github.com/unigraph-dev/unigraph-dev/commit/5f2b22c911f806e2de6a9f79eee990ff913d3f4d))
* **sync:** add framework for bi-directional sync service ([2086682](https://github.com/unigraph-dev/unigraph-dev/commit/208668241d76e98b5e545b88553d6796222beda3))





## [0.2.5](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.4...v0.2.5) (2022-03-13)

**Note:** Version bump only for package unigraph-dev-common





## [0.2.4](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.3...v0.2.4) (2022-03-13)

**Note:** Version bump only for package unigraph-dev-common





## [0.2.3](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.2...v0.2.3) (2022-03-11)

**Note:** Version bump only for package unigraph-dev-common





## [0.2.2](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.1...v0.2.2) (2022-03-09)


### Bug Fixes

* **backend:** import/export objects now use proper format ([5db704e](https://github.com/unigraph-dev/unigraph-dev/commit/5db704e876fe639739106bd628cd6b57864c0be4))
* common ui fixes ([f868ca9](https://github.com/unigraph-dev/unigraph-dev/commit/f868ca98236deb641f9bf950cd7979ba50464116))
* **packages:** package declaration now independent from unigraph versioning ([141bd18](https://github.com/unigraph-dev/unigraph-dev/commit/141bd18adb1734db6b3d0280e0bd1104feca1adf))





## [0.2.1](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.0...v0.2.1) (2022-03-09)

**Note:** Version bump only for package unigraph-dev-common





# [0.2.0](https://github.com/unigraph-dev/unigraph-dev/compare/v0.1.0...v0.2.0) (2022-03-07)


### Bug Fixes

* **api:** add option to select subscription IDs for adding objects ([7933ae9](https://github.com/unigraph-dev/unigraph-dev/commit/7933ae92bc24769b5f9c4c1d837af105b342f5d8))
* **api:** race condition in uid lease that breaks editor ([e0a27d0](https://github.com/unigraph-dev/unigraph-dev/commit/e0a27d0c22108ce00da4224b03af0cdd2470750f))
* **common:** speed up buildGraph ([b03f7a0](https://github.com/unigraph-dev/unigraph-dev/commit/b03f7a08250f5f4025501ff071de141d571f8d5a))
* **datamodel:** buildGraph at api level ([de047d0](https://github.com/unigraph-dev/unigraph-dev/commit/de047d0988a4e872ce9000b6a90ef4931236c0d5))
* **datamodel:** buildGraph speedup & reliability ([9338fce](https://github.com/unigraph-dev/unigraph-dev/commit/9338fcec23e8e888ee5e2013fa7ebb692de18b46))
* **datamodel:** buildGraph use only reference, merge uids ([23caffb](https://github.com/unigraph-dev/unigraph-dev/commit/23caffbea31e1c336b91f0187e0cb4b2db4f2c53))
* **datamodel:** correctly set array indexes with user specified ([55fbda6](https://github.com/unigraph-dev/unigraph-dev/commit/55fbda6206fd7d967f0cf12f6a69adad790d9f68))
* **datamodel:** findUid adapted to graph data model ([e480b39](https://github.com/unigraph-dev/unigraph-dev/commit/e480b391e402a3ea5f57f36529185df6465b63e2))
* **editor:** more editor fixes, general responsiveness, and todo interop ([3a8b5a6](https://github.com/unigraph-dev/unigraph-dev/commit/3a8b5a67b522390356a29f9484bc1b6c92979e7f))
* **subscriptions:** client side buildGraph speedup ([5a3a41e](https://github.com/unigraph-dev/unigraph-dev/commit/5a3a41ebcded3747b931863ab5b62ef6d0cb3cf4))
* **subscription:** use buildGraph for all subscriptions, prepare for subgraph ([6890aa6](https://github.com/unigraph-dev/unigraph-dev/commit/6890aa604b68d15a04b6108ef975647f693ead4d))


### Features

* **backend:** auto update when new version is found ([a4b89b5](https://github.com/unigraph-dev/unigraph-dev/commit/a4b89b5441f71de250320fc7e42f697569b34838))
* properly build subgraph, prepare for subgraph sync ([ea99f85](https://github.com/unigraph-dev/unigraph-dev/commit/ea99f85282f6b72d8403e17998b52c80a042338e))
* **semantic:** add generic entity renaming with all references ([da91571](https://github.com/unigraph-dev/unigraph-dev/commit/da915716e0a952dcc914987d950c8c6483e7e265))


### Performance Improvements

* tidy up subscription on client side ([8d2de57](https://github.com/unigraph-dev/unigraph-dev/commit/8d2de5727a81cd0d7715100200a5d2b982cf7d57))





# [0.1.0](https://github.com/unigraph-dev/unigraph-dev/compare/v0.1.10...v0.1.0) (2022-02-21)


### Bug Fixes

* **api:** add ability to couple update event with fakeupdate ([a847ae9](https://github.com/unigraph-dev/unigraph-dev/commit/a847ae9220453a5ed5316224811e24f9a86558bd))
* **api:** better findUid ([78a0ec7](https://github.com/unigraph-dev/unigraph-dev/commit/78a0ec7d5b0b3d0cb0fcda14c2921912a41a3fb2))
* **api:** client-side state sync should merge all references if multiple available ([40a86f6](https://github.com/unigraph-dev/unigraph-dev/commit/40a86f6f853a343e127c703b38d6f1a9afc3e825))
* **api:** enhanced client state manage ([987a0e1](https://github.com/unigraph-dev/unigraph-dev/commit/987a0e164a3385f478db94ac5df33e522e30380a))
* **api:** race condition of uid assignment resulting in recursive elements ([0ddf223](https://github.com/unigraph-dev/unigraph-dev/commit/0ddf2230ac012fe6aeb5ccc9632cd53080a862a9))
* **api:** remove cyclic structure for old results ([b35b5dd](https://github.com/unigraph-dev/unigraph-dev/commit/b35b5dd7950ed4ba021c971ace5c141bf3cd4539))
* **datamodel:** allow linked objects within upsert queries ([c47e0d3](https://github.com/unigraph-dev/unigraph-dev/commit/c47e0d3863c059e2e3fddd3d00cce19fcea53761))
* **editor, api:** uid leases, shift+arrow select, ctx menu while editing ([53ba34f](https://github.com/unigraph-dev/unigraph-dev/commit/53ba34f17f883c02495dc88cd3000fee022dc191))
* **lib:** recursive check for buildGraph ([85a6da8](https://github.com/unigraph-dev/unigraph-dev/commit/85a6da8740959839468f1372768ca6349d3de8d0))
* merger and uid leasing fixes ([b61100e](https://github.com/unigraph-dev/unigraph-dev/commit/b61100ed74bc32ee6844073c4bb050a9a4abe975))
* **notes:** addChild indexes ([cb06543](https://github.com/unigraph-dev/unigraph-dev/commit/cb06543bdf45a022731f371f19d12dac02db42cb))
* **server, kanban:** increased executable performance ([b4f0731](https://github.com/unigraph-dev/unigraph-dev/commit/b4f0731dca1d94a6c909506b208f5ede47f86684))
* **server:** update triplet support designating uids ([20055a5](https://github.com/unigraph-dev/unigraph-dev/commit/20055a5e6ea48045782dbb5f926223ac0608da7f))
* **subscriptions:** better subscriptions on revival ([577dc3b](https://github.com/unigraph-dev/unigraph-dev/commit/577dc3ba6872a4f115f06a22bbf23d6e327839a3))
* ui and ux updates ([eb9ca88](https://github.com/unigraph-dev/unigraph-dev/commit/eb9ca8887ec61d9d2d097dc9cfd759a5847cb9f1))
* **ui:** minor ui hiccups ([56b1d56](https://github.com/unigraph-dev/unigraph-dev/commit/56b1d56113fe34b30897eda29d221528d89019dd))


### Features

* **api:** add method to bulk update last edited metadata ([62cbb0c](https://github.com/unigraph-dev/unigraph-dev/commit/62cbb0c6db9e69c984bb41ea201cc9ce19af972c))
* **api:** add methods to manage backlinks more efficiently ([ce69913](https://github.com/unigraph-dev/unigraph-dev/commit/ce69913a6090c9bd739820ad255ae36afe2cb1c3))
* **api:** add option to send full object on fake update ([079662c](https://github.com/unigraph-dev/unigraph-dev/commit/079662c0b76bfcc2524a25bc04c39f484edd770a))
* **api:** add optional common variables in query ([2edfe5a](https://github.com/unigraph-dev/unigraph-dev/commit/2edfe5a584567ba44e8938e83ba6826dd07d8e87))
* **api:** allow manually leasing UIDs ([1966366](https://github.com/unigraph-dev/unigraph-dev/commit/19663669ca30272acfce37bfcc25d4dd2746e14d))
* **api:** getObject available in frontend ([f3d5f74](https://github.com/unigraph-dev/unigraph-dev/commit/f3d5f74e223ed3e948e05d4e3253fdcb07a52a75))
* **api:** send fake updates for everything ([a7027c5](https://github.com/unigraph-dev/unigraph-dev/commit/a7027c51aee8ad2b8fd0aed1234a53cee1058824))
* **backend:** add debug mode for function execution with console log redirects ([0abd4b6](https://github.com/unigraph-dev/unigraph-dev/commit/0abd4b65e3a0689c91bb6423c0a5d51e0d51fe46))
* better backlinks display ([4603182](https://github.com/unigraph-dev/unigraph-dev/commit/460318271e48209b59290a5d9ec23c9d76faf2f5))
* **contacts:** add person as contact in context menu ([513c095](https://github.com/unigraph-dev/unigraph-dev/commit/513c095dad27aeaac06f7c5c0737c14e2ccf4e27))
* **data:** remove duplicate items with same key via upsert ([3f21e18](https://github.com/unigraph-dev/unigraph-dev/commit/3f21e18f9a3d8645cb071dbebdc94e9c34517065))
* **dev:** add current subscriptions view for debug ([35f09fa](https://github.com/unigraph-dev/unigraph-dev/commit/35f09fa1eb2ab8a1272266198b47168180d5a287))
* **editor:** basic undo/redo support for editor ([f01e8ea](https://github.com/unigraph-dev/unigraph-dev/commit/f01e8eaaa697b5681989c10940eadd6971345519))
* **explorer, common:** restructure repo for 3rd-party integrations ([60ee044](https://github.com/unigraph-dev/unigraph-dev/commit/60ee0440e104163a280a6bbf6ecafeaf74f30945))
* **frontend:** add experimental global shortcut actions ([43af28b](https://github.com/unigraph-dev/unigraph-dev/commit/43af28bafa8eee049fdad74eb1c34a663cdc9c23))
* functional state changes ([6478c63](https://github.com/unigraph-dev/unigraph-dev/commit/6478c634dee4202dca489d5e691ad4762f0455fe))
* new UID leasing, add experimental state sync between client and server ([d5c2a4d](https://github.com/unigraph-dev/unigraph-dev/commit/d5c2a4de9afe27bf1fc6272ead6cfd0367ddf549))
* **notes:** use state sync for indent/outdent as well ([c30141c](https://github.com/unigraph-dev/unigraph-dev/commit/c30141c2207af37123d1ff9945c177019781a573))
* **packages:** enabling/disabling packages ([6a1ccdf](https://github.com/unigraph-dev/unigraph-dev/commit/6a1ccdf91bd2a5575330452a59a4ddc4e81307dd))
* **server, api:** add api for custom hibernated subscriptions ([136341c](https://github.com/unigraph-dev/unigraph-dev/commit/136341cce7e4808109de6f9ade4f937e1cdac918))
* **subscriptions:** auto hibernate subscriptions based on visibility ([4f59e0e](https://github.com/unigraph-dev/unigraph-dev/commit/4f59e0e20c28c457b94c6a8076e4f84e9fae0443))
* **subs:** structural subscriptions & delta subscriptions ([4909235](https://github.com/unigraph-dev/unigraph-dev/commit/49092354bf86b1235796aedd137c5b07506d2c25))
* **unigraph:** make getObject available on frontend, promise not resolving correctly yet ([86af735](https://github.com/unigraph-dev/unigraph-dev/commit/86af735fc1f385090f5f182e85ab480b94bc5d91))


### Performance Improvements

* augmentstubs perf ([b6d76a1](https://github.com/unigraph-dev/unigraph-dev/commit/b6d76a1b42f81dc68af6ed131aca24dd06c5fe17))
* better insert performance ([de8fdfe](https://github.com/unigraph-dev/unigraph-dev/commit/de8fdfeae1b38d42e498392058cd446e889ba760))


### Reverts

* Revert "docs: changelogs initialized properly" ([e5b8921](https://github.com/unigraph-dev/unigraph-dev/commit/e5b89215d19fb7478cd76898e6473544f21c773e))
