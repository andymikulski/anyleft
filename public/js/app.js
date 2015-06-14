define(["require", "exports"], function (require, exports) {
    /**
    * Application class. Starts the app.
    * @class App
    */
    var App = (function () {
        function App() {
            console.log('hello');
            return;
        }
        App.prototype.init = function () {
            return;
        };
        return App;
    })();
    // yuck
    window['_'] = window['highland'] || {};
    new App();
    return App;
});
