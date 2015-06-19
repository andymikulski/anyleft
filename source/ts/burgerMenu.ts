declare var $: any;
export = BurgerMenu;

class BurgerMenu {
    private $el:any;

    constructor(el:any) {
        var widget:BurgerMenu = this;
        console.log(1);
        widget.$el = $(el);
        widget.init();
    }

    public init() {
        console.log(2);

        var widget: BurgerMenu = this;
        widget.bindMenu();
    }

    private bindMenu() {
        console.log(3);
        var widget: BurgerMenu = this;

        widget.$el.unbind().on('click', (evt) => widget.onClickEvt(evt));
    }

    private onClickEvt(evt) {
        console.log(4);
        var widget: BurgerMenu = this,
            $body: any = $(document.body);

        evt && evt.preventDefault && evt.preventDefault();

        if($body.hasClass('active')){
            $('body, #layout, #menu, #menuLink').removeClass('active');
        }else{
            $('body, #layout, #menu, #menuLink').addClass('active');
        }
    }

}
