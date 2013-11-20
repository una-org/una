# API Reference

## Server

### una.listen(server || port)

Used to start the Una instance. Una will attach the socket.io
server to the server if it is passed in. If a port number is
passed in, a HttpServer listening at the port will be launched instead.

### una.enableServerMode()

Enable the server mode.

### una.server_mode.registerInitState(init_state)

When a screen or controller joins a new room, the initial state will be the
JSON object init_state.

```javascript
una.enableServerMode()
una.server_mode.registerInitState({tomato: 0, potato: 0});
```

### una.server_mode.registerOnControllerEvent(key, callback)

When a controller send a new payload keyed by key to the server, your callback
will be called with the following parameters:
- UnaServer: the UnaServer instance associated with the room
- una_header: una_header associated with the controller that sent the payload
- payload: The payload sent by the controller

```javascript
una.server_mode.registerOnControllerEvent('vote', function(UnaServer, una_header, payload) {
    var state = UnaServer.getState(); 
    if (payload.type == 'tomato')
        state.tomato++;
    else if (payload.type == 'potato') 
        state.potato++;
});
```

### una.server_mode.registerOnScreenEvent(key, callback)

When a screen send a new payload keyed by key to the server, your callback
will be called with the following parameters:
- UnaServer: the UnaServer instance associated with the room
- una_header: una_header associated with the controller that sent the payload
- payload: The payload sent by the controller

```javascript
una.server_mode.registerOnScreenEvent('reset', function(UnaServer, una_header, payload) {
    var state = UnaServer.getState();
    state.tomato = 0;
    state.potato = 0; 
});
```

### una.set(config_key, config_value)

Sets configuration key. The available keys are as follow:

- floodControlDelay : delay in milliseconds  
Discard subsequent messages that fall within miliseconds of the previous message. 

### una.app

An express app instance attached to the Una instance.

### una.httpServer

The curently running http server instance for the Una instance.

### una.express
 
A shortcut to the express library.

## UnaServer

### UnaServer.sendToControllers(key, payload)
Sends payload of key to all controllers from the server.
```javascript
UnaScreen.sendToControllers('game_end', {winner: 'tomato'});
```

### UnaServer.sendToScreens(key, payload)
Sends payload of key to all screens from the server.
```javascript
UnaScreen.sendToControllers('clear_screen', null);
```

### UnaServer.getState()
Returns the current room state associated with the UnaServer instance.

### UnaServer.setState(new_state)
Set the new state associated with the UnaServer instance.

## Screen

### UnaScreen.register(room_id, user_data, callback)

Register the current UnaScreen to a room_id. Optionally, you can
supply the user_data, an object that could be used to identify 
this particular screen instance, and it will be stored in the
una header.

Your user_data should be a JSON object identifying the screen instance.

When the registration has been complete, your callback function will
be called with an object with the following keys:
- success: Whether the screen has registered successfully
- (in server mode) state: The current state of the room at the moment
the screen joins.
- (optional) error: The error message if the registration has 
failed.

```javascript
UnaScreen.register('room1', {name: 'screen'}, function(res) {
    if (res.success) {
        // Screen has registered successfully
    }
});
```

### UnaScreen.onControllerJoin(callback)

Register the controller join event with your callback. When a new
controller has joined the Screen, your callback function will be 
called with an object containing the following keys:
- una: The una header

Your callback should return true if you wish to accept the controller.
This allows you to limit the number of controllers that your screen can
handle at any time.

The default implementation will always accept any incoming controllers up
till the limit imposed by the server.

```javascript
var player_ids = [];
UnaScreen.onControllerJoin(function(data) {    
    if (player_ids.length > 2)
        return false;
    player_ids.push(data.una.id);
    return true;
});
```

### UnaScreen.onControllerLeave(callback)

Register the controller leave event with your callback. When a new
controller has joined the Screen, your callback function will be 
called with an object containing the following keys:
- una: The una header

```javascript
var player_ids = [];
UnaScreen.onControllerLeave(function(data) {    
    var index = player_ids.indexOf(data.una.id);
    player_ids.slice(index, 1);
});
```

### UnaScreen.onControllerInput(key, callback)

Register the controller input event associated with key with your callback. 
When a controller sends a message to the screen, your callback will be called 
with an object containing the following keys:
- una: The una header
- payload: The payload object that was sent by the controller

```javascript
UnaScreen.onControllerInput('move', function(res) {
    console.log('Moving ninja ' + res.una.user_data.name + ' in the ' + res.payload.direction);
});
```

### UnaScreen.sendToController(controller_id, key, payload)

Sends payload to the controller identified by controller_id. You may obtain
the id of the controller by inspecting the una header of any controller event.

```javascript
UnaScreen.sendToController(ctrl_id, 'disable', {button: 'shoot'});
```

### UnaScreen.onServerInput(key, callback)

Register the server input event identified with key with your callback, 
in server mode. When a server sends a message to the screen, 
your callback will be called with an object containing the following keys:
- payload: The payload object that was sent by the server.

```javascript
UnaScreen.onServerInput('clear_screen', function(res) {
    // Clear the screen 
});
```

### UnaScreen.sendToServer(key, payload)

Sends payload to the server, with the key.

```javascript
UnaScreen.sendToServer('reset', null);
```

## Controller

### UnaController.register(room_id, user_data, callback)

Register the current UnaScreen to a room_id. Optionally, you can
supply the user_data, an object that could be used to identify 
this particular controller instance, and it will be stored in the
una header.

Your user_data should be a JSON object identifying the controller instance.

When the registration has been complete, your callback function will
be called with an object with the following keys:
- success: Whether the controller has registered successfully
- (in server mode) state: The current state of the room at the moment
the screen joins.
- (optional) error: The error message if the registration has 
failed.

Note that for controllers, registration is only complete after the Screen
has accepted the controller's registration request.

```javascript
var ctrl_info = {'name': 'Foxy', 'color': blue};
UnaController.register('room1', ctrl_info, function(res) {
    if (res.success) {
        // Controller has registered successfully
    }
});
```

### UnaController.sendToScreen(key, payload)

Sends payload to the screen. 

```javascript
if (userIsShooting) {
    UnaController.sendToScreen('shoot', true);
}
```

### UnaController.onScreenInput(key, callback)

Register the screen input event with your callback. When a screen sends
sends a message to this controller, your callback will be called with 
an object containing the following keys:
- una: The una header
- payload: The payload object that was sent by the screen

### UnaController.onServerInput(key, callback)

Register the server input event identified with key with your callback, 
in screenless mode. When a server sends a message to your controller, 
your callback will be called with an object containing the following keys:
- payload: The payload object that was sent by the server.

### UnaController.sendToServer(key, payload)

Sends payload to the server, with key.

```javascript
UnaController.sendToServer('vote', {type: 'tomato'});
```

## Una Header
The Una Header object consists of the following keys:
- id: The socket.io associated with the originator of the event
- user_data: The user_data associated with the originator of the event
- room: The current room_id
- type: Either "screen", "controller" or "server"
