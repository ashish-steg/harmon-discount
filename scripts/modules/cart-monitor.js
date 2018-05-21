/**
 * Watches for changes to the quantity of items in the shopping cart, to update
 * cart count indicators on the storefront.
 */
define(['modules/jquery-mozu', 'modules/api', 'bootstrap', 'modules/page-header/global-cart', 'hyprlive', 'doubletaptogoipad'], function($, api, Bootstrap, GlobalCart, Hypr, doubletaptogoipad) {

    var $cartCount,
        user = require.mozuData('user'),
        userId = user.userId,
        $document = $(document),
        CartMonitor = {
            setAmount: function(amount) {
                var localAmount = Hypr.engine.render("{{price|currency}}", { locals: { price: amount } });
                this.$amountEl.text(localAmount);
            },
            setCount: function(count) {
                this.$el.text(count);
            },
            addToCount: function(count) {
                this.update(true);
            },
            getCount: function() {
                return parseInt(this.$el.text(), 10) || 0;
            },
            update: function(showGlobalCart) {
                api.get('cartsummary').then(function(summary) {
                    $.cookie('mozucart', JSON.stringify(summary.data), { path: '/' });
                    savedCarts[userId] = summary.data;
                    $document.ready(function() {
                        $('.ml-header-global-cart-wrapper').css('display', 'block');
                        CartMonitor.setCount(summary.data.totalQuantity);
                        CartMonitor.setAmount(summary.data.total);
                        GlobalCart.update(showGlobalCart);
                    });
                });

            }
        },
        savedCarts,
        savedCart;

    try {
        savedCarts = JSON.parse($.cookie('mozucart'));
    } catch (e) {}

    if (!savedCarts) savedCarts = {};
    savedCart = savedCarts || savedCarts[userId];

    //if (isNaN(savedCart.itemCount)) {
    CartMonitor.update();
    //}

    $document.ready(function() {
        CartMonitor.$el = $('[data-mz-role="cartcount"]').text(savedCart.totalQuantity || 0);
        CartMonitor.$amountEl = $('[data-mz-role="cartamount"]').text(savedCart.total || 0);
        try {
            $('.ml-header-global-cart-wrapper').doubletaptogoipad();
        } catch (e0) {
        }
    });

    return CartMonitor;

});