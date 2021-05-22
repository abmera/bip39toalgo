const bip39words = require('./bip39-en').words
const hmacSHA512 = require('crypto-js/hmac-sha512')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const PBKDF2 = require('crypto-js/pbkdf2')
const cp = require('crypto-js');
const EC = require('elliptic').ec;
const EdDSA = require('elliptic').eddsa;
const ecEd25519 = new EdDSA('ed25519');
const ecSECP256 = new EC('secp256k1');
const ecCurve25519 = new EC('ed25519');
const rand = require('random-number-csprng');

const BIP32KEY_HARDEN = 0x80000000
const ed25519_n = 2n**252n + 27742317777372353535851937790883648493n
const _ = undefined

const hexilify   = cp.enc.Hex.stringify
const unhexilify = cp.enc.Hex.parse

const _hmac512  = (message, secret) => hmacSHA512(message, secret)
const _hmac256  = (message, secret) => hmacSHA256(message, secret)
const _getBit   = (character, pattern) => (character &  pattern) >>> 0
const _setBit   = (character, pattern) => (character |  pattern) >>> 0
const _clearBit = (character, pattern) => (character & ~pattern) >>> 0

// https://stackoverflow.com/questions/6798111/bitwise-operations-on-32-bit-unsigned-ints
const _OR  = (x,y) => (x | y) >>> 0
const _AND = (x,y) => (x & y) >>> 0
const _XOR = (x,y) => (x ^ y) >>> 0

//https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
const RED     = s => `\x1b[40m\x1b[31m${s}\x1b[0m`  //black background, red text
const YELLOW  = s => `\x1b[40m\x1b[93m${s}\x1b[0m`  //black background, yellow text
const GREEN   = s => `\x1b[40m\x1b[92m${s}\x1b[0m`  //black background, green text
const GREENBG = s => `\x1b[102m\x1b[30m${s}\x1b[0m` //green background, black text

const _DBUG = false
const TRACE = (k,v, debug=_DBUG) => {
    if(debug) console.log(k.padEnd(12),v)
}
const ENTER = (g   , debug=_DBUG) => { if(debug) console.group(YELLOW('ENTER ' + g)) }
const LEAVE = (g='', debug=_DBUG) => { if(debug) {console.groupEnd(); console.log(YELLOW('LEAVE ' + g))} }

const _NODE = (kL,kR, ...args) => { 
    [ A, c, p ] = args
    o = { kL, kR, A, c, p }
    var dumps = () => kL.toString()
    return o
}

function _assert(x, y, op='eq'){
    // console.log(x, op, y)
    exp = false
    exp ^= op === 'eq' & x === y
    exp ^= op === 'gt' & x >   y
    exp ^= op === 'ge' & x >=  y
    exp ^= op === 'lt' & x <   y
    exp ^= op === 'le' & x <=  y
    if(exp) return true
    else throw EvalError(RED(`\n${x}\nNOT ${op}\n${y}`))
}

// Convert a hex string to a byte array
function hexToBytes(hex) {
    if(hex.substr(0,2)=='0x') hex = hex.substr(2)
    if(hex.length % 2 == 1) hex = '0'+ hex
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes
}
var hexToUint8Array = hex => Uint8Array.from(hexToBytes(hex))

// Convert a byte array to a hex string
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    hex = hex.join("")
    if(hex.length % 2 == 1) hex = '0'+ hex
    return hex
}
var uint8ArrayToHex = bytes => bytesToHex(bytes)

// unint <--> hex
var uint8hex  = u => u.reduce((p,c)=>p+c.toString(16).padStart(2,'0'),'')
var uint16hex = u => u.reduce((p,c)=>p+c.toString(16).padStart(4,'0'),'')
var uint32hex = u => u.reduce((p,c)=>p+c.toString(16).padStart(8,'0'),'')
var uintN2hex = (n,u) => u.reduce((p,c)=>p+c.toString(16).padStart(n/8*2,'0'),'')

