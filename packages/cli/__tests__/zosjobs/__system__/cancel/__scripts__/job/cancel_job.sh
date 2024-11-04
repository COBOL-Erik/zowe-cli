#!/bin/bash

# Max attempt count
ATTEMPTS=10

# Wait time between attempts
WAIT=10

# Submit the job and ensure the RC is 0
JOBID=`zowe jobs submit lf "$1" --rff jobid --rft string`
RC=$?
if [ $RC -gt 0 ]
then
    echo $JOBID 1>&2
    echo "Submit returned a non-zero return code" 1>&2
    exit $RC
fi

sleep 1

# Cancel the job
zowe jobs cancel job $JOBID
RC=$?

if [ $RC -gt 0 ]
then
    echo "The cancel job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi
