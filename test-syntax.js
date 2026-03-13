const fs = require('fs');
const code = fs.readFileSync('server/index.js', 'utf8');
try {
  require('vm').runInNewContext(code);
  console.log('OK');
} catch (e) {
  if (e instanceof SyntaxError) {
    console.error(e.stack);
  } else {
    console.error('Other error:', e);
  }
}
