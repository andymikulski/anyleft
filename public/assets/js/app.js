define(["require", "exports", 'BurgerMenu'], function (require, exports, BurgerMenu) {
    /**
    * Application class. Starts the app.
    * @class App
    */
    var App = (function () {
        function App() {
            var app = this;
            app.init();
        }
        App.prototype.init = function () {
            new BurgerMenu($('[data-widget="burgerMenu"]'));
        };
        return App;
    })();
    // yuck
    window['_'] = window['highland'] || {};
    new App();
    return App;
});
