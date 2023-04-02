#!/bin/bash
npm install -g jsdoc
#cp conf.json ~//.npm-global/lib/node_modules/jsdoc/conf.json
npm init -y
npm install taffydb
npm install minami
rm -R ../dist/docs/*
jsdoc ../src/bip39-en.js ../src/bip39toalgo.js ../src/utils.js ../src/public/js/main.js -t ./node_modules/minami -d ../dist/docs