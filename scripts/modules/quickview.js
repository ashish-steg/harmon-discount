define([
        'modules/jquery-mozu',
        'underscore',
        'hyprlive',
        'hyprlivecontext',
        'modules/models-product',
        'modules/cart-monitor',
        'modules/api',
        'modules/backbone-mozu',
        'modules/block-ui',
        "bxslider",
        "modules/views-productimages",
        "elevatezoom",
        "modules/color-swatches",
        'modules/common-functions',
        "modules/api",
        'modules/general-functions',
        "async"
    ],
    function($, _, Hypr, hyprlivecontext, ProductModels, CartMonitor, api, Backbone, blockUiLoader, bxslider, ProductImageViews, elevatezoom, colorSwatch, CommonFunctions, Api, generalFunctions, async) {

        var sitecontext = hyprlivecontext.locals.siteContext;
        var cdn = sitecontext.cdnPrefix;
        var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
        var imagefilepath = cdn + '/cms/' + siteID + '/files';
        var storedPageData = "";

        var QuickviewSlider = function() {
            var self = this;
            this.init = function(el) {
                self.bindListeners.call(el, true);
            };
            this.bindListeners = function(on) {
                $('#quickViewModal').modal('show').on('hidden.bs.modal', function(e) {
                    $('.zoomContainer').remove();
                    $('#zoom').removeData('elevateZoom');
                    window.pageData = JSON.parse(JSON.stringify(storedPageData));
                });
                var $tabContent = $(".tab_content");
                var $ulLi = $("ul.tabs li");

                $tabContent.hide();
                $(".tab_content:first").show();
                $ulLi.click(function() {
                    $tabContent.hide();
                    var activeTab = $(this).attr("rel");
                    $("#" + activeTab).fadeIn();
                    $ulLi.removeClass("active");
                    $(this).addClass("active");
                });
            };
            this.closeQuickviewSlider = function(e) {
                window.pageData = JSON.parse(JSON.stringify(storedPageData));
                $("#quickViewModal").modal("hide");
                $('.zoomContainer').remove();
                $('#zoom').removeData('elevateZoom');
            };
        };
        var slider = new QuickviewSlider();

        var QuickViewView = Backbone.View.extend({
            events: {
                'click .qvButton': 'buttonClicked',
                'click .qvPromo': 'promoOpen',
                "click [data-mz-quickview-close]": "quickviewClose",
                "click #quickViewModal [data-mz-swatch-color]": "selectSwatch",
                "click #quickViewModal [data-mz-product-option-attribute]": "onOptionChangeAttribute",
                "click [data-mz-qty-minus]": "quantityMinus",
                "click [data-mz-qty-plus]": "quantityPlus",
                "click .btnAddToCart": "addToCart",
                'mouseenter #quickViewModal .color-options': 'onMouseEnterChangeImage',
                'mouseleave #quickViewModal .color-options': 'onMouseLeaveResetImage',
                'click .full-product a': 'checkCookie'
            },
            checkCookie: function() {
                generalFunctions.checkCookie();
            },
            promoOpen: function() {
                blockUiLoader.productValidationMessage();
                if ($('#SelectValidOption .promo-header').length === 0) {
                    $('#SelectValidOption').children('span').remove();
                    var promoDetail = _.find(window.quickviewProduct.get('properties'), function(e) {
                        return e.attributeFQN === "tenant~Promo_Detail" && e.values;
                    });
                    if (promoDetail) {
                        var html = "";
                        html += '<div class="promo-header text-uppercase">' + Hypr.getLabel('promotionDetails') + '</div><div class="promo-content">' + promoDetail.values[0].stringValue + '</div>';
                        $(html).insertBefore("#SelectValidOption #mz-close-button");
                    }
                }
            },
            quickviewClose: function() {
                slider.closeQuickviewSlider();
            },
            initialize: function() {
                this.currentProductCode = null;
                this.isColorClicked = false;
                this.mainImage = '';
                _.bindAll(this, "quickviewClose");
                storedPageData = JSON.parse(JSON.stringify(window.pageData));
            },
            zoomInit: function() {
                var me = this;
                $('#zoom').elevateZoom({ zoomType: "inner", cursor: "crosshair", responsive: true });
                this.$('[data-mz-product-option]').each(function() {
                    var $this = $(this),
                        isChecked, wasChecked;
                    if ($this.val()) {
                        switch ($this.attr('type')) {
                            case "checkbox":
                            case "radio":
                                isChecked = $this.prop('checked');
                                wasChecked = !!$this.attr('checked');
                                if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                    me.configureAttribute($this);
                                }
                                break;
                            default:
                                me.configureAttribute($this);
                        }
                    }
                });
            },
            bxSliderInit: function() {
                $("ul.tabs li")[0].focus();
                return $('#productpager-Carousel').bxSlider({
                    slideWidth: 90,
                    minSlides: 4,
                    maxSlides: 4,
                    moveSlides: 1,
                    slideMargin: 15,
                    nextText: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                    prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                    infiniteLoop: false,
                    hideControlOnEnd: true,
                    pager: false
                });
            },
            render: function() {
                var me = this;

                Backbone.MozuView.prototype.render.apply(this);
            },
            onMouseEnterChangeImage: function(_e) {
                this.mainImage = $('#quickViewModal .mz-productimages-mainimage').attr('src');
                var colorCode = $(_e.currentTarget).data('mz-swatch-color'),
                    productCode = $(_e.currentTarget).data("product-code");
                this.changeImages(colorCode, productCode, 'N');
            },
            onMouseLeaveResetImage: function(_e) {
                if (!this.isColorClicked) {
                    var _selectedColorDom = $("ul.product-color-swatches").find('li.active'),
                        colorCode = _selectedColorDom.data('mz-swatch-color'),
                        productCode = _selectedColorDom.data("product-code");
                    if (typeof colorCode != 'undefined') {
                        this.changeImages(colorCode, productCode, 'N');
                    } else if (typeof this.mainImage != 'undefined') {
                        $('#quickViewModal .mz-productimages-mainimage').attr('src', this.mainImage);
                    } else {
                        $('#quickViewModal .mz-productimages-main').html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
                    }
                }
            },
            quantityMinus: function() {
                var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                    _qtyCountObj = $('.mz-productdetail-qty');
                var skuID;
                _qtyObj.text('');
                var value = parseInt(_qtyCountObj.val(), 10);
                if (value == 1) {
                    //_qtyObj.text("Quantity can't be zero.");
                    //$('.tab_container ').animate({ scrollTop: $('.tab_container')[0].scrollHeight }, 'slow');
                    return;
                }
                value--;
                _qtyCountObj.val(value);
                if (window.quickviewProduct.attributes.variationProductCode) {
                    skuID = window.quickviewProduct.attributes.variationProductCode;
                } else {
                    skuID = window.quickviewProduct.attributes.mfgPartNumber;
                }
                blockUiLoader.globalLoader();
                this.checkLimitOfSku(skuID, value, function(response) {
                    blockUiLoader.unblockUi();
                    if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.quickviewProduct.attributes.inventoryInfo.outOfStockBehavior != "AllowBackOrder") {
                        var onlineStock = window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable;
                        /*if (onlineStock >= window.productView.model.get('quantity')){
                            $("#add-to-cart").removeClass("button_disabled");
                        }*/
                        if (response) {
                            if (response <= onlineStock) {
                                $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Max " + response + " items are allowed.");
                                $("[data-mz-action='addToCart']").addClass("button_disabled");
                                $('#plus').addClass('disabled btn-disable-color');
                            }
                            if (onlineStock !== 0 && onlineStock < response) {
                                $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Only " + onlineStock + " left in stock.");
                                $("[data-mz-action='addToCart']").addClass("button_disabled");
                                $('#plus').addClass('disabled btn-disable-color');
                            }
                        } else {
                            if (onlineStock >= window.quickviewProduct.get('quantity')) {
                                $("[data-mz-action='addToCart']").removeClass("button_disabled");
                                $('#plus').removeClass('disabled btn-disable-color');
                            }
                        }
                    }
                });
            },
            quantityPlus: function() {
                if (!$("#plus").hasClass('disabled')) {
                    var _qtyObj = $('[data-mz-validationmessage-for="quantity"]'),
                        _qtyCountObj = $('.mz-productdetail-qty');
                    var skuID;
                    _qtyObj.text('');
                    var value = parseInt(_qtyCountObj.val(), 10);
                    if (value == 99) {
                        _qtyObj.text("Quantity can't be greater than 99.");
                        return;
                    }
                    value++;
                    _qtyCountObj.val(value);
                    if (window.quickviewProduct.attributes.variationProductCode) {
                        skuID = window.quickviewProduct.attributes.variationProductCode;
                    } else {
                        skuID = window.quickviewProduct.attributes.mfgPartNumber;
                    }
                    blockUiLoader.globalLoader();
                    this.checkLimitOfSku(skuID, value, function(response) {
                        blockUiLoader.unblockUi();
                        if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.quickviewProduct.attributes.inventoryInfo.outOfStockBehavior != "AllowBackOrder") {
                            var onlineStock = window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable;
                            /*if (onlineStock >= window.productView.model.get('quantity')){
                                $("#add-to-cart").removeClass("button_disabled");
                            }*/
                            if (response) {
                                if (response <= onlineStock) {
                                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Max " + response + " items are allowed.");
                                    $("[data-mz-action='addToCart']").addClass("button_disabled");
                                    $('#plus').addClass('disabled btn-disable-color');
                                }
                                if (onlineStock !== 0 && onlineStock < response) {
                                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Only " + onlineStock + " left in stock.");
                                    $("[data-mz-action='addToCart']").addClass("button_disabled");
                                    $('#plus').addClass('disabled btn-disable-color');
                                }
                            } else {
                                if (onlineStock < window.quickviewProduct.get('quantity')) {
                                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Only " + onlineStock + " left in stock.");
                                    $("[data-mz-action='addToCart']").addClass("button_disabled");
                                    $('#plus').addClass('disabled btn-disable-color');
                                }
                                if (onlineStock >= window.quickviewProduct.get('quantity')) {
                                    $("[data-mz-action='addToCart']").removeClass("button_disabled");
                                }
                            }
                        }
                    });
                }
            },
            checkLimitOfSku: function(skuID, newQty, callback) {
                var itemQuantity = parseInt(newQty, 10);
                Api.get("cart").then(function(resp) {
                    var cartItems = resp.data.items;
                    for (var i = 0; i < cartItems.length; i++) {
                        if (cartItems[i].product.mfgPartNumber === skuID) {
                            itemQuantity += cartItems[i].quantity;
                        }
                    }
                    var limitAttribute = _.findWhere(window.quickviewProduct.get('properties'), { "attributeFQN": "tenant~limitPerOrder" });
                    if (!limitAttribute) {
                        callback(false);
                    } else {
                        var limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                        if (itemQuantity > limitperorder) {
                            //$('[data-mz-validationmessage-for="quantity"]').text("*Max " + limitperorder + " items are allowed.");
                            callback(limitperorder);
                        } else {
                            callback(false);
                        }
                    }
                });
            },
            addToCart: function() {
                if ($('[data-mz-validationmessage-for="quantity"]').text().length === 0) {
                    var self = this;
                    var skuID;
                    $('.stock-error').remove();
                    blockUiLoader.globalLoader();
                    var newQty = $('.mz-productdetail-qty').val();
                    if (newQty > 0) {
                        if (window.quickviewProduct.attributes.inventoryInfo.manageStock === true) {
                            if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable === "undefined" || $(".mz-productoptions-optioncontainer").length != $(".mz-productoptions-optioncontainer .active").length) {
                                blockUiLoader.productValidationMessage();
                            } else {
                                if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable >= newQty) {
                                    if (window.quickviewProduct.attributes.variationProductCode) {
                                        skuID = window.quickviewProduct.attributes.variationProductCode;
                                    } else {
                                        skuID = window.quickviewProduct.attributes.mfgPartNumber;
                                    }
                                    this.checkLimitOfSku(skuID, newQty, function(response) {
                                        if (!response) {
                                            window.quickviewProduct.apiAddToCart({
                                                quantity: newQty
                                            }).then(function() {
                                                CartMonitor.addToCount(newQty);
                                                $('[data-mz-validationmessage-for="quantity"]').text("");
                                                blockUiLoader.unblockUi();
                                                slider.closeQuickviewSlider();
                                                $('html,body').animate({
                                                    scrollTop: $('header').offset().top
                                                }, 1000);
                                            }, function(err) {
                                                blockUiLoader.unblockUi();
                                                $('.stock-info').text('');
                                                if (err.message.indexOf("Validation Error: The following items have limited quantity or are out of stock:") !== -1) {
                                                    $('.stock-info').after('<div class="stock-error">' + Hypr.getLabel('productOutOfStockError') + '</div>');
                                                    $('.tab_container ').animate({ scrollTop: 0 }, 'slow');
                                                } else
                                                    $('[data-mz-validationmessage-for="quantity"]').text(err.message);
                                                //$(".mz-validationmessage").text("Please try again later.");
                                            });
                                        } else {
                                            $("#add-to-cart").addClass("button_disabled");
                                            blockUiLoader.unblockUi();
                                        }
                                    });
                                } else {
                                    if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.quickviewProduct.get('inventoryInfo').onlineStockAvailable === 0) {
                                        $('[data-mz-validationmessage-for="item-out-of-stock"]').text("* This item is out of stock.");
                                        $(".stock-info").hide();
                                    } else {
                                        $(".stock-info").show();
                                        $('[data-mz-validationmessage-for="item-out-of-stock"]').text("");
                                        $('[data-mz-validationmessage-for="quantity"]').text("*Only " + window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable + " left in stock.");
                                    }
                                    // Add error message not enough inventory
                                    /*$(".mz-validationmessage").text("We're sorry, we only have " + window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable + " available. Those items have been added to your cart.");*/

                                    $('.tab_container ').animate({ scrollTop: $('.tab_container')[0].scrollHeight }, 'slow');
                                    blockUiLoader.unblockUi();
                                    return false;
                                    /*window.quickviewProduct.apiAddToCart({
                                    quantity: window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable
                                    }).then(function() {
                                    CartMonitor.addToCount(newQty);
                                    blockUiLoader.unblockUi();
                                    });*/
                                }
                            }
                        } else {
                            if (window.quickviewProduct.attributes.variationProductCode) {
                                skuID = window.quickviewProduct.attributes.variationProductCode;
                            } else {
                                skuID = window.quickviewProduct.attributes.mfgPartNumber;
                            }
                            this.checkLimitOfSku(skuID, newQty, function(response) {
                                if (response) {
                                    window.quickviewProduct.apiAddToCart({
                                        quantity: newQty
                                    }).then(function() {
                                        CartMonitor.addToCount(newQty);
                                    });
                                    $('[data-mz-validationmessage-for="quantity"]').text("");
                                    blockUiLoader.unblockUi();
                                    slider.closeQuickviewSlider();
                                    $('html,body').animate({
                                        scrollTop: $('header').offset().top
                                    }, 1000);
                                }
                            });
                        }
                    } else {
                        $('[data-mz-validationmessage-for="quantity"]').text("Quantity can't be zero.");
                        blockUiLoader.unblockUi();
                        return;
                    }
                }
            },
            selectSwatch: function(e) {
                this.isColorClicked = true;
                var colorCode = $(e.currentTarget).data('mz-swatch-color'),
                    productCode = $(e.currentTarget).data("product-code");
                this.changeImages(colorCode, productCode, 'Y');

            },
            changeImages: function(colorCode, productCode, _updateThumbNails) {
                var width = hyprlivecontext.locals.themeSettings.productImageDirectoryMaxWidth;
                var version = 1;
                if ($("figure.mz-productimages-thumbs ul.products_list li.active").length > 0) {
                    version = $("figure.mz-productimages-thumbs ul.products_list li.active").data("mz-productimage-thumb");
                }
                var imagepath = imagefilepath + '/' + productCode + '_' + colorCode + '_v' + version + '.jpg?maxWidth=' + hyprlivecontext.locals.themeSettings.productImagePdpMaxWidth;
                var zoomimagepath = imagefilepath + '/' + productCode + '_' + colorCode + '_v' + version + '.jpg?maxWidth=' + hyprlivecontext.locals.themeSettings.productZoomImageMaxWidth;
                var _this = this;
                //TODO: following function is checking if images exist on server or not
                generalFunctions.checkImage(imagepath, function(response) {
                    if (response) {
                        var img = $('#quickViewModal .mz-productimages-mainimage');
                        if (img.length === 0) {
                            var parentDiv = $("#quickViewModal .mz-productimages-main");
                            parentDiv.find(".mz-productlisting-imageplaceholder").remove();
                            parentDiv.append("<img id='zoom' class='mz-productimages-mainimage' data-mz-productimage-main>");
                        }
                        if (_updateThumbNails == 'Y') {
                            $('#quickViewModal .mz-productimages-mainimage').attr('src', imagepath);
                            $('.zoomContainer').remove();
                            $('#zoom').removeData('elevateZoom');
                            img.attr('src', imagepath).data('zoom-image', zoomimagepath);
                            $('#zoom').elevateZoom({ zoomType: "inner", cursor: "crosshair" });
                        } else {
                            $("#quickViewModal .mz-productimages-main img").attr('src', imagepath);
                        }
                    } else if (typeof _this.mainImage === 'undefined') {
                        $('.zoomContainer').remove();
                        $('.mz-productimages-main').html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
                    }
                });
                if ($("figure.mz-productimages-thumbs").length && $("figure.mz-productimages-thumbs").data("length") && _updateThumbNails == 'Y') {
                    _this.updateAltImages(colorCode, productCode);
                }
            },
            updateAltImages: function(colorCode, productCode) {
                try {
                    this.bxSliderInit().destroySlider();
                } catch (e) {}
                var slideCount = parseInt($("figure.mz-productimages-thumbs").data("length"), 10);
                for (var i = 1; i <= slideCount; i++) {
                    $(".mz-productimages-thumbs .products_list li:eq(" + (i - 1) + ") .mz-productimages-thumb img")
                        .attr({
                            "src": imagefilepath + '/' + productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + hyprlivecontext.locals.themeSettings.maxProductImageThumbnailSize,
                            "data-orig-src": imagefilepath + '/' + productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + hyprlivecontext.locals.themeSettings.productImagePdpMaxWidth,
                            "data-orig-zoom": imagefilepath + '/' + productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + hyprlivecontext.locals.themeSettings.productZoomImageMaxWidth
                        });
                }
                if (slideCount > 4) {
                    this.bxSliderInit();
                }
            },
            onOptionChangeAttribute: function(e) {
                if (window.quickviewProduct !== null) {
                    if ((!$(e.currentTarget).hasClass("disabled") || ($(e.currentTarget).parents('.product-color-swatches').length > 0 && $(e.currentTarget).hasClass("disabled"))) && !$(e.currentTarget).hasClass('active')) {
                        if ($(e.currentTarget).parents('.product-color-swatches').length > 0) {
                            colorSwatch.changeColorSwatch(e);
                        }
                        blockUiLoader.globalLoader();
                        return this.configureAttribute($(e.currentTarget));
                    }
                }
            },
            configureAttribute: function($optionEl) {
                if (!$optionEl.hasClass("active")) {
                    var $this = this,
                        newValue = $optionEl.data('value'),
                        oldValue,
                        id = $optionEl.data('mz-product-option-attribute'),
                        optionEl = $optionEl[0],
                        isPicked = (optionEl.type !== 'checkbox' && optionEl.type !== 'radio') || optionEl.checked,
                        option = window.prodOptions.get(id),
                        product = window.quickviewProduct;
                    if (!option) {
                        var byIDVal = JSON.parse(JSON.stringify(window.prodOptions._byId));
                        for (var key in byIDVal) {
                            if (id === byIDVal[key].attributeFQN) {
                                option = window.prodOptions.get(key);
                            }
                        }
                    }
                    if (option) {
                        if (option.get('attributeDetail').inputType === 'YesNo') {
                            option.set("value", isPicked);
                        } else if (isPicked) {
                            oldValue = option.get('value');
                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                option.set('value', newValue);
                            }
                        }
                    }
                    $('button.btnAddToCart').addClass('button_disabled');

                    var isRequiredOptionsSet = true;
                    var productOptions = window.prodOptions.models;
                    var _optionsObj = CommonFunctions.filterProductOptions(window.prodOptions.models);

                    var allOptions = Object.keys(_optionsObj).length;
                    //for all available options
                    for (var i = 0; i < productOptions.length; i++) {
                        //check if this option is req
                        if (productOptions[i].attributes.isRequired) {
                            //check if any option has any property isEnabled = "true"                    
                            var isEnabled = CommonFunctions.checkIsEnabled(productOptions[i].attributes.values);
                            if (isEnabled) {
                                isRequiredOptionsSet = true;
                            } else {
                                isRequiredOptionsSet = false;
                            }
                        }
                    }

                    product.on("change", function() {
                        if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable && typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined") {
                            var sp_price = "";
                            if (window.quickviewProduct.get('inventoryInfo').onlineStockAvailable && typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined") {
                                if (typeof window.quickviewProduct.attributes.price.get('salePrice') != 'undefined')
                                    sp_price = window.quickviewProduct.attributes.price.get('salePrice');
                                else
                                    sp_price = window.quickviewProduct.attributes.price.get('price');
                                var price = Hypr.engine.render("{{price|currency}}", { locals: { price: sp_price } });
                                $('.stock-info').show().html("<span>In Stock </span>" + price);
                                $('[data-mz-validationmessage-for="item-out-of-stock"]').text("");
                            } else {
                                $('.stock-info').hide();
                            }
                        }
                        if (window.quickviewProduct.attributes.variationProductCode && typeof window.quickviewProduct.attributes.variationProductCode !== "undefined") {
                            $(".mz-productcodes-productcode").text("Sku # " + window.quickviewProduct.attributes.variationProductCode);
                        }
                        // Set product price       
                        if (window.quickviewProduct.attributes.price.attributes.price) {
                            var priceModel = { onSale: product.attributes.price.onSale() },
                                priceDiscountTemplate = Hypr.getTemplate("modules/product/price-discount"),
                                priceTemplate = Hypr.getTemplate("modules/common/price");

                            _.extend(priceModel, product.attributes.price.attributes);

                            $(".quickviewElement .mz-pricestack").html(priceDiscountTemplate.render({
                                model: priceModel
                            }) + '<span class="not-range">' + priceTemplate.render({
                                model: priceModel
                            }) + '</span>');
                        }
                        if ($(".mz-productoptions-valuecontainer input:radio")) {
                            var color = "#ff0000";
                            if ($(".mz-productoptions-valuecontainer input:radio:checked").val()) {
                                color = "#000";
                            }
                            $(".mz-productoptions-valuecontainer input:radio + label").each(function() {
                                $(this).css("border-color", color);
                            });
                        }
                        $(".mz-productdetail-options input, .mz-productdetail-options select").each(function() {
                            if (($(this).data('value') && $(this).data('value').toLowerCase() == "select") || !$(this).data('value')) {
                                $(this).css("border-color", "red");
                            } else {
                                $(this).css("border-color", "black");
                            }
                        });
                        var deliverySurchargeTemplate = Hypr.getTemplate("modules/product/product-delivery-surcharge");
                        $(".quickviewSlider .surcharge").html(deliverySurchargeTemplate.render({
                            model: window.quickviewProduct.attributes
                        }));
                    });

                    var prodOptions = [];
                    $(product.attributes.options.models).each(function() {
                        if (this.attributes.value) {
                            prodOptions.push(this);
                        }
                    });
                    product.apiConfigure({ options: prodOptions }).then(function(e) {
                        $('[data-mz-validationmessage-for="quantity"]').text("");
                        if (isRequiredOptionsSet) {
                            if (window.quickviewProduct.attributes.inventoryInfo.manageStock === true) {
                                if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable === "undefined") {
                                    $('button.btnAddToCart').removeClass('button_disabled');
                                }
                                if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable > 0 && window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable < hyprlivecontext.locals.themeSettings.minimumQuantityForInStockQuantityMessage) {
                                    $('[data-mz-validationmessage-for="quantity"]').text("*Only " + window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable + " left in stock.");
                                }
                                if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable >= 1) {
                                    $('button.btnAddToCart').removeClass('button_disabled');

                                    $(".quickviewElement input, .quickviewElement ul.product-swatches").removeAttr("disabled");
                                } else {
                                    $(".mz-qty-control").addClass("disabled");
                                    $('button.btnAddToCart').addClass('button_disabled');

                                    $(".quickviewElement input, .quickviewElement ul.product-swatches").not("#mz-close-button, #add-to-cart").attr("disabled", "disabled");
                                    if (window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== undefined) {
                                        $('[data-mz-validationmessage-for="item-out-of-stock"]').text("* This item is out of stock.");
                                        $('.stock-info').hide();
                                    } else {
                                        $('[data-mz-validationmessage-for="item-out-of-stock"]').text("");
                                        $('.stock-info').show();
                                    }
                                }
                            } else {
                                $('button.btnAddToCart').removeClass('button_disabled');
                                $(".quickviewElement input, .quickviewElement ul.product-swatches").removeAttr("disabled");
                            }

                        } else {
                            $('button.btnAddToCart').addClass('button_disabled');

                            $(".quickviewElement input, .quickviewElement ul.product-swatches").not("#mz-close-button, #add-to-cart").attr("disabled", "disabled");
                        }

                        var _ot = Hypr.getTemplate("modules/product/product-options");
                        e.data.productType = window.quickviewProduct.get('productType');
                        $(".quickviewSlider .mz-productdetail-options").html(_ot.render({
                            model: e.data
                        }));
                        $this.isColorClicked = false;
                        blockUiLoader.unblockUi();
                    });
                }
            },
            buttonClicked: function(e) {
                blockUiLoader.globalLoader();
                var self = this;
                window.quickviewProduct = null;
                this.currentProductCode = null;

                // Reset modal dialog content
                $('.quickviewSlider .modal-body').html('');

                var qvProductCode = $(e.currentTarget).data("target");
                var productJSONData = $(e.currentTarget).data("mz-product-data");
                var product = new ProductModels.Product(productJSONData);
                window.quickviewProduct = product;
                this.currentProductCode = qvProductCode;
                var options_pro = product.attributes.options;
                var availableColors = [];
                if (options_pro.models) {
                    for (var i = 0; i < options_pro.models.length; i++) {
                        if (options_pro.models[i].id == "tenant~COLOR") {
                            for (var j = 0; j < options_pro.models[i].legalValues.length; j++) {
                                var color = options_pro.models[i].legalValues[j].trim().replace(/ /g, '_');
                                var swatchIconSize =
                                    hyprlivecontext.locals.themeSettings.listProductSwatchIconSize;
                                var swatchIconPath = imagefilepath + '/' + options_pro.models[i].collection.parent.id + '_' + color + '.jpg?max=' + swatchIconSize;
                                availableColors.push({
                                    color: options_pro.models[i].legalValues[j],
                                    swatchIconPath: swatchIconPath,
                                    swatch_color: color
                                });
                            }
                            product.attributes.availableColors = availableColors;
                        }
                    }
                }
                //pageData
                var productsArray = [];
                productsArray.customer = window.pageData.customer;
                productsArray.page = window.pageData.page;
                productsArray.products = [];
                var qvVariations = window.quickviewProduct.get('variations');
                // for multi sku
                var priceData = "";
                var promises = [];
                if (qvVariations) {
                    promises.push((function(callback) {
                        var serviceurl = '/product/price?productCode=' + window.quickviewProduct.get('productCode');
                        api.request('GET', serviceurl).then(function(response) {
                            priceData = response;
                            if (qvVariations && qvVariations.length) {
                                for (var p = 0; p < qvVariations.length; p++) {
                                    productsArray.products.push({
                                        "categoryName": storedPageData.page.productCategories.join(" > "),
                                        "id": window.quickviewProduct.get('productCode'),
                                        "onlineStockStatus": qvVariations[p].inventoryInfo.onlineStockAvailable > 0 ? Hypr.getLabel('upcInStock') : Hypr.getLabel('outOfStock'),
                                        "productCategories": storedPageData.page.productCategories,
                                        "quantity": 1,
                                        "sku": qvVariations[p].productCode,
                                        "markDownAmount": (priceData[p].saleAmount).toFixed(2),
                                        "price": priceData[p].listPrice,
                                        "priceTotal": priceData[p].listPrice,
                                        "totalPrice": priceData[p].listPrice
                                    });
                                }
                            }
                            callback(null, productsArray);
                        }, function(err) {
                            callback(err);
                        });
                    }));
                } else {
                    // for single sku
                    promises.push((function(callback) {
                        var pro_price = "";
                        var markDownAmount = "";
                        if (window.quickviewProduct.get('price').get('onSale')) {
                            pro_price = window.quickviewProduct.get('price').get('salePrice');
                            markDownAmount = (window.quickviewProduct.get('price').get('price') - window.quickviewProduct.get('price').get('salePrice')).toFixed(2);
                        } else {
                            pro_price = window.quickviewProduct.get('price').get('price');
                            markDownAmount = 0;
                        }
                        productsArray.products = {
                            "categoryName": storedPageData.page.productCategories.join(" > "),
                            "id": window.quickviewProduct.get('productCode'),
                            "markDownAmount": markDownAmount,
                            "onlineStockStatus": window.quickviewProduct.get('inventoryInfo').onlineStockAvailable > 0 ? Hypr.getLabel('upcInStock') : Hypr.getLabel('outOfStock'),
                            "price": pro_price,
                            "priceTotal": pro_price,
                            "productCategories": storedPageData.page.productCategories,
                            "quantity": 1,
                            "sku": window.quickviewProduct.get('mfgPartNumber'),
                            "totalPrice": pro_price
                        };
                        callback(null, productsArray);
                    }));
                    //window.pageData = productsArray; 
                }
                async.series(promises, function(err, results) {
                    if (results) {
                        window.pageData = productsArray;
                        var sizeObj = "";
                        sizeObj = _.find(product.attributes.properties, function(e) {
                            return e.attributeFQN === "tenant~moreInfo" && e.values;
                        });
                        //If Size Object exist then append a new key "sizeChartImagePath" with value URL(SIZE CHART) as string.
                        product.attributes.sizeChartPath = sizeObj ? (imagefilepath + '/' + sizeObj.values[0].value) : null;
                        product.attributes.quickView = "yes";
                        var oneSizeOption = "",
                            id = Hypr.getThemeSetting('oneSizeAttributeName');
                        if (product.get('options') && product.get('options').length)
                            oneSizeOption = product.get('options').get(id);
                        if (oneSizeOption) {
                            var onlyEnabledOneSizeOption = _.find(oneSizeOption.get('values'), function(value) { return value.isEnabled; });
                            oneSizeOption.set('value', onlyEnabledOneSizeOption.value);
                        }

                        var modalTemplate = Hypr.getTemplate('modules/product/product-quick-view');

                        var htmlToSetAsContent = modalTemplate.render({
                            model: product.toJSON({
                                helpers: true
                            })
                        });

                        // SET OPTIONS
                        window.prodOptions = window.quickviewProduct.attributes.options;
                        $('.quickviewSlider').html(htmlToSetAsContent);
                        slider.init(this);
                        setTimeout(function() {
                            if ($('.zoomContainer').length > 0) {
                                $('.zoomContainer').remove();
                            }
                            self.zoomInit();
                            var productImagesView = new ProductImageViews.ProductPageImagesView({
                                el: $('[data-mz-productimages]'),
                                model: product
                            });
                            self.bxSliderInit();
                            var promoStatus = generalFunctions.checkPromo(product);
                            if (promoStatus) {
                                $('#quickViewModal .qvPromo').show();
                            }
                        }, 500);
                        if (window.quickviewProduct.get('variationProductCode')) {
                            var sp_price = "";
                            if (window.quickviewProduct.get('inventoryInfo').onlineStockAvailable && typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined") {
                                if (typeof window.quickviewProduct.attributes.price.get('salePrice') != 'undefined')
                                    sp_price = window.quickviewProduct.attributes.price.get('salePrice');
                                else
                                    sp_price = window.quickviewProduct.attributes.price.get('price');
                                var price = Hypr.engine.render("{{price|currency}}", { locals: { price: sp_price } });
                                $('.stock-info').show().html("<span>In Stock </span>" + price);
                                $('[data-mz-validationmessage-for="item-out-of-stock"]').text("");
                            } else {
                                $('.stock-info').hide();
                            }
                        }
                        if (typeof window.quickviewProduct.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.quickviewProduct.get('inventoryInfo').onlineStockAvailable === 0) {
                            $('[data-mz-validationmessage-for="item-out-of-stock"]').text("* This item is out of stock.");
                            $('.stock-info').hide();
                        } else {
                            $('[data-mz-validationmessage-for="item-out-of-stock"]').text("");
                            $(".stock-info").show();
                        }
                        $(".video-image").removeClass("video-image");
                        var skuID;
                        if (window.quickviewProduct.attributes.variationProductCode) {
                            skuID = window.quickviewProduct.attributes.variationProductCode;
                        } else {
                            skuID = window.quickviewProduct.attributes.mfgPartNumber;
                        }
                        var itemQuantity = 1;
                        Api.get("cart").then(function(resp) {
                            var cartItems = resp.data.items;
                            for (var i = 0; i < cartItems.length; i++) {
                                if (cartItems[i].product.mfgPartNumber === skuID) {
                                    itemQuantity += cartItems[i].quantity;
                                }
                            }
                            var limitAttribute = _.findWhere(window.quickviewProduct.get('properties'), { "attributeFQN": "tenant~limitPerOrder" });
                            if (limitAttribute) {
                                var limitperorder = parseInt(JSON.parse(limitAttribute.values[0].stringValue)[skuID], 10);
                                if (itemQuantity > limitperorder) {
                                    $('[data-mz-validationmessage-for="quantity"]').text("*Max " + limitperorder + " items are allowed.");
                                    $("#add-to-cart").addClass("button_disabled");
                                }
                            }
                        });
                        /*this.checkLimitOfSku(skuID, 1, function(response) {
                            if (!response) {
                                $("#add-to-cart").addClass("button_disabled");
                            }
                        });*/
                        blockUiLoader.unblockUi();
                    }
                });
            }
        });

        $(document).ready(function() {
            var quickViewView = new QuickViewView({
                el: 'body'
            });
            $('body').on('click', '#mz-close-button', function(e) {
                e.preventDefault();
                blockUiLoader.unblockUi();
                $('#zoom').elevateZoom({ zoomType: "inner", cursor: "crosshair" });
            });
            $('body').on('click', '#surcharge-details', function() {
                blockUiLoader.deliverySurchargeMessage();
            });


        });
    });