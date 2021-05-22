// wallet = wallets.coinomi

const { PDFDocument, StandardFonts, rgb } = PDFLib

const defaultParams = { 
  method: 'slip10-ed25519',
  path: "m/44'/283'/0'/0/0",
  mnemonic: '',
  passphrase: '',
  client: 'coinomi',
}

const clients = ['atomic','coinomi','exodus','ledger','trust','custom','search']

const STATUS = { DONE: 31401, WIP: 31402, ERR: 31403 }

const bk = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 }
const vw = () => Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = () => Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)

// Return current viewport breakpoint (xs|sm|md|lg|xl|xxl):
const D  = () => [...Object.entries(bk)].reverse().reduce((p,[k,v],i) => { if (vw() >= v && p === "na") return k; else return p },"na")

// State global variable:
var S = { d: undefined, algo: undefined, statusTimeoutId: undefined }

// const _ = undefined

var intervalId

$(document).ready(function(){
  showMnemonicTab()
  clear('all')
  S.d = D()
  updateStatus('Ready!')
})

const range = (n,o=0) => Array.from(new Uint8Array(n).map((e,i)=>i+o))

function getParams(){
  params = {
    mnemonic: $('#mnemoTxt').val(),
    method: $('#method option:checked')[0].text,
    path: getPath(),
    passphrase: $('#mnemoPass').val(),
    client: $('#clients option:checked').val(),
  }
  return params
}

function getPath(){
  path = "m"
  ip = $('.deriv-path')
  ip.map(i => {
    //console.log(ip[i].value)
    path += '/' + (parseInt(ip[i].value) ? parseInt(ip[i].value) : 0)
    if(i<3) path += "'"
  })
  return path
}

function clear(include){
  // $('#method')[0].selectedIndex = 0
  $('#bip39seed').val('')
  $('#algoAddress').val('')
  $('#algoKey').val('')
  $('#qrcode').html('')
  $('#qrcode2').html('')
  // divs = $('#algoMnemonic > div')
  // divs.map(i => divs[i].innerHTML='')
  $('.algo-secret').hide()
  $('#algoMnemonic').html('')
  S.algo = undefined
  if(include=='mnemonic' || include=='all') $('#mnemoTxt').val('')
  if(include=='lookup' || include =='all'){
    $('#lookupWhat').val('')
    $('#lookupWhat').removeClass('is-valid')
    $('#lookupWhat').removeClass('is-invalid')
    $('#lookupFeedback').html('')
  }
  if(include=='search' || include=='all'){
    $('#searchAddress').val('')
    $('#searchAddress').removeClass('is-valid')
    $('#searchAddress').removeClass('is-invalid')
    $('#searchFeedback').html('')
  }
  if(include=='all'){
    // $('#coinomi')[0].checked = true
    changeWalletClient(defaultParams.client)
  }
}

function showMnemonicTab(){
  $('#mainTitle').html('BIP39 to Algorand Mnemonic')
  $('.mnemo-tab').show()
  $('.address-tab').hide()
  $('.info-tab').hide()
  $('.tools-tab').show()
  $('#mnemoTab').addClass('active')
  $('#addressTab').removeClass('active')
  $('#infoTab').removeClass('active')
  $('#searchSection').hide()
  clear()
}

function showAddressTab(){
  $('#mainTitle').html('Find Me a Cool Address')
  $('.mnemo-tab').hide()
  $('.address-tab').show()
  $('.info-tab').hide()
  $('.tools-tab').show()
  $('#mnemoTab').removeClass('active')
  $('#addressTab').addClass('active')
  $('#infoTab').removeClass('active')
  clear('lookup')
}

function showInfoTab(){
  $('#mainTitle').html('')
  $('.mnemo-tab').hide()
  $('.address-tab').hide()
  $('.info-tab').show()
  $('.tools-tab').hide()
  $('#mnemoTab').removeClass('active')
  $('#addressTab').removeClass('active')
  $('#infoTab').addClass('active')
  // clear('lookup')
}

function updateStatus(m, s=STATUS.DONE){
  if(S.statusTimeoutId) clearTimeout(S.statusTimeoutId)
  clearStatus()
  if(s===STATUS.DONE) {
    S.statusTimeoutId = setTimeout(()=> clearStatus(), 3000)
    $("#status").addClass("text-white bg-success")
  } 
  else if(s===STATUS.WIP){
    $("#status").addClass("text-dark bg-warning")
  } 
  else if(s===STATUS.ERR){
    S.statusTimeoutId = setTimeout(()=> clearStatus(), 3000)
    $("#status").addClass("text-white bg-danger")
  } 
  else return
  $("#status").addClass('shadow-sm px-3 py-1')
  $("#status > small").html(m)
}

