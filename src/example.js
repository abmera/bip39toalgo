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