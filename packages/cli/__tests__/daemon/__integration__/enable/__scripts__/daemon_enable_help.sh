#!/bin/bash
set -e

echo "================ daemon enable help ==============="
zowe daemon enable --help
if [ $? -gt 0 ]
then
    exit $?
fi