function hex2uintN(n,hex){
    if(n % 8 > 0 && n < 54) return -1 // muliple of 8 bits & less than Number.MAX_SAFE_INTEGER
    if(hex.length % 2 == 1) hex = '0' + hex
    blen = hex.length * 8 / 2
    if(blen % n > 0) hex = hex + 'xx'.repeat((n-blen%n)/8)
    regexp = new RegExp('[a-fA-Z0-9x]{'+2*n/8+'}','g')
    uintN = Array.from(hex.matchAll(regexp),m => parseInt(m[0].replace(/x/gi),16))
    return uintN
}

// Convert a hex string to a byte array
/**
 * Reverses hexadecimal string
 * @param {string} hex - Hexadecimal string
 * @returns {string} Reversed hexadecimal string
 */
function reverseHex(hex) {
    if(hex.substr(0,2)=='0x') hex = hex.substr(2)
    if(hex.length % 2 == 1) hex = '0'+ hex 
    for (var reverse = '', i=0; i < hex.length; i += 2){
        // console.log(hex.length-2-i)
        reverse += hex.substr(hex.length-2-i,2)
    }
    return reverse
}

// bits <--> hex
function hex2bits(hex) {
    if(hex.substr(0,2)=='0x') hex = hex.substr(2)
    if(hex.length % 2 == 1) hex = '0'+ hex
    for (var bits = [], c = 0; c < hex.length; c += 2){
        bits.push(parseInt(hex.substr(c, 2), 16).toString(2).padStart(8,'0'));
    }
    return bits.join('')
}

function bits2hex(bits) {
    buf = ''
    hex = ''
    while(bits.length > 0){
        buf = bits.substr(0,8)
        hex += parseInt(buf,2).toString(16).padStart(2,'0')
        bits = bits.substr(8)
        buf = ''
    }
    return hex
}

/**
 * Converts a bit string to an array of N-bit unsigned integers
 * @param   {number} n      Number of bits
 * @param   {string} bits   Bits string
 * @returns {int[]}         Array of unsigned integers
 */
function bits2uintN(n,bits) {
    uintN = []
    while(bits.length > 0){
        uintN.push(parseInt(bits.substr(0,n),2))
        bits = bits.substr(n)
    }
    return uintN
}

var uintN2bits = (n,u) => u.reduce((p,c)=>p+c.toString(2).padStart(n,'0'),'')

function hex2b32(hex){
    iambase32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    bits = hex2bits(hex)
    b32 = []
    while(bits.length > 0){
        i = parseInt(bits.substr(0,5).padEnd(5,'0'),2)
        b32.push(iambase32.substr(i,1))
        bits = bits.substr(5)
    }
    pad = ''
    if(b32.length % 8 > 0) pad = '='.repeat(8 - b32.length % 8)
    return b32.join('') + pad
}

function b32hex(b32){
    iambase32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    b32 = b32.replace(/=/gi,'')
    pad = (b32.length * 5) % 8
    bits = b32.split('').map(c => iambase32.search(c).toString(2).padStart(5,'0')).join('')
    if(pad > 0) bits = bits.substr(0, bits.length - pad)
    return bits2hex(bits)
}

function bytes2b11(bytes){
    bits = ''
    b11 = []
    for (let i=bytes.length-1; i >= 0; i--)
        bits += bytes[i].toString(2).padStart(8,0)
    while (bits != ''){
        b11.push(parseInt(bits.substr(-11),2))
        bits = bits.substr(0,bits.length-11)
    }
    return b11
}

const numsToWords = nums => nums.reduce((p,c) => [...p, bip39words[c]],[])

function randomArray(size){
    var a = []
    for (var i = 0; i < size; i++) {
        a.push(rand(0,255))
    }
    return Promise.all(a)
}

var randomHex = size => randomArray(size).then(a => uint8hex(Uint8Array.from(a)))

