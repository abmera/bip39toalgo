#!/bin/bash

# Download js libraries used by bip39toalgo

### Bootsrap, https://getbootstrap.com/
dest=../dist/js_lib
save=`pwd`
mkdir -p $dest/bootstrap
cd $dest/bootstrap
wget -q -np -r -l 2 -k https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/
cd $save

ver=bootstrap@5.3.0-alpha1  # latest: alpha2
mkdir -p $dest/$ver/css
mkdir -p $dest/$ver/js
wget -q -O $dest/$ver/css/bootstrap.min.css \
  https://cdn.jsdelivr.net/npm/$ver/dist/css/bootstrap.min.css
wget -q -O $dest/$ver/css/bootstrap.min.css.map \
  https://cdn.jsdelivr.net/npm/$ver/dist/css/bootstrap.min.css.map
wget -q -O $dest/$ver/js/bootstrap.bundle.min.js \
  https://cdn.jsdelivr.net/npm/$ver/dist/js/bootstrap.bundle.min.js
wget -q -O $dest/$ver/js/bootstrap.bundle.min.js.map \
  https://cdn.jsdelivr.net/npm/$ver/dist/js/bootstrap.bundle.min.js.map
cd $save 

### jQuery, https://jquery.com/download/
save=`pwd`
mkdir -p $dest/jquery
cd $dest/jquery
wget -q -np -r -l 2 -k https://code.jquery.com
cd $save

ver=jquery-3.6.3 # latest: 3.6.4
mkdir -p $dest/$ver/js
# JS, Download the compressed, production jQuery 3.6.4
wget -q -O $dest/$ver/js/$ver.min.js \
    https://code.jquery.com/$ver.min.js
# Download the map file for jQuery 3.6.3
wget -q -O $dest/$ver/js/$ver.min.map \
    https://code.jquery.com/$ver.min.map
cd $save

### jQuery qrcode, https://www.jqueryscript.net/other/Canvas-Table-QR-Code-Generator.html
##  wget https://www.jqueryscript.net/download/Canvas-Table-QR-Code-Generator.zip
## 404 Not Found

### jQuery.qrcode 0.18.0, https://larsjung.de/jquery-qrcode/
save=`pwd`
ver=jquery-qrcode-0.18.0
mkdir -p $dest/$ver
wget -q -O $dest/$ver/$ver.zip https://release.larsjung.de/jquery-qrcode/$ver.zip
unzip -o $dest/$ver/$ver.zip -d $dest/$ver
#cp -p ./jquery-qrcode-0.18.0/jquery-qrcode-0.18.0.min.js jquery.qrcode.min.js
cd $save

# main.js
  #cat main.js | minify --js > main.min.js

# pdf-lib, https://pdf-lib.js.org/
save=`pwd`
ver=pdf-lib@1.17.1
mkdir -p $dest/$ver/js
wget -q -O $dest/$ver/js/pdf-lib.js \
  https://cdn.jsdelivr.net/npm/$ver/dist/pdf-lib.js
wget -q -O $dest/$ver/js/pdf-lib.js.map \
  https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.js.map
wget -q -O $dest/$ver/js/pdf-lib.min.js \
  https://cdn.jsdelivr.net/npm/$ver/dist/pdf-lib.min.js
wget -q -O $dest/$ver/js/pdf-lib.min.js.map \
  https://cdn.jsdelivr.net/npm/$ver/dist/pdf-lib.min.js.map

# cat pdf-lib.js | minify --js > pdf-lib.min1.js  # source map-et nem tud készíteni

# download, https://danml.com/
# download
## wget http://danml.com/js/download.js?v3.1
# see also https://github.com/rndme/download
save=`pwd`
ver=download-4.21
mkdir -p $dest/$ver/js
wget -q -O $dest/$ver/js/download.js \
  https://raw.githubusercontent.com/rndme/download/master/download.js # v4.21
exit