function clearStatus(){
  c = ['shadow-sm', 'px-3', 'py-1', 'text-white', 'text-dark',
      'bg-success', 'bg-warning', 'bg-danger']
  $("#status").removeClass(c)
  $("#status > small").html('')
  S.statusTimeoutId = undefined
}

function checkMnemonic(){
  sel = getParams()
  parsedMnemonic = ambip39toalgo.parseMnemonic(sel.mnemonic)
  // console.log(parsedMnemonic)
  if(!sel.mnemonic || sel.mnemonic == ''){
    $('#mnemoTxt').removeClass('is-valid')
    $('#mnemoTxt').removeClass('is-invalid')
  }
  else if(parsedMnemonic.valid){
    $('#mnemoTxt').addClass('is-valid')
    $('#mnemoTxt').removeClass('is-invalid')
    // $('#mnemoLbl').html('invalid mnemonic')
  } else {
    $('#mnemoTxt').addClass('is-invalid')
    $('#mnemoTxt').removeClass('is-valid')
  }
}

// function printWords(words){
//   uls = $('#algoMnemonic ul')
//   uls.map(i => uls[i].innerHTML='')
//   idx = 0
//   words.map((w,i)=>{
//     // console.log(i,w)
//     var li = document.createElement('li')
//     var sm = document.createElement('small')
//     li.classList.add('list-group-item')
//     sm.innerHTML = (i+1)+'. '+w
//     li.appendChild(sm)
//     // uls[i%5].appendChild(li)
//     uls[idx].appendChild(li)
//     if(i % 5 == 4) idx++
//   })
// }

function printWords(words){
  // divs = $('#algoMnemonic > div')
  // divs.map(i => divs[i].innerHTML='')
  $('.algo-secret').show()
  o = $('#algoMnemonic')
  o.html('')
  s = (D()==='xs' || D()==='sm') ? 2 : 5
  cols = range(s).map(i=>{
            let div = document.createElement('div')
            div.classList.add('col')
            return div
          })
  idx = 0
  words.map((w,i)=>{
    // console.log(i,w)
    let div = document.createElement('div')
    let pre = document.createElement('pre')
    let span = document.createElement('span')
    div.classList.add('row')
    // pre.classList.add('row d-inline')
    pre.innerHTML = `${(i+1).toString().padStart(2,' ')}. `
    span.innerHTML = w
    span.style.color = '#d63384' //pink
    pre.appendChild(span)
    div.appendChild(pre)
    // uls[i%5].appendChild(li)
    cols[idx].appendChild(div)
    if(s == 2 && i == 12) idx++
    if(s == 5 && i % 5 == 4) idx++
  })
  cols.forEach(c => o.append(c))
}

// Re-print words
$(window).resize(()=>{
  if(D() !== S.d) { 
    // console.log(vw(), vh(), D())
    S.d = D()
    if(S.algo) printWords(S.algo.words)
  }
})

//$("#qrcode > canvas")[0].getContext("2d").getImageData(0,0,296,296)
function printQR(words){
  algoMnemonic = {version:'1.0',mnemonic: words.join(' ')}
  $('#qrcode').html('')
  console.log(algoMnemonic)
  $('#qrcode').qrcode({
    text: JSON.stringify(algoMnemonic),
    width: 296,
    height: 296,
    // correctLevel: QRErrorCorrectLevel.Q
  })
}

function printAddressQR(address){
  // txt = {version:'1.0',address: address}
  $('#qrcode2').html('')
  $('#qrcode2').qrcode({
    text: address,
    width: 296,
    height: 296,
    // correctLevel: QRErrorCorrectLevel.Q
  })
}

