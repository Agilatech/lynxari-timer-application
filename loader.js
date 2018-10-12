module.exports = function(server) {
  
  const config = require('./config');
  const timer = require('./timer');

  config.requests.forEach((command) => {
  	new timer(server, command);    
  });
  
}
