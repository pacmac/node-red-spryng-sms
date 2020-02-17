module.exports = function(RED) {

  var request = require('request');
  const cl = console.log;
  const token = `Bearer ${process.env.spryng_token}`;
  
  function spryngMain(config) {

    function send(node,msg){
      
      var recipients = msg.topic.split(',');
      
      var options = {
        'method': 'POST',
        'url': 'https://rest.spryngsms.com/v1/messages',
        'headers': {
          'Accept'        : 'application/json',
          'Authorization' : token,
          'Content-Type'  : 'application/json'
        },
        
        body: JSON.stringify({
          "body"          : "Pete's Test Message.",
          "encoding"      : "unicode",
          "originator"    : "Spryng",
          "recipients"    : recipients,
          "route"         : "business",
          "scheduled_at"  : "2019-01-01T15:00:00+00:00"
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
            recipients  : recipients
          },
          
          topic   : msg.payload,
          _msgid  : new Date().getTime()
          
        });
      
      });
    }    
    
    
    RED.nodes.createNode(this,config);
    var node = this;
    
    node.on('input', function(msg) {
      send(node,msg);
    });
  
  }
  
  RED.nodes.registerType("spryng-sms",spryngMain);
}