function findMyCoolAddress(prefix, alive, id, tick){
  ambip39toalgo.randomAlgoAddress()
  .then(algo=>{
    alive = !algo.address.startsWith(prefix.toUpperCase())
    if(algo) $('#algoAddress').val(algo.address)
    if(!alive) {
      clearInterval(id)
      tock = Date.now()
      //console.log('time:',(tock-tick)/1000,'s')
      $('#lookupFeedback').html('<br>Address found in '+(tock-tick)/1000+' seconds')
      $('#lookupBtn').prop('disabled',false)
      $('#lookupBtnSpinner').hide()
      $('#algoKey').val(algo.key)
      ambip39toalgo.algoWords(algo.key).then(algo => {
        printWords(algo.words)
        printQR(algo.words)
        S.algo = algo
        updateStatus('Done!')
        //console.log(algo)
      })
    }
  })
}

function startLookup(prefix, alive){
  clear()
  tick = Date.now()
  updateStatus('Working...', STATUS.WIP)
  id = setInterval(()=>{
    findMyCoolAddress(prefix, alive, id, tick)
  }, 10)
  return id
}

function derivationSearch(address, seed, field, id){
  // done searching entire derivation method/path field
  if(field.length == 0) {
    return ambip39toalgo.deriveBip39Seed(seed, 'bip39-seed', "m/0'/0'/0'/0/0")
    .then(node => {
        $('#bip39seed').val(node.bip39seed)
        $('#algoAddress').val('Not found')
        $('#algoKey').val('Not found')
        updateStatus('Not found!', STATUS.ERR)
        return true
    })
    .then(done => endDerivationSearch(done, id))
  }

  method = field[0][0]
  path = field[0][1]
  field.shift()
  // console.log(field.length)
  // console.log(address)
  // console.log(seed.toString())
  ip.map(i => {
    ip[i].value = parseInt(path.split('/')[i+1])
  })
  mt = $('#method option')
  mt.map(i=>{
    if(mt[i].text==method) mt[i].selected = true
  })

  return ambip39toalgo.deriveBip39Seed(seed, method, path)
  .then(node => {
      $('#bip39seed').val(node.bip39seed)
      $('#algoAddress').val(node.algo.address)
      $('#algoKey').val(node.algo.key)
      ip = $('.deriv-path')
      // console.log(address, '=?', node.algo.address)
      if(address == node.algo.address){
        printWords(node.algo.words)
        printQR(node.algo.words)
        S.algo = node.algo
        updateStatus('Done!')
        return true
      }
      else return false
  })
  .then(done => endDerivationSearch(done, id))
}

function startDerivationSearch(address){
  clear()
  tick = Date.now()
  sel = getParams()
  updateStatus('Working...', STATUS.WIP)
  ambip39toalgo.bip39seed(sel.mnemonic, sel.passphrase,)
  .then(seed =>{
    methods = ['slip10-ed25519','slip10-secp256k1','kholaw-ed25519']
    paths = []
    field = [['bip39-seed',"m/0'/0'/0'/0/0"]]
    range(10).map(i=> range(10).map(j=> paths.push("m/44'/283'/"+i+"'/0/"+j)))
    methods.forEach(m => paths.forEach(p => field.push([m,p])))
    // console.log(paths)
    i = 0
    id = setInterval(()=>{
      derivationSearch(address, seed, field, id)
    }, 10)
    intervalId = id
  })
}

function endDerivationSearch(done, id){
  if(done) {
    clearInterval(id)
    $('#searchBtn').prop('disabled',false)
  }
}

//-------------------------------------------------------
//::CHANGE TABS::
//-------------------------------------------------------
$('#mnemoTab').on('click', () => showMnemonicTab())
$('#addressTab').on('click', () => showAddressTab())
$('#infoTab').on('click', () => showInfoTab())

//-------------------------------------------------------
//::BIP MNEMONIC - GENERATE & CLEAR::
//-------------------------------------------------------
$('#mnemoRand').on('click', function(e){
  w = parseInt($('#mnemoRandSize option:selected').val())
  s = (w*11 - (w*11) % 32)/8
  ambip39toalgo.randomWords(s).then(random => {
    $('#mnemoTxt').val(random)
    checkMnemonic()
  })
})

$('#mnemoClear').on('click', function(){
  clear('all')
  $('#mnemoTxt').removeClass('is-valid')
  $('#mnemoTxt').removeClass('is-invalid')
})

