var ErrorLogger = {
    log: function log() {}
};
if (console && console.log) {
    ErrorLogger.log = function() {
        console.log.apply(console, arguments);
    }
}
export default ErrorLogger;