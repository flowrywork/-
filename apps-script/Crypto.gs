var PBKDF2_ITERATIONS = 600000;

function bytesToHex_(bytes) {
  return bytes.map(function (value) { var n = value < 0 ? value + 256 : value; return ("0" + n.toString(16)).slice(-2); }).join("");
}

function randomHex_(length) {
  var out = "";
  while (out.length < length) out += Utilities.getUuid().replace(/-/g, "");
  return out.slice(0, length);
}

// PBKDF2-HMAC-SHA256. Apps Script has no native PBKDF2 primitive, so the
// derived value is calculated with its verified HMAC implementation.
function pbkdf2_(password, salt, iterations) {
  var block = Utilities.newBlob(salt).getBytes().concat([0,0,0,1]);
  var u = Utilities.computeHmacSha256Signature(block, password);
  var result = u.slice();
  for (var i = 1; i < iterations; i++) {
    u = Utilities.computeHmacSha256Signature(u, password);
    for (var j = 0; j < result.length; j++) result[j] ^= u[j];
  }
  return bytesToHex_(result);
}

function hashPassword_(password, salt) { return pbkdf2_(password, salt, PBKDF2_ITERATIONS); }
function safeEqual_(left, right) {
  left = String(left); right = String(right); var diff = left.length ^ right.length;
  for (var i = 0; i < Math.max(left.length, right.length); i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return diff === 0;
}
