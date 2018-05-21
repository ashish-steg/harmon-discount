define([
    'modules/backbone-mozu',
    'modules/jquery-mozu',
    "modules/api",
    "hyprlive",
    'underscore',
    "modules/models-product",
    "bxslider",
    "session-management",
    "modules/on-image-load-error",
    'modules/block-ui'
], function(Backbone, $, Api, Hypr, _, ProductModels, bxslider, sessionManagement, onImageLoadError, blockUiLoader) {
    if (require.mozuData('user').isAuthenticated) {
        $(window).sessionManagement(Hypr.getThemeSetting('sessionTimeout'), function() {
            window.location.href = '/logout';
        });
    }
    var globalCartMaxItemCount = Hypr.getThemeSetting('globalCartMaxItemCount'),
        globalCartHidePopover = Hypr.getThemeSetting('globalCartHidePopover'),
        coerceBoolean = function(x) {
            return !!x;
        };
    var GlobalCartView = Backbone.MozuView.extend({
        templateName: "modules/page-header/global-cart-flyout",
        initialize: function() {
            var me = this;
        },
        render: function() {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
            $("#global-cart img").on("error", function() {
                onImageLoadError.checkImage(this);
            });
        },
        openLiteRegistration: function() {
            $(".second-tab").show();
            $(".third-tab").hide();
            $('#liteRegistrationModal').modal('show');
        },
        checkoutGuest: function() {
            blockUiLoader.globalLoader();
            var itemQuantity;
            var flag = true;
            Api.get("cart").then(function(resp) {
                var items = resp.data.items;
                var productCodes = [];
                for (var i = 0; i < items.length; i++) {
                    var pdtCd = items[i].product.productCode;
                    productCodes.push(pdtCd);
                }
                var filter = _.map(productCodes, function(c) {
                    return "ProductCode eq " + c;
                }).join(' or ');
                Api.get("search", { filter: filter, pageSize: productCodes.length }).then(function(collection) {
                    var cartItems = collection.data.items;
                    var skuID;
                    var obj = {};
                    for (var i = 0; i < cartItems.length; i++) {
                        var limitAttribute = _.findWhere(cartItems[i].properties, { "attributeFQN": "tenant~limitPerOrder" });
                        var limitAttributeModel = _.findWhere(items[i].properties, { "attributeFQN": "tenant~limitPerOrder" });
                        var limitperorder, limitperorderModel;
                        if (cartItems[i].mfgPartNumber) {
                            skuID = cartItems[i].mfgPartNumber.toString();
                            if (limitAttribute) {
                                limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                limitperorderModel = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                obj[skuID] = limitperorder;
                                limitperorderModel = limitperorder;
                            }
                        } else {
                            for (var j = 0; j < cartItems[i].mfgPartNumbers.length; j++) {
                                skuID = cartItems[i].mfgPartNumbers[j].toString();
                                if (limitAttribute) {
                                    limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                    limitperorderModel = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                    obj[skuID] = limitperorder;
                                    limitperorderModel = limitperorder;
                                }
                            }
                        }
                    }
                    blockUiLoader.unblockUi();
                    Object.keys(obj).forEach(function(key, index) {
                        for (var j = 0; j < items.length; j++) {
                            if (items[j].product.mfgPartNumber === key) {
                                itemQuantity = items[j].quantity;
                                if (itemQuantity > obj[key]) {
                                    flag = false;
                                    window.location.href = "/cart?isLimit=false";
                                    break;
                                }
                            }
                        }
                    });
                    if (flag) {
                        $(".second-tab").hide();
                        $(".third-tab").show();
                        $('#liteRegistrationModal').modal('show');
                        window.isCheckoutGuest = true;
                    }
                }, function() {
                    window.console.log("Got some error at cross sell in Global Cart");
                });
            });
            return flag;
        },
        proceedToCheckout: function(e) {
            e.preventDefault();
            blockUiLoader.globalLoader();
            var itemQuantity;
            var flag = true;
            Api.get("cart").then(function(resp) {
                var items = resp.data.items;
                var productCodes = [];
                for (var i = 0; i < items.length; i++) {
                    var pdtCd = items[i].product.productCode;
                    productCodes.push(pdtCd);
                }
                var filter = _.map(productCodes, function(c) {
                    return "ProductCode eq " + c;
                }).join(' or ');
                Api.get("search", { filter: filter, pageSize: productCodes.length }).then(function(collection) {
                    var cartItems = collection.data.items;
                    var skuID;
                    var obj = {};
                    for (var i = 0; i < cartItems.length; i++) {
                        var limitAttribute = _.findWhere(cartItems[i].properties, { "attributeFQN": "tenant~limitPerOrder" });
                        var limitAttributeModel = _.findWhere(items[i].properties, { "attributeFQN": "tenant~limitPerOrder" });
                        var limitperorder, limitperorderModel;
                        if (cartItems[i].mfgPartNumber) {
                            skuID = cartItems[i].mfgPartNumber.toString();
                            if (limitAttribute) {
                                limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                limitperorderModel = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                obj[skuID] = limitperorder;
                                limitperorderModel = limitperorder;
                            }
                        } else {
                            for (var j = 0; j < cartItems[i].mfgPartNumbers.length; j++) {
                                skuID = cartItems[i].mfgPartNumbers[j].toString();
                                if (limitAttribute) {
                                    limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                    limitperorderModel = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                    obj[skuID] = limitperorder;
                                    limitperorderModel = limitperorder;
                                }
                            }
                        }
                    }
                    blockUiLoader.unblockUi();
                    Object.keys(obj).forEach(function(key, index) {
                        for (var j = 0; j < items.length; j++) {
                            if (items[j].product.mfgPartNumber === key) {
                                itemQuantity = items[j].quantity;
                                if (itemQuantity > obj[key]) {
                                    flag = false;
                                    window.location.href = "/cart?isLimit=false";
                                    break;
                                }
                            }
                        }
                    });
                    if (flag) {
                        $('#registeredCheckout').attr('action', window.location.origin + '/cart/checkout');
                        $('#registeredCheckout').submit();
                        return;
                    }
                }, function() {
                    window.console.log("Got some error at cross sell in Global Cart");
                });
            });
            return flag;
        },
        update: function(showGlobalCart) {
            var me = this;
            Api.get("cart").then(function(resp) {
                resp.data.cartItems = resp.data.items.slice(0, globalCartMaxItemCount);
                if (globalCartHidePopover === true && resp.data.cartItems.length === 0) {
                    $(me.el).hide();
                }
                me.model.attributes = resp.data;
                me.render();
                try {
                    window.updateGCRTI();
                } catch (e) {}
                if (showGlobalCart) {
                    me.$el.parents('#global-cart').show();
                    setTimeout(function() {
                        me.$el.parents('#global-cart').attr('style', '');
                    }, 5000);
                }
            });
        }
    });

    var Model = Backbone.MozuModel.extend();
    var globalCartView = new GlobalCartView({
        el: $('#global-cart-listing'),
        model: new Model({})
    });
    globalCartView.render();
    var GlobalCart = {
        update: function(showGlobalCart) {
            globalCartView.update(showGlobalCart);
        }
    };
    return GlobalCart;

});