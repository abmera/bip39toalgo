#!/bin/bash
dst=../dist/js_lib/bip39toalgo
mkdir -p $dst
webpack --config webpack.config.dev.js --progress --stats #verbose
webpack --config webpack.config.prod.js --progress --stats #verbose

