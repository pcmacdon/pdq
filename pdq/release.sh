#!/bin/sh
# Script to fossil commit a new release, adding the required tag "ver-N.M"
# Validates that release does not already exists and adds "jsireq-N.M" tag as required.
#set -x
#DO=echo
./pdq/jslint.sh
jsish pdq/genlist.jsi
VER=ver-`jsish -e 'require("pdq")'`
JSIVER=jsireq-`jsish -e 'require("pdq",0).conf.info.verjsireq'`
AVERS=`fossil tag list | grep $VER`
JVERS=`fossil tag list | grep $JSIVER`
echo $AVERS
if [ "$AVERS" != "" ]; then
   echo "Version already in repo: " $VER
   echo "Perhaps use: \"fossil tag cancel $VER $VER\""
   exit 1
fi
set -x

$DO fossil commit --tag $VER || exit 1
if [ "$JVERS" = "" ]; then
    $DO fossil tag add $JSIVER $VER
fi

