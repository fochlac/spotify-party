# Spotify Party
Hack The North 2021 Project

## Inspiration
We wanted to have the option for everyone to queue up songs to create a smooth listening experience that we all enjoy.

## What it does
Users can login with Spotify to create their own listening room, which they can send to others to join in! Once in, anyone can queue a song and can vote up or down to move the queue positions around. This allows everyone to create a listening experience that they can all share together!

## How we built it
We utilized Node and Express to build a backend that wraps around the Spotify Web API to provide endpoints to allow for adding songs to a queue, searching Spotify, voting up or down on a song, and authorization. We then used a React frontend to build an interface that allows users to create their own listening rooms to share with friends via link or QR code.

## Challenges we ran into
Spotify's user authorization tokens only last for an hour, so we had to consistently refresh tokens with requests to ensure the listening room still works. In addition, another challenge we overcame was managing authorization with rooms, as we wanted people to be able to queue songs to the player without having Spotify (only the host). The way we did this was to implement a mapping system which kept track of active rooms to their authorization tokens (hashed and hidden from client).
