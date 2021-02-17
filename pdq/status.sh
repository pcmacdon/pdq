#!/bin/sh
FOSS=`echo *.fossil`
PROJ=`basename $FOSS .fossil`
VER=`jsish -e "require('$PROJ')"`
JSIVER=`jsish -e "require('$PROJ',0).conf.info.verjsireq"`
echo fossil: $FOSS
echo version: $VER
echo jsiver: $JSIVER
echo tags: `fossil tag list -R $FOSS | xargs`
fossil info -R $FOSS
fossil info -R $FOSS  tip
fossil timeline -n 50 -p content.json -R $FOSS