//-------------------------------------------------------
//::START DERIVATION & GET ALGORAND SECRET::
//-------------------------------------------------------
$('#startBtn').on('click', function(){
  sel = getParams()
  parsedMnemonic = ambip39toalgo.parseMnemonic(sel.mnemonic)
  if(parsedMnemonic.valid){
    $('#mnemoTxt').removeClass('is-invalid')
    $('#mnemoTxt').addClass('is-valid')
    ambip39toalgo.deriveMnemonic(sel.mnemonic, sel.method, sel.path, sel.passphrase)
    .then(node => {
        console.log(node)
        $('#bip39seed').val(node.bip39seed)
        $('#algoAddress').val(node.algo.address)
        $('#algoKey').val(node.algo.key)
        $('#mnemoTxt').val(parsedMnemonic.mnemonic)
        printWords(node.algo.words)
        printQR(node.algo.words)
        S.algo = node.algo
        updateStatus('Done!')
    })
  }
  else {
    $('#mnemoTxt').removeClass('is-valid')
    $('#mnemoTxt').addClass('is-invalid')
  }
})

$('#clearResultsBtn').on('click', () => clear())

//-------------------------------------------------------
//::CHANGE WALLET::
//-------------------------------------------------------
function printPath(path, disableIndex = -1){
  ip = $('.deriv-path')
  ip.map(i => {
    if(path) ip[i].value = parseInt(path.split('/')[i+1])
    else ip[i].value = ''
    if(i < disableIndex) ip[i].disabled = true
    else ip[i].disabled = false
  })
}

function changeMethod(method){
  mt = $('#method option')
  mt.map(i=>{
    if(mt[i].text==method) mt[i].selected = true
  })
}

function changeWalletClient(client){
  idx = clients.indexOf(client)
  if (idx === -1) throw new Error(`Client "${client}" not supported!`)
  $('#clients')[0].selectedIndex = idx
  if(client != 'custom' && client != 'search'){
    wallet = ambip39toalgo.wallets[client]
    // $('#derivationMethod').val(wallet.method)
    // $('#derivationPath').val(wallet.path)
    $('#searchSection').hide()
    $('#method').prop('disabled',true)
    if(client == 'atomic') printPath(wallet.path, 999)
    else printPath(wallet.path, 2)  
    // ip = $('.deriv-path')
    // ip.map(i => {
    //   if(wp) ip[i].value = parseInt(wp.split('/')[i+1])
    //   else ip[i].value = ''
    //   if(i<2) ip[i].disabled = true
    //   else if(client == 'atomic') ip[i].disabled = true
    //   else ip[i].disabled = false
    // })
    changeMethod(wallet.method)
    // mt = $('#method option')
    // mt.map(i=>{
    //   if(mt[i].text==wallet.method) mt[i].selected = true
    // })
  } 
  else if(client == 'custom') {
    printPath(defaultParams.path)
    $('#method').prop('disabled',false)
    $('#searchSection').hide()
  } 
  else if(client == 'search') {
    printPath(defaultParams.path, 999)
    $('#method').prop('disabled',true)
    $('#searchSection').show()
  }
  // else {
  //   ip = $('.deriv-path')
  //   ip.map(i => {
  //     ip[i].value = parseInt(defaultParams.path.split('/')[i+1])
  //     if(client == 'custom') {
  //       ip[i].disabled = false
  //       $('#method').prop('disabled',false)
  //       $('#searchSection').hide()
  //     }
  //     else if(client == 'search') {
  //       ip[i].disabled = true
  //       $('#method').prop('disabled',true)
  //       $('#searchSection').show()
  //     }
  //   })
  // }
}

$('#clients').on('change', function(e){
  // console.log(e.target.selectedOptions)
  client = e.target.selectedOptions[0].value
  changeWalletClient(client)
})

//-------------------------------------------------------
//::DERIVATION SEARCH::
//-------------------------------------------------------
$('#searchBtn').on('click', function(){
  check = checkBase32Input('#searchAddress','#searchInvalid',58, false)
  if(check > 0){
    $('#searchBtn').prop('disabled',true)
    address = $('#searchAddress').val()
    startDerivationSearch(address)
  }
})

$('#searchKill').on('click', () => endDerivationSearch(true, intervalId))

$('#searchClear').on('click', () => clear('search'))

