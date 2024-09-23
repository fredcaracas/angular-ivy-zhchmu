var crypto = require('crypto');

var cipher = crypto.createCipher('aes192', 'QaPassKey')
  var crypted = cipher.update('earlyuser','utf8','hex')
  crypted += cipher.final('hex');

  console.log(crypted);

  const decipher = crypto.createDecipher('aes192', 'TestPassKey');  
             var decrypted = decipher.update('589f577116ce6b0fd34a906a84c51724', 'hex', 'utf8');  
             decrypted += decipher.final('utf8');  

             console.log(decrypted);