module.exports = function(RED) {

  var request = require('request');
  const cl = console.log;
  
  
  function spryngMain(config) {

    console.log('@@@@@')
    console.log(config);
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
          "scheduled_at"  : msg.payload.scheduled_at || new Date().toISOString()
        })
        
      };
      
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        console.log(response.body);
        
        /*
          {"message":"The given data was invalid.","errors":{"credits":["User has insufficient credits; Currently: 0.0 Needed: 1.2"]}}
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