function bip39seed(mnemonic, passphrase='',prefix='mnemonic'){
    return new Promise(function(resolve,reject){
        seed = cp.PBKDF2(mnemonic.normalize('NFKD'), prefix+passphrase,{
            hasher: cp.algo.SHA512,
            keySize: 512 / 32,
            iterations: 2048
        })
        if (seed.length === 0) reject('Error: empty seed')
        TRACE('bip39seed',seed.toString())
        resolve(seed)
    })
}

function curveInfo(curveName){
    curves = {
    secp256k1: {
                name:'secp256k1',
                modifier: 'Bitcoin seed',
                order: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
            },
    nist256p1: {
                name:'nist256p1',
                modifier: 'Nist256p1 seed',
                order: BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551')
            },
    ed25519: {
                name:'ed25519',
                modifier: 'ed25519 seed',
            }
    }
    return curves[curveName]

}

function rootKey(seed, curve, method='slip10'){
    return new Promise((res,error)=>{
        ENTER('ROOT KEY')
        if(method==='slip10'){
            isAlive = true
            while(isAlive){
                h = hmacSHA512(seed,curve.modifier).toString()
                kL = unhexilify(h.substr(0,64))
                kR = unhexilify(h.substr(64))
                if(curve.name == 'ed25519') isAlive=false
                a = BigInt('0x'+kL)
                if(a<curve.order && a != 0) isAlive=false
                seed = unhexilify(h)
            TRACE('kL',kL.toString())
            TRACE('kR',kR.toString())
            LEAVE()
            res(_NODE(kL,kR))
            }
        } else if(method==='kholaw'){
            c = _hmac256(unhexilify('01'+seed),curve.modifier)
            I = _hmac512(seed, curve.modifier).toString()
            kL = unhexilify(I.substr(0,64))
            kR = unhexilify(I.substr(64))
            kLb = hexToBytes(kL.toString())
            while (_getBit(kLb[31], 0b00100000) !=0){
                seed = unhexilify(I)
                I = _hmac512(seed, curve.modifier).toString()
                kL = unhexilify(I.substr(0,64))
                kR = unhexilify(I.substr(64))
                kLb = hexToBytes(kL.toString())
            }

            kLb[0]  = _clearBit( kLb[0], 0b00000111)
            kLb[31] = _clearBit(kLb[31], 0b10000000)
            kLb[31] =   _setBit(kLb[31], 0b01000000)

            kL = unhexilify(bytesToHex(kLb))
            kLr = bytesToHex(kLb.reverse())

            pub  = ecCurve25519.keyFromPrivate(kLr).getPublic()
            x = pub.getX().toString('hex')
            y = pub.getY().toString('hex')
            A = encodeXY(x,y)

            TRACE('scalar', BigInt('0x'+kLr).toString(10))
            TRACE('x',x)
            TRACE('y',y)

            TRACE('kL',kL.toString())
            TRACE('kR',kR.toString())
            TRACE('A',A)
            TRACE('c',c.toString())
            LEAVE()

            res(_NODE(kL,kR,A,c))
        }
    })
}

function getPublicKey(key,curve){
    if (curve.name == 'ed25519'){
        k = '00' + bytesToHex(ecEd25519.keyFromSecret(key.toString()).getPublic())
    }
    else if(curve.name == 'secp256k1'){
        pub  = ecSECP256.keyFromPrivate(key.toString()).getPublic()
        x    = pub.getX().toString('hex') // BN -> hex
        y    = pub.getY().toString('hex') // BN -> hex
        padx = x.padStart(64,'0')
        pady = y.padStart(64,'0')
        if (BigInt('0x' + y) & 1n) {
            k = '03' + padx
        } else{
            k = '02' + padx
        }
}
    return k
}

