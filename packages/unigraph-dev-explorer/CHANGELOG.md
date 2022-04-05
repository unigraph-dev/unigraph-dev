# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.7...v0.3.0) (2022-04-05)


### Bug Fixes

* disable drag select temporarily because it's causing problems ([73e9b74](https://github.com/unigraph-dev/unigraph-dev/commit/73e9b74cc2d6526ee9023891bfffc87ec7f33c43))
* **dockerfile:** dependencies fix for docker ([f4a15c3](https://github.com/unigraph-dev/unigraph-dev/commit/f4a15c391a699385b1201ca959dd14dc5d856dc5))
* **editor:** allow focusing code blocks (```) ([0a7d0e0](https://github.com/unigraph-dev/unigraph-dev/commit/0a7d0e0a23c931f5e7f0dc3569d93bc042e8bbde))
* **email:** properly sync email, add option to open in gmail ([d0a4e6d](https://github.com/unigraph-dev/unigraph-dev/commit/d0a4e6deddf16b2ad82210bd8d801c12432e8a93))
* **executable:** executable preview now working ([37a8d77](https://github.com/unigraph-dev/unigraph-dev/commit/37a8d77866568ccab47c4fb4b7ac1eb6b574e77a))
* **reddit:** remove unused vote option ([42d359a](https://github.com/unigraph-dev/unigraph-dev/commit/42d359a4cd4ab44269d9014428d4c392636776be))
* remove unused inspector pane ([00618c6](https://github.com/unigraph-dev/unigraph-dev/commit/00618c602ebffc18737522948cceb71bdf88083b))
* **settings:** add definition for settings pages ([13da813](https://github.com/unigraph-dev/unigraph-dev/commit/13da813cab21064dc57f17c8d20e878497102ac6))
* **todo:** show untagged tasks, autodynamicview filter by tag with todo by default ([65c6e54](https://github.com/unigraph-dev/unigraph-dev/commit/65c6e5440f2c71200900c0ccae87c73a48a52a50))
* various ux fixes ([788c021](https://github.com/unigraph-dev/unigraph-dev/commit/788c02121a1a885f5f7a8b9b1e5465d4422ce6c0))


### Features

* **notes:** use the new, richer daily notes page ([eb96dca](https://github.com/unigraph-dev/unigraph-dev/commit/eb96dcabfe8db91313603db626387535efcba116))





## [0.2.7](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.6...v0.2.7) (2022-03-30)


### Bug Fixes

* **dynamic view:** add option to ignore backlink completely and use parents' backlinks ([d9e6da7](https://github.com/unigraph-dev/unigraph-dev/commit/d9e6da7a6b1069c84a4d82c154ff5bb50c437c3a))
* **editor:** align children text with title when bullets are hidden ([4499e27](https://github.com/unigraph-dev/unigraph-dev/commit/4499e27994005a2cde2367d58e551c511a81959d))
* **editor:** editor state mismatch fixes, increase query depth ([adc791b](https://github.com/unigraph-dev/unigraph-dev/commit/adc791b816168902a0bdef4a6ff81a63bd83ddec))
* **editor:** improve toggle stability ([01485ec](https://github.com/unigraph-dev/unigraph-dev/commit/01485ec2b9cd22962b9fafc50ffb94d1d9f785aa))
* **editor:** make scrollable view properly ([d0ee8ce](https://github.com/unigraph-dev/unigraph-dev/commit/d0ee8ce64e6df36d25a84a0882103a935e392d63))
* **editor:** make sure toggle shows at the right place ([2735e03](https://github.com/unigraph-dev/unigraph-dev/commit/2735e03bcf510e6dac821a9190c115eb6e119645))
* **editor:** outline width should be constant ([2ba9a59](https://github.com/unigraph-dev/unigraph-dev/commit/2ba9a595ce55957e48c311c01da3e02bae2cc92c))
* **editor:** prevent drop indicator overflow ([ec7c0a4](https://github.com/unigraph-dev/unigraph-dev/commit/ec7c0a4c05ffe788cd9662e4ea07e4ff7cbb1548))
* **editor:** prevent super long words overflow when not being edited ([db892bd](https://github.com/unigraph-dev/unigraph-dev/commit/db892bd06cd2913ca3d69448c225dd166e6991e9))
* **editor:** prevent toggle button go out of the tab ([9246000](https://github.com/unigraph-dev/unigraph-dev/commit/92460001fd80eed8abc71009088fd3add1d860dc))
* **editor:** remove the space bullets take when in paragraph mode ([070fd2f](https://github.com/unigraph-dev/unigraph-dev/commit/070fd2f651b91264ae59d231c14947d82dc0a910))
* **semantic:** prevent image width overflow ([4dbea60](https://github.com/unigraph-dev/unigraph-dev/commit/4dbea609a27ef9ce06001d931471f864055ddd9d))
* **semantic:** prevent numbered list overlap with outliner bullet ([e90907d](https://github.com/unigraph-dev/unigraph-dev/commit/e90907dd2b85cf879bbc5add5915b55e6ca5dfb8))
* styling, search result display ([3c54aab](https://github.com/unigraph-dev/unigraph-dev/commit/3c54aaba57280e606cc310218a0338558ee8419e))
* **unigraph:** favorites bar speedup ([2f07fa5](https://github.com/unigraph-dev/unigraph-dev/commit/2f07fa554092fd6683fa72cf5f73a4c4fd34c950))


### Features

* **calendar:** activate context menu in calendar events ([f36cadb](https://github.com/unigraph-dev/unigraph-dev/commit/f36cadbd7a8eecb05caf537333b568631d2d7325))
* **editor:** add more padding around the editor ([35bb133](https://github.com/unigraph-dev/unigraph-dev/commit/35bb1332ceb0736867477122dda3eee79c14669c))
* **editor:** improve the visual feeling of the date description ([5c13849](https://github.com/unigraph-dev/unigraph-dev/commit/5c13849e2d62a7ac230a711335bf46ed31124e82))
* **editor:** prevent children count interfere with text ([5a0b296](https://github.com/unigraph-dev/unigraph-dev/commit/5a0b2961133ccd54ffdd029cec621a5ac50785e8))
* **tabs:** limit tab width at 200px max ([afc4ca3](https://github.com/unigraph-dev/unigraph-dev/commit/afc4ca388364b32ca82eda41fc24c09b51b8f373))
* **tabs:** make close tab button larger so it's easier to click ([524b615](https://github.com/unigraph-dev/unigraph-dev/commit/524b6151067a948a6355843ee0aa83c2ff0b9584))





## [0.2.6](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.5...v0.2.6) (2022-03-19)


### Bug Fixes

* **editor:** commands with update parent ([0428dc8](https://github.com/unigraph-dev/unigraph-dev/commit/0428dc8e15edc802764d5ddceb901d84360d10c7))
* **frontend:** hide raw JSON representation by default ([4857799](https://github.com/unigraph-dev/unigraph-dev/commit/4857799b57d5c6499c6e5e67028ad4b6b479d2e7))
* **notes:** formal expand/hide option for outlining ([bd7f706](https://github.com/unigraph-dev/unigraph-dev/commit/bd7f706dd41179cacb05eb3696336899a23a5dee))
* **search:** inline search differentiate between top matches and recent updated ([93b8469](https://github.com/unigraph-dev/unigraph-dev/commit/93b8469cca6b621d53d90f1d3ef7d68384d7b906))


### Features

* **editor:** update parents' timestamps ([07bba56](https://github.com/unigraph-dev/unigraph-dev/commit/07bba560d769a3907dc0886089425a0b6a2ea8f8))
* **sync:** add framework for bi-directional sync service ([2086682](https://github.com/unigraph-dev/unigraph-dev/commit/208668241d76e98b5e545b88553d6796222beda3))
* **tabs:** names for backlink view and object view ([ab81229](https://github.com/unigraph-dev/unigraph-dev/commit/ab81229cca9c24f3b303530b533d72ba0875bebb))
* **tabs:** type name for tabs on objects without names ([b6ce5e9](https://github.com/unigraph-dev/unigraph-dev/commit/b6ce5e93cf96e23d747e338c49d3a9948a364e57))
* **todo:** hide number if 0 ([c8af818](https://github.com/unigraph-dev/unigraph-dev/commit/c8af818950b38dff2bfbf9d954951732b7e21c12))
* **todo:** made tag list in sidebar a dynamicList ([2db1f0e](https://github.com/unigraph-dev/unigraph-dev/commit/2db1f0ee9af93950fffde9b82259515b161ef6ca))





## [0.2.5](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.4...v0.2.5) (2022-03-13)


### Features

* **todo:** hide tags w 0 todos ([efc561f](https://github.com/unigraph-dev/unigraph-dev/commit/efc561fd6c99d9d7a8347f8ecc8e15f223fc3ad8))





## [0.2.4](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.3...v0.2.4) (2022-03-13)


### Bug Fixes

* editor issues, todo interop, and home screen updating ([b7571c0](https://github.com/unigraph-dev/unigraph-dev/commit/b7571c0607f4e507f29b432a6b3932b2e55c1874))
* **editor:** unindenting issues ([3cc4ede](https://github.com/unigraph-dev/unigraph-dev/commit/3cc4ede583cdc41bb460261a102e8d01840088e8))
* **packages:** don't hide hidden packages ([f3908d8](https://github.com/unigraph-dev/unigraph-dev/commit/f3908d8cdc413f78c38934929cf54c335ff250d0))
* **packages:** invert checkbox state ([b3f55d8](https://github.com/unigraph-dev/unigraph-dev/commit/b3f55d855e72a37539a25b1a33f89216649da13b))
* search bar styling enhancement, editable backlinks ([6de3006](https://github.com/unigraph-dev/unigraph-dev/commit/6de30067eb75c4f3a3c486a6600e1aa4f135fd46))
* **styling:** text field and todo list styling ([dcf8b54](https://github.com/unigraph-dev/unigraph-dev/commit/dcf8b5490ba58899647dcee0d182660c7458b24d))





## [0.2.3](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.2...v0.2.3) (2022-03-11)


### Bug Fixes

* **calendar, editor:** calendar props update, editor issues ([36113d5](https://github.com/unigraph-dev/unigraph-dev/commit/36113d586d194bb51234a69069d829e67869504e))
* change websocket port to less common port ([4c98406](https://github.com/unigraph-dev/unigraph-dev/commit/4c98406dae11819ec8a45be8acd53d2d2dd2e162))
* simplify analytics flow ([fad6bc6](https://github.com/unigraph-dev/unigraph-dev/commit/fad6bc6387f5d63a10468325cd0c57fc85498ad4))
* upgrade to es6, with suport for async functions ([169d0a9](https://github.com/unigraph-dev/unigraph-dev/commit/169d0a9cfa6aa0ba650530a99e51c12a5e9e3bb0))





## [0.2.2](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.1...v0.2.2) (2022-03-09)


### Bug Fixes

* common ui fixes ([f868ca9](https://github.com/unigraph-dev/unigraph-dev/commit/f868ca98236deb641f9bf950cd7979ba50464116))
* **packages:** package declaration now independent from unigraph versioning ([141bd18](https://github.com/unigraph-dev/unigraph-dev/commit/141bd18adb1734db6b3d0280e0bd1104feca1adf))


### Features

* **email:** support multiple email accounts ([d0de455](https://github.com/unigraph-dev/unigraph-dev/commit/d0de4558cac6f36f98c333001f30cc8640ba11ce))





## [0.2.1](https://github.com/unigraph-dev/unigraph-dev/compare/v0.2.0...v0.2.1) (2022-03-09)


### Bug Fixes

* **calendar:** reintroduce buildGraph ([327f6ca](https://github.com/unigraph-dev/unigraph-dev/commit/327f6ca1399e31c9c391e0fc7133446850cc233a))





# [0.2.0](https://github.com/unigraph-dev/unigraph-dev/compare/v0.1.0...v0.2.0) (2022-03-07)


### Bug Fixes

* **analytics:** anonymize detailed user information and calculate session length ([5a298fe](https://github.com/unigraph-dev/unigraph-dev/commit/5a298fed45f633ce3cde52c8860e643e501c6ae6))
* **api:** add option to select subscription IDs for adding objects ([7933ae9](https://github.com/unigraph-dev/unigraph-dev/commit/7933ae92bc24769b5f9c4c1d837af105b342f5d8))
* **bookmarks:** fix inbox adding, only add untagged bms to inbox ([72a5e36](https://github.com/unigraph-dev/unigraph-dev/commit/72a5e36a561eb64b2d63a10d5b4273e2ba9a67d4))
* **calendar:** temporarily disable converting date to utc ([c1f65ab](https://github.com/unigraph-dev/unigraph-dev/commit/c1f65abd7013c0f07572744889e565407a3bcb36))
* **common:** speed up buildGraph ([b03f7a0](https://github.com/unigraph-dev/unigraph-dev/commit/b03f7a08250f5f4025501ff071de141d571f8d5a))
* consistent styling and backend issues ([fd01f30](https://github.com/unigraph-dev/unigraph-dev/commit/fd01f30c684aac116cb3b8290ca962d17a567452))
* **datamodel:** buildGraph at api level ([de047d0](https://github.com/unigraph-dev/unigraph-dev/commit/de047d0988a4e872ce9000b6a90ef4931236c0d5))
* **datamodel:** findUid adapted to graph data model ([e480b39](https://github.com/unigraph-dev/unigraph-dev/commit/e480b391e402a3ea5f57f36529185df6465b63e2))
* **dnd:** drag and drop use embed block in notes too ([366eb75](https://github.com/unigraph-dev/unigraph-dev/commit/366eb75706adae685f0aec3296897463f635e77d))
* editor use onClick instead of onPointerUp, tag adding upsert fix ([b988fab](https://github.com/unigraph-dev/unigraph-dev/commit/b988fabe153117157286b583003787ecca9782c9))
* **editor:** duplicate db updates & partial todo tag creation ([ba7687a](https://github.com/unigraph-dev/unigraph-dev/commit/ba7687a65478e64d6106d9376e64a735ea27e3c5))
* **editor:** inline editor search improvements ([ce045a3](https://github.com/unigraph-dev/unigraph-dev/commit/ce045a3c9f4d03958b449772318264fffdbf0bb9))
* **editor:** more editor fixes, general responsiveness, and todo interop ([3a8b5a6](https://github.com/unigraph-dev/unigraph-dev/commit/3a8b5a67b522390356a29f9484bc1b6c92979e7f))
* **editor:** sometimes clicking on empty notes don't focus ([52b14a9](https://github.com/unigraph-dev/unigraph-dev/commit/52b14a9b7360e57cfda5d891be954611820c1c13))
* electron always quits and discern ids between windows ([65c63c1](https://github.com/unigraph-dev/unigraph-dev/commit/65c63c1176f81abfebe81a2e3aa313032aef8afb))
* **frontend:** various elements shouldn't jump to editor on click ([9c379d4](https://github.com/unigraph-dev/unigraph-dev/commit/9c379d43d01db78b29b85c4fadc132b89f4f7673))
* list display & linked reference display ([2243668](https://github.com/unigraph-dev/unigraph-dev/commit/2243668afd637ef3694e52de063ae551e1931a3c))
* **notes:** stub query position issue ([25864ff](https://github.com/unigraph-dev/unigraph-dev/commit/25864ffbc716f26cba35513f8aca09f555b7179d))
* **search:** speedup query, search result balancing relevance and recency ([8cd0855](https://github.com/unigraph-dev/unigraph-dev/commit/8cd0855a8d660b3048b21e9de7ac849bda81c9de))
* styling app drawer, electron fixes ([811d55a](https://github.com/unigraph-dev/unigraph-dev/commit/811d55a04823920c8d53a1ee9df2f8ad43fe6419))
* **subscription:** use buildGraph for all subscriptions, prepare for subgraph ([6890aa6](https://github.com/unigraph-dev/unigraph-dev/commit/6890aa604b68d15a04b6108ef975647f693ead4d))
* **todos:** bugs with tags and filtering ([ca139aa](https://github.com/unigraph-dev/unigraph-dev/commit/ca139aadbfb97267d775939fb7933e4e376b3fa4))
* **todo:** style fixes ([80611fd](https://github.com/unigraph-dev/unigraph-dev/commit/80611fd308b30838f8936c82b2b1b63884af82ba))
* **todo:** tag regex matching ([996d8f2](https://github.com/unigraph-dev/unigraph-dev/commit/996d8f2c27a4db92421fa2ff222e70ef190da8ae))


### Features

* **backend:** auto group and batch subscriptions ([8336cf6](https://github.com/unigraph-dev/unigraph-dev/commit/8336cf6c127d8f086f669c21dde095fd5c643c3b))
* **editor:** add item to todo on mobile ([bb0ca69](https://github.com/unigraph-dev/unigraph-dev/commit/bb0ca697418487a1ec77ca14a0b0df9d40b6ab54))
* properly build subgraph, prepare for subgraph sync ([ea99f85](https://github.com/unigraph-dev/unigraph-dev/commit/ea99f85282f6b72d8403e17998b52c80a042338e))
* **semantic:** add generic entity renaming with all references ([da91571](https://github.com/unigraph-dev/unigraph-dev/commit/da915716e0a952dcc914987d950c8c6483e7e265))
* **today-todos:** implemented ([c6fb3fe](https://github.com/unigraph-dev/unigraph-dev/commit/c6fb3fe7d4ee841a1e36ff6af260e66d37fa8dc3))
* **todo:** archived tags, tag subgrouping, count queries ([edb9e47](https://github.com/unigraph-dev/unigraph-dev/commit/edb9e47a5c09b9581cbda85ace3b4ddbaec59dd8))
* **todos:** tags in alphabetical order ([cf5fce0](https://github.com/unigraph-dev/unigraph-dev/commit/cf5fce034051fd4b5d0b4338d8ced92fa2cf5e10))
* **upcoming-todos:** implemented, bit messy code ([b02770c](https://github.com/unigraph-dev/unigraph-dev/commit/b02770c73c2b6249c5ed2dfc06000fa245c2c785))


### Performance Improvements

* **notes:** don't get contents on linked reference, speedup queries ([6e4be48](https://github.com/unigraph-dev/unigraph-dev/commit/6e4be48ffac28c85d87c6564b3ec876c5c815da4))





# [0.1.0](https://github.com/unigraph-dev/unigraph-dev/compare/v0.1.10...v0.1.0) (2022-02-21)


### Bug Fixes

* **accounts:** fix broken account connector query ([2738d6d](https://github.com/unigraph-dev/unigraph-dev/commit/2738d6d4c6db1623a1e809846f5861648fd5a557))
* add focus management for dynamic view detailed as well ([1ab4203](https://github.com/unigraph-dev/unigraph-dev/commit/1ab42035e263f834e0841c0001fa13b2daa91424))
* **analytics:** add explicit, unique analytics ([6f6649d](https://github.com/unigraph-dev/unigraph-dev/commit/6f6649d8945de3886cd61e541a28cc9de14b21f9))
* **api:** better findUid ([78a0ec7](https://github.com/unigraph-dev/unigraph-dev/commit/78a0ec7d5b0b3d0cb0fcda14c2921912a41a3fb2))
* **backlink & libary:** more efficient queries ([01903e7](https://github.com/unigraph-dev/unigraph-dev/commit/01903e77f7323c0cabced9e3ad72b2305bd4fb15))
* **backlinks:** handles null uids when temporary switching between updates ([ebbb8d7](https://github.com/unigraph-dev/unigraph-dev/commit/ebbb8d7800c29fdf2ea41ebb38d160b454487d71))
* **backlinks:** use context uids to determine visibility ([b21953e](https://github.com/unigraph-dev/unigraph-dev/commit/b21953e4ff74f3bc13d05099ef3cf8a3e5231a6a))
* bad merge ([fbeb718](https://github.com/unigraph-dev/unigraph-dev/commit/fbeb718b50e092088a3d84852765a7dda46a6c82))
* **bookmark, list:** better list and bookmark handling ([eb91c56](https://github.com/unigraph-dev/unigraph-dev/commit/eb91c5659c9f64efe9b987dbfc3e5b0e7f2bf80b))
* **bookmarks:** bookmarks list not scrolling ([8ff2946](https://github.com/unigraph-dev/unigraph-dev/commit/8ff294631e0f8b971bd2453e9451e867f0d58ba1))
* **calendar:** fullscreen calendar & better inline displays ([f61aa50](https://github.com/unigraph-dev/unigraph-dev/commit/f61aa508ca712353c076e635c5a63db07eed66fb))
* **calendar:** next events showing ordered and grouped ([26f0c6d](https://github.com/unigraph-dev/unigraph-dev/commit/26f0c6d7c2967d66210dc6be94f15c2da03e72a4))
* **calendar:** query for year rather than month (not final, get a better solution ([bb012e9](https://github.com/unigraph-dev/unigraph-dev/commit/bb012e97aef32221c1bccd6e15138ad1d87509e1))
* **calendar:** querying by displayed range ([73f87d6](https://github.com/unigraph-dev/unigraph-dev/commit/73f87d66c11673d80b95c8dd1a842ca6e4dc1d18))
* **calendar:** recurrent events don't break anymore, still slow ([531b0d2](https://github.com/unigraph-dev/unigraph-dev/commit/531b0d2ef396af9ca8f8d4eb6f6af555063055d4))
* **calendar:** show recurrent events ([92e876d](https://github.com/unigraph-dev/unigraph-dev/commit/92e876d9974c593e141d87853a3d94a5cee8fd36))
* **calendar:** styling fixes for inline components with calendar ([9ea09d5](https://github.com/unigraph-dev/unigraph-dev/commit/9ea09d542ebf4943953c1b2b16c9e00c09fb7a9e))
* **calendar:** todo bounds, event component refactor, calendar items scaled down ([17163ce](https://github.com/unigraph-dev/unigraph-dev/commit/17163ce7046c35553c0a336f3ffcd18e6d381e2d))
* **calendar:** utc date in calendar view ([6f28f26](https://github.com/unigraph-dev/unigraph-dev/commit/6f28f26b21552127bc98944a140b86d8a429b215))
* **code editor:** import style enhancements ([85cf5a8](https://github.com/unigraph-dev/unigraph-dev/commit/85cf5a85ed90bab59b8b18b1b241f51ab006e56f))
* **code editor:** update version & imports ([42e4aa2](https://github.com/unigraph-dev/unigraph-dev/commit/42e4aa24d9ee5171876d3496d779b5eb87d1772a))
* copy/paste references in embed blocks ([f0ff9b6](https://github.com/unigraph-dev/unigraph-dev/commit/f0ff9b633f0282348425fb909a3f5d768a54b86d))
* dailynotes timezone and scrollbar aesthetics ([c87113b](https://github.com/unigraph-dev/unigraph-dev/commit/c87113bede3c50f90e9ef91c4d6c126066b57881))
* **data:** data context with better backlink display ([0da3c62](https://github.com/unigraph-dev/unigraph-dev/commit/0da3c6264be33c62e7346e4ff91e9fb48d976685))
* delete array issues and note editor states ([2edfecd](https://github.com/unigraph-dev/unigraph-dev/commit/2edfecd498467b31e86777da7336cbc2379a32eb))
* **dnd:** drag and drop cleanup ([01777c0](https://github.com/unigraph-dev/unigraph-dev/commit/01777c0cc0e3da00e3ee6b2f4c2000a01ad10650))
* dynamic view backlinks ([c32f7b4](https://github.com/unigraph-dev/unigraph-dev/commit/c32f7b48436d82e983a5a3f7f58122e077481611))
* **dynamicview:** delta updates for infinite scrolling should keep existing ([d448a9c](https://github.com/unigraph-dev/unigraph-dev/commit/d448a9c0d23f9f7b5784230587fada1f512912f5))
* **editor, api:** uid leases, shift+arrow select, ctx menu while editing ([53ba34f](https://github.com/unigraph-dev/unigraph-dev/commit/53ba34f17f883c02495dc88cd3000fee022dc191))
* **editor, misc:** editor experience fixes & remove unused shell ([031efe3](https://github.com/unigraph-dev/unigraph-dev/commit/031efe3435914a03f1af6305d1e5bdd7406fef49))
* **editor:** allow embed items to display backlinks ([c8403a2](https://github.com/unigraph-dev/unigraph-dev/commit/c8403a2b61b6495da6772c92f60c01e1b8a90a54))
* **editor:** autosize and preserve editor ([dedbdf0](https://github.com/unigraph-dev/unigraph-dev/commit/dedbdf02f15a91f8df4ac3a7f10947ae94e7e34a))
* **editor:** block transclusion and editor ux enhancement ([9525065](https://github.com/unigraph-dev/unigraph-dev/commit/95250654e6035afdf1f640a05b05aff283d89987))
* **editor:** bulk action sorting order ([6ab3289](https://github.com/unigraph-dev/unigraph-dev/commit/6ab328979b0b9eabe8e3066835ab8126ab3b1156))
* **editor:** copy & paste backlinks fix ([148c086](https://github.com/unigraph-dev/unigraph-dev/commit/148c086999b975f7c1e4a3d41a334ea07ee8c49b))
* **editor:** dfs node fetch object fixes ([8abb47d](https://github.com/unigraph-dev/unigraph-dev/commit/8abb47dbd3829c8da496caed92e9a0bbc2119c3c))
* **editor:** editing todo inline can't create backlinks for references ([808965a](https://github.com/unigraph-dev/unigraph-dev/commit/808965a2d82b7f8688c3c1488ba258cc1daeb688))
* **editor:** embed_block related issues and inline popup ([116f802](https://github.com/unigraph-dev/unigraph-dev/commit/116f802b920a086a674b3426c2388b4e044bbd9a))
* **editor:** fix scoped chars ([78a41b9](https://github.com/unigraph-dev/unigraph-dev/commit/78a41b96dc69f91dcb64f00d4b09489dda6b49ff))
* **editor:** more efficient add text below ([3c87eba](https://github.com/unigraph-dev/unigraph-dev/commit/3c87eba721c13b01a5eb386bbee9bfb8af457e93))
* **editor:** move caret to end after creating todo object ([bee72d5](https://github.com/unigraph-dev/unigraph-dev/commit/bee72d5e6c01b792f9f463293da08220c37c508d))
* **editor:** possible missing parent ([b0446cf](https://github.com/unigraph-dev/unigraph-dev/commit/b0446cfd89ccca2b860efe619aff8f6ec0daa9ab))
* **editor:** properly dispose of temp new focus data ([556fbff](https://github.com/unigraph-dev/unigraph-dev/commit/556fbff742b48e825eb5f379e37e33dc53130474))
* **editor:** react state dependencies, style, and oninput behavior ([764f6f8](https://github.com/unigraph-dev/unigraph-dev/commit/764f6f8b91c9b91bf0a968f9df55fb59c53ba26f))
* **editor:** recalculate backlinks on unindent ([5ea160a](https://github.com/unigraph-dev/unigraph-dev/commit/5ea160a15357246683f98fed8ee2adaf37b4f248))
* **editor:** regressive issues fixed ([d0ecd6d](https://github.com/unigraph-dev/unigraph-dev/commit/d0ecd6da4c19c8f8cc78b9bf665046a0b0314afc))
* **editor:** undo set correct focus, fix recalculate backlink issues ([20653be](https://github.com/unigraph-dev/unigraph-dev/commit/20653be49ebe529fec1db6e8f290216dcce24087))
* **editor:** ux fixes ([f58d6c9](https://github.com/unigraph-dev/unigraph-dev/commit/f58d6c91e1144bc54e60b28d1b7ddeacfa1335f6))
* **electron, rss:** styling and rss fixes ([8311405](https://github.com/unigraph-dev/unigraph-dev/commit/831140540cf1b48c539c6d8b2e4f500a39376f1f))
* email inbox and todo list bugfix ([7f41fd2](https://github.com/unigraph-dev/unigraph-dev/commit/7f41fd29efdf30002eba06ef3f3ee362381af839))
* **email:** gmail inbox sync should work now ([9d22bcc](https://github.com/unigraph-dev/unigraph-dev/commit/9d22bcc4534bf1b28f9db9ec431229399e9c78d9))
* **email:** option for removing from inbox on read ([c0db1e9](https://github.com/unigraph-dev/unigraph-dev/commit/c0db1e935b77fd06030174412a0e9edb087af9da))
* **email:** renamed email settings to Mirror Email Inbox ([1232d19](https://github.com/unigraph-dev/unigraph-dev/commit/1232d19ed849c77ab518cbe598ae7de0a68046c3))
* **executable:** live updates for executables ([37bdc75](https://github.com/unigraph-dev/unigraph-dev/commit/37bdc75aaa268fb5c4b80ab7d28a5057ce97bca3))
* **executables:** don't send context menu callbacks to backend ([895c8bb](https://github.com/unigraph-dev/unigraph-dev/commit/895c8bb01fb0f847a90e712c8e9545f14abeddaa))
* **explorer:** ux issues ([70b39c3](https://github.com/unigraph-dev/unigraph-dev/commit/70b39c37c2827647b723842c294ebc4ca45bc785))
* **feed:** rss items shouldn't open new tab ([f225809](https://github.com/unigraph-dev/unigraph-dev/commit/f225809fc033160cbfe29433147c16bd47e122c5))
* fix todo creation and immediately update, and editor delete permanently if no references ([a0da8ff](https://github.com/unigraph-dev/unigraph-dev/commit/a0da8ff9b61cdb17f61b29dc0c74ac6f7552c1ad))
* **focus:** focus with global state ([6ddcf8f](https://github.com/unigraph-dev/unigraph-dev/commit/6ddcf8f248077bb945748e650a6557adaf5e2502))
* **frontend:** autodynamicview object updates ([dadf05f](https://github.com/unigraph-dev/unigraph-dev/commit/dadf05f2b6a17559b42b7708df8af039fc3515c4))
* **frontend:** hide hidden entities from trash ([340aa43](https://github.com/unigraph-dev/unigraph-dev/commit/340aa43c5e5acd12aa462c0b111745871e77492c))
* **frontend:** infinite scrolling list fix & speedup ([bcb568d](https://github.com/unigraph-dev/unigraph-dev/commit/bcb568d493fa077edcb1ef6d28977892baa26b20))
* **frontend:** make backlink indicator faster and more accurate ([a5b3d04](https://github.com/unigraph-dev/unigraph-dev/commit/a5b3d0406990c435d67fefadbe4a3fb026bda614))
* **frontend:** multiselect with alt-click ([425317f](https://github.com/unigraph-dev/unigraph-dev/commit/425317fd0af6efb9a5f6ee5927a0784a92cc2b8e))
* **frontend:** navigating within iframe in external browser ([8e307f8](https://github.com/unigraph-dev/unigraph-dev/commit/8e307f8246e55909ef93a3600bb567d518431b53))
* **frontend:** note display error and workspace isvisible fix ([3ba52b0](https://github.com/unigraph-dev/unigraph-dev/commit/3ba52b0527e4b8cd284ff0502b1525eea85ba6dd))
* **frontend:** omnibar error fix ([f778046](https://github.com/unigraph-dev/unigraph-dev/commit/f77804600961bcc587e756c1c294f89dde3a4ed9))
* **frontend:** package manager use unigraph objects ([ffd9df2](https://github.com/unigraph-dev/unigraph-dev/commit/ffd9df23d7cdb16d433f3312ceaae494cb6a1d12))
* **frontend:** styling issues related to multi select ([96d34e5](https://github.com/unigraph-dev/unigraph-dev/commit/96d34e5b6cadc15b1ac47477b4dd84317ab2088f))
* **frontend:** various frontend ux fixes ([dcf1ebd](https://github.com/unigraph-dev/unigraph-dev/commit/dcf1ebd8f51dbc23bc6d9d1b56b2327483c497bb))
* gmail update fixes and ux fixes ([858b93a](https://github.com/unigraph-dev/unigraph-dev/commit/858b93a137d4272f860914828543bf0271885741))
* handles inbetweeness of stub and full object display ([34599e0](https://github.com/unigraph-dev/unigraph-dev/commit/34599e0df4cf52ef1c2a04323cf1e94355c305b3))
* **hover:** correct pointer ([f53e13f](https://github.com/unigraph-dev/unigraph-dev/commit/f53e13f3c88b9338e8092997627fa64149ac7463))
* html in markdown ([58fec6f](https://github.com/unigraph-dev/unigraph-dev/commit/58fec6f6b4dd31ba548a0939aa34dc4ab85b715f))
* **inbox:** removeOnEnter: false ([ea83c9e](https://github.com/unigraph-dev/unigraph-dev/commit/ea83c9ebd8f0a3cd06660dc95087db5f7145ea2f))
* left/right arrow working & collapsed entities hint ([99990fb](https://github.com/unigraph-dev/unigraph-dev/commit/99990fb4add70c0ca2e712e6e3b315d2b7f13963))
* **lists:** adding new items at correct position in open lists ([e098f5b](https://github.com/unigraph-dev/unigraph-dev/commit/e098f5bfe9909419d6ca0d870920ecad5300a1f9))
* markdown rendering diff and delete stale refs ([e40dac3](https://github.com/unigraph-dev/unigraph-dev/commit/e40dac33eb882be0e9a1c7de4c97a6494e2b5b8a))
* **markdown:** can open URL now ([06c701f](https://github.com/unigraph-dev/unigraph-dev/commit/06c701f9ad445dd90b02b02d34250601cabc27a5))
* **markdown:** editable markdown components set correct caret ([b6f1cd8](https://github.com/unigraph-dev/unigraph-dev/commit/b6f1cd8236a81d39d94014240b1d74f5fde64e6b))
* **mui:** alias old mui versions temporarily until executable updates are available ([509c91d](https://github.com/unigraph-dev/unigraph-dev/commit/509c91dabb8ce2ae9308aa1494bcc5478837084d))
* **multiselect:** behavior changes for multiselect ([26aabe2](https://github.com/unigraph-dev/unigraph-dev/commit/26aabe287556178569559f97b265e3a95bd0e28e))
* **multiselect:** better heuristic to determine selection ([4459c44](https://github.com/unigraph-dev/unigraph-dev/commit/4459c4435540b5649bd2d601d2cb99ae4d01f81d))
* **multiselect:** cancel select when dragging objects ([4953c9b](https://github.com/unigraph-dev/unigraph-dev/commit/4953c9bfcbae801baae004ecf073366783f5d332))
* **multiselect:** multiselect throttling ([2c115a8](https://github.com/unigraph-dev/unigraph-dev/commit/2c115a86ad499944d81c87ef9f078b4e1d343d6e))
* **multiselect:** respect existing text selection ([0945709](https://github.com/unigraph-dev/unigraph-dev/commit/09457090e8b9f171e95b5621e372d149340231aa))
* **navigation:** tag navigation issues ([83094cf](https://github.com/unigraph-dev/unigraph-dev/commit/83094cf55c3cfe6d8c0632e2b373574977551d27))
* **note editor:** firefox cursor position bug ([b6f9af3](https://github.com/unigraph-dev/unigraph-dev/commit/b6f9af35c468dbc4f6f5e256f557d952c42aed3c))
* **notes, todo:** todo checking too slow, various interop issues ([874d0b7](https://github.com/unigraph-dev/unigraph-dev/commit/874d0b736a959c65a4fe650e2633343ee6bd8204))
* **notes:** addChild indexes ([cb06543](https://github.com/unigraph-dev/unigraph-dev/commit/cb06543bdf45a022731f371f19d12dac02db42cb))
* **notes:** argument fixes for focu ([24b2963](https://github.com/unigraph-dev/unigraph-dev/commit/24b29631c1d0be498eddfbea74a573f260ec5616))
* **notes:** auto search works, caret position with mouse clicks is off but fixed soon ([1e30108](https://github.com/unigraph-dev/unigraph-dev/commit/1e301081233d41aad5425ce308264f7214411481))
* **notes:** caret positioning on markdown click ([0ebd94e](https://github.com/unigraph-dev/unigraph-dev/commit/0ebd94ebdcbfa93c0ebd5b9a02677572ad8de64a))
* **notes:** check for references after autocomplete ([59a24f0](https://github.com/unigraph-dev/unigraph-dev/commit/59a24f04ad44b550db1e2aa4e05e621b8d7beec7))
* **notes:** click to create block should autofocus ([cae8055](https://github.com/unigraph-dev/unigraph-dev/commit/cae80552bdc6098e971178fc62292f709017ec17))
* **notes:** close scope characters only next to whitespace ([3cdfad1](https://github.com/unigraph-dev/unigraph-dev/commit/3cdfad195f50ac2b493f7a8c9b60e32359748ba2))
* **notes:** copy pasting and block hopping ([6afae80](https://github.com/unigraph-dev/unigraph-dev/commit/6afae805176563d93bbb2dc23b7e3c3ebdd6ce17))
* **notes:** correct componentId and don't show duplicate ([db77d21](https://github.com/unigraph-dev/unigraph-dev/commit/db77d21b920cc291da1e47d406a63e6a0e848cfb))
* **notes:** delete items should work ([6730a30](https://github.com/unigraph-dev/unigraph-dev/commit/6730a30395cce4f16f7d5212774dbebb4310003d))
* **notes:** editor add children correct focus ([902f726](https://github.com/unigraph-dev/unigraph-dev/commit/902f72691ab104f4cf0091401a0d94662a9a4ad0))
* **notes:** fix note block recursing ([224acb9](https://github.com/unigraph-dev/unigraph-dev/commit/224acb904bfa3615b8170547a97024b276741406))
* **notes:** fix viewId issues in custom views ([4cc989b](https://github.com/unigraph-dev/unigraph-dev/commit/4cc989bd805807356adb98530efe4b0e979f6700))
* **notes:** focus state set as global ([32b74fc](https://github.com/unigraph-dev/unigraph-dev/commit/32b74fc9dcdb2430779209a867d7c566b4849bba))
* **notes:** insert text should work now ([af80277](https://github.com/unigraph-dev/unigraph-dev/commit/af80277b30e1247eff528fd99c9449e64f996da0))
* **notes:** notes editor left/right arrow keys ([a264b1b](https://github.com/unigraph-dev/unigraph-dev/commit/a264b1bf8bb78be841ee52a5aec1b80656abfb37))
* **notes:** outdentation disappearance bug ([a0695c4](https://github.com/unigraph-dev/unigraph-dev/commit/a0695c4a1260ddc2778cbde5fb90dc1d6337aecf))
* **notes:** paste cursor location and inline img ([a090d74](https://github.com/unigraph-dev/unigraph-dev/commit/a090d743a39df736a62714d1556f89b69c8df9b9))
* **notes:** properly set caret pos ([16568b8](https://github.com/unigraph-dev/unigraph-dev/commit/16568b8490986ad734f61adebcf44e82746a0960))
* **notes:** search for hidden blocks as well ([d638086](https://github.com/unigraph-dev/unigraph-dev/commit/d638086adb9d59e0615a7443fdd06a6fbafa411a))
* **notes:** ui/ux improvements for caret and editing, and fix pasting ([2b31889](https://github.com/unigraph-dev/unigraph-dev/commit/2b31889177c00eb8dfc7c5732ac6a3d6269bb393))
* **notes:** unindent index position error ([0540548](https://github.com/unigraph-dev/unigraph-dev/commit/0540548b12f6bbbf287503d80069898ea13b452d))
* **notes:** up/down arrow should only change block if at top/bottom row ([a8d652c](https://github.com/unigraph-dev/unigraph-dev/commit/a8d652cd41ed3dcd7dbfd53a41fba672668a8c4a))
* **object view:** always allow same defn of object with inline mode ([3761e4f](https://github.com/unigraph-dev/unigraph-dev/commit/3761e4f54582e2c91bf98d523b14aa63ee9292f7))
* **object view:** error prompt enable context menu as well ([05176a3](https://github.com/unigraph-dev/unigraph-dev/commit/05176a3350ae1bbaad884e02d0d0685decef44b0))
* **object view:** load specific components after registry ([6b235db](https://github.com/unigraph-dev/unigraph-dev/commit/6b235dbd4288b666bfaa3f077617a874bb047bd3))
* **omnibar:** add item show dashed border ([dc0c66e](https://github.com/unigraph-dev/unigraph-dev/commit/dc0c66ef9ddca203f2d89eaa04f307138092c70d))
* **omnibar:** auto hide search popup ([9ae7e73](https://github.com/unigraph-dev/unigraph-dev/commit/9ae7e73b3d3894a914803700b69fc64b2fca648c))
* **omnibar:** disable click through for preview ([c1887ea](https://github.com/unigraph-dev/unigraph-dev/commit/c1887ea03bb765ff8c8fd78fc721dae45554a2e5))
* **omnibar:** omnibar with callbacks behave as expected ([c128ee4](https://github.com/unigraph-dev/unigraph-dev/commit/c128ee41dc54be7d9b6f10606697d7c7aa31f541))
* prettier formatting for frontend ([3b9592c](https://github.com/unigraph-dev/unigraph-dev/commit/3b9592c1b4e0a1348714b5f86e9d591562db6f19))
* **rss:** rss reader subscription and relative update time ([f53edba](https://github.com/unigraph-dev/unigraph-dev/commit/f53edba0e21902a37ddd790af9b744cdaff18b4a))
* **search overlay:** only show nontrivial entities ([f781800](https://github.com/unigraph-dev/unigraph-dev/commit/f7818002bc7c5fb25b32445e92ad7643fad7c4ab))
* **search popup:** mobile search wasn't working ([f10e365](https://github.com/unigraph-dev/unigraph-dev/commit/f10e365e95cf3b7091f00c708d2f3fe725f57933))
* **search:** inline tag creation returns correct uid ([b244168](https://github.com/unigraph-dev/unigraph-dev/commit/b244168da328590db291aeeadf319f8f8a486ee9))
* **search:** showHidden now works ([fba5963](https://github.com/unigraph-dev/unigraph-dev/commit/fba5963866b3ced2c8267be3a93b140a45433815))
* **search:** speed up queries ([d7e2ad8](https://github.com/unigraph-dev/unigraph-dev/commit/d7e2ad8034809960330582c335e8ce1e86bfde8f))
* **states:** optimize selected state ([e01850f](https://github.com/unigraph-dev/unigraph-dev/commit/e01850f7295ade7b20fc0debe0196e75b0435142))
* **style:** outliner bar color be light gray ([bc05a9b](https://github.com/unigraph-dev/unigraph-dev/commit/bc05a9b28baab57916f7082b9d4195d281590689))
* sub error and disable notification on mobile ([08b30ee](https://github.com/unigraph-dev/unigraph-dev/commit/08b30ee9fd844a8184f81f20dab86277937f1ac9))
* **subscriptions:** better subscriptions on revival ([577dc3b](https://github.com/unigraph-dev/unigraph-dev/commit/577dc3ba6872a4f115f06a22bbf23d6e327839a3))
* **subscriptions:** stale data when getobject updated ([9814ae5](https://github.com/unigraph-dev/unigraph-dev/commit/9814ae59aa899e734e0d97b9f45b7a5b8f541263))
* **todo, autodynamicview:** not inserting and object flickering ([f79257b](https://github.com/unigraph-dev/unigraph-dev/commit/f79257b3e20628bf9e367ca76c53f01d7e46d54e))
* **todo, editor:** Various `embed_block` and todo interop fixes ([c4a6bed](https://github.com/unigraph-dev/unigraph-dev/commit/c4a6bed525f160e0d80bed0c17b4328db59a8874))
* **todo:** always use the latest text ([e0d54e8](https://github.com/unigraph-dev/unigraph-dev/commit/e0d54e8e70bd1334507c692e4b37463230da275a))
* **todo:** checkbox still visible when editing ([c862004](https://github.com/unigraph-dev/unigraph-dev/commit/c862004b01136e4596b0f6d086dcf8a9f51fc512))
* **todo:** indent shows undefined briefly ([9040691](https://github.com/unigraph-dev/unigraph-dev/commit/904069129dfee941e3fb3aa184a44567ed749e46))
* **todo:** inline references update todo object as well ([6328563](https://github.com/unigraph-dev/unigraph-dev/commit/632856367d515f50bad77677d4ce25249d4eaff2))
* **todo:** more efficient todo query ([2532edb](https://github.com/unigraph-dev/unigraph-dev/commit/2532edbc0b875916bcb62c7cb33506902c0ca905))
* **todo:** not having focus on creation ([809b109](https://github.com/unigraph-dev/unigraph-dev/commit/809b1090c33bad10499fb9c8b66f8e5d39863f9a))
* **todo:** use correct update date for inline tags ([12c7e8d](https://github.com/unigraph-dev/unigraph-dev/commit/12c7e8d7131544de7c4fe5d66e6ae9d48a7619c8))
* ui and ux updates ([eb9ca88](https://github.com/unigraph-dev/unigraph-dev/commit/eb9ca8887ec61d9d2d097dc9cfd759a5847cb9f1))
* **ui:** minor ui hiccups ([56b1d56](https://github.com/unigraph-dev/unigraph-dev/commit/56b1d56113fe34b30897eda29d221528d89019dd))
* uncomment styles in utils ([0fe7c1d](https://github.com/unigraph-dev/unigraph-dev/commit/0fe7c1d1a39ed6a208c273c2e17a58c962f8c5fd))
* **ux/ui:** some ux/ui fixes ([36e4f08](https://github.com/unigraph-dev/unigraph-dev/commit/36e4f08a8eaad6f81352e086b99636cdce65bd99))
* **ux:** linking behavior update & tab styling ([ca15317](https://github.com/unigraph-dev/unigraph-dev/commit/ca15317c7d36259e1708a4b30c2533849bda5c64))
* **ux:** revert selection css ([e95a2ed](https://github.com/unigraph-dev/unigraph-dev/commit/e95a2ed651a506383dd8cbfa995fe65924485f17))
* **ux:** some more ux fixes ([e144cb4](https://github.com/unigraph-dev/unigraph-dev/commit/e144cb4b56387fe122b89247b92ab816bb2bc447))
* **ux:** ux editor fixes ([5a57f7f](https://github.com/unigraph-dev/unigraph-dev/commit/5a57f7f35c71c159bb9b6d3c881979933eb0d78a))
* **ux:** ux polishing & stray bug fixing ([ea7a487](https://github.com/unigraph-dev/unigraph-dev/commit/ea7a487bf6da469045f0265c848f807e94931193))
* **ux:** various ux and usability fixes ([5bfe822](https://github.com/unigraph-dev/unigraph-dev/commit/5bfe82223030037df4ff2d6bcfdd5959b28978b7))
* **ux:** various ux fixes ([0007ed0](https://github.com/unigraph-dev/unigraph-dev/commit/0007ed060b0bb1c96d81c5b55965b9aec3ef31ed))
* various fixes for note editor on mobile ([1723430](https://github.com/unigraph-dev/unigraph-dev/commit/1723430fa908bf3f400388a044edf734607fb27b))
* **view renderer:** unify detailed view rendering ([#271](https://github.com/unigraph-dev/unigraph-dev/issues/271)) ([84c6056](https://github.com/unigraph-dev/unigraph-dev/commit/84c6056cf13dd30e69a5fbafaa97aeec17df3a28))
* **workspace:** maximize option for detailed object view ([7a52f86](https://github.com/unigraph-dev/unigraph-dev/commit/7a52f866dc3431f0e8e0a610f480b8ae62aa5f52))


### Features

* **adder:** add quick adder ([4b708c5](https://github.com/unigraph-dev/unigraph-dev/commit/4b708c5561a0dbba3eee92aa931b3fb9f1885d4c))
* better backlinks display ([4603182](https://github.com/unigraph-dev/unigraph-dev/commit/460318271e48209b59290a5d9ec23c9d76faf2f5))
* **calendar:** linear calendar view, includes journals ([bec54b8](https://github.com/unigraph-dev/unigraph-dev/commit/bec54b87641b1bf203f9b7d4c63f0226159c7db6))
* **calendar:** react-big-calendar ([dc100ca](https://github.com/unigraph-dev/unigraph-dev/commit/dc100caa25560aab55e63f1bf75efe97908c1f80))
* **code editor:** group executables by package ([30f3880](https://github.com/unigraph-dev/unigraph-dev/commit/30f38806e91075799f317207dbab8c22df96cbf4))
* **codeEditor:** add runner for fast debug iterations ([9297eca](https://github.com/unigraph-dev/unigraph-dev/commit/9297ecaf65c40931308ae4245476dbf1f4cd9074))
* **contacts:** add person as contact in context menu ([513c095](https://github.com/unigraph-dev/unigraph-dev/commit/513c095dad27aeaac06f7c5c0737c14e2ccf4e27))
* **contacts:** add social media profile to contact ([4536c5f](https://github.com/unigraph-dev/unigraph-dev/commit/4536c5fdec6ae450dc649bb089032f06ef38d3f7))
* **contacts:** detailed contacts view ([0ef017b](https://github.com/unigraph-dev/unigraph-dev/commit/0ef017b46452cb52fc3dd11c40dfba32c590bd84))
* **contacts:** initial contact book & automation support ([067efd5](https://github.com/unigraph-dev/unigraph-dev/commit/067efd5dd6826974c6f179621eb23be6fdbece24))
* **data:** remove duplicate items with same key via upsert ([3f21e18](https://github.com/unigraph-dev/unigraph-dev/commit/3f21e18f9a3d8645cb071dbebdc94e9c34517065))
* **dev:** add current subscriptions view for debug ([35f09fa](https://github.com/unigraph-dev/unigraph-dev/commit/35f09fa1eb2ab8a1272266198b47168180d5a287))
* **dynamicViews:** view-specific dynamic view options ([db17b32](https://github.com/unigraph-dev/unigraph-dev/commit/db17b3257448ce55299b5c559fe6755051917693))
* **editor:** allow bulk unindentation ([979c5fb](https://github.com/unigraph-dev/unigraph-dev/commit/979c5fb6519638fc4d7087567bd0fc235460bdb6))
* **editor:** auto add todo tags based on parent tags ([5e573aa](https://github.com/unigraph-dev/unigraph-dev/commit/5e573aa979a1d9b80db00ce80806a91a4ef2c405))
* **editor:** basic undo/redo support for editor ([f01e8ea](https://github.com/unigraph-dev/unigraph-dev/commit/f01e8eaaa697b5681989c10940eadd6971345519))
* **editor:** better caret management ([203f6b4](https://github.com/unigraph-dev/unigraph-dev/commit/203f6b46627dfe5941e33f4eb8be6fc10928bdc4))
* **editor:** copy/cut/paste with references support ([391ee58](https://github.com/unigraph-dev/unigraph-dev/commit/391ee5869b1f716bf7ff5c0740450b62b859dd6f))
* **editor:** edit todo list items inline ([608e485](https://github.com/unigraph-dev/unigraph-dev/commit/608e485519c832b7a6062304c3a5aaeb637a79d2))
* **editor:** fully support annotation and nested subentity ([b829c49](https://github.com/unigraph-dev/unigraph-dev/commit/b829c494ab371fe71036d0cc842b20f44bcdf8c7))
* **editor:** rich copy, images, multiline copy ([0dd567e](https://github.com/unigraph-dev/unigraph-dev/commit/0dd567e84cadf61f22427bd21da3aa607bc45900))
* **editor:** switching between outliner and paragraph editing ([fa5d254](https://github.com/unigraph-dev/unigraph-dev/commit/fa5d254f13a8b5f5feafdb90ebd0f3d4b7f3deba))
* **editor:** undo/redo cache locally for performance ([9014bd1](https://github.com/unigraph-dev/unigraph-dev/commit/9014bd125896b0eb32da47fe1ddf7cf1f989bf1f))
* **editor:** undo/redo for indentations ([5d52c8b](https://github.com/unigraph-dev/unigraph-dev/commit/5d52c8b1505897e40614a9895e2ad46aad0a97d6))
* **editor:** undo/redo support ([4386bf7](https://github.com/unigraph-dev/unigraph-dev/commit/4386bf7987efe855fb5254e01270713618fb447d))
* **email, contacts:** profile image display ([cd7640e](https://github.com/unigraph-dev/unigraph-dev/commit/cd7640e56f497f9622e98c4547c3c0c4b25cdfb3))
* **email:** gmail read status sync ([7505ade](https://github.com/unigraph-dev/unigraph-dev/commit/7505adee3a68d99d39d8b4715fe89241dcacf7a9))
* **email:** sync and push to gmail inbox (read, archive) ([33d55b0](https://github.com/unigraph-dev/unigraph-dev/commit/33d55b0ea490a3d22c1be720d7aaa3d8e5e04ecb))
* **explorer, common:** restructure repo for 3rd-party integrations ([60ee044](https://github.com/unigraph-dev/unigraph-dev/commit/60ee0440e104163a280a6bbf6ecafeaf74f30945))
* **feeds:** created a Feeds list entity and redirected feeds from inbox to it ([68a5de4](https://github.com/unigraph-dev/unigraph-dev/commit/68a5de4bb576f6a0159ace256f3527f63fd73410))
* **frontend:** add block-level backlink indicator ([2b009c8](https://github.com/unigraph-dev/unigraph-dev/commit/2b009c8d40e4c189c1a1fe9e4f4032463e19a3bc))
* **frontend:** add experimental global shortcut actions ([43af28b](https://github.com/unigraph-dev/unigraph-dev/commit/43af28bafa8eee049fdad74eb1c34a663cdc9c23))
* **frontend:** add option to specify components in lists ([d8d7683](https://github.com/unigraph-dev/unigraph-dev/commit/d8d7683fedf65c5c8c697eeb214b40337de0f1f5))
* **frontend:** add options to embed bidirectional links in todo/elsewhere ([7024d8c](https://github.com/unigraph-dev/unigraph-dev/commit/7024d8cee2a8be926425a14e86a5dcf64f19ebc1))
* **frontend:** subentity support ([2c0ebb1](https://github.com/unigraph-dev/unigraph-dev/commit/2c0ebb1ec88cffd9b74d6c1ddbca28aa2b458c34))
* **frontend:** trash view update & better infinite scroll ([dbf50e8](https://github.com/unigraph-dev/unigraph-dev/commit/dbf50e8515c5b898c733fe3edd8d41f2a3f06237))
* global drag to select support ([b122ac6](https://github.com/unigraph-dev/unigraph-dev/commit/b122ac6649e3cdba557ac0722e7a7ed9423fceb7))
* **inbox:** add favicon to inbox ([973b3f3](https://github.com/unigraph-dev/unigraph-dev/commit/973b3f372f6b7fabc699e2d3a478376287916c09))
* **inbox:** add notes, todos, bookmarks created from overlay to inbox ([18c078a](https://github.com/unigraph-dev/unigraph-dev/commit/18c078a3b6bf075d706f7239361461345098e6f1))
* **inbox:** most recent first ([2ea52f5](https://github.com/unigraph-dev/unigraph-dev/commit/2ea52f574bc523f28cbc6d4448e69a957ffb0c59))
* **journal:** inline journal view ([97ad9f7](https://github.com/unigraph-dev/unigraph-dev/commit/97ad9f7327386a0fa2ece56f030d6aadfe57c000))
* **multiselect:** add parent inclusion check ([1f2b0e4](https://github.com/unigraph-dev/unigraph-dev/commit/1f2b0e42f6fc38f4793fcfe67cda3711ce7ebfc3))
* new UID leasing, add experimental state sync between client and server ([d5c2a4d](https://github.com/unigraph-dev/unigraph-dev/commit/d5c2a4de9afe27bf1fc6272ead6cfd0367ddf549))
* **note:** refactor keyCode to key, auto close quote marks ([0f3014c](https://github.com/unigraph-dev/unigraph-dev/commit/0f3014c6d14ab22ac32e75fcf89bb1288c8c5d79))
* **notes:** allow attaching notes everywhere ([6a05099](https://github.com/unigraph-dev/unigraph-dev/commit/6a0509927d171b9d6cdd898c5485271f7db210d2))
* **notes:** complete daily notes feature ([83a1445](https://github.com/unigraph-dev/unigraph-dev/commit/83a14454325a60e9bf362f7166213330af4cf87b))
* **notes:** ctrl+k for markdown links ([4021156](https://github.com/unigraph-dev/unigraph-dev/commit/4021156114ad95f08291e9e1f91341edadd39bff))
* **notes:** editor shows last updated ([54c26ff](https://github.com/unigraph-dev/unigraph-dev/commit/54c26ff869707097a6b4f8342cccf25759dd1376))
* **notes:** handle newlines, replaced textContent w/ innerText ([ce28cce](https://github.com/unigraph-dev/unigraph-dev/commit/ce28cce180b9f7eecbbde4f41c12b4e796ae9d3f))
* **notes:** paste url into selection notion-style ([4680373](https://github.com/unigraph-dev/unigraph-dev/commit/46803736ef37610924a5c41d6e4bc8f419380272))
* **notes:** setCurrentText now updates db ([dea1502](https://github.com/unigraph-dev/unigraph-dev/commit/dea1502d10103fb60e6f58faaa456517e1563221))
* **notes:** use state sync for indent/outdent as well ([c30141c](https://github.com/unigraph-dev/unigraph-dev/commit/c30141c2207af37123d1ff9945c177019781a573))
* **object view:** add compact view options ([64a4ceb](https://github.com/unigraph-dev/unigraph-dev/commit/64a4ceb19d346dbfa0d371aa43db11eb82ab6587))
* **omnibar:** auto command registration, keyboard navigation ([868fc04](https://github.com/unigraph-dev/unigraph-dev/commit/868fc049637d4e4d617d1cc793f9b514f5ec8c7a))
* **packages:** enabling/disabling packages ([6a1ccdf](https://github.com/unigraph-dev/unigraph-dev/commit/6a1ccdf91bd2a5575330452a59a4ddc4e81307dd))
* prepare datatypes for contact app ([084163a](https://github.com/unigraph-dev/unigraph-dev/commit/084163a18c9b477889057807c294c01968279d93))
* **search:** basic relevance-based search ([eb72245](https://github.com/unigraph-dev/unigraph-dev/commit/eb72245dd5ac0e463a814c22e99e63ce38597e8a))
* **subscriptions:** auto hibernate subscriptions based on visibility ([4f59e0e](https://github.com/unigraph-dev/unigraph-dev/commit/4f59e0e20c28c457b94c6a8076e4f84e9fae0443))
* **subs:** structural subscriptions & delta subscriptions ([4909235](https://github.com/unigraph-dev/unigraph-dev/commit/49092354bf86b1235796aedd137c5b07506d2c25))
* **todo, editor:** initial `embed_block` support and editor todo integration ([7474b7c](https://github.com/unigraph-dev/unigraph-dev/commit/7474b7c39f21dcb2a316489ee46eb4039fb38fee))
* **todo:** allow converting anything into a followup todo ([d780f65](https://github.com/unigraph-dev/unigraph-dev/commit/d780f659b2af1dae3a900880790dce40aeb5d8e4))
* **todo:** editing todo objects inline now updates tags, etc ([3e7a7de](https://github.com/unigraph-dev/unigraph-dev/commit/3e7a7defa84f4bccbb1b606338b3ea1cb66b2a9c))
* **todo:** smaller todo list items when is embed ([e20d652](https://github.com/unigraph-dev/unigraph-dev/commit/e20d65230fcceac285d985b996d0d63458ea6408))


### Performance Improvements

* **autodynamicview:** faster adv ([e30d673](https://github.com/unigraph-dev/unigraph-dev/commit/e30d673ceeeb25525c11669f988d28af80e5443e))
* **editor:** don't use unpad, use dataref ([ea2a717](https://github.com/unigraph-dev/unigraph-dev/commit/ea2a717a4e4dd4b3c599f2b0c17a3e6011650c0a))
* **frontend:** memonize context and component with same results ([14f2fa8](https://github.com/unigraph-dev/unigraph-dev/commit/14f2fa8d1f3452c91fd644b79bd7774dff456480))
* **frontend:** optimize performance a bit ([9f1ce9b](https://github.com/unigraph-dev/unigraph-dev/commit/9f1ce9b350be4cfcea7e0077ce2bcbe8869a1424))
* **frontend:** use memonized values for subscription and drag & drop ([6a8b1aa](https://github.com/unigraph-dev/unigraph-dev/commit/6a8b1aa6bbe283acfd8a2b3955a1afa2c0858dbb))
* **susbcription:** object stub performance fix ([019c3a5](https://github.com/unigraph-dev/unigraph-dev/commit/019c3a589d0cbee5c73e9faea16176cd51945cfc))


### Reverts

* Revert "docs: changelogs initialized properly" ([e5b8921](https://github.com/unigraph-dev/unigraph-dev/commit/e5b89215d19fb7478cd76898e6473544f21c773e))
