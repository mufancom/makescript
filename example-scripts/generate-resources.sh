#!bin/sh

mkdir -p $RESOURCE_PATH

EXPIRES_AT=$(($(date +"%s"000) + 60000))

echo "$MESSAGE" > $RESOURCE_PATH/index.html
echo "{\"expiresAt\": $EXPIRES_AT}" > $RESOURCE_PATH/config.json

echo "Page generated. Please <a href="$RESOURCE_BASE_URL">click here</a> to check message."
