# API Reference

## Server

### una.listen(server || port)

Used to start the Una instance. Una will attach the socket.io
server to the server if it is passed in. If a port number is
passed in, a HttpServer will be launched instead.

### una.app

An express app instance attached to the Una instance.

### una.server

The curently running server instance for the Una instance.

### una.express
 
A shortcut to the express library.


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

### UnaScreen.onControllerInput(callback)

Register the controller input event with your callback. When a controller
sends a message to the screen, your callback will be called with an object
containing the following keys:
- una: The una header
- payload: The payload object that was sent by the controller

### UnaScreen.sendToController(controller_id, payload)

Sends payload to the controller identified by controller_id. You may obtain
the id of the controller by inspecting the una header of any controller event.

### UnaScreen.setRoomData(key, value)

Stores the key-value pair in the room state on the server.

### UnaScreen.getRoomData(key, callback)

Retrieve the key-value pair in the room state on the server. When the data is
ready, your callback function will be called with the following parameters:
- key: The key that was requested
- value: The value associated with the requested key

```javascript
UnaScreen.getRoomData("high_score", function(key, value) {
    console.log("The highest score is " + value); 
});
```

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

### UnaController.sendToScreen(payload)

Sends payload to the screen. 

```javascript
if (userIsShooting) {
    UnaController.sendToScreen({'shoot': true});
}
```

### UnaController.onScreenInput(callback)

Register the screen input event with your callback. When a screen sends
sends a message to this controller, your callback will be called with 
an object containing the following keys:
- una: The una header
- payload: The payload object that was sent by the screen

### UnaController.setRoomData(key, value)

Stores the key-value pair in the room state on the server.

### UnaController.getRoomData(key, callback)

Retrieve the key-value pair in the room state on the server. When the data is
ready, your callback function will be called with the following parameters:
- key: The key that was requested
- value: The value associated with the requested key


## Una Header
The Una Header object consists of the following keys:
- id: The socket.io associated with the originator of the event
- user_data: The user_data associated with the originator of the event
- room: The current room_id
- type: Either "screen" or "controller"