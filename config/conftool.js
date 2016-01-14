// How to set environment variable to specify config file:
//
// sudo NODE_ENV='wbrn' forever -a -l /path/to/logs.txt start /path/to/app.js

var env = process.env.NODE_ENV || 'not specified';
var local_config;

console.log( 'TURN STATS SENDER [ event=%s, datacenter=%s, file=%s ]', 'Loading configuration', env, 'config_'+env+'.js' );

var config = require('./config_'+env);

function getConf(){
  
  console.log( 'TURN STATS SENDER [ event=%s, datacenter=%s, config=%s ]', 'Successfully loaded configuration' , env, JSON.stringify(config) );
  
  if(process.env.CONFIGURATION){
    return JSON.parse(process.env.CONFIGURATION);
  } else{
    return config;
  }
}

module.exports.getConf = getConf;
module.exports.configure = function(conf){
  process.env.CONFIGURATION = JSON.stringify(conf);
};




