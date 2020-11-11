# Follow me game

A simple client server based game where we follow instructions provided by server. We must respond with the appropriate instruction (key press) before the time runs out!

Following are the game rules:

1. When a key is pressed in server (instruction), the client receives it; and has a timer
counting up to X seconds in which the same key has to be pressed.
1. The server verifies if the keypress sent by client matched “the instruction” and assign +1
point on correct, -1 on a wrong key and 0 for timeouts.
1. The game is over when the score reaches either +10 points or -3 points.
1. The game is also over if the client does not respond for 3 continuous instructions.
1. Each score update should send the score back to the connected client.
1. The client should also know the timeout value for each instruction received.

# Steps to run

1. `npm install`
1. Server: `npm run start:server`
1. Client: `npm run start:client`