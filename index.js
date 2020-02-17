module.exports = function(RED) {

  var request = require('request');
  const cl = console.log;
  function spryngMain(config) {

    this.atomDate = function(date){
      // '2020-01-17T19:34:18-08:00'
      function pad(val){
        return val.toString().padStart(2,'0')
      }
      date = date || new Date();
      var raw = (date.getTimezoneOffset()/60).toString();
      var sign = raw.slice(0,1);
      var osh = pad(raw.slice(1));
      var osm = pad((date.getTimezoneOffset()%60).toString());
      var os = `${sign}${osh}:${osm}`
      return `${date.getFullYear()}-${pad(date.getMonth())}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${os}`;
    } 

    console.log('@@ SPRYNG-SMS CONFIG:')
    for(var key in config){
      this[key] = config[key];
      console.log(key,config[key]);
    }

    function send(node,msg){
    
      msg.payload.recipients = msg.payload.recipients.split(',');
      
      var options = {
        'method': 'POST',
        'url': 'https://rest.spryngsms.com/v1/messages',
        'headers': {
          'Accept'        : 'application/json',
          'Authorization' : token,
          'Content-Type'  : 'application/json'
        },
        
        body: JSON.stringify({
          "body"          : msg.payload.body,
          "encoding"      : msg.payload.encoding || node.encoding,
          "originator"    : msg.payload.originator || node.originator,
          "recipients"    : msg.payload.recipients,
          "route"         : msg.payload.route || node.route,
          "scheduled_at"  : node.atomDate(msg.payload.scheduled_at) || node.atomDate()
        })
        
      };
      
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        console.log(response.body);
      
        /*
          {"message":"The given data was invalid.","errors":{"credits":["User has insufficient credits; Currently: 0.0 Needed: 1.2"]}}
          
          The scheduled at does not match the format Y-m-d\TH:i:sP.
          
          '2020-02-17T10:57:55.901Z'
          2020-01-01T15:00:00+00:00
        
        */
        
        node.send({
          payload : {
            body        : JSON.parse(response.body),
            recipients  : msg.payload.recipients
          },
          
          topic   : msg.payload,
          _msgid  : new Date().getTime()
          
        });
      
      });
    }    
    
    var node = this;
    //if(this.token) const token = `Bearer ${this.token}`;
    const token = `Bearer ${process.env.spryng_token}`;
    
    RED.nodes.createNode(node,config);
    node.on('input', function(msg) {
      var action = msg.topic;
      send(this,msg);
    });
  
  }
  
  RED.nodes.registerType("spryng-sms",spryngMain);
}

