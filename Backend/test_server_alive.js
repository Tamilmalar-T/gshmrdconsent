require('./server.js');
setTimeout(() => {
  console.log('Timeout reached. Active handles:', process._getActiveHandles().length);
}, 2000);
