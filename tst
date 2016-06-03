#!/bin/bash
xcrun xcodebuild -workspace "$WORK_SPACE_FILE" -scheme "$PROJECT_NAME" -configuration Release clean archive -archivePath "$ARCHIVE_PATH" ENABLE_BITCODE=NO &>/Users/r00fi0/Work/buildmachine/log
if [ $? != 0 ]; then
    VA=1
    VA=$((VA++))
    VA=$((VA * 10))
    echo "$VA"
    exit 1

fi