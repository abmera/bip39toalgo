const rand = require('random-number-csprng')

/** @namespace utils */

/**
 * Convert a hex string to a byte array
 * @memberof utils
 * @param {string} hex 
 * @returns {number[]} bytes
 */
function hexToBytes(hex) {
    if(hex.substr(0,2)=='0x') hex = hex.substr(2)
    if(hex.length % 2 == 1) hex = '0'+ hex
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes
}

/**
 * Convert a byte array to a hex string
 * @memberof utils
 * @param {number[]} bytes 
 * @returns {string} hex
 */
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    hex = hex.join("")
    if(hex.length % 2 == 1) hex = '0'+ hex
    return hex
}

// unint <~> hex
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

/**
 * Reverses hexadecimal string
 * @memberof utils
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

/**
 * Converts hex string to binary bits
 * @param {string} hex 
 * @returns {string} bits
 */
function hex2bits(hex) {
    if(hex.substr(0,2)=='0x') hex = hex.substr(2)
    if(hex.length % 2 == 1) hex = '0'+ hex
    for (var bits = [], c = 0; c < hex.length; c += 2){
        bits.push(parseInt(hex.substr(c, 2), 16).toString(2).padStart(8,'0'));
    }
    return bits.join('')
}
/**
 * Converts binary bits to hex string
 * @param {string} bits 
 * @returns {string} hex
 */
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
 * Converts a bits string to an array of N-bit unsigned integers
 * @param   {number} n      Number of bits
 * @param   {string} bits   Bits string
 * @returns {number[]}   Array of N-bit unsigned integers
 */
function bits2uintN(n,bits) {
    uintN = []
    while(bits.length > 0){
        uintN.push(parseInt(bits.substr(0,n),2))
        bits = bits.substr(n)
    }
    return uintN
}

/**
 * Converts array of N-bit unsigned integers to bits string
 * @param {number} n Number of bits per number
 * @param {number[]} u Array of N-bit unsigned integers 
 * @returns {string} bits
 */
var uintN2bits = (n,u) => u.reduce((p,c)=>p+c.toString(2).padStart(n,'0'),'')

/**
 * Encodes Hex into Base32
 * @param {string} hex 
 * @returns {string} Base32 encoded string
 */
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

/**
 * Dencodes Base32 string
 * @param {string} b32 Base32 encoded string
 * @returns {string} Hex
 */
function b32hex(b32){
    iambase32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    b32 = b32.replace(/=/gi,'')
    pad = (b32.length * 5) % 8
    bits = b32.split('').map(c => iambase32.search(c).toString(2).padStart(5,'0')).join('')
    if(pad > 0) bits = bits.substr(0, bits.length - pad)
    return bits2hex(bits)
}

/**
 * Converts array of bytes into array of 11-bit numbers
 * @param {number[]} bytes Array of bytes
 * @returns {number[]} Array of 11-bit numbers
 */
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

/**
 * Generates random bytes array in hexadecimal
 * @param {number} size Number of bytes
 * @returns {string} Hex
 */
var randomHex = size => randomArray(size).then(a => uint8hex(Uint8Array.from(a)))

/**
 * Generates random bytes array using a CSPRNG module
 * @param {number} size Number of bytes
 * @returns {Promise<number[]>} Array of bytes
 */
function randomArray(size){
    var a = []
    for (var i = 0; i < size; i++) {
        a.push(rand(0,255))
    }
    return Promise.all(a)
}

/**
 * Generates array with numbers from 0 [+ offset] to N [+ offset]
 * @param {number} n     Size of array
 * @param {number} [o=0] Offset
 * @returns {Array} Array with N numbers
 */
const range = (n,o=0) => Array.from(new Uint8Array(n).map((e,i)=>i+o))

/**
 * Split string every N position
 * @param {string} s String to split
 * @param {number} n 
 * @returns {}
 */
const splitter = (s,n) => Array.from(new Uint8Array(Math.ceil(s.length/n)).map( (e,i) => i*n ) ).map(i => s.substr(i,n))

/**
 * Chains functions together and passes return 
 * value to the next function as an argument
 * @param  {...any} fns List of functions
 * @returns {any}
 * @example
 * f1 = x => x**2
 * f2 = y => y-1
 * c1 = z => compose(f1,f2)(z)
 * c1(5) // returns 24
 * c1(4) // returns 15
 */
const compose = (...fns) => arg => fns.reduce((composed, f) => f(composed), arg)

module.exports = {
    hexToBytes, bytesToHex,
    uint8hex, uint16hex, uint32hex, uintN2hex,
    hex2uintN, reverseHex, hex2bits, bits2hex, 
    bits2uintN, uintN2bits, hex2b32, b32hex, 
    bytes2b11, randomHex, randomArray, range,
    splitter, compose
}