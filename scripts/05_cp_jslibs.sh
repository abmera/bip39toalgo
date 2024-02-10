#!/bin/bash

src=../dist/js_lib
dst=../src/public

# bootstrap
cp -p $src/bootstrap@5.3.0-alpha1/css/bootstrap.min.css $dst/css/bootstrap.min.css
cp -p $src/bootstrap@5.3.0-alpha1/css/bootstrap.min.css.map $dst/css/bootstrap.min.css.map
cp -p $src/bootstrap@5.3.0-alpha1/js/bootstrap.bundle.min.js $dst/js/bootstrap.bundle.min.js
cp -p $src/bootstrap@5.3.0-alpha1/js/bootstrap.bundle.min.js.map $dst/js/bootstrap.bundle.min.js.map

# jquery
cp -p $src/jquery-3.6.3/js/jquery-3.6.3.min.js $dst/js/jquery-3.6.3.min.js
cp -p $src/jquery-3.6.3/js/jquery-3.6.3.min.map $dst/js/jquery-3.6.3.min.map

# jquery.qrcode
cp -p $src/jquery-qrcode-0.18.0/jquery-qrcode-0.18.0.min.js $dst/js/jquery-qrcode-0.18.0.min.js

# pdf-lib
cp -p $src/pdf-lib@1.17.1/js/pdf-lib.min.js $dst/js/pdf-lib.min.js
cp -p $src/pdf-lib@1.17.1/js/pdf-lib.min.js.map $dst/js/pdf-lib.min.js.map

# download
cp -p $src/download-4.21/js/download.js $dst/js/download.js

# bip39toalgo
cp -p $src/bip39toalgo/bip39toalgo.bundle.min.js $dst/js/bip39toalgo.bundle.min.js
cp -p $src/bip39toalgo/bip39toalgo.bundle.min.js.map $dst/js/bip39toalgo.bundle.min.js.map
cp -p $src/bip39toalgo/bip39toalgo.bundle.min.js.LICENSE.txt $dst/js/bip39toalgo.bundle.min.js.LICENSE.txt