function deriveChild(parentKey, parentChaincode, i, curve){
    return new Promise((res,error)=>{
        ENTER('DERIVE CHILD SLIP10')
        data = ''
        if(_AND(i, BIP32KEY_HARDEN)){
            data = '00' + parentKey.toString()
        } else {
            data = getPublicKey(parentKey, curve)
        }
        data += i.toString(16).padStart(8,0) //padded 4 bytes

        while(true){
            h = hmacSHA512(unhexilify(data), parentChaincode).toString()
            kL = unhexilify(h.substr(0,64))
            kR = unhexilify(h.substr(64))
            if(curve.name == 'ed25519') break
            a = BigInt('0x'+kL)
            key = (a + BigInt('0x' + parentKey)) % curve.order

            if(a<curve.order &&  key!= 0){
                kL = unhexilify(key.toString(16).padStart(64,0))
                break
            }
            data = '01' + hexilify(kR) +  i.toString(16).padStart(8,0)
        }

        pub = getPublicKey(kL,curve)

        o = _NODE(kL,kR,_,_,pub)

        TRACE('private',o.kL.toString().padStart(64,0))
        TRACE('chain',o.kR.toString().padStart(64,0))
        TRACE('public',o.p)
        LEAVE()
        res(o)
    })
}

function encodeXY(x,y){
    xb = hexToBytes(x)
    yb = hexToBytes(y)
    if(_AND(xb[31],1)){
        yb[0] = (yb[0] | 0x80) >>> 0
    }
    return bytesToHex(yb.reverse())
}

function deriveChildKhoLaw(node, i){
    ENTER('DERIVE CHILD KHO-LAW')
    return new Promise((res,error)=>{
        kLP = node.kL
        kRP = node.kR
        AP = node.A
        cP = node.c

        ib = reverseHex(i.toString(16).padStart(4*2,'0'))
        
        // TRACE('\nDERIVE CHILD KEY:','')
        TRACE('kLP',hexilify(kLP))
        TRACE('kRP',hexilify(kRP))
        TRACE('AP',AP)
        TRACE('cP',hexilify(cP))
        TRACE('i',i)
        TRACE('ib',ib)

        if(i < 2**31){
            // regular child
            Zi = '02' + AP + ib
            ci = '03' + AP + ib
            Z = _hmac512(unhexilify(Zi), cP).toString()
            c = _hmac512(unhexilify(ci), cP).toString().substr(-32*2)
            TRACE('Zi reg',Zi)
            TRACE('ci reg',ci)
        } else{
            // hardened child
            Zi = '00' + hexilify(kLP) + hexilify(kRP) + ib
            ci = '01' + hexilify(kLP) + hexilify(kRP) + ib
            Z = _hmac512(unhexilify(Zi), cP).toString().toString()
            c = _hmac512(unhexilify(ci), cP).toString().substr(-32*2)
            TRACE('Zi hard',Zi)
            TRACE('ci hard',ci)
        }
        TRACE('Z',Z)
        TRACE('c',c)

        ZL = unhexilify(Z.substr(0,28*2))
        ZR = unhexilify(Z.substr(32*2))

        // compute KRi
        kLn = BigInt('0x'+reverseHex(hexilify(ZL))) * 8n 
            + BigInt('0x'+reverseHex(hexilify(kLP)))
        
        TRACE('ZL',ZL.toString())
        TRACE('ZR',ZR.toString())
        TRACE('kLn',kLn.toString(16))

        if(kLn % ed25519_n == 0n){
            TRACE('kLn is 0','kLn % ed25519')
            res()
        }

        // compute KLi
        kRn = (
            BigInt('0x'+reverseHex(hexilify(ZR)))
          + BigInt('0x'+reverseHex(hexilify(kRP)))
             ) % 2n**256n

        TRACE('kRn',kRn.toString(16))

        kL = reverseHex(kLn.toString(16))
        kR = reverseHex(kRn.toString(16))
        TRACE('kL',kL.toString(16))
        TRACE('kR',kR.toString(16))

        pub  = ecCurve25519.keyFromPrivate(reverseHex(kL)).getPublic()

        x = pub.getX().toString('hex')
        y = pub.getY().toString('hex')
        A = encodeXY(x,y)

        TRACE('scalar', BigInt('0x'+reverseHex(kL)).toString(10))
        TRACE('x',x)
        TRACE('y',y)
        TRACE('A',A)
        LEAVE()

        o =_NODE(unhexilify(kL),unhexilify(kR),A,unhexilify(c))
        res(o)
    })
}

