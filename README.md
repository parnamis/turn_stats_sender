### TURN STATS SENDER

Node.js app that periodically collects utilization information about the number of connections and CPU and RAM usage of the host it is running on it and pushes this data to a Cassandra cluster.
This app is part of the TURN server deployment and is deployed on every TURN server instance suppoprting the webrtc infrastructure.


### Prerequsites

git
node.js
forever
Cassandra

/opt/logs directory (writeable by the user account that will run the server process)


The installation instructions for these items is beyond the scope of this readme file.



### Installation and configuration 


```
cd /opt/
sudo git clone https://YOUR_GIT_USERNAME@github.com/CommsOps/turn_stats_sender.git
cd /opt/turn_stats_sender
sudo npm install
```


Configuration files for are stored in the  /config folder. Every logical data center location should have its own configuration file.  If necessary, create a new configuration file with an appropriate environment or data center suffix. (for example, wbrn, stg, qa2)


Sample configuration:

```
module.exports = { 

  cassandra_config : {
    hosts : ['YOUR_CASSANDRA_HOST_IP'],
    keyspace : 'turn_stats_db'
  }
  
}
```

Explanation:

hosts:  the IP address of the Cassandra host where data will be inserted

keyspace:  the Cassandra keyspace (database) name


### Execution

The init script is located in the scripts directory of this repository.  It will need to be modified to load the correct configuration file. 

The environment variable NODE_ENV needs to be set with an environment name that matches its corresponding config in config. For example, to load config_wbrn.js set NODE_ENV to "wbrn", to load config_qa2.js set NODE_ENV to "qa2".   


First, install the init script as follows:

```
sudo cp /opt/turn_stats_sender/script/turn_stats_sender /etc/init.d/turn_stats_sender
sudo chmod +x /etc/init.d/turn_stats_sender
sudo chkconfig --add turn_stats_sender
sudo chkconfig --level 35 turn_stats_sender on
```

Then, edit the /etc/init.d/turn_stats_sender script on line 17 to set the NODE_ENV variable to match your environment. 


To start the service:
```
sudo service turn_stats_sender start
```

To stop the service:
```
sudo service turn_stats_sender stop
```


### Verification

First, verify that the application is correctly generating a log file in and is not logging exceptions such as node.js missing module exceptions or Cassandra database connection exceptions. 

```
cat /opt/logs/turn_stats_sender_log.txt
```

Second, verify that the turn api webserver is returning the information placed in the database by the stats sender. To verify, check the following URL endpoint in a web browser:

```
http://YOUR_TURN_API_HOST_NAME:8080/getTURNServerArray
```









