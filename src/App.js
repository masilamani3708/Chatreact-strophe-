import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import $ from 'jquery';
import {Helmet} from "react-helmet";
import  { Strophe, $pres, $iq, $msg , mydomain } from 'strophe.js'
const Demo = props => (
<div className="application">
            <Helmet>
            <script data-require="jquery" data-semver="2.1.4" src="https://code.jquery.com/jquery-2.1.4.js"></script>
  <script src='//cdnjs.cloudflare.com/ajax/libs/strophe.js/1.2.3/strophe.min.js'></script>
  <script src='//cdn.jsdelivr.net/npm/strophejs-plugin-muc@1.1.0/lib/strophe.muc.min.js'></script>
            </Helmet>
            
        </div>
  
);

let chat1 = [
  {
      text: " Syncfusion",
      contact: "Hi, welcome to chat"
      
  }
  
];

var server = 'localhost';
var BOSH_SERVICE = 'wss://localhost:5443/ws/';
var ROOM = 'chatroom@conference.' + server;
var ROOM_SERVICE = 'conference.' + server;
var connection = null;
function log(msg) {
  $('#log').append('<div></div>').append(document.createTextNode(msg));
  console.log(msg);
}

function onConnect(status) {
  if (status === Strophe.Status.CONNECTING) {
    log('Strophe is connecting.');
  } else if (status === Strophe.Status.CONNFAIL) {
    log('Strophe failed to connect.');
    $('#connect').get(0).value = 'connect';
  } else if (status === Strophe.Status.DISCONNECTING) {
    log('Strophe is disconnecting.');
  } else if (status === Strophe.Status.DISCONNECTED) {
    log('Strophe is disconnected.');
    $('#connect').get(0).value = 'connect';
  } else if (status === Strophe.Status.CONNECTED) {
    log('Strophe is connected.');
    $('#to').get(0).value = connection.jid; // full JID
    // set presence
    connection.send($pres());
    // set handlers
    connection.addHandler(onMessage, null, 'message', null, null, null);
    connection.addHandler(onSubscriptionRequest, null, "presence", "subscribe");
    connection.addHandler(onPresence, null, "presence");
    
    listRooms();
  }
}
function onMessage(msg) {
  var to = msg.getAttribute('to');
  var from = msg.getAttribute('from');
  var type = msg.getAttribute('type');
  var elems = msg.getElementsByTagName('body');

  if (type === "chat" && elems.length > 0) {
    var body = elems[0];
    log('CHAT: I got a message from ' + from + ': ' + Strophe.getText(body));
  }
  // we must return true to keep the handler alive.  
  // returning false would remove it after it finishes.
  return true;
}

function sendMessage(msg) {
  log('CHAT: Send a message to ' + $('#to').get(0).value + ': ' + msg);

  var m = $msg({
    to: $('#to').get(0).value,
    from: $('#jid').get(0).value,
    type: 'chat'
  }).c("body").t(msg);
  connection.send(m);
}
function setStatus(s) {
  log('setStatus: ' + s);
  var status = $pres().c('show').t(s);
  connection.send(status);
}

function subscribePresence(jid) {
  log('subscribePresence: ' + jid);
  connection.send($pres({
    to: jid,
    type: "subscribe"
  }));
}

function getPresence(jid) {
  log('getPresence: ' + jid);
  var check = $pres({
    type: 'probe',
    to: jid
  });
  connection.send(check);
}

function getRoster() {
  log('getRoster');
  var iq = $iq({
    type: 'get'
  }).c('query', {
    xmlns: 'jabber:iq:roster'
  });
  connection.sendIQ(iq, rosterCallback);
}

function rosterCallback(iq) {
  log('rosterCallback:');
  $(iq).find('item').each(function() {
    var jid = $(this).attr('jid'); // The jabber_id of your contact
    // You can probably put them in a unordered list and and use their jids as ids.
    log('	>' + jid);
  });
}

function onSubscriptionRequest(stanza) {
  if (stanza.getAttribute("type") === "subscribe") {
    var from = $(stanza).attr('from');
    log('onSubscriptionRequest: from=' + from);
    // Send a 'subscribed' notification back to accept the incoming
    // subscription request
    connection.send($pres({
      to: from,
      type: "subscribed"
    }));
  }
  return true;
}
function onPresence(presence) {
  log('onPresence:');
  var presence_type = $(presence).attr('type'); // unavailable, subscribed, etc...
  var from = $(presence).attr('from'); // the jabber_id of the contact
  if (!presence_type) presence_type = "online";
  log('	>' + from + ' --> ' + presence_type);
  if (presence_type !== 'error') {
    if (presence_type === 'unavailable') {
      // Mark contact as offline
    } else {
      var show = $(presence).find("show").text(); // this is what gives away, dnd, etc.
      if (show === 'chat' || show === '') {
        // Mark contact as online
      } else {
        // etc...
      }
    }
  }
  return true;
}
function listRooms() {
  connection.muc.listRooms(mydomain, function(msg) {
    log("listRooms - success: ");
    $(msg).find('item').each(function() {
      var jid = $(this).attr('jid'),
        name = $(this).attr('name');
      log('	>room: ' + name + ' (' + jid + ')');
    });
  }, function(err) {
    log("listRooms - error: " + err);
  });
}
function enterRoom(room) {
  log("enterRoom: " + room);
  connection.muc.init(connection);
  connection.muc.join(room, $('#jid').get(0).value, room_msg_handler, room_pres_handler);
  //connection.muc.setStatus(room, $('#jid').get(0).value, 'subscribed', 'chat');
}

