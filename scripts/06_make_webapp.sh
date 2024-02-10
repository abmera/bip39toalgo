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
# to make zip deterministic (within a day), set creation and modification date
##touch -a -m -t `date +%Y%m%d0000.00` README.md README1.md bip39toalgo-webapp.html
touch -a -m -t 200001010000.00 README.md README1.md bip39toalgo-webapp.html
# also, do don incluide extented file attribuid, like uid (-X)
zip -X bip39toalgo-webapp.zip bip39toalgo-webapp.html README.md README1.md

# make SAH256SUM
sha256sum bip39toalgo-webapp.zip > SHA256SUM

# copy to dist
cp -p bip39toalgo-webapp.zip ../../dist/bip39toalgo-webapp.zip
cp -p bip39toalgo-webapp.html ../../dist/bip39toalgo-webapp.html
cp -p SHA256SUM ../../dist/SHA256SUM

# restore original dir
cd $save
