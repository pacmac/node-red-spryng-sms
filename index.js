module.exports = function(RED) {

  var request = require('request');
  const cl = console.log;
  const token = `Bearer ${process.env.spryng_token}`;
  
  function spryngMain(config) {

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
          "encoding"      : msg.payload.encoding || "unicode",
          "originator"    : msg.payload.originator || "Spryng",
          "recipients"    : msg.payload.recipients,
          "route"         : msg.payload.route || "business",
          "scheduled_at"  : msg.payload.scheduled_at || "2020-01-01T15:00:00+00:00"
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
    RED.nodes.createNode(node,config);
    node.on('input', function(msg) {
      var action = msg.topic;
      send(this,msg);
    });
  
  }
  
  RED.nodes.registerType("spryng-sms",spryngMain);
}

