# Contributing

If you wish to contribute to <NAME>, feel free to fork the repository and submit a pull request. We use ESLint to enforce a consistent coding style, so having that set up in your editor of choice is a great boon to your development process.

## Setting up Soundbort for contributing

You need the following prerequisites for contributing to Soundbort:

* Node.js 16.5.0 (using a version management tool like [nvm](https://github.com/nvm-sh/nvm) is recommended)
* build-essentials (apt install build-essential. For dev on Windows use WSL 2 or inform yourself about Node.js package build requirements)
* ffmpeg (apt install ffmpeg)
* A MongoDb instance. Either local, or on [cloud.mongodb.com](https://cloud.mongodb.com), which I recommend, because it's easy to setup, doesn't require you to install anything and it has a free plan.

To get ready to work on the codebase, please do the following:

1. Get a Discord API token (for bot user) from the [developer portal](https://discord.com/developers/applications).
2. Fork & clone the repository, and make sure you're on the **main** branch.
3. Cd into the repo and run `npm install`
4. Create an `.env` file based on the `.env.template` file and fill out the required variables (optional variables can be removed if you're not working on those).
5. Code your heart out!
6. Run `npm lint` and `npm run build` to ensure changes are valid.
7. By chance build the docker container `npm run build:docker` and fix any errors.
8. [Submit a pull request](<repository>/compare). Make sure that any commit keeps the bot executable.

### Running the Bot

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

If you're going to edit the code, make sure you're using a proper IDE for code editing. Your best bet might be VS Code.