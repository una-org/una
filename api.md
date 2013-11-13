# API Reference

## Server

### una.listen(server || port)

Used to start the Una instance. Una will attach the socket.io
server to the server if it is passed in. If a port number is
passed in, a HttpServer will be launched instead.

### una.enableScreenless()

Enable the screenless mode.

### una.screenless.registerInitState(init_fn)

When a screen or controller joins a new room, your init_fn will be called.
Your init_fn should return the default state that the new room should have.

### una.screenless.registerOnControllerEvent(key, callback)

When a controller send a new payload keyed by key to the server, your callback
will be called with the following parameters:
- UnaServer: the UnaServer instance associated with the room
- una_header: una_header associated with the controller that sent the payload
- payload: The payload sent by the controller

### una.screenless.registerOnScreenEvent(key, callback)

When a screen send a new payload keyed by key to the server, your callback
will be called with the following parameters:
- UnaServer: the UnaServer instance associated with the room
- una_header: una_header associated with the controller that sent the payload
- payload: The payload sent by the controller

### una.setConfig(config_key, config_value)

Sets configuration key. The available keys are as follow:

- floodControlDelay : delay in milliseconds  
Discard subsequent messages that fall within miliseconds of the previous message.

### una.screenless

The screenless object. 

### una.app

An express app instance attached to the Una instance.

### una.server

The curently running server instance for the Una instance.

### una.express
 
A shortcut to the express library.

## UnaServer

### UnaServer.sendToControllers(key, payload)
Sends payload of key to all controllers from the server.

### UnaServer.sendToScreens(key, payload)
Sends payload of key to all screens from the server.

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

When the registration has been complete, your callback function will
be called with an object with the following keys:
- success: Whether the screen has registered successfully
- (optional) error: The error message if the registration has 
failed.

```javascript
UnaScreen.register('room1', 'screen', function(res) {
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

### UnaScreen.sendToController(controller_id, key, payload)

Sends payload to the controller identified by controller_id. You may obtain
the id of the controller by inspecting the una header of any controller event.

### UnaScreen.onServerInput(key, callback)

Register the server input event identified with key with your callback, 
in screenless mode. When a server sends a message to the screen, 
your callback will be called with an object containing the following keys:
- payload: The payload object that was sent by the server.

### UnaServer.sendToServer(key, payload)

Sends payload to the server, with the key.

## Controller

### UnaController.register(room_id, user_data, callback)

Register the current UnaScreen to a room_id. Optionally, you can
supply the user_data, an object that could be used to identify 
this particular controller instance, and it will be stored in the
una header.

When the registration has been complete, your callback function will
be called with an object with the following keys:
- success: Whether the controller has registered successfully
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

### UnaServer.sendToServer(key, payload)

Sends payload to the server, with key.

## Una Header
The Una Header object consists of the following keys:
- id: The socket.io associated with the originator of the event
- user_data: The user_data associated with the originator of the event
- room: The current room_id
- type: Either "screen" or "controller"