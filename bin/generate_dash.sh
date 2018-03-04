#! /bin/bash

EXEC_NAME=$( dirname $0 )"/ffmpeg.exe"
FILE_PATH=$1
OUTPUT_PATH_PREFIX=$2

if [ $# -ne 2 ]; then
	echo "Usage: ./generate_dash.sh <input_file_path> <output_folder>"
	exit
fi

mkdir -p ${OUTPUT_PATH_PREFIX}

EXEC_WITH_INPUT="${EXEC_NAME} -i ${FILE_PATH}"

# generate audio
${EXEC_WITH_INPUT} -vn -acodec libvorbis -ab 128k -dash 1 ${OUTPUT_PATH_PREFIX}/audio.webm


${EXEC_WITH_INPUT} -c:v libvpx-vp9 -keyint_min 150 \
-g 150 -tile-columns 4 -frame-parallel 1  -f webm -dash 1 \
-an -vf scale=160:190 -b:v 250k -dash 1 ${OUTPUT_PATH_PREFIX}/160x90_250k.webm \
-an -vf scale=320:180 -b:v 500k -dash 1 ${OUTPUT_PATH_PREFIX}/320x180_500k.webm \
-an -vf scale=640:360 -b:v 750k -dash 1 ${OUTPUT_PATH_PREFIX}/640x360_750k.webm \
-an -vf scale=640:360 -b:v 1000k -dash 1 ${OUTPUT_PATH_PREFIX}/640x360_1000k.webm \
-an -vf scale=1280:720 -b:v 1500k -dash 1 ${OUTPUT_PATH_PREFIX}/1280x720_1500k.webm

${EXEC_NAME} \
-f webm_dash_manifest -i ${OUTPUT_PATH_PREFIX}/160x90_250k.webm \
-f webm_dash_manifest -i ${OUTPUT_PATH_PREFIX}/320x180_500k.webm \
-f webm_dash_manifest -i ${OUTPUT_PATH_PREFIX}/640x360_750k.webm \
-f webm_dash_manifest -i ${OUTPUT_PATH_PREFIX}/audio.webm \
-c copy \
-map 0 -map 1 -map 2 -map 3 \
-f webm_dash_manifest \
-adaptation_sets "id=0,streams=0,1,2 id=1,streams=3" \
${OUTPUT_PATH_PREFIX}/manifest.mpd