define(["require", "exports"], function (require, exports) {
    var BurgerMenu = (function () {
        function BurgerMenu(el) {
            var widget = this;
            console.log(1);
            widget.$el = $(el);
            widget.init();
        }
        BurgerMenu.prototype.init = function () {
            console.log(2);
            var widget = this;
            widget.bindMenu();
        };
        BurgerMenu.prototype.bindMenu = function () {
            console.log(3);
            var widget = this;
            widget.$el.unbind().on('click', function (evt) { return widget.onClickEvt(evt); });
        };
        BurgerMenu.prototype.onClickEvt = function (evt) {
            console.log(4);
            var widget = this, $body = $(document.body);
            evt && evt.preventDefault && evt.preventDefault();
            if ($body.hasClass('active')) {
                $('body, #layout, #menu, #menuLink').removeClass('active');
            }
            else {
                $('body, #layout, #menu, #menuLink').addClass('active');
            }
        };
        return BurgerMenu;
    })();
    return BurgerMenu;
});
