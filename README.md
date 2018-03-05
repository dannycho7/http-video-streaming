# HTTP Video Streaming

Project for CS 176B by Hyun Bum Cho (Danny)

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

As noted in the report, you can also find a simple deployment at: https://http-video-streaming.herokuapp.com.

Also noted in the report is a note about the deployment: It will take 30 seconds to start up, as I am hosting it on a free-plan. With a free-plan on heroku, your application is put to sleep if there is no activity for 1 hour.

## Directory Structure

### bin/
This is the directory that holds the executables, like the server and the dash generation script.

### public/
This holds the static assets like the client and dash player (this dash player is built on existing players used solely for the purpose of tuning my server).

### videos/
This holds the video content. Each video is stored as: /:video_id/:____.webm. The ____ could either be "audio" for the audio content, or "dimwidthxdimheight_bitrate".