function algoSecret(node){
    ENTER('ALGORAND SECRET')
    return new Promise((res,error)=>{
        var { key, pub, address, chk } = algoAddress(node.kL)
        chk1 = chk
        var { words, chk } = algoMnemonic(key)
        chk2 = chk
        TRACE('key',key)
        TRACE('pub',pub)
        TRACE('pub_chk',chk1)
        TRACE('addr',address)
        TRACE('mnemo_chk',chk2)
        TRACE('words',words)
        LEAVE()
        node.algo = { key,address,words,pub,chk1,chk2 }
        res(node)
    })
}

function algoAddress(key){
    key = key.toString().padStart(64,'0')
    pub = bytesToHex(ecEd25519.keyFromSecret(key).getPublic())
    chk = hexilify(cp.SHA512t256(unhexilify(pub))).substr(0,64).substr(-8)
    address = hex2b32(pub+chk).replace(/=/g,'')
    return { key, pub, address, chk }
}

function algoMnemonic(key){
    nums = bytes2b11(hexToBytes(key))
    words = numsToWords(nums)
    chk = cp.SHA512t256(unhexilify(key)).toString().substr(0,2*2)
    chkN = bytes2b11(hexToBytes(chk))
    chkW = numsToWords(chkN)[0]
    words.push(chkW)
    return { words, chk }
}

const randomAlgoAddress = () => randomHex(32).then(ent => algoAddress(ent))

function algoKeyFromMnemonic(mnemonic){
    mnemonic = mnemonic.trim().toLowerCase().normalize('NFKD').split(' ')
    if(mnemonic.length !== 25) throw new Error('Invalid mnemonic length: expected 25 words')
    words = mnemonic.map(w => bip39words.find(bw => bw.substr(0,4)==w.substr(0,4)))
    nums = words.map(w => bip39words.findIndex(bw => bw==w))
    if(nums.length !== 25) throw new Error('Invalid mnemonic: one or more words not valid')
    // last word is the checksum:
    csN1 = nums.slice(-1)[0]
    cs1 = csN1.toString(16)
    // convert 11-bit numbers (little endian) to bits:
    bits = nums.slice(0,24).map((e,i) => e.toString(2).padStart(11,'0')).reverse().join('')
    key = reverseHex(bits2hex(bits)).substr(0,64)
    // compute the checksum to verify mnemonic:
    cs2 = cp.SHA512t256(unhexilify(key)).toString().substr(0,2*2)
    csN2 = bytes2b11(hexToBytes(cs2))[0]
    isValid = csN1 === csN2
    parsed = { 
        mnemonic:words.join(' '),
        original: mnemonic.join(' '),
        words:words,
        key:key,
        checksum:cs1, 
        valid:isValid,
    }
    return parsed
}

function algoAddressFromMnemonic(mnemonic){
    var { key, words, valid } = algoKeyFromMnemonic(mnemonic)
    if(!valid) throw new Error('Invalid mnemonic checksum')
    var { pub, address } = algoAddress(key)
    return { key, address, words, pub }
}

const range = (n,o=0) => Array.from(new Uint8Array(n).map((e,i)=>i+o))
const splitter = (s,n) => Array.from(new Uint8Array(Math.ceil(s.length/n)).map( (e,i) => i*n ) ).map(i => s.substr(i,n))

function countAddressEnding(){
    let b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.split('')
    let b32map = Object.fromEntries(new Map(b32.map(e => [e,0])))
    let endChars = range(1000).map((e,i,a) => randomAlgoAddress().then(algo => {
        if((i+1)%1000==0) console.log(i, algo.address)
        return algo.address.substr(-1)
    }))
    Promise.all(endChars).then(chars => {
        for (let i = chars.length - 1; i >= 0; i--) {
            let c = chars[i]
            b32map[c]++
        }
        console.log(b32map)
    })
}

