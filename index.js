module.exports = function(RED) {

  var debug = false;

  var request = require('request');
  const cl = console.log;
  
  function spryngMain(config) {

    function atomDate(date){
      
      function pad(val){
        return val.toString().padStart(2,'0');
      }
      
      date = date || new Date();
      var raw = (date.getTimezoneOffset()/60).toString();
      var sign = raw.slice(0,1);
      var osh = pad(raw.slice(1));
      var osm = pad((date.getTimezoneOffset()%60).toString());
      var os = `${sign}${osh}:${osm}`
      
      /* 
          '2020-01-17T19:34:18-08:00'
          Hack - the server does not use the timezone offset (-08:00)
          so hard code it and adjust into the hours.
          problem is daylight saving in NL
          Also Need another fix to allow for this, probably send bad request to get TZ-oset.
      */
      
      /* HACK START */
      sos = 1; // server TZ Offset 1 hour
      osh = date.getTimezoneOffset() / 60 + sos;
      date.setHours(date.getHours() + osh);
      date = new Date(date);
      os = '+01:00';  // Use Fixed NL Offset (needs lookup fix)
      /* HACK END */
      
      var atom = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${os}`
      cl(`@@ scheduled_at = atomDate(${atom})`);
      return atom;
    } 

    function balance(node,msg){
      var request = require('request');
      var options = {
        'method'          : 'GET',
        'url'             : 'https://rest.spryngsms.com/v1/balance',
        'headers'         : {
          'Accept'        : 'application/json',
          'Authorization' : token
        }
      };

      request(options, function (error, response) { 
        if (error) throw new Error(error);
        if(debug) cl(response.body);
        
        node.send({
          payload : {
            body        : JSON.parse(response.body)
          },
          
          topic   : msg.payload,
          _msgid  : new Date().getTime()
          
        });      
      
      });
    }

    function cancel(node,msg){

      var options = {
        'method'          : 'POST',
        'url'             : `https://rest.spryngsms.com/v1/messages/${msg.payload.message_uuid}/cancel`,
        'headers'         :   {
          'Accept'        : 'application/json',
          'Authorization' : 'Bearer xxxxxx',
          'Content-Type'  : 'application/json'
        }
      };
      
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        if(debug) (response.body);
      
      
      
      });
      
    }


    function send(node,msg){
    
      msg.payload.recipients = msg.payload.recipients.split(',');
      
      var options = {
        'method'          : 'POST',
        'url'             : 'https://rest.spryngsms.com/v1/messages',
        'headers'         : {
          'Accept'        : 'application/json',
          'Authorization' : token,
          'Content-Type'  : 'application/json'
        },
        
        body: JSON.stringify({
          "body"          : msg.payload.body || '',
          "encoding"      : msg.payload.encoding || node.encoding,
          "originator"    : msg.payload.originator || node.originator,
          "recipients"    : msg.payload.recipients || [],
          "route"         : msg.payload.route || node.route,
          "scheduled_at"  : atomDate(msg.payload.scheduled_at) || atomDate()
        })
        
      };
      
      if(debug) cl(options.body);
      
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        if(debug) console.log(response.body);
      
        /*
          {"message":"The given data was invalid.","errors":{"credits":["User has insufficient credits; Currently: 0.0 Needed: 1.2"]}}
          
          The scheduled at does not match the format Y-m-d\TH:i:sP.
          
          2020-01-01T15:00:00+00:00
        
        */
        
        node.send({
          payload : {
            body        : JSON.parse(response.body),
            recipients  : msg.payload.recipients
          },
          
          topic   : msg.topic,
          _msgid  : new Date().getTime()
          
        });
      
      });
    }    
    
    // ### MAIN
    var node = this;
    
    if(debug) console.log('@@ SPRYNG-SMS CONFIG:\n',JSON.stringify(config,null,2));
    for(var key in config){
      this[key] = config[key];
    }
    
    //if(this.token) const token = `Bearer ${this.token}`;
    const token = `Bearer ${process.env.spryng_token}`;
    
    RED.nodes.createNode(node,config);
    node.on('input', function(msg) {
      if(msg.payload.debug) debug = true;
      var action = msg.topic;
      if(action=='send') send(this,msg);
      else if(action=='balance') balance(this,msg);
    });
  
  }
  
  RED.nodes.registerType("spryng-sms",spryngMain);
}

