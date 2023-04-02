## Motivation of this fork
To rebuild the node app and the web app from sources, as the `bip39toalgo` conversion program
handles very sensitive data.

### node app, SHA512t256 is not a function
The original project repository is here: <https://github.com/abmera/bip39toalgo>

When I tried to run the tests after checking it out, I got an error:
```
git clone https://github.com/abmera/bip39toalgo
cd bip39toalgo
npm install
npm run test
=>   TypeError: cp.SHA512t256 is not a function
```

I looked at the source code, and saw that the sha512.js in the node module crypto-js doesn't have this function any more.
But the SHA512t256 function is related to checksum computation. I checked the relevant part of the js-algorand-sdk:
```
# from js-sdkalgo
const sha512 = require('js-sha512');

function genericHash(arr) {
    return sha512.sha512_256.array(arr);
}
```

So I used js-sha512 as a replacement, and modified the ./src/bip39toalgo.js accordingly:
```
# After checkout, install node modules
npm install
# Install new library js-sha512
npm install js-sha512
# Patch bip39toalgo to use js-sha512
patch ./src/bip39toalgo.js ./src/bip39toalgo_p1.patch
# Check it by running the tests
npm run test
=> ...
=>  21. custom     22. high       23. word       24. ability    25. evidence   
=>  assertion OK
=> LEAVE 
```

Now you can convert your 24 word Ledger menmonic to the Algorand format,
by modifying the `./src/example.js` file, inserting your Ledger mnemonic here, and then running it:
```
npm run example
=> 
=> > bip39toalgo@1.0.0 example
=> > node ./src/example.js
=> 
=> 1075ab5e3fcedcb69eef77974b314cc0cbc163c01a0c354989dc70b8789a194f
=> NVGXFOROGBDBUW6CEQDX6V742PWFPLXUDKW6V7HOZHFD7GSQEB556GUZII
=>  1. pear        6. pumpkin    11. champion   16. army       21. vapor      
=>  2. punch       7. language   12. rose       17. chase      22. grief      
=>  3. quantum     8. jewel      13. logic      18. cement     23. juice      
=>  4. token       9. indicate   14. body       19. hour       24. able       
=>  5. ridge      10. share      15. stock      20. mandate    25. coast   
=> 
```

### node app, recreate docs
The documentation was created by jsdoc. If you want to recreate it, please run the following script:
```
./scripts/01_gen_jsdoc.sh
```

### web app, bundled version of bip39toalgo.js
The web app uses the `bip39toalgo.js`, bundled together with the node modules. 

Alas, in the original project there isn't any clue about that step. 

I began my first trials with `browserify`, but then changed to `webpack`, as it seemed to me more general and very well supported.
The webpack configuration files are `webpack.config.dev.js` and `webpack.config.prod.js` for the development and for the production 
version respectively.

You can bundle together the `bip39toalgo.js` and the node js modules for the browser by running:
```
./scripts/02_webpack_install.sh
./scripts/03_webpack_run.sh
```
The bundled files will be created in the `dist/js_lib` library.
The bundled version can be tested by clicking on `test.html` in the `dist` library.
A browser will be started. If you press F12, then press the `Run tests` button, you will see the test results
on the "Console" tab.

See also:
- https://webpack.js.org/concepts/
- https://stackoverflow.com/questions/64557638/how-to-polyfill-node-core-modules-in-webpack-5
- <https://stackoverflow.com/questions/68707553/uncaught-referenceerror-buffer-is-not-defined>
- <https://stackoverflow.com/questions/45817227/how-to-export-function-with-webpack>

### web app, JS library download
The web app uses the following libraries:
- bootstrap, see <https://getbootstrap.com/>
- jQuery, see <https://jquery.com/download/>
- jQuery.qrcode, see <https://larsjung.de/jquery-qrcode/>
- pdf-lib, see <https://pdf-lib.js.org/>
- download, see <https://github.com/rndme/download>

These can be downloaded to `./dist/js_lib` by running:
```
./scripts/04_get_jslibs.sh
```

The js libraries can be copied to `./src/public/js` by running:
```
./scripts/05_cp_jslibs.sh
```
The web app can be tried out by clicking on `./src/public/index.html`

### web app, single file version

The `html`, `css` and `js` files can be copied into a single `html` file. The original project probably used
`handlebars` and `express` for that. I couldn't figure out, how. So, I used the npm package `inline-scripts` 
to make a single html web app.
```
./sripts/06_make_webapp.sh
```
The result is the single html file `bip39toalgo-webapp.html` in `./src/public`
The script also makes a `zip` file, an `SHA256SUM` for the `zip` file, and copies them to the `dist` too.

### web app, publish 
For the general procedure, see <https://pages.github.com/>
The required steps are:
- create new repository, `a-maugli.github.io`
- clone it: `git clone https://github.com/A-Maugli/a-maugli.github.io`
- copy files into it from `bip39toalgo\dist` 
- `git add --all`
- `git commit -m "initial commit"`
- `git remote add origin https://github.com/A-Maugli/a-maugli.github.io.git`
- `git branch -M main`
- `git push -u origin main`