function algoWords(key, enc='hex'){
    return new Promise((res,error)=>{
        key = key.toString().padStart(64,'0')
        pub = bytesToHex(ecEd25519.keyFromSecret(key).getPublic())
        chk = hexilify(cp.SHA512t256(unhexilify(pub))).substr(0,64).substr(-8)
        addr = hex2b32(pub+chk).replace(/=/g,'')
        nums = bytes2b11(hexToBytes(key))
        words = numsToWords(nums)
        chk = cp.SHA512t256(unhexilify(key)).toString().substr(0,2*2)
        chkN = bytes2b11(hexToBytes(chk))
        chkW = numsToWords(chkN)[0]
        words.push(chkW)
        algo = {key:key,address:addr,words:words}
        res(algo)
    })
}

function deriveSeed(seed, method, path="m/44'/283'/0'/0/0"){
    TRACE('method',method)
    TRACE('path',path)

    if(method==='bip39-seed'){
        let o = _NODE()
        o.seed = seed
        o.bip39seed = seed.toString()
        o.kL = unhexilify(seed.toString().substr(0,32*2))
        TRACE('kL',o.kL.toString().padStart(64,0))
        return algoSecret(o)
    }

    curve = curveInfo(method.split('-')[1])
    method = method.split('-')[0]

    return rootKey(seed,curve,method)
    .then(root => {
        TRACE('m_private',root.kL.toString())
        TRACE('m_chain',root.kR.toString())

        path = path.split('/')
        // path.shift(0)
        if(path.indexOf('m') === 0) [ignore, ...path] = path

        return path.reduce((p,c,i,a) => {
            return p.then(o=>{
                idx = parseInt(c)
                if (c.substr(-1) === "'") idx = _OR(idx, BIP32KEY_HARDEN)
                if (curve.name === 'ed25519' && method == 'slip10') idx = _OR(idx, BIP32KEY_HARDEN)
                currPath = a.slice(0,i+1).join('/')
                ENTER(currPath)
                TRACE('parent key',o.kL.toString())
                if(method=='slip10') return deriveChild(o.kL, o.kR, idx, curve).then(o=>{ LEAVE(''); return o })
                if(method=='kholaw') return deriveChildKhoLaw(o, idx).then(o=>{ LEAVE(''); return o })
            })
        }, Promise.resolve(root))
        .then(o=>{
            o.seed = seed
            o.bip39seed = seed.toString()
            return o
        })
    })
    .then(node => algoSecret(node))
}

function deriveMnemonic(mnemonic, method, path, passphrase=''){
    return bip39seed(mnemonic,passphrase).then(seed => deriveSeed(seed, method, path))
}

function deriveBip39Seed(seed, method, path){
    return deriveSeed(seed, method, path)
}

function prettifyWords(words){
    prettyWords = []
    row = []
    words.map((w,i)=>{
            w = ((i+1).toString().padStart(2) + '. ' + w).padEnd(15)
            row.push(w)
            if((i+1)%5==0) {
                prettyWords.push(row.join(''))
                row = []
            }
        })
    return prettyWords.join('\n')
}

function entCheckBits(ent, cs){
    chk = cp.SHA256(unhexilify(ent)).toString().substr(0,2) //get first byte
    return hex2bits(chk).substr(0,cs).padStart(cs)
}

function ent2bip39words(ent){
    cs = ent.length*8/2/32
    entChecked = hex2bits(ent).substr(0,ent.length*8/2+cs)+entCheckBits(ent,cs)
    nums = bits2uintN(11,entChecked)
    wlist = numsToWords(nums)
    return wlist
}

const randomWords = size => randomHex(size).then(r => ent2bip39words(r)).then(w => w.join(' '))

function findBip39Word(word){
    w = word.trim().toLowerCase().normalize('NFKD').substr(0,4)
    return bip39words.find(bw => bw.substr(0,4)==w)
}

