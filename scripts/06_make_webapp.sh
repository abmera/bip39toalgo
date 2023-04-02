#!/bin/bash

# convert web app to single html file
save=`pwd`
npm install -g inline-scripts
cd ../src/public
inline-stylesheets index.html bip39toalgo-webapp.html
inline-script-tags bip39toalgo-webapp.html bip39toalgo-webapp.html
npm remove -g inline-scripts

# make zip
cp -p ../../README.md ./README.md
cp -p ../../README1.md ./README1.md
zip bip39toalgo-webapp.zip bip39toalgo-webapp.html README.md README1.md

# make SAH256SUM
sha256sum bip39toalgo-webapp.zip > SHA256SUM

# copy to dist
cp -p bip39toalgo-webapp.zip ../../dist/bip39toalgo-webapp.zip
cp -p bip39toalgo-webapp.html ../../dist/bip39toalgo-webapp.html
cp -p SHA256SUM ../../dist/SHA256SUM

# restore original dir
cd $save
