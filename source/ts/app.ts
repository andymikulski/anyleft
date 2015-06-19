declare var $: any;
import BurgerMenu = require('BurgerMenu');

export = App;
/**
* Application class. Starts the app.
* @class App
*/
class App {

  constructor() {
	  var app = this;

	  app.init();
  }

  public init() {
	  new BurgerMenu($('[data-widget="burgerMenu"]'));
  }

}

// yuck
window['_'] = window['highland'] || {};

new App();
