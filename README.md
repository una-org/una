# Una: 

[![Build Status](https://travis-ci.org/soedar/una.png)](https://travis-ci.org/soedar/una)

## Server
```javascript
var path = require('path');
var una = require('una').listen(3216);
var express = una.express;
var app = una.app;

app.use(express.static(path.join(__dirname, 'public')));
```

## Screen
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
UnaScreen.register('room1', 'screen');

UnaScreen.onControllerInput(function (data) {
    // controller1 says woof
    console.log(data.una.user_data + ' says ' + data.payload);
    UnaScreen.sendToController(data.una.id, data.payload + ' you too!');
});
</script>
```

## Controller
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
UnaController.register('room1', 'controller1', function(res) {
    UnaController.sendToScreen('woof');
});

UnaController.onScreenInput(function (data) {
    // screen says woof too
    console.log(data.una.user_data + ' says ' + data.payload);
});
</script>
```

## Next Steps
- Create a screenless mode, where a small game state is stored on the server, and the screen merely processes the change in the game state from the server/controller. (Means support for multiple screen woots)
- More comprehensive test cases