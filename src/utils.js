const rand = require('random-number-csprng')

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

var randomHex = size => randomArray(size).then(a => uint8hex(Uint8Array.from(a)))

function randomArray(size){
    var a = []
    for (var i = 0; i < size; i++) {
        a.push(rand(0,255))
    }
    return Promise.all(a)
}

const range = (n,o=0) => Array.from(new Uint8Array(n).map((e,i)=>i+o))
const splitter = (s,n) => Array.from(new Uint8Array(Math.ceil(s.length/n)).map( (e,i) => i*n ) ).map(i => s.substr(i,n))
const compose = (...fns) => arg => fns.reduce((composed, f) => f(composed), arg)


module.exports = {
    hexToBytes, hexToUint8Array, bytesToHex, uint8ArrayToHex,
    uint8hex, uint16hex, uint32hex, uintN2hex,
    hex2uintN, reverseHex, hex2bits, bits2hex, 
    bits2uintN, uintN2bits, hex2b32, b32hex, 
    bytes2b11, randomHex, randomArray, range,
    splitter, compose
}