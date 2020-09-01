#!/bin/bash

WORKFLOW=$1
INFILE=$2
JOB_DIR=$3
JOB_ID=$4
FEATURE_INFO_INFILE=$5


echo $PWD

WF_LEN=$(expr ${#WORKFLOW} - 1)

echo $WF_LEN

for MOD_I in $(seq 0 $WF_LEN)
do
    MOD_NUM=${WORKFLOW:MOD_I:1}

    if [ $MOD_NUM == '1' ]
    then
        python $PWD/pyModules/Tagger.py -i $INFILE -c $JOB_DIR/tagger.ini -od $JOB_DIR
        INFILE=$JOB_DIR/$(cat $JOB_DIR/tagger.ini | awk -F ' = ' '/^OutputName = / {print $2}')
    fi

    if [ $MOD_NUM == '2' ]
    then
        python $PWD/pyModules/Mod.py -i $INFILE -pr $JOB_DIR/mod.ini  -od $JOB_DIR
        INFILE=$JOB_DIR/$(cat $JOB_DIR/mod.ini | awk -F ' = ' '/^OutputName = / {print $2}')
    fi

    if [ $MOD_NUM == '3' ]
    then
        python $PWD/pyModules/Table.py -i $INFILE -c $JOB_DIR/table.ini -od $JOB_DIR
        INFILE=$JOB_DIR/$(cat $JOB_DIR/table.ini | awk -F ' = ' '/^OutputName = / {print $2}')
    fi

    if [ $MOD_NUM == '4' ]
    then
        python $PWD/pyModules/FeatureInfo.py -id $INFILE -c $JOB_DIR/featureInfo.ini -if $FEATURE_INFO_INFILE -od $JOB_DIR
        INFILE=$JOB_DIR/$(cat $JOB_DIR/featureInfo.ini | awk -F ' = ' '/^OutputName = / {print $2}')
    fi

done

INIT_PATH=$PWD
cd $JOB_DIR
zip TurboPutativeResults.zip ./*
cd $INIT_PATH
#mv $JOB_ID.zip $JOB_DIR/TurboPutativeResults.zip