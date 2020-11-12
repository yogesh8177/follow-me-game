# Follow me game

A simple client server based game where we follow instructions provided by server. We must respond with the appropriate instruction (key press) before the time runs out!

Following are the game rules:

1. When a `key is pressed` in server (instruction), the client receives it; and has a timer.
counting up to `X seconds` in which the same key has to be pressed.
1. The server verifies if the keypress sent by client matched “the instruction” and assign +1
point on correct, `-1 on a wrong key` and `0 for timeouts`.
1. The game is over when the score reaches either `+10 points` or `-3 points`.
1. The game is also over if the client does not respond for `3 continuous instructions`.
1. Each score update should send the score back to the connected client.
1. The client should also know the timeout value for each instruction received.

> Note: Right now only keyboard keys [a-z] and [0-9] are supported. 

# Project structure

- `$PROJECT_ROOT`
  - `decorators` (decorator helpers)
  - `dist` (generated after you run build or run commands)
  - `models` (classes and models)
  - `.env.example` (sample env file to generate .env)
  - `game.ts` (main entry file)

# Steps to run

Clone the git code:
- `git clone https://github.com/yogesh8177/follow-me-game.git`
- `cd follow-me-game`

> $PROJECT_ROOT=<path/to/follow-me-game> will be used as a refrence to root folder in this doc.

## Setup env file

Create `.env` file from the given `$PROJECT_ROOT/.env.example` file. Below is a sample `.env` file structure.

```
## Server config

SERVER_PORT=3001
MAX_SCORE=10
MIN_SCORE=-3
TIMEOUT_IN_SECONDS=5
MAX_TIMEOUT_MISSES=3

# Client config
CLIENT_PORT=3000
SERVER_URL=ws://localhost:3001
```

## Commands to run

1. `npm install`
1. Server: `npm run start:server`
1. Client: `npm run start:client`

Firsly start the server, once server boots up, then start the client. Presently only one client will be able to connect. Any new connections to server will be overriden and reset the game.

> Note: Make sure to run client and server in separate terminal windows/tabs.

# Possible next steps

- Instead of setting `TIMEOUT_IN_SECONDS` for each instruction in .env file, randomly assign that value. Provision is made available to pass `TIMEOUT_IN_SECONDS` as a dynamic value in the `Instruction` model. A small function or utility to make it dynamic will help!

- `One to many` mapping between `server:clients`.

- Handle socket `disconnects` and `error` events on server and client respectively!

- Implement connection `retry` mechanism!

- Improve the UX for client and server!