//-------------------------------------------------------
//::MY COOL ADDRESS SEARCH::
//-------------------------------------------------------
$('#lookupBtn').on('click', function(){
  // where = $('#lookupWhere option:checked').val()
  where = 'prefix'
  what = $('#lookupWhat').val()
  console.log('lookup:', where, what)
  // check = checkLookupWhat()
  check = checkBase32Input('#lookupWhat','#lookupInvalid',6)
  if(check > 0){
    // findMyCoolAlgoAddress(what,_,_,true)
    $('#lookupFeedback').html('')
    $('#lookupBtn').prop('disabled',true)
    $('#lookupBtnSpinner').show()
    intervalId = startLookup(what,true)
  }
})

$('#lookupKill').on('click', function(){
  clearInterval(intervalId)
  $('#lookupBtn').prop('disabled',false)
  $('#lookupBtnSpinner').hide()
})

$('#lookupClear').on('click', () => clear('lookup'))

//-------------------------------------------------------
//::BIP39 MNEMONIC AUTO-COMPLETE & (IN)VALID FEEDBACK::
//-------------------------------------------------------
$('#mnemoTxt').on('keyup keydown', function(e) {
  keyCode = e.keyCode || e.which
  m = e.target.value.trim().toLowerCase().normalize('NFKD').split(' ')
  w = m.slice(-1)[0]
  // bw = undefined
  if(e.type == 'keyup' && keyCode != 9) {
    bw = ambip39toalgo.findBip39Word(w)
    if(bw) {
      $('#mnemoLbl').html(bw)
      $('#mnemoTxt').removeClass('is-invalid')
    }
    else if(w.length > 2) {
      w = m.slice(-1)[0]
      $('#mnemoLbl').html('invalid word "'+w+'"')
      $('#mnemoTxt').addClass('is-invalid')
      $('#mnemoTxt').removeClass('is-valid')
    }
  }
  else if (keyCode == 9) { 
    e.preventDefault()
    w = m.slice(-1)[0]
    bw = ambip39toalgo.findBip39Word(w)
    if(bw) e.target.value = (m.slice(0,-1).join(' ') + ' ' + bw).trim()
  } 
})

$('#mnemoTxt').on('focusout', function(e) {
  $('#mnemoLbl').html('Enter BIP39 Mnemonic (12-24 words)...')
  checkMnemonic()
})

//-------------------------------------------------------
//::ALGORAND ADDRESS (IN)VALID FEEDBACK::
//-------------------------------------------------------
function checkBase32Input(inputFieldId, invalidFeedbackId, maxLength, range = true){
  b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  inputField = $(inputFieldId)
  invalidFeedback = $(invalidFeedbackId)
  m = inputField.val().trim().toUpperCase().normalize('NFKD').split('')
  isValid = true
  if(!range && m.length != maxLength){
    inputField.removeClass('is-valid')
    inputField.addClass('is-invalid')
    invalidFeedback.html('Invalid search: please input '+maxLength+' characters (A-Z and 2-7)')
    return -1
  }
  if(m.length == 0 || m.length > maxLength){
    inputField.removeClass('is-valid')
    inputField.addClass('is-invalid')
    invalidFeedback.html('Invalid search: please input 1 to '+maxLength+' characters (A-Z and 2-7)')
    return -1
  }

  if(maxLength == 58 && m.length == 58){
    b32endings = b32.split('').reduce((p,c,i) => { if(i%4==0) p.push(c) ; return p } , [] )
    validEnding = b32endings.indexOf(m.splice(-1)[0]) >= 0
    if(!validEnding) {
      inputField.removeClass('is-valid')
      inputField.addClass('is-invalid')
      invalidFeedback.html('Invalid Algorand address, last character should be A,E,I,M,Q,U,Y or 4')
      return -1
    }
  }

  m.map((e,i,a)=>{
    isValid &= b32.search(e)>=0 
  })

  if(!isValid) {
    inputField.removeClass('is-valid')
    inputField.addClass('is-invalid')
    invalidFeedback.html('Invalid search: valid characters are A-Z and 2-7')
    return -1
  } else{
    inputField.removeClass('is-invalid')
    inputField.addClass('is-valid')
    return 1
  }
}

$('#searchAddress').on('keyup', function(e){
  checkBase32Input('#searchAddress','#searchInvalid',58)
})

$('#lookupWhat').on('keyup', function(e){
  checkBase32Input('#lookupWhat','#lookupInvalid',6)
})

