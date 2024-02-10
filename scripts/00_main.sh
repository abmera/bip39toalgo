#!/bin/bash

# create js doc in dist/docs1
./01_gen_jsdoc.sh

# install the necessary node js modules for webpack
./02_webpack_install.sh

# bundle bip39toalgo together with webpack, result in dist
./03_webpack_run.sh

# download necessary js libs for the web app to dist/js_lib
./04_get_jslibs.sh

# cp jslibs to src/public/js
./05_cp_jslibs.sh

# make single file app, copy to dist
./06_make_webapp.sh
