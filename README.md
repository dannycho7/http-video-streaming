# HTTP Video Streaming

A HTTP Video Streaming implementation, which provides adaptive streaming/tuning via DASH (Dynamic Adaptive Streaming over HTTP). This was built using the Media Sources extensions on JavaScript.

## Setup Instructions

In order to run the program, you will need to have nodejs installed. Installation steps for node.js can be found here: https://nodejs.org/en/download/.

Make sure you run these commands inside the proejct directory.

Install the npm packages:
```sh
npm install
```

Start the server:
```sh
npm start
```

You will now be able to find the application at `localhost:5000`.

## Directory Structure

### bin/
This is the directory that holds the executables, like the server, the dash generation script, and video metadata programs.

### player/
This folder holds the source code for the client player. All of these files get compiled (in reality, they're just concatenated together) into a bundle that is linked in the player HTML. The names of the files should be explanatory of what they do. For example, `player.js` holds the source code for the actual player which will pull everything together.

### videos/
This holds the video content and metadata. The manifest file should be located in a file called `manifest.mpd`. Each video is stored within this folder as `/:video_id/:____.webm.`gi The ____ could either be "audio" for the audio content, or "dimwidthxdimheight_bitrate. You can find individual video metadata in the `timestamps/` folder. This folder will hold files named `dimwidthxdimheight_bitrate.webm.json` or `audio.webm.json`. These timestamps hold data necessary for adaptive streaming to work (locates where I-Frames are).

### public/
This holds static assets. It currently only stores the player compilation and does not store source code.

### views/
This holds HTML that get sent to the client, which is built using ejs (a template engine). 