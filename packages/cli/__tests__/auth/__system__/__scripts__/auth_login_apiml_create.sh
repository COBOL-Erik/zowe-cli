#!/bin/bash
set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4
REJECT=$5
ECHOVAL=$6

echo $ECHOVAL | zowe auth login apiml --host $HOST --port $PORT --user $USER --password $PASSWORD --ru $REJECT

exit $?