function room_msg_handler(a, b, c) {
  log('MUC: room_msg_handler');
  return true;
}

function room_pres_handler(a, b, c) {
  log('MUC: room_pres_handler');
  return true;
}

function exitRoom(room) {
  log("exitRoom: " + room);
  //TBD
}

function rawInput(data) {
  console.log('RECV: ' + data);
}

function rawOutput(data) {
  console.log('SENT: ' + data);
}
function listTemplate(data) {
  const sendertemplate = (<div className="settings">
     
  <div id="content">
    <div className="name">{data.text}</div>
    <div id="info">{data.contact}</div>
  </div>
  
</div>);
  const receivertemplate = (<div className="settings">
       
  <div id="content1">
    <div className="name1">{data.text}</div>
    <div id="info1">{data.contact}</div>
  </div>
 
</div>);
 var height = document.getElementById('List').scrollHeight;
 document.getElementById('List').scrollTop = height;
  return <div>{receivertemplate} </div>;
}
$(document).ready(function() {

  $('#jid').get(0).value = "mani@localhost";
  $('#pass').get(0).value = "mani";

  $('#connect').bind('click', function() {
    var url = BOSH_SERVICE;
    connection = new Strophe.Connection(url);
    connection.rawInput = rawInput;
    connection.rawOutput = rawOutput;
    var button = $('#connect').get(0);
    if (button.value === 'connect') {
      button.value = 'disconnect';
      connection.connect($('#jid').get(0).value, $('#pass').get(0).value, onConnect);
    } else {
      button.value = 'connect';
      connection.disconnect();
    }
  });
  $('#send').bind('click', function() {
    var msg = $('#msg').val();
    var new1 = {text:msg,contact:'text'};
    // chat.push(new1);
    // setChat(chat);
    sendMessage(msg);
  });

  $('#btnGetPres').bind('click', function() {
    var jid = $('#to').val();
    getPresence(jid);
  });

  $('#btnSubPres').bind('click', function() {
    var jid = $('#to').val();
    subscribePresence(jid);
  });

  $('#btnRoster').bind('click', function() {
    getRoster();
  });

  $('#btnAway').bind('click', function() {
    setStatus('away');
  });

  $('#room').val(ROOM);

  $('#btnEnter').bind('click', function() {
    enterRoom($('#room').val());
  });

  $('#btnExit').bind('click', function() {
    exitRoom($('#room').val());
  });

});


function App() {
const [ chat, setChat ] = useState([]);
  return (
    <div>
    <div className="container">
    <div id='login' class="panel panel-default">
      <div className="panel-heading">Login</div>
      <form name='cred' className="panel-body">
        <div className="form-group">
          <label for='jid'>Username (JID):</label>
          <input type='text' id='jid' />
        </div>
        <div className="form-group">
          <label for='pass'>Password:</label>
          <input type='password' id='pass' />
        </div>
        <input type='button' id='connect' value='connect' />
      </form>
    </div>
    <div id='chat' className="panel panel-default">
      <div className="panel-heading">Chat O2O</div>
      <form name='chat' class="panel-body">
        <div className="form-group">
          <label for='msg'>msg:</label>
          <input type='text' id='msg' />
        </div>
        <div className="form-group">
          <label for='to'>to:</label>
          <input type='text' id='to' />
        </div>
        <input type='button' id='send' value='send' />
      </form>
    </div>
    <div id='rooms' class="panel panel-default">
      <div className="panel-heading">Rooms</div>
      <form name='rooms' class="panel-body">
        <label for='room'>room:</label>
        <input type='text' id='room' value='' />
        <input type='button' id='btnEnter' value='enter' />
        <input type='button' id='btnExit' value='exit' />
      </form>
    </div>
    <div id='presence' class="panel panel-default">
      <div className="panel-heading">Presence</div>
      <form name='presence' className="panel-body">
        <input type='button' id='btnGetPres' value='getPres' />
        <input type='button' id='btnSubPres' value='subscribePres' />
        <input type='button' id='btnRoster' value='getRoster' />
        <input type='button' id='btnAway' value='setAway' />
      </form>
    </div>
    <b>Trace:</b>
    <div id='log'></div>
    </div>
     <div className='listview'>
     <ListViewComponent id="List" dataSource={chat1} headerTitle=" Syncfusion Chat" showHeader={true} template={listTemplate} />
</div>
</div>

  );
}

export default App;
