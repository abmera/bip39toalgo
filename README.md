# BIP39 Mnemonic to Algorand Secret
## Motivation
As a paranoid long-term Algo holder with a Ledger wallet, this tool is the answer to the question: 
> *What if my Ledger device malfunctions or I misplace it and don't have access to a new one?*

While some advances have been made in terms of interoperability and recoverability across wallet clients (more details in [WalletsRecovery](https://walletsrecovery.org/)), there is still a considerable amount of inconsistencies. Thus, I couldn't just enter my Ledger recovery phrase (BIP39 mnemonic) in another multi-account wallet like Coinomi, Exodus or Trust. Also, I wanted to have the Algorand native 25-word recovery phrase in paper so that I could use in the official app to access my funds as a backup plan.

## How to Use
### Web App
---
Go to the live webapp: <https://algorand.oortnet.com/>  
To use the main functionality of this tool:

1. Select the `Mnemonic Tool` tab
2. Enter your wallet `BIP39 mnemonic` (12-24 words recovery phrase)
3. Choose your `Wallet Client` (currently known derivation paths for: Atomic, Coinomi, Exodus, Ledger and Trust)
4. Press `Start`
5. Confirm that the `Algorand Address` displayed matches your current address
6. Write down your secret in a piece of paper and store it in a secure place. Do not take a screenshot! Take the necessary precautions to store your secret!

If your `Wallet Client` is not listed you could use the `Search` functionality which will try multiple derivation method/path combinations to find one that matches your `Current Address`, or play around with the `Custom` option.

#### Offline Usage
1. Download this zip file: [Standalone Mnemonic Tool](bip39toalgo-webapp.zip)
2. Disconnect from the Internet
3. Unzip the file and open the `index.html` file

### Node app
---
1. Download and clone this repository
2. Change directory to project folder
3. Install dependencies with `npm install`
4. Main app code is in `src/bip39toalgo.js`
Read the source code documentation: <https://algorand.oortnet.com/docs/>

#### Example
Run this [example](src/example.js) with `node ./src/example.js`
```javascript
const {
    deriveMnemonic,
    wallets,
    prettifyWordsTTB
} = require('./bip39toalgo')

mnemonic = 'all all all all all all all all all all all all all all all all all all all all all all all feel'
deriveMnemonic(mnemonic, wallets.ledger.method, wallets.ledger.path)
.then(node => {
    console.log(node.algo.key)
    console.log(node.algo.address)
    words = prettifyWordsTTB(node.algo.words)
    console.log(words)
})
// Returns:
// 1075ab5e3fcedcb69eef77974b314cc0cbc163c01a0c354989dc70b8789a194f
// NVGXFOROGBDBUW6CEQDX6V742PWFPLXUDKW6V7HOZHFD7GSQEB556GUZII
//  1. pear        6. pumpkin    11. champion   16. army       21. vapor      
//  2. punch       7. language   12. rose       17. chase      22. grief      
//  3. quantum     8. jewel      13. logic      18. cement     23. juice      
//  4. token       9. indicate   14. body       19. hour       24. able       
//  5. ridge      10. share      15. stock      20. mandate    25. coast
```


## Derivation Method
`slip10-ed25519` uses [SLIP10](https://github.com/satoshilabs/slips/blob/master/slip-0010.md) standard with elliptic curve ed25519  
`slip10-secp256k1` uses [SLIP10](https://github.com/satoshilabs/slips/blob/master/slip-0010.md) standard with elliptic curve secp256k1  
`kholaw-ed25519` implements paper from D. Khovratovich and J. Law, " [BIP32-Ed25519: Hierarchical Deterministic Keys over a Non-linear Keyspace](https://ieeexplore.ieee.org/abstract/document/7966967)", 2017 IEEE European Symposium on Security and Privacy Workshops (EuroS&PW), 2017, pp. 27-31, doi: 10.1109/EuroSPW.2017.47.  
`bip39-seed` does not derive the key, uses first 32 bytes of the BIP39 seed 

## Open Source
This project is 100% open source, get the source code in the repository in [GitHub](https://github.com/abmera/bip39toalgo)

## Buy Me a Coffee
Coffee donations are welcome: `TIPKTP7LNT2SZ52445YP2YSZJQV53Z4FSJSIWLMKTSABZIVQ4L73U2QC3A`

## License
Please refer to the software [license](https://github.com/abmera/bip39toalgo/blob/main/LICENSE) for more details.

*The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.*

## Test Vectors
### Atomic Wallet
```
Bip39 Mnemonic: 	all all all all all all all all all all all all
Bip39 Passphrase: 	"" (blank)
Derivathon Method: 	bip39-seed
Derivathon Path: 	None
Algorand Address: 	YQDDGDM3BKPQ5RAIYGCT7JX6DCIMVQHTHITSPJWKNLIPETB2JR6MPKC43A
Algorand Secret: 	ocean claim giraffe exercise dove sell deputy essay clog brother lesson produce whisper damage subway shoulder ten bike torch also voyage fine where able scan
```

### Coinomi and Trust Wallets
```
Bip39 Mnemonic: 	all all all all all all all all all all all all all all all all all all all all all all all feel
Bip39 Passphrase: 	"" (blank)
Derivathon Method: 	slip10-ed25519
Derivathon Path: 	m/44'/283'/0'/0/0
Algorand Address: 	NMRBZNN2RXUNVLVVPVD53GJV6A2A55QWJXMD2KG42N7NQZB67WXYFGONVA
Algorand Secret: 	sorry aisle similar royal unveil laugh tissue upset volcano beach setup kit isolate bonus poem employ call venture item snack favorite gaze maximum abandon leave 
```

### Exodus Wallet
```
Bip39 Mnemonic: 	all all all all all all all all all all all all
Bip39 Passphrase: 	"" (blank)
Derivathon Method: 	slip10-secp256k1
Derivathon Path: 	m/44'/283'/0'/0/0
Algorand Address: 	ZXLNDDUAYCYFXJI33HXUXLNVUTMQMSG6HRXV6JT2KNSU2SP4J7GUZG5BWU
Algorand Secret: 	ghost price deny catalog gallery know boat acoustic mouse extend track member pitch media bunker border miss near vendor rapid meat idle verb above chief 
```

### Ledger Wallet
```
Bip39 Mnemonic: 	all all all all all all all all all all all all all all all all all all all all all all all feel
Bip39 Passphrase: 	"" (blank)
Derivathon Method: 	kholaw-ed25519
Derivathon Path: 	m/44'/283'/0'/0/0
Algorand Address: 	NVGXFOROGBDBUW6CEQDX6V742PWFPLXUDKW6V7HOZHFD7GSQEB556GUZII
Algorand Secret: 	pear punch quantum token ridge pumpkin language jewel indicate share champion rose logic body stock army chase cement hour mandate vapor grief juice able coast
```

## Libraries
[CryptoJS](https://github.com/brix/crypto-js)  
[download](http://danml.com/download.html)  
[Elliptic](https://github.com/indutny/elliptic)  
[jQuery](https://jquery.com/)  
[jQuery qrcode](https://www.jqueryscript.net/other/Canvas-Table-QR-Code-Generator.html)  
[PDF-LIB](https://pdf-lib.js.org/)  
[random-number-csprng](https://github.com/joepie91/node-random-number-csprng)  
[Twitter Bootstrap](https://getbootstrap.com/)  