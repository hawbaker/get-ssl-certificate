var https = require('https');

function isEmpty(object) {
  for (var prop in object) {
    if (object.hasOwnProperty(prop)) return false;
  }

  return true;
}

function pemEncode(str, n) {
  var ret = [];

  for (var i = 1; i <= str.length; i++) {
    ret.push(str[i - 1]);
    var mod = i % n;

    if (mod === 0) {
      ret.push('\n');
    }
  }

  var returnString = `-----BEGIN CERTIFICATE-----\n${ret.join('')}\n-----END CERTIFICATE-----`;

  return returnString;
}

function getOptions() {
  return {
    agent: false,
    rejectUnauthorized: false,
    ciphers: 'ALL'
  };
}

function handleRequest(url, options, resolve, reject) {
	if ( typeof url !== 'URL' ) url = new URL(url)
	options.hostname = url.hostname
	options.port = url.port
	options.path = url.path
  return https.get(options, res => {
    var certificate = res.socket.getPeerCertificate();

    if (isEmpty(certificate) || certificate === null) {
      reject({ message: 'The website did not provide a certificate' });
    } else {
      if (certificate.raw) {
        certificate.pemEncoded = pemEncode(certificate.raw.toString('base64'), 64);
      }
      resolve(certificate);
    }
  });
}

function get(url, timeout) {
  var options = getOptions();

  return new Promise(function(resolve, reject) {
    var req = handleRequest(url, options, resolve, reject);

    if (timeout) {
      req.setTimeout(timeout, function() {
        reject({ message: 'Request timed out.' });
        req.abort();
      });
    }

    req.on('error', function(e) {
      reject(e);
    });

    req.end();
  });
}

module.exports = {
  get: get
};
