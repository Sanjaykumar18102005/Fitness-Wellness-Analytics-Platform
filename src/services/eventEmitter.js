const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const eventEmitter = new AppEventEmitter();

module.exports = eventEmitter;
