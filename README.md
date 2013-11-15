# Una: 

[![Build Status](https://travis-ci.org/soedar/una.png)](https://travis-ci.org/soedar/una)

## Screen-Controller Mode

### Server
```javascript
var path = require('path');
var una = require('una').listen(3216);
var express = una.express;
var app = una.app;

app.use(express.static(path.join(__dirname, 'public')));
```

### Screen
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
UnaScreen.register('room1', {name: 'screen'});

UnaScreen.onControllerInput('controller_msg', function (data) {
    // controller1 says woof
    console.log(data.una.user_data.name + ' says ' + data.payload);
    UnaScreen.sendToController(data.una.id, 'screen_msg', data.payload + ' you too!');
});
</script>
```

### Controller
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
UnaController.register('room1', {name: 'controller1'}, function(res) {
    UnaController.sendToScreen('controller_msg', 'woof');
});

UnaController.onScreenInput('screen_msg', function (data) {
    // screen says woof too
    console.log(data.una.user_data.name + ' says ' + data.payload);
});
</script>
```

## Screenless (Screen-Server-Controller) Mode

### Server
```javascript
var una = require('una');

// Enable screenless mode
una.enableScreenless();

una.screenless.registerInitState({count: 0});

una.screenless.registerOnControllerInput('add_count', function(UnaServer, una_header, payload) {
    var state = UnaServer.getState();
    state.count++;
    UnaServer.sendToServers('increment_count'); 
});

una.listen(3216);
```

### Screen
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
var count = -1;
UnaScreen.register('room1', {name: 'screen'}, function(res) {
    count = res.payload.count;
    console.log('Current count :' + count);

});

UnaScreen.onServerInput('increment_count', function(res) {
    count++;
    console.log('Current count :' + count);
});
</script>
```

### Controller
```html
<script src='/socket.io/socket.io.js'></script>
<script src='/una_js/una.js'></script>

<script>
var addCount = function() {
    UnaController.sendToServer('add_count');
}

UnaController.register('room1', {name: 'controller1'}, function(res) {
    addCount();
});
</script>
```

## Next Steps
- More comprehensive test cases