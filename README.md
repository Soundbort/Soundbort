# Soundbort

![Soundbort Banner](assets/readme_banner.jpg)

<div>

<img src="https://discordbots.org/api/widget/868296331234521099.png" alt="Bot stats from top.gg" width="250" style="float:right; margin-left: .5rem" />

## Using the Official Soundbort

***[Add Soundbort to your server now](https://discord.com/api/oauth2/authorize?client_id=868296331234521099&permissions=2150943808&scope=applications.commands%20bot) and enjoy it's full set of features with low latency.***

##### *[Add Soundbort Staging to your server](https://discord.com/api/oauth2/authorize?client_id=869715767497740378&permissions=2150943808&scope=applications.commands%20bot) if you want the newest of (potentially unstable) features and help out with development.*
</div>

---

Soundbort is a custom soundboard bot for Discord. It offers low latency playback - basically as fast as Discord allows it - by converting audio at time of upload instead of just-in-time like other bots do it.

## It's set of features include:

* Upload your own audio files easily
* Seperate soundboards for servers and users
    * Provide sounds for everyone in your server to use
    * Or keep sounds in your own soundboard and carry it anywhere
* Let other users import your sounds into their own soundbord
* Built on Discord's slash commands and clickable buttons
* Constantly worked on
* Thoroughly tested

---
## Setting up Soundbort for contributing

**WARNING**: The developer of Soundbort does not recommend running your own version of Soundbort. Building and deploying Soundbort is not documented and is not eligible for support.

### Development environment

You need the following prerequisites for testing Soundbort:

* Node.js 16.6.1 (using a version management tool like [nvm](https://github.com/nvm-sh/nvm) is recommended)
* build-essentials (apt install build-essential. For dev on Windows use WSL 2 or inform yourself about Node.js package build requirements)
* ffmpeg (apt install ffmpeg)
* A MongoDb instance. Either local, or on [cloud.mongodb.com](https://cloud.mongodb.com), which I recommend, because it's easy to setup, doesn't require you to install anything and it has a free plan.

For testing Soundbort you need a Discord API Token and bot user account from [here](https://discord.com/developers/applications).

Now clone the repository to your machine, install the dependencies and transpile the source files.

```sh
git clone https://github.com/lonelesscodes/Soundbort.git
cd Soundbort
npm install
```

### Setting up

In the root folder create an `.env` file based on the `.env.template` file and fill out the required variables - delete the optional variables if needed.

### Running

```sh
# run for development, compile at runtime
npm run start:watch

# build for development and run
npm run build
npm run start:devel

# build for production and run
npm run build
npm run start
```

### Editing

If you're going to edit the code, make sure you're using a proper IDE for code editing. Your best bet might be VS Code. If you want to contribute to the project, run `npm run lint` and `npm run build` and by chance build the docker container `npm run build:docker` and fix any errors before creating a pull request.

---

## Disclaimer of liability

This software comes WITHOUT ANY WARRANTY. Edit and use at your own risk!

# License

Soundbort is licensed under the [GNU General Public License v3.0](LICENSE)

Copyright (C) 2021 Christian Schäfer / Loneless

`Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.`