//-------------------------------------------------------
//::PAPAER WALLET::
//-------------------------------------------------------
function prettifyWords(words){
    // prettyWords = []
    // row = []
    // prettyWords = range(5).map(()=>[])
    prettyWords = words.map((w,i)=>{
      w = ((i+1).toString().padStart(2) + '. ' + w).padEnd(15)
      // console.log(w)
      if(i>=20) w += '\n'
      return w
    }).map((w,i,a)=>{
      // console.log(a)
      // return a[i%5 + Math.floor(i/5)*5]
      return a[5*(i%5) + Math.floor(i/5)]
    })
    console.log(prettyWords)
    return prettyWords.join('')
}

$('#btnPDF').on('click', ()=> createPdf())

async function createPdf() {
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const page = pdfDoc.addPage()
  
  printAddressQR(S.algo.address)
  const addressCanvas = $("#qrcode2 > canvas")[0]
  const addressCanvasImageData =  addressCanvas ? addressCanvas.toDataURL(): undefined
  const addressCanvasImage = await pdfDoc.embedPng(addressCanvasImageData)
  $('#qrcode2').html('')

  const secretCanvas = $("#qrcode > canvas")[0]
  const secretCanvasImageData =  secretCanvas ? secretCanvas.toDataURL(): undefined
  const secretCanvasImage = await pdfDoc.embedPng(secretCanvasImageData)

  const addressCanvasDims = addressCanvasImage.scale(0.5)
  const secretCanvasDims = secretCanvasImage.scale(0.7)

  const fontSize = 11

  height = page.getHeight() - 4 * fontSize
  txt = `ALGORAND OFFLINE PAPER WALLET
Use this wallet as a cold storage option. Import the wallet address as a view-only account in
the official Algorand app. Your secret will be completely offline. Store in a secure place!`

  page.drawText(txt, {
    x: 50,
    y: height,
    size: fontSize,
    font: helveticaFont,
    // color: rgb(0, 0.53, 0.71),
    color: rgb(0,0,0)
  })

  txt = `Wallet Address\n`
  height = height - 8 * fontSize
  page.drawText(txt, {
    x: 50,
    y: height,
    size: fontSize,
    font: helveticaFont,
    // color: rgb(0, 0.53, 0.71),
    color: rgb(0,0,0)
  })

  txt = `${S.algo.address}\n`
  height = height - 2 * fontSize
  page.drawText(txt, {
    x: 50,
    y: height,
    size: fontSize,
    font: courierFont,
    // color: rgb(0, 0.53, 0.71),
    color: rgb(214/255,51/255,132/255)
  })

  // var page = pdfDoc.addPage()
  height = height - 2 * fontSize - addressCanvasDims.height
  page.drawImage(addressCanvasImage, {
    x: page.getWidth() / 2 - addressCanvasDims.width / 2, // center horizontally
    // y: page.getHeight() / 2 - addressCanvasDims.height / 2 + 250,
    y: height,
    width: addressCanvasDims.width,
    height: addressCanvasDims.height,
  })

  txt = `Wallet Secret\n`
  height = height - 4 * fontSize
  page.drawText(txt, {
    x: 50,
    y: height,
    size: fontSize,
    font: helveticaFont,
    // color: rgb(0, 0.53, 0.71),
    color: rgb(0,0,0)
  })

  txt = prettifyWords(S.algo.words)
  height = height - 2 * fontSize
  page.drawText(txt, {
    x: 50,
    y: height,
    size: fontSize,
    font: courierFont,
    // color: rgb(0, 0.53, 0.71),
    color: rgb(214/255,51/255,132/255)
  })

  height = height - 11 * fontSize - secretCanvasDims.height
  page.drawImage(secretCanvasImage, {
    x: page.getWidth() / 2 - secretCanvasDims.width / 2, // center horizontally
    // y: page.getHeight() / 2 - addressCanvasDims.height / 2 + 250,
    y: height,
    width: secretCanvasDims.width,
    height: secretCanvasDims.height,
  })



  height = height - 1 * fontSize

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()

  // Trigger the browser to download the PDF document
  download(pdfBytes, `${S.algo.address}.pdf`, "application/pdf");
}

//-------------------------------------------------------
//::COPY ON CLICK LISTENERS::
//-------------------------------------------------------

$('#bip39seed, #algoAddress, #algoKey').on('click',e=>{ 
  // console.log(e.target.value)
  if(e.target.value || e.target.value !== ''){
    e.target.select()
    e.target.setSelectionRange(0, 99999) /* For mobile devices */
    document.execCommand('copy')
    updateStatus('Copied')
  }
})