function parseMnemonic(mnemonic){
    mnemonic = mnemonic.trim().toLowerCase().normalize('NFKD').split(' ')
    words = mnemonic.map(w => bip39words.find(bw => bw.substr(0,4)==w.substr(0,4)))
    nums = words.map(w => bip39words.findIndex(bw => bw==w))
    bits = uintN2bits(11,nums)
    cs = bits.length % 32
    ent = bits2hex(bits.substr(0,bits.length-cs))
    chkBits1 = bits.substr(-cs)
    chkBits2 = entCheckBits(ent, cs)
    isValid = chkBits1 === chkBits2
    parsed = { 
        mnemonic:words.join(' '),
        original: mnemonic.join(' '),
        words:words, 
        checkbits:chkBits1, 
        valid:isValid,
    }
    return parsed
}

function testMnemonicWords(word='all',size=24){
    dummyMnemonic = `${word.trim()} `.repeat(size).trim()
    mnemonic = dummyMnemonic.trim().toLowerCase().normalize('NFKD').split(' ')
    words = mnemonic.map(w => bip39words.find(bw => bw.substr(0,4)==w.substr(0,4)))
    nums = words.map(w => bip39words.findIndex(bw => bw==w))
    bits = uintN2bits(11,nums)
    cs = bits.length % 32
    ent = bits2hex(bits.substr(0,bits.length-cs))
    // chkBits = entCheckBits(ent, cs)
    return ent2bip39words(ent)
}

const compose = (...fns) => arg => fns.reduce((composed, f) => f(composed), arg)

function deriveMnemonicTest({ no, mnemonic, method, path, key, address }) {
    ENTER(`Test #${no}: ${method}`, true)
    return deriveMnemonic(mnemonic, method, path)
    .then(o=>{
        // console.log(o.algo)
        TRACE('test key', key, true)
        TRACE('test address', address, true)
        let { valid } = parseMnemonic(mnemonic)
        _assert(valid, true)
        _assert(o.algo.key, key)
        _assert(o.algo.address, address)
        console.log(prettifyWords(o.algo.words))
        TRACE(GREENBG('assertion'), GREENBG('OK'), true)
        return true
    })
    .then(done => LEAVE('', true))
}

function tests() {
    vectors = [
        { 
            no:         1,
            mnemonic:   'all all all all all all all all all all all all all all all all all all all all all all all feel',
            method:     wallets.ledger.method,
            path:       wallets.ledger.path,
            key:        '1075ab5e3fcedcb69eef77974b314cc0cbc163c01a0c354989dc70b8789a194f',
            address:    'NVGXFOROGBDBUW6CEQDX6V742PWFPLXUDKW6V7HOZHFD7GSQEB556GUZII'
        },
        { 
            no:         2,
            mnemonic:   'all all all all all all all all all all all all all all all all all all all all all all all feel',
            method:     wallets.coinomi.method,
            path:       wallets.coinomi.path,
            key:        '7b6ec191cb3b77f6593cefaddf0489af47bb65e0f4480391bcedd00caa822d11',
            address:    'NMRBZNN2RXUNVLVVPVD53GJV6A2A55QWJXMD2KG42N7NQZB67WXYFGONVA'
        },
        { 
            no:         3,
            mnemonic:   'all all all all all all all all all all all all',
            method:     wallets.exodus.method,
            path:       wallets.exodus.path,
            key:        '0c9b6a753e82afef190302853c14cdadc8d229cec3196ee464e41f0bc5c2519e',
            address:    'ZXLNDDUAYCYFXJI33HXUXLNVUTMQMSG6HRXV6JT2KNSU2SP4J7GUZG5BWU'
        },
        { 
            no:         4,
            mnemonic:   'all all all all all all all all all all all all',
            method:     wallets.atomic.method,
            path:       wallets.atomic.path,
            key:        'c76c4ac4f4e4a00d6b274d5c39c700bb4a7ddc04fbc6f78e85ca75007b5b495f',
            address:    'YQDDGDM3BKPQ5RAIYGCT7JX6DCIMVQHTHITSPJWKNLIPETB2JR6MPKC43A'
        },
        { 
            no:         5,
            mnemonic:   'bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar anxiety',
            method:     wallets.ledger.method,
            path:       wallets.ledger.path,
            key:        'c896059cbb23f5e29692ce23c5c56aeea6376ae63dfb513e03e42b75be51e646',
            address:    'KS4ACRBVNAKFAEKK5XWV5HV355FDPBRNG37VTJYU646WLAGWD26L6FSIRA'
        },
        { 
            no:         6,
            mnemonic:   'bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar anxiety',
            method:     wallets.trust.method,
            path:       wallets.trust.path,
            key:        '83fffaec238ae65b1ef4195d01d6c670348335f78ee6407e70c07cd356cd462e',
            address:    'DDVQJSNA7KMZAR3WTZXQHB53KKXHI7AGQOQSPLQL4Y5PTY7IMNTATQMTAE'
        },
        { 
            no:         7,
            mnemonic:   'dog dog dog dog dog dog dog dog dog dog dog dose',
            method:     wallets.exodus.method,
            path:       wallets.exodus.path,
            key:        '9bcbf75ea8b0997771c19e8440e3bce7675374bbe926f608cdbf671d42171966',
            address:    'QKYJ7CY3ZDJZ7GZE7FJ6S5WK5MKKTNBJBS2L7B2LUKSHSMEJWFG4KIS3FI'
        },
        { 
            no:         8,
            mnemonic:   'dog dog dog dog dog dog dog dog dog dog dog dose',
            method:     wallets.atomic.method,
            path:       wallets.atomic.path,
            key:        '0eed13381c206469210932dd7f58b0a84b9d44b1b63e9f963b0d4c4d1baead3f',
            address:    'CWEAA3OJTGY2IJOACHISLWAJNR6XMFNRLCD7MXRPFUBESTMMKSQ42XRBOI'
        },
        

    ]
    vectors.reduce((p, v, arr) => {
        return p.then(() => deriveMnemonicTest(v))
    },Promise.resolve())
    .catch(console.log)
}

const wallets = {
        atomic  :{ 'method': 'bip39-seed'      ,'path': undefined           },
        coinomi :{ 'method': 'slip10-ed25519'  ,'path': "m/44'/283'/0'/0/0" },
        exodus  :{ 'method': 'slip10-secp256k1','path': "m/44'/283'/0'/0/0" },
        ledger  :{ 'method': 'kholaw-ed25519'  ,'path': "m/44'/283'/0'/0/0" },
        trust   :{ 'method': 'slip10-ed25519'  ,'path': "m/44'/283'/0'/0/0" },
    }


//-------------------------------------------------------
//::EXAMPLE::
//-------------------------------------------------------
// mnemonic = 'all all all all all all all all all all all all all all all all all all all all all all all feel'
// deriveMnemonic(mnemonic,"slip10-ed25519", "m/44'/283'/0'/0/0")
// .then(node => console.log(node))

//-------------------------------------------------------
//::GENERATE DUMMY MNEMONICS FOR TESTING::
//-------------------------------------------------------
// console.log(testMnemonicWords('dog',12).join(' '))
// console.log(testMnemonicWords('boy',15).join(' '))
// console.log(testMnemonicWords('bar',24).join(' '))

//-------------------------------------------------------
//::RUN TEST VECTORS::
//-------------------------------------------------------
// tests()

module.exports = {
    deriveMnemonic:             deriveMnemonic,
    parseMnemonic:              parseMnemonic,
    findBip39Word:              findBip39Word,
    wallets:                    wallets,
    randomWords:                randomWords,
    randomAlgoAddress:          randomAlgoAddress,
    algoWords:                  algoWords,
    bip39seed:                  bip39seed,
    deriveBip39Seed:            deriveBip39Seed,
    prettifyWords:              prettifyWords,
    algoAddressFromMnemonic:    algoAddressFromMnemonic,
    algoKeyFromMnemonic:        algoAddressFromMnemonic,
}
