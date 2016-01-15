var cql = require('node-cassandra-cql');
var os = require('os');
var sys = require('sys')
  var exec = require('child_process').exec;
require('console-stamp')(console, {
  pattern : 'yyyy-mm-dd HH:MM:ss.l Z'
});

var config = require('./config/conftool').getConf();

// Cassandra setup
var client = new cql.Client(config.cassandra_config);
var consistency = cql.types.consistencies.quorum;

var delimiter = '##';

function processShellResults(error, stdout, stderr) {

  // Split the output by delimiter
  var command_spliter = stdout.split(delimiter);

  if (typeof command_spliter[0] == 'undefined') {
    console.log('TURN STATS SENDER [ event=%s, error=%s ]', 'Error in processing shell command results - aborting', 'spliter.0 undefined');
    return;
  }

  if (typeof command_spliter[1] == 'undefined') {
    console.log('TURN STATS SENDER [ event=%s, error=%s ]', 'Error in processing shell command results - aborting', 'spliter.1 undefined');
    return;
  }

  // Analyze network interface data
  var arr = command_spliter[0].split(" ");
  var active_connections = Math.round(arr.length / 6);
  var from_arr = arr[3].split(":");

  // Analyze process information
  var ps_arr = command_spliter[1].split(" ");
  var pid = ps_arr[1];
  var cpu_percentage = ps_arr[2];
  var mem_usage = ps_arr[3];

  var date = new Date();
  var timestamp = Math.round(date.getTime() / 1000) + date.getTimezoneOffset() * 60;
  var userId = cql.types.uuid();
  var messageId = cql.types.uuid();

  var interfaces = os.networkInterfaces();
  var server_ip = '0.0.0.0';

  // Parse IP address out of network interface output
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && alias.address !== '0.0.0.0') {
        server_ip = alias.address;
      }
    }
  }

  console.log('TURN STATS SENDER [ event=%s, server_ip=%s, active_connections=%d, pid=%s, cpu_percentage=%d, mem_usage=%s ]', 'Processing shell command results', server_ip, active_connections, pid, cpu_percentage, mem_usage);

  insertIntoDatabase([server_ip, server_ip, active_connections, pid, cpu_percentage, mem_usage, timestamp]);

}

function insertIntoDatabase(values) {

  var query = 'INSERT INTO turn_lb (server_id , turn_server_ip ,active_connections,pid,cpu_percentage,mem_usage, timestamp) VALUES (?,?,?,?,?,?,?)';

  // Insert data into database
  var queries = [{
      query : query,
      params : values
    }
  ];
  client.executeBatch(queries, consistency, function (err) {
    if (err) {
      console.log('TURN STATS SENDER [ event=%s, data=%s, error=%s ]', 'Failed to insert into database', JSON.stringify(values), JSON.stringify(err));
    } else {
      console.log('TURN STATS SENDER [ event=%s, data=%s ]', 'Successfully inserted into database', JSON.stringify(values));
    }
  });

}

// Main loop
setInterval(function () {

  var cmd = "CPU_MEM=$(ps aux|grep '[t]urnserver') && echo $(netstat -an  | grep udp &&  netstat -an  | grep tcp)" + delimiter + "$CPU_MEM";

  console.log('TURN STATS SENDER [ event=%s, command=%s ]', 'Executing shell command', cmd);

  exec(cmd, processShellResults);

}, 20000);