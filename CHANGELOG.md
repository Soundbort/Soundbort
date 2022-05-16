# Changelog

## [0.8.0](https://github.com/LonelessCodes/SoundBort/compare/v0.7.1...v0.8.0) (2022-05-16)


### Features

* add attachment option for /upload command(s) ([#31](https://github.com/LonelessCodes/SoundBort/issues/31)) ([276a74b](https://github.com/LonelessCodes/SoundBort/commit/276a74b3fb977d6ba06870ed36952b0e2d69aaa6))
* change permission model to Permissions V2 (merges [#30](https://github.com/LonelessCodes/SoundBort/issues/30)) ([101b229](https://github.com/LonelessCodes/SoundBort/commit/101b229a2f4c666d278bfdf5e5e55276c4ac5bba))
* retry deploying commands to guilds that couldn't be deployed to ([ba35d79](https://github.com/LonelessCodes/SoundBort/commit/ba35d7953c386093cd40b6ad7f81520244cba203))


### Bug Fixes

* fixed /owner upload type-checking ([8502947](https://github.com/LonelessCodes/SoundBort/commit/850294769285978922c919d0f51f355658a52198))
* fixed error when there are more than 25 choices for auto-completion ([7c548f3](https://github.com/LonelessCodes/SoundBort/commit/7c548f374565663db379a31e49bbb1035da34059))
* fixed typo in InteractionLoader.ts ([7ff0fba](https://github.com/LonelessCodes/SoundBort/commit/7ff0fba87ff83dc3433f2d36eeed91bc8be93b64))
* fixed uncaught error when destroying VoiceConnection when not able to join voice channel ([926ec51](https://github.com/LonelessCodes/SoundBort/commit/926ec512ed7e24a0d7591e143adff8fcd5787667))
* fixed visualize audio log formatting ([cc5e93a](https://github.com/LonelessCodes/SoundBort/commit/cc5e93a78d6b853f3775855b82e821bc1b01c8f7))
* fixed wrongly formatted audio bitrate during upload ([10faa37](https://github.com/LonelessCodes/SoundBort/commit/10faa37fcc48f648cb5ee008735a45370f444acf))
* more or less fixed logging of circular json ([2bd2b56](https://github.com/LonelessCodes/SoundBort/commit/2bd2b56fbc0c47622b7b9590e1de5a8d3c202011))
* patch discord.js to expose raw interaction data on interaction object ([31bd9bf](https://github.com/LonelessCodes/SoundBort/commit/31bd9bfbcff8b7d5722f373a649a256239f6f136))
* replace github url in banner ([a20db4a](https://github.com/LonelessCodes/SoundBort/commit/a20db4a7553714804ebeb7e3b0e402773d6402d3))


### Changes

* delete "playing sample" message after a few seconds ([5fd8eeb](https://github.com/LonelessCodes/SoundBort/commit/5fd8eebbaa47114231d965a1422c89e40fd4f764))
* increase max file size to 8 MB ([e7a32a7](https://github.com/LonelessCodes/SoundBort/commit/e7a32a7a99a20cb5cfa08be587e42d4e5c0595e4))
* use ffmpeg to create sample waveform ([44e5358](https://github.com/LonelessCodes/SoundBort/commit/44e53587e86bfe7021c6d4256916d5b653013362))

### [0.7.1](https://github.com/LonelessCodes/SoundBort/compare/v0.7.0...v0.7.1) (2022-03-02)


### Maintenance release

Lots of updated dependencies.

### Bug Fixes

* add gzip to Dockerfile for log querying ([8f618a8](https://github.com/LonelessCodes/SoundBort/commit/8f618a819ad49154a4f40330a94f29b09cd460ce))

## [0.7.0](https://github.com/LonelessCodes/SoundBort/compare/v0.6.3...v0.7.0) (2021-11-20)


### Features

* add audio waveform to sample info embeds ([775748e](https://github.com/LonelessCodes/SoundBort/commit/775748ee3d5ff26936d087649ff8358ff3af34a6))


### Bug Fixes

* disable gzipping logs so cli tool works ([16c6cb0](https://github.com/LonelessCodes/SoundBort/commit/16c6cb06c6263fe4cbf090eb2a3ab26bdc83e834))
* revert more of the failed attempt at esm ([3f126ca](https://github.com/LonelessCodes/SoundBort/commit/3f126caee4c4088d40323ae4f48813f223b0ceb4))


### Changes

* change play button color to blue bc it looks better ([f2d443b](https://github.com/LonelessCodes/SoundBort/commit/f2d443b4dc6d60fd1798e4d15bbb532ba47fe65c))

### [0.6.3](https://github.com/LonelessCodes/SoundBort/compare/v0.6.2...v0.6.3) (2021-11-14)


### Bug Fixes

* fixed "emit" of undefined for wrong "this" in VotesManager.webhookListener ([d6d7e2f](https://github.com/LonelessCodes/SoundBort/commit/d6d7e2fb5833ff48743264a7eb459ef8e36baf5c))

### [0.6.2](https://github.com/LonelessCodes/SoundBort/compare/v0.6.1...v0.6.2) (2021-11-07)


### Bug Fixes

* return to commonjs, because @discordjs/voice doesn't support esm at all ([65e3065](https://github.com/LonelessCodes/SoundBort/commit/65e3065fdaf1f38a01809f1d92f12f2b0df86a04))

### [0.6.1](https://github.com/LonelessCodes/SoundBort/compare/v0.6.0...v0.6.1) (2021-11-07)


### Bug Fixes

* fixed ESM import problem of topgg-autoposter ([e5df081](https://github.com/LonelessCodes/SoundBort/commit/e5df0813edf9d0969bf2020f5445236477bd26e6))

## [0.6.0](https://github.com/LonelessCodes/SoundBort/compare/v0.5.0...v0.6.0) (2021-11-07)


### Features

* add basic cli tool to query logs and adjust log.ts ([b5499a4](https://github.com/LonelessCodes/SoundBort/commit/b5499a4412462adc00274b812fe4d7973aaffee1))
* add DatabaseCache.updateMany() and other improvements ([60e69e1](https://github.com/LonelessCodes/SoundBort/commit/60e69e1969b25e7f31ad5cef8c321323f12cf1b5))
* automatically delete server associated data 14 days after being kicked from a server ([76ebb37](https://github.com/LonelessCodes/SoundBort/commit/76ebb373e555283be99b636ae2f9fdb2433732ed))


### Bug Fixes

* **Dockerfile:** fixed /bin permissions ([abd4497](https://github.com/LonelessCodes/SoundBort/commit/abd4497ac02dc45c35f364c75ee74970fdd15f8f))
* fix imports ([0491466](https://github.com/LonelessCodes/SoundBort/commit/0491466c2a35d9cd0bf6d8b2a1c6bc6118cb9265))

## [0.5.0](https://github.com/LonelessCodes/SoundBort/compare/v0.4.3...v0.5.0) (2021-11-02)


### Features

* add autocomplete (woooo! yeah!) ([65acda8](https://github.com/LonelessCodes/SoundBort/commit/65acda8bc692702a5413cdde81a02413e60e8a2e))


### Bug Fixes

* **dialog:** don't freak out over expected "time" error from awaitMessageComponent() ([cbe0a5c](https://github.com/LonelessCodes/SoundBort/commit/cbe0a5c475ab1b9aed0676072e747df718a734cf))
* fixed docker healthcheck ([ca8c3d3](https://github.com/LonelessCodes/SoundBort/commit/ca8c3d3817a4576b52f218b8b3e80994ffaa2598))


### Changes

* change /delete behaviour (preparation for autocomplete) ([e3a4f0f](https://github.com/LonelessCodes/SoundBort/commit/e3a4f0fc73d4c358012d3966279b28151ef08563))
* remove "from" option from /info command ([36cb95c](https://github.com/LonelessCodes/SoundBort/commit/36cb95c5b5a781b83e11ab82c9d4db9f9152de11))

### [0.4.3](https://github.com/LonelessCodes/SoundBort/compare/v0.4.2...v0.4.3) (2021-10-29)


### Bug Fixes

* privacy improvements during upload ([b7c8b94](https://github.com/LonelessCodes/SoundBort/commit/b7c8b944353cbbb55a4027076b2516573d4c889f))


### Changes

* add link to privacy page in /getting-started ([afbcb7d](https://github.com/LonelessCodes/SoundBort/commit/afbcb7d02ebfc3e76631f9f7cef6c63bbaedfdd0))
* logging ([d7c887e](https://github.com/LonelessCodes/SoundBort/commit/d7c887e2676ccc7e100e60c5319bcf12a79168e2))
* stop logging user tags ([0a26100](https://github.com/LonelessCodes/SoundBort/commit/0a26100805653d7c3c7c843e0226fe01f7cd53e9))
* stop storing file names of attachments ([7b8bee5](https://github.com/LonelessCodes/SoundBort/commit/7b8bee5541f55f7065cb8f92b1d0724a341bfc0a))

### [0.4.2](https://github.com/LonelessCodes/SoundBort/compare/v0.4.1...v0.4.2) (2021-09-29)


### Bug Fixes

* fixed missing libpixman in Docker image ([48d1079](https://github.com/LonelessCodes/SoundBort/commit/48d107926ed53250a5f98f71abe42c4855a3e334))
* uploading fixed by reverting earlier commit ([0db8f65](https://github.com/LonelessCodes/SoundBort/commit/0db8f650300a41331e892faaa3bb7b6fb695840f))

### [0.4.1](https://github.com/LonelessCodes/SoundBort/compare/v0.4.0...v0.4.1) (2021-09-28)


### Bug Fixes

* emergency fixed failing to log in when one server doesn't have app.commands permissions ([7dd4bdf](https://github.com/LonelessCodes/SoundBort/commit/7dd4bdf1d34c9b62bcab770aad928d6370eca035))
* fixed logging levels ([6312ce7](https://github.com/LonelessCodes/SoundBort/commit/6312ce7854eb8591efe1c2df9f11fa7df0acd4e0))


### Changes

* build sodium instead of using libsodium-wrappers ([9a86f08](https://github.com/LonelessCodes/SoundBort/commit/9a86f08eaef3957016c877a6a833962483fcb395))
* use ffmpeg-static package instead of host system installation to address [#1](https://github.com/LonelessCodes/SoundBort/issues/1) ([986f9b5](https://github.com/LonelessCodes/SoundBort/commit/986f9b5fcc2679f8888386e93a5f553eed0e981b))


### Improvements

* add graceful reboots/shutdowns ([1adcf93](https://github.com/LonelessCodes/SoundBort/commit/1adcf93cca866602a2574d512890efe40d144932))
* disable caching for unused stuff ([afe150a](https://github.com/LonelessCodes/SoundBort/commit/afe150af407c9eb584b112ec8f8405e4cd7679f6))
* produce smaller docker container ([dfdd530](https://github.com/LonelessCodes/SoundBort/commit/dfdd5307b759a33827a86b1396b58149a43dbda2))

## [0.4.0](https://github.com/LonelessCodes/SoundBort/compare/v0.3.0...v0.4.0) (2021-08-27)


### Features

* improved caching of samples, guild configs and blacklisted users ([341be4b](https://github.com/LonelessCodes/SoundBort/commit/341be4b89cf1334e6f360e8d178e36cab5eb0e17)), closes [#5](https://github.com/LonelessCodes/SoundBort/issues/5)
* **metrics command:** add option to specify time window ([e9b9442](https://github.com/LonelessCodes/SoundBort/commit/e9b9442f789dea2a08456b769bcb150e783b3d47))
* Upvote the bot to get more sample slots. /vote command ([af71a31](https://github.com/LonelessCodes/SoundBort/commit/af71a31ac6001fb867a5580128c91d8d6d6a79de)), closes [#6](https://github.com/LonelessCodes/SoundBort/issues/6)


### Bug Fixes

* differenciate between custom and standard sample buttons in statistics ([0d4eeae](https://github.com/LonelessCodes/SoundBort/commit/0d4eeaec9af2ff373a764271d78c8d30b5700152))
* revert emergency fix from 'stable' 7dd4bdf1d34c9b62bcab770aad928d6370eca035 ([ec222db](https://github.com/LonelessCodes/SoundBort/commit/ec222dbc1ab84e3866841465836d9d4c14b69b22))
* trim inputs from string options. ([9f366ec](https://github.com/LonelessCodes/SoundBort/commit/9f366ec616f7700a03c3d8afa1d94698e42cbd70))


### Changes

* add another time window to TimeWindowTable ([05f06e7](https://github.com/LonelessCodes/SoundBort/commit/05f06e76101c8a48cdd7c19bff39ecea156e59c1))
* make /metrics command global ([69cf26a](https://github.com/LonelessCodes/SoundBort/commit/69cf26abe2320cb620d3bbb4dc93ce636246b4f8))
* make /vote command global ([ee51d70](https://github.com/LonelessCodes/SoundBort/commit/ee51d7046623b75d5cd2f1873e00db5bfa03b335))
* move worker-portal.js to be more universal ([db30c96](https://github.com/LonelessCodes/SoundBort/commit/db30c9660810e18c8565c79b8b862bb6daad8f49))

## [0.3.0](https://github.com/LonelessCodes/SoundBort/compare/v0.2.1...v0.3.0) (2021-08-16)


### Features

* add metrics/stats command baseline ([da52a69](https://github.com/LonelessCodes/SoundBort/commit/da52a69400f837fd4204d0dd8efac8efdc0bbeb3))
* **lineGraph:** add displayable labels to each dataset ([6739078](https://github.com/LonelessCodes/SoundBort/commit/673907868d2572798139f10f9044e93ceb6e5009))


### Bug Fixes

* **Command.ts:** fixed error when replying to deffered interaction ([e31cea7](https://github.com/LonelessCodes/SoundBort/commit/e31cea7e01b3380498c7be46e50ab9a26970a9ab))
* fixed x axies time intervals ([435ccc3](https://github.com/LonelessCodes/SoundBort/commit/435ccc324b9a85dc6fe1c4573e6b1f873a59f868))
* **lineGraph:** fixed infinite loop ([a192b02](https://github.com/LonelessCodes/SoundBort/commit/a192b0251e885c051434dee683e7cec413ba2ba1))
* **metrics command:** defer reply ([8de06f4](https://github.com/LonelessCodes/SoundBort/commit/8de06f4c9a07c6683befb63c4e2735bb525bba12))


### Improvements

* get /metrics command into shape ([82663f6](https://github.com/LonelessCodes/SoundBort/commit/82663f6dc3ec29f3639d6b7fbe29340405b95cce))
* show command and button uses in /metrics command ([7e88d4a](https://github.com/LonelessCodes/SoundBort/commit/7e88d4ae7ca5650a4d5880bb38e28edb8926f2e7))


### Changes

* added "buttons" fields to all db documents without one, so remove optional flag ([7faf1b9](https://github.com/LonelessCodes/SoundBort/commit/7faf1b91ce2bd37a244fa8e2f9ce942e926c26b8))
* show command and button interactions in graph instead of played samples, because it makes more sense in context ([5f24794](https://github.com/LonelessCodes/SoundBort/commit/5f247943cd9dc5175b3fd2dda4f60269a0883371))

### [0.2.1](https://github.com/LonelessCodes/SoundBort/compare/v0.2.0...v0.2.1) (2021-08-14)


### Bug Fixes

* fixed wrong repo url in /getting-started command ([23192fe](https://github.com/LonelessCodes/SoundBort/commit/23192fec818b7eabb68c5dcccba274bb9f5b7596))


### Improvements

* better error logging? ([2ef0fe4](https://github.com/LonelessCodes/SoundBort/commit/2ef0fe40419dc46e1a0ec416e5d4210a8456ff76))

## [0.2.0](https://github.com/LonelessCodes/SoundBort/compare/v0.1.1...v0.2.0) (2021-08-14)


### Features

* add button to remove sample from soundboard ([c0e7dbd](https://github.com/LonelessCodes/SoundBort/commit/c0e7dbd3afe3b7fbc25865a7fbb43f0c196d9b8d))
* import other user's or server's sound samples ([2103d4f](https://github.com/LonelessCodes/SoundBort/commit/2103d4fa48e007939a639430f5c9d5e6a6cf6c45))
* **list command:** add option to output only standard soundbort ([bc7b314](https://github.com/LonelessCodes/SoundBort/commit/bc7b3147cda70afa2eb29c265756e737184b3518))
* now also include button presses in statistics ([0554ee9](https://github.com/LonelessCodes/SoundBort/commit/0554ee92064fc3fb2052c07cb79ede7021046b0d))
* show dialog when clicking delete button ([2fb0a9f](https://github.com/LonelessCodes/SoundBort/commit/2fb0a9fe4d600f446274601ac2ae544de009f764))
* support posting server count to top.gg ([8181ad4](https://github.com/LonelessCodes/SoundBort/commit/8181ad49c9f6733c1c6b68fb24e1b26dda207dc1))


### Bug Fixes

* add sample slot limit checks when importing ([7aeadc4](https://github.com/LonelessCodes/SoundBort/commit/7aeadc431c9e388d92f854ca6ac6b2f9a9ebf39d))
* add type-fest to package.json, so it isn't imported from ts-node ([8ac4a14](https://github.com/LonelessCodes/SoundBort/commit/8ac4a145391977243ba919bfc1aa156737e336fa))
* fixed security bug concerning non-mods deleting server samples ([40864dc](https://github.com/LonelessCodes/SoundBort/commit/40864dc8aba906b8880a8121159b8eba96eca6f1))
* make all custom button id fields strings, so that snowflakes won't be treated as numbers ([7938e51](https://github.com/LonelessCodes/SoundBort/commit/7938e51f915ae42fd036a0135a7b6514085c7059))
* **remove command:** add missing text to error when not in server ([0956fb6](https://github.com/LonelessCodes/SoundBort/commit/0956fb68c165fc00fde526f9ee4c5ff8f1fce73f))
* trim sample name whitespaces when uploading ([0525699](https://github.com/LonelessCodes/SoundBort/commit/052569961723e08a05398bcb1a69664658ee27d5))


### Changes

* change invite url in /getting-started command ([c25261f](https://github.com/LonelessCodes/SoundBort/commit/c25261fa7cd82fb889c31b8f251ed3014e724c62))
* display owner commands only in selected guilds ([475ccea](https://github.com/LonelessCodes/SoundBort/commit/475cceadb55b936e12710b434771f2651e1d8ec1))


### Improvements

* add seperate delete button for user and server to delete dialog ([21f55cb](https://github.com/LonelessCodes/SoundBort/commit/21f55cbf00a267f553d792a9e39a92b94b1e168d))
* cache json command data generated by command classes ([83f5981](https://github.com/LonelessCodes/SoundBort/commit/83f59817df4c5f662e6f5db3e107aaaa692fd8d9))

### [0.1.1](https://github.com/LonelessCodes/SoundBort/compare/v0.1.0...v0.1.1) (2021-08-11)


### Bug Fixes

* fixed guessing mod role by role position ([b108508](https://github.com/LonelessCodes/SoundBort/commit/b1085080553bb0740a6c4c791e27c8633c1f4ab4))

## 0.1.0 (2021-08-11)


### Features

* add /getting-started command ([c24f891](https://github.com/LonelessCodes/SoundBort/commit/c24f891e268ccca2e2e1b0083a68de987e1d2813))
* add config command and neccessary implementations ([e7f38e9](https://github.com/LonelessCodes/SoundBort/commit/e7f38e926fae7a5bb585bda0930a78cc2719f93e))
* add owner command ([f0bb270](https://github.com/LonelessCodes/SoundBort/commit/f0bb2700609f796ac030f8ef27e1c03e624efa45))
* allow blacklisting of users ([a89dde8](https://github.com/LonelessCodes/SoundBort/commit/a89dde8174fdfa4725e1f3c02ddc52ad01b735dd))
* leave voice channel when moved to empty vc or all members left ([459220e](https://github.com/LonelessCodes/SoundBort/commit/459220e342ce2f9ecbe9f48ba1ebc7ba3e39c5f4))
* show sample info and play button after sample upload ([cb12c15](https://github.com/LonelessCodes/SoundBort/commit/cb12c156d851b6a8ff9bab5079ed7a6929d549d0))


### Bug Fixes

* add permissions to owner command ([6814854](https://github.com/LonelessCodes/SoundBort/commit/6814854874d8293aba49a8cc32d6b50d4aa5bb23))
* banner file path fixed ([2e35e8f](https://github.com/LonelessCodes/SoundBort/commit/2e35e8fa4d7727bf7324e6a0d53c6e9547890638))
* cache not updated when playing sample ([1445881](https://github.com/LonelessCodes/SoundBort/commit/1445881a66253122881695816cc813f0fbeee80b))
* default back to default guessed mod role when previous mod role has been deleted ([4f66cfc](https://github.com/LonelessCodes/SoundBort/commit/4f66cfc84fe2f28169534b0c97426d9c2be2ca00))
* disallow user not in same voice chat to play samples ([1205978](https://github.com/LonelessCodes/SoundBort/commit/12059782c3244cc918129b9def0ca0edf1cff4e2))
* fix embed colors ([3e81ff5](https://github.com/LonelessCodes/SoundBort/commit/3e81ff5f90be90243eb174340f886372f3de44dc))
* fix error when /owner delete standard ([f7c4eca](https://github.com/LonelessCodes/SoundBort/commit/f7c4eca60a978ad8dfc8a1d162f13815f3e48041))
* fixed from method name ([117e7f7](https://github.com/LonelessCodes/SoundBort/commit/117e7f76a81b5942462fe9bd088e476c20cec9bb))
* fixed not loading commands after transpiling ([b3e74fa](https://github.com/LonelessCodes/SoundBort/commit/b3e74fad33b3d1776b416cda62ca2794f6c3e0ce))
* maybe fixed permissions for /data and /logs? ([8cdc297](https://github.com/LonelessCodes/SoundBort/commit/8cdc297f0b157d0be7cff74f2f7c59e26b518458))
* missing permissions to open package-lock.json in Dockerfile fixed ([d3024a0](https://github.com/LonelessCodes/SoundBort/commit/d3024a0455551a78c02a0adf586cbbabb98bfab3))
* now fixed Dockerfile? ([fdcad75](https://github.com/LonelessCodes/SoundBort/commit/fdcad75908c8761f520f13bb73e614e6f5cb42de))
* quick fix for failed import ([962dcec](https://github.com/LonelessCodes/SoundBort/commit/962dcecf6dac0b01e0d2bfd6f36d5097ebe8b9ce))
* replying to already replied to interaction fixed ([fc6306b](https://github.com/LonelessCodes/SoundBort/commit/fc6306bda827219917c2d1b4a75b691b6751fabf))


### Improvements

* check, to not set admin role again ([99b1cd8](https://github.com/LonelessCodes/SoundBort/commit/99b1cd84bbe7614f9bf88670d54931b2770d3e8f))
* improve error logs ([a0d2527](https://github.com/LonelessCodes/SoundBort/commit/a0d25272c5aa318fa94cc350760e4228785d7538))
* reduce docker image size ([e340eb4](https://github.com/LonelessCodes/SoundBort/commit/e340eb4ec6de2d86558b4741dfc13aa798a14200))


### Changes

* add play button to info command ([f76b9a4](https://github.com/LonelessCodes/SoundBort/commit/f76b9a4cf528a5c679c7f1b6b541a84d9b0cd643))
* change boot-up status ([1bb1dcb](https://github.com/LonelessCodes/SoundBort/commit/1bb1dcbe51537156fd93fc24ffecef6690bcfdba))
* change max sample slots to 10 ([81a8f18](https://github.com/LonelessCodes/SoundBort/commit/81a8f18fa8872e8bdf3be123a0525540def18346))
* handle moderator checks client-side only ([91b7b32](https://github.com/LonelessCodes/SoundBort/commit/91b7b32c0e0717217d6a2b209d57de79af08a62b))
* rename /owner upload-pre command to /owner upload standard ([3e7db37](https://github.com/LonelessCodes/SoundBort/commit/3e7db37f6358696b5bbab27ce92b08f21a5ff028))
* run node as root in Dockerfile, since I couldn't resolve permission problems ([4845ffd](https://github.com/LonelessCodes/SoundBort/commit/4845ffd4a5b8ea73919efc66620654cf18d3b68a))
* update color palette ([e9c6dfe](https://github.com/LonelessCodes/SoundBort/commit/e9c6dfe2b966782d4294ffe8639824a5271f4bb7))
