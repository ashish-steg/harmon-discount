require([
    "modules/jquery-mozu",
    "underscore",
    "bxslider",
    "elevatezoom",
    'modules/block-ui',
    "hyprlive",
    "hyprlivecontext",
    "modules/backbone-mozu",
    "modules/cart-monitor",
    "modules/models-product",
    "modules/views-productimages",
    "modules/product/recently-viewed-products",
    "pages/family",
    "modules/api",
    "async",
    'modules/general-functions'
], function($, _, bxslider, elevatezoom, blockUiLoader, Hypr, HyprLiveContext, Backbone, CartMonitor, ProductModels, ProductImageViews, RVIModel, FamilyItemView, api, async, generalFunctions) {

    var sitecontext = HyprLiveContext.locals.siteContext,
        pagecontext = HyprLiveContext.locals.pageContext,
        cdn = sitecontext.cdnPrefix,
        siteID = cdn.substring(cdn.lastIndexOf('-') + 1),
        imagefilepath = cdn + '/cms/' + siteID + '/files',
        slider,
        slider_mobile,
        productInitialImages,
        priceModel,
        width_thumb = HyprLiveContext.locals.themeSettings.maxProductImageThumbnailSize,
        width_pdp = HyprLiveContext.locals.themeSettings.productImagePdpMaxWidth,
        width_zoom = HyprLiveContext.locals.themeSettings.productZoomImageMaxWidth,
        current_zoom_id_added,
        deviceType = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPod|Opera Mini|IEMobile/i);

    function initSlider() {
        slider = $('#productpager-Carousel').bxSlider({
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
        window.slider = slider;
    }

    function initslider_mobile() {
        var id;
        if (current_zoom_id_added)
            id = $(current_zoom_id_added)[0].attributes.id.value.replace('zoom_', '') - 1;
        slider_mobile = $('#productmobile-Carousel').bxSlider({
            slideWidth: 300,
            minSlides: 1,
            maxSlides: 1,
            moveSlides: 1,
            preloadImages: 'all',
            onSliderLoad: function(currentIndex) {
                $('ul#productmobile-Carousel li').eq(currentIndex).find('img').addClass("active");
                $("#productmobile-Carousel,#productCarousel-pager").css("visibility", "visible");
            },
            onSlideAfter: function($slideElement, oldIndex, newIndex) {
                $('.zoomContainer').remove();
                current_zoom_id_added.elevateZoom({ zoomType: "inner", cursor: "crosshair" }).addClass('active');
                var bkimg = $(current_zoom_id_added)[0].attributes['data-zoom-image'].value;
                $(".mz-productimages-pager div").removeClass("activepager").eq(newIndex).addClass("activepager");
                setTimeout(function() {
                    $('div.zoomWindowContainer div').css({ 'background-image': 'url(' + bkimg + ')' });
                }, 500);

            },
            onSlideBefore: function(currentSlide, totalSlides, currentSlideHtmlObject) {
                var current_zoom_id = '#' + $('#productmobile-Carousel>li').eq(currentSlideHtmlObject).find('img').attr('id');
                $('.zoomContainer').remove();
                $(current_zoom_id).removeData('elevateZoom');
                current_zoom_id_added = $('#productmobile-Carousel>li').eq(currentSlideHtmlObject).find('img');
                $('ul#productmobile-Carousel li img').removeClass('active');
            },
            startSlide: id ? id : 0,
            nextText: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
            prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            infiniteLoop: false,
            hideControlOnEnd: true,
            pager: true,
            pagerCustom: '#productCarousel-pager'
        });
    }


    function updateImages(productInitialImages) {
        if (productInitialImages && productInitialImages.mainImage) {
            var mainImage = productInitialImages.mainImage.src + '?maxWidth=' + width_pdp;
            var zoomImage = productInitialImages.mainImage.src + '?maxWidth=' + width_zoom;
            $('body div.zoomContainer').remove();
            $('#zoom').removeData('elevateZoom');
            $('.mz-productimages-mainimage').attr('src', mainImage).data('zoom-image', zoomImage);
            $('#zoom').elevateZoom({ zoomType: "inner", cursor: "crosshair" });
            try {
                slider.destroySlider();
            } catch (e) {}
        }
        if (productInitialImages && productInitialImages.thumbImages) {
            var slideCount = productInitialImages.thumbImages.length;
            for (var i = 1; i <= productInitialImages.thumbImages.length; i++) {
                $(".mz-productimages-thumbs li:eq(" + (i - 1) + ") .mz-productimages-thumb img")
                    .attr({
                        "src": productInitialImages.thumbImages[i - 1].src + '?maxWidth=' + width_thumb,
                        "data-orig-src": productInitialImages.thumbImages[i - 1].src + '?maxWidth=' + width_pdp,
                        "data-orig-zoom": productInitialImages.thumbImages[i - 1].src + '?maxWidth=' + width_zoom
                    });
            }
            if (slideCount > 4) {
                initSlider();
            }
            initslider_mobile();
        }
    }
    window.family = [];
    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-detail',
        autoUpdate: ['quantity'],
        renderOnChange: [
            'quantity',
            'stockInfo'
        ],
        additionalEvents: {
            "change [data-mz-product-option]": "onOptionChange",
            "blur [data-mz-product-option]": "onOptionChange",
            "click [data-mz-product-option-attribute]": "onOptionChangeAttribute",
            "click [data-mz-qty-minus]": "quantityMinus",
            "click [data-mz-qty-plus]": "quantityPlus",
            'mouseenter .color-options': 'onMouseEnterChangeImage',
            'mouseleave .color-options': 'onMouseLeaveResetImage',
            'click li.mz-productlist-item': 'checkCookie',
            'click .mz-productlist-item': 'checkCookie',
            'click .mz-recentproductlist-item': 'checkCookie'
        },
        checkCookie: function() {
            generalFunctions.checkCookie();
        },
        render: function() {
            var me = this;
            var oneSizeOption = "",
                id = Hypr.getThemeSetting('oneSizeAttributeName');
            if(this.model.get('options') && this.model.get('options').length)
                oneSizeOption = this.model.get('options').get(id);
            if (oneSizeOption) {
                var onlyEnabledOneSizeOption = _.find(oneSizeOption.get('values'), function(value) { return value.isEnabled; });
                oneSizeOption.set('value', onlyEnabledOneSizeOption.value);
            }
            Backbone.MozuView.prototype.render.apply(this);
            this.$('[data-mz-is-datepicker]').each(function(ix, dp) {
                $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChangeAttribute, me));
            });
            $(".family-details [data-mz-action='addToCart']").addClass('hide');
            $(".mz-productdetail-conversion-buttons").removeClass('hide');

            if (this.model.get('productType') === Hypr.getThemeSetting('familyProductType')) {
                try {
                    blockUiLoader.globalLoader();
                    $('.family-details .mz-productdetail-shortdesc, .family-details .stock-info, .family-details .mz-reset-padding-left, .family-details #SelectValidOption').remove();
                    var familyData = me.model.get('family');
                    $("#mz-family-container .family-members").empty();
                    var familyItemModelOnready = function() {
                        var product = familyData.models[this.index];
                        if (typeof product.get('inventoryInfo').onlineStockAvailable !== 'undefined' && product.get('inventoryInfo').onlineStockAvailable === 0 && product.get('inventoryInfo').outOfStockBehavior === "HideProduct") {
                            //if all family members are out of stock, disable add to cart button.
                            if (window.outOfStockFamily) {
                                $(".family-details [data-mz-action='addToCart']").addClass('hide');
                                $("[data-mz-action='addToCart']").addClass('button_disabled').attr("disabled", "disabled");
                            }
                        } else {
                            var productCode = product.get('productCode');
                            var view = new FamilyItemView({
                                model: product,
                                messagesEl: $('#family-item-error-' + productCode + " [data-mz-message-bar]")
                            });
                            window.family.push(view);
                            var renderedView = view.render().el;
                            $("#mz-family-container").find("#" + productCode).append(renderedView);
                            $(".family-details [data-mz-action='addToCart']").removeClass('hide');
                            //if all family members are out of stock, disable add to cart button.
                            if (window.outOfStockFamily) {
                                $("[data-mz-action='addToCart']").addClass('button_disabled').attr("disabled", "disabled");
                            }
                        }
                    };
                    if (familyData.models.length) {
                        for (var i = 0; i < familyData.models.length; i++) {
                            //var x = this.model.checkVariationCode(familyData.models[i]);
                            var familyItemModel = familyData.models[i];
                            if (familyItemModel.get("isReady")) {
                                familyItemModel.off('ready');
                                familyItemModelOnready.call({ index: i });
                            } else {
                                familyItemModel.on('ready', familyItemModelOnready.bind({ index: i }));
                                if (i === (familyData.models.length - 1)) {
                                    blockUiLoader.unblockUi();
                                }
                            }
                        }
                    } else {
                        $(".family-details [data-mz-action='addToCart']").addClass('hide');
                        $("[data-mz-action='addToCart']").addClass('button_disabled').attr("disabled", "disabled");
                        blockUiLoader.unblockUi();
                    }
                } catch (e) {}
            }
            var promoStatus = generalFunctions.checkPromo(this.model);
            if (promoStatus) {
                $('#product-detail .promo').show();
            }
        },
        checkLimitOfSku: function(skuID, callback) {
            var itemQuantity = window.productView.model.get('quantity');
            api.get("cart").then(function(resp) {
                var cartItems = resp.data.items;
                for (var i = 0; i < cartItems.length; i++) {
                    if (cartItems[i].product.mfgPartNumber === skuID) {
                        itemQuantity += cartItems[i].quantity;
                    }
                }
                if (require.mozuData('limit') && require.mozuData('limit').stringValue !== "") {

                    var limitperorder = parseInt(JSON.parse(require.mozuData('limit').stringValue)[skuID], 10);
                    if (itemQuantity > limitperorder) {
                        //$('[data-mz-validationmessage-for="quantity"]').text("*Max " + limitperorder + " items are allowed.");
                        callback(limitperorder);
                    } else {
                        //$('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("");
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            });

        },
        quantityMinus: function() {
            this.model.messages.reset();
            var qty = this.model.get('quantity');
            if (qty === 1) {
                return;
            }
            this.model.set('quantity', --qty);
            /*$('[data-mz-validationmessage-for="quantity"]').text('');
            var value = parseInt($('.mz-productdetail-qty').val(), 10);
            //var value = this.model.get('quantity');
            if (value == 1) {
                $('[data-mz-validationmessage-for="quantity"]').text("Quantity can't be zero.");
                return;
            }
            --value;
            $('.mz-productdetail-qty').val(value);
            //this.model.set('quantity',--value);*/
            var skuID;
            if (window.productView.model.attributes.variationProductCode) {
                skuID = window.productView.model.attributes.variationProductCode;
            } else {
                skuID = window.productView.model.attributes.mfgPartNumber;
            }
            blockUiLoader.globalLoader();
            this.checkLimitOfSku(skuID, function(response) {
                blockUiLoader.unblockUi();
                if (typeof window.productView.model.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.productView.model.attributes.inventoryInfo.outOfStockBehavior != "AllowBackOrder") {
                    var onlineStock = window.productView.model.attributes.inventoryInfo.onlineStockAvailable;
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
                        if (onlineStock >= window.productView.model.get('quantity')) {
                            $("[data-mz-action='addToCart']").removeClass("button_disabled");
                            $('#plus').removeClass('disabled btn-disable-color');
                        }
                    }
                }
            });
        },
        quantityPlus: function() {
            if (this.model.attributes.soldOut === false && !$("#plus").hasClass('disabled')) {
                this.model.messages.reset();
                var qty = this.model.get('quantity');
                this.model.set('quantity', ++qty);
                /*$('[data-mz-validationmessage-for="quantity"]').text('');
                var value = parseInt($('.mz-productdetail-qty').val(), 10);
                //var value = this.model.get('quantity');
                if (value == 99) {
                    $('[data-mz-validationmessage-for="quantity"]').text("Quantity can't be greater than 99.");
                    return;
                }
                ++value;
                $('.mz-productdetail-qty').val(value);
                //this.model.set('quantity',++value);*/
                var skuID;
                if (window.productView.model.attributes.variationProductCode) {
                    skuID = window.productView.model.attributes.variationProductCode;
                } else {
                    skuID = window.productView.model.attributes.mfgPartNumber;
                }
                blockUiLoader.globalLoader();
                this.checkLimitOfSku(skuID, function(response) {
                    blockUiLoader.unblockUi();
                    if (typeof window.productView.model.attributes.inventoryInfo.onlineStockAvailable !== "undefined" && window.productView.model.attributes.inventoryInfo.outOfStockBehavior != "AllowBackOrder") {
                        var onlineStock = window.productView.model.attributes.inventoryInfo.onlineStockAvailable;
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
                            if (onlineStock < window.productView.model.get('quantity')) {
                                $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Only " + onlineStock + " left in stock.");
                                $("[data-mz-action='addToCart']").addClass("button_disabled");
                                $('#plus').addClass('disabled btn-disable-color');
                            }
                            if (onlineStock >= window.productView.model.get('quantity')) {
                                $("[data-mz-action='addToCart']").removeClass("button_disabled");
                            }
                        }
                    }
                });
            }
        },
        onOptionChangeAttribute: function(e) {
            return this.configureAttribute($(e.currentTarget));
        },
        configureAttribute: function($optionEl) {
            var $this = this;
            if (!$optionEl.hasClass("active")) {
                if ($optionEl.attr('disabled') == 'disabled') {
                    return false;
                } else {
                    blockUiLoader.globalLoader();
                    var newValue = $optionEl.data('value'),
                        oldValue,
                        id = $optionEl.data('mz-product-option-attribute'),
                        optionEl = $optionEl[0],
                        isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                        option = this.model.get('options').get(id);
                    if (!option) {
                        var byIDVal = JSON.parse(JSON.stringify(this.model.get('options')._byId));
                        for (var key in byIDVal) {
                            if (id === byIDVal[key].attributeFQN) {
                                option = this.model.get('options').get(key);
                            }
                        }
                    }
                    if (option) {
                        if (option.get('attributeDetail').inputType === "YesNo") {
                            option.set("value", isPicked);
                        } else if (isPicked) {
                            oldValue = option.get('value');
                            if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                                option.set('value', newValue);
                                this.render();
                            }
                        }
                    }
                    this.model.whenReady(function() {
                        setTimeout(function() {
                            if (window.productView.model.get('variationProductCode') && typeof window.productView.model.get('variationProductCode') !== "undefined") {
                                $(".mz-productcodes-productcode").text(Hypr.getLabel('sku') + " # " + window.productView.model.get('variationProductCode'));
                            }
                            $('.mz-productdetail-price.prize-mobile-view').html($('.mz-l-stack-section.mz-productdetail-conversion .mz-productdetail-price').html());
                            blockUiLoader.unblockUi();
                            $this.isColorClicked = false;
                        }, 1000);
                    });
                }
            }
        },
        onOptionChange: function(e) {
            return this.configure($(e.currentTarget));
        },
        configure: function($optionEl) {
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                option = this.model.get('options').get(id);
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                    }
                }
            }
        },
        addToCart: _.debounce(function() {
            var me = this;
            me.model.messages.reset();
            //If Family Products
            if (this.model.get('productType') === Hypr.getThemeSetting('familyProductType')) {
                blockUiLoader.globalLoader();
                /* jshint ignore:start */
                var promises = [];
                var productsAdded = [];
                for (var i = 0; i < this.model.get('family').models.length; i++) {
                    promises.push((function(callback) {
                        var familyItem = me.model.get('family').models[this.index];
                        var productCode = familyItem.get('productCode');
                        familyItem.addToCart().then(function(e) {
                            //Clear options and set Qty to 0
                            for (var j = 0; j < window.family.length; j++) {
                                if (window.family[j].model.get('productCode') === productCode) {
                                    var optionModels = window.family[j].model.get('options').models;
                                    for (var k = 0; k < optionModels.length; k++) {
                                        optionModels[k].unset('value');
                                    }
                                    window.family[j].model.set('quantity', 0);
                                    window.family[j].model.unset('stockInfo');
                                    window.family[j].model.set('addedtocart', true);
                                }
                            }
                            productsAdded.push(e);
                            callback(null, e);
                        }, function(e) {
                            callback(null, e);
                        });
                    }).bind({ index: i }))
                }
                var errors = { "items": [] };
                async.series(promises, function(err, results) {
                        var resp = results.reduce(
                            function(flag, value) {
                                return flag && results[0] === value;
                            },
                            true
                        );
                        if (resp === true) {
                            window.productView.model.trigger('error', { message: Hypr.getLabel('selectValidOption') });
                            blockUiLoader.unblockUi();
                            return;
                        }
                        if (results) {
                            var failureNames = [];
                            var successNames = [];
                            for (var i = 0; i < results.length; i++) {
                                if (results[i].errorCode) {
                                    var errorMessage = results[i].message.split(':');
                                    failureNames.push(errorMessage[2]);
                                } else if (typeof results[i].attributes === 'undefined' && results[i].indexOf("Please enter quantity of ") !== -1) {
                                    failureNames.push(results[i]);
                                } else if (typeof results[i].attributes === 'undefined' && results[i].indexOf("Select Valid Option(s) for ") !== -1) {
                                    failureNames.push(results[i]);
                                } else if (typeof results[i].attributes !== 'undefined') {
                                    successNames.push(results[i].get('content').get('productName'));
                                }
                            }
                            if (failureNames.length) {
                                errors.items.push({
                                    "name": "error",
                                    "message": Hypr.getLabel('productaddToCartError') + ": " + failureNames.join(', ')
                                });
                            }
                            if (successNames.length) {
                                errors.items.push({
                                    "name": 'success',
                                    "message": Hypr.getLabel('successfullyAddedItems') + ": " + successNames.join(', '),
                                    "messageType": "success"
                                });
                            }
                            if (failureNames.length || successNames.length)
                                me.model.trigger("error", errors);
                        }
                        if (productsAdded.length)
                            CartMonitor.update('showGlobalCart');
                        if (!deviceType) {
                            $('html,body').animate({
                                scrollTop: $('figure.mz-productimages-main').offset().top
                            }, 1000);
                        } else {
                            $('html,body').animate({
                                scrollTop: $('.mz-product-top-content').offset().top
                            }, 1000);
                        }
                        blockUiLoader.unblockUi();
                    })
                    /* jshint ignore:end */
            } else if (typeof me.model.get('inventoryInfo').onlineStockAvailable !== 'undefined' && me.model.get('inventoryInfo').outOfStockBehavior === "AllowBackOrder") {
                me.model.addToCart();
            } else if (typeof me.model.get('inventoryInfo').onlineStockAvailable !== "undefined" && me.model.get('inventoryInfo').onlineStockAvailable === 0 && me.model.get('inventoryInfo').outOfStockBehavior === "DisplayMessage") {
                blockUiLoader.productValidationMessage();
                $('#SelectValidOption').children('span').html(Hypr.getLabel('productOutOfStock'));
            } else if (typeof me.model.get('inventoryInfo').onlineStockAvailable === "undefined" || $(".mz-productoptions-optioncontainer").length != $(".mz-productoptions-optioncontainer .active").length) {
                blockUiLoader.productValidationMessage();
            } else if (me.model.get('inventoryInfo').onlineStockAvailable) {
                if (me.model.get('inventoryInfo').onlineStockAvailable < me.model.get('quantity')) {
                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Only " + me.model.get('inventoryInfo').onlineStockAvailable + " left in stock.");
                    return false;
                }
                var skuID;
                if (window.productView.model.attributes.variationProductCode) {
                    skuID = window.productView.model.attributes.variationProductCode;
                } else {
                    skuID = window.productView.model.attributes.mfgPartNumber;
                }
                this.checkLimitOfSku(skuID, function(response) {
                    if (!response) {
                        me.model.addToCart();
                    } else {
                        $("#add-to-cart").addClass("button_disabled");
                        $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Max " + response + " items are allowed.");
                    }
                });
            }
        }, 1500),
        addToWishlist: function() {
            this.model.addToWishlist();
        },
        checkLocalStores: function(e) {
            var me = this;
            e.preventDefault();
            this.model.whenReady(function() {
                var $localStoresForm = $(e.currentTarget).parents('[data-mz-localstoresform]'),
                    $input = $localStoresForm.find('[data-mz-localstoresform-input]');
                if ($input.length > 0) {
                    $input.val(JSON.stringify(me.model.toJSON()));
                    $localStoresForm[0].submit();
                }
            });

        },
        onMouseEnterChangeImage: function(_e) {
            if (!deviceType) {
                this.mainImage = $('.mz-productimages-mainimage').attr('src');
                var colorCode = $(_e.currentTarget).data('mz-swatch-color');
                this.changeImages(colorCode, 'N');
            }
        },
        onMouseLeaveResetImage: function(_e) {
            if (!this.isColorClicked && !deviceType) {
                var colorCode = $("ul.product-color-swatches").find('li.active').data('mz-swatch-color');
                if (typeof colorCode != 'undefined') {
                    this.changeImages(colorCode, 'N');
                } else if (typeof this.mainImage != 'undefined') {
                    $('.mz-productimages-mainimage').attr('src', this.mainImage);
                } else {
                    $('.mz-productimages-main').html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
                }
            }
        },
        selectSwatch: function(e) {
            this.isColorClicked = true;
            var colorCode = $(e.currentTarget).data('mz-swatch-color');
            this.changeImages(colorCode, 'Y');

        },
        changeImages: function(colorCode, _updateThumbNails) {
            var self = this;
            var version = 1;
            if (deviceType && $("figure.mz-productimages-thumbs ul.products_list_mobile li img.active").length > 0) {
                version = $("figure.mz-productimages-thumbs ul.products_list_mobile li img.active").data("mz-productimage-mobile");
            } else if ($("figure.mz-productimages-thumbs ul.products_list li.active").length > 0) {
                version = $("figure.mz-productimages-thumbs ul.products_list li.active").data("mz-productimage-thumb");
            }
            var imagepath = imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + version + '.jpg?maxWidth=';
            var mainImage = imagepath + width_pdp;
            var zoomimagepath = imagepath + width_zoom;
            var _this = this;
            //TODO: following function is checking if images exist on server or not
            generalFunctions.checkImage(imagepath, function(response) {
                if (response) {
                    if (!$('#zoom').length) {
                        $('.mz-productimages-main').html('<img class="mz-productimages-mainimage" data-mz-productimage-main="" id="zoom" itemprop="image">');
                    }
                    if (_updateThumbNails == 'Y') {
                        $('body div.zoomContainer').remove();
                        if (deviceType && $('ul.products_list_mobile').length) {
                            //slider_mobile.goToSlide(0);
                            $('body div.zoomContainer').remove();
                            $("img").removeData('elevateZoom');
                            $(current_zoom_id_added).attr('src', imagepath).data('zoom-image', zoomimagepath).elevateZoom({ zoomType: "inner", cursor: "crosshair" });
                        } else {
                            $('#zoom').removeData('elevateZoom');
                            $('.mz-productimages-mainimage').attr('src', mainImage).data('zoom-image', zoomimagepath);
                            $('#zoom').elevateZoom({ zoomType: "inner", cursor: "crosshair" });
                            $('.mz-productimages-mainimage').attr('src', mainImage);
                        }
                    } else {
                        $('.mz-productimages-mainimage').attr('src', mainImage);
                    }
                } else if (typeof self.mainImage === 'undefined') {
                    $('.mz-productimages-main').html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
                }
                if ($("figure.mz-productimages-thumbs").length && $("figure.mz-productimages-thumbs").data("length") && _updateThumbNails == 'Y') {
                    _this.updateAltImages(colorCode);
                }
            });
        },
        updateAltImages: function(colorCode) {
            try {
                slider.destroySlider();
            } catch (e) {}
            try {
                slider_mobile.destroySlider();
            } catch (e) {}
            var slideCount = parseInt($("figure.mz-productimages-thumbs").data("length"), 10);
            var productCode = this.model.attributes.productCode;
            for (var i = 1; i <= slideCount; i++) {
                $(".mz-productimages-thumbs .products_list li:eq(" + (i - 1) + ") .mz-productimages-thumb img")
                    .attr({
                        "src": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_thumb,
                        "data-orig-src": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_pdp,
                        "data-orig-zoom": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_zoom
                    });
                $(".mz-productimages-thumbs .products_list_mobile li:eq(" + (i - 1) + ") img")
                    .attr({
                        "src": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_pdp,
                        "data-orig-src": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_pdp,
                        "data-orig-zoom": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_zoom,
                        "data-zoom-image": imagefilepath + '/' + this.model.attributes.productCode + '_' + colorCode + '_v' + i + '.jpg?maxWidth=' + width_zoom
                    });
            }
            if (slideCount > 4) {
                initSlider();
            }
            initslider_mobile();
        },
        initialize: function() {
            // handle preset selects, etc
            var me = this;
            //create div for family members
            if (this.model.get('family').models.length) {
                for (var i = 0; i < this.model.get('family').models.length; i++) {
                    var html = "";
                    html += '<div id="' + this.model.get('family').models[i].get('productCode') + '" class="family-members"></div>';
                    $("#mz-family-container").append(html);
                }
            }
            me.isColorClicked = false;
            me.mainImage = '';
            if (deviceType && me.model.get('content').get('productImages').length > 1)
                $('#zoom_1').elevateZoom({ zoomType: "inner", cursor: "crosshair", responsive: true });
            else
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
                                me.configure($this);
                            }
                            break;
                        default:
                            me.configure($this);
                    }
                }
            });
        }
    });

    RVIModel.renderRVI('#rvi-container');

    $(document).ready(function() {
        var product = ProductModels.Product.fromCurrent();

        if ($('.mz-product-detail-tabs ul.tabs li').length === 0)
            $('.mz-product-detail-tabs').remove();

        /*$('body').click("#promo-detail .promo-modal-close", function(){
            $('#promo-detail').modal('hide');
        }); */
        $('body').on('click', '#surcharge-details', function() {
            $('.del-surcharge-popup').modal('show');
        });
        product.on('addedtocart', function(cartitem) {
            if (cartitem && cartitem.prop('id')) {
                //product.isLoading(true);
                CartMonitor.addToCount(product.get('quantity'));
                $('html,body').animate({
                    scrollTop: $('header').offset().top
                }, 1000);
                CartMonitor.update('showGlobalCart');
                product.set('quantity', 1);
                var oneSizeOption = "",
                id = Hypr.getThemeSetting('oneSizeAttributeName');
                if(product.get('options') && product.get('options').length)
                    oneSizeOption = product.get('options').get(id);
                if (product.get('options') && product.get('options').length && !oneSizeOption) {
                    var optionModels = product.get('options').models;
                    for (var k = 0; k < product.get('options').models.length; k++) {
                        optionModels[k].set('value', null);
                        $("[data-mz-action='addToCart']").addClass('button_disabled');
                    }
                }
                if (oneSizeOption) {
                    var onlyEnabledOneSizeOption = _.find(oneSizeOption.get('values'), function(value) { return value.isEnabled; });
                    oneSizeOption.set('value', onlyEnabledOneSizeOption.value);
                    $("[data-mz-action='addToCart']").removeClass('button_disabled');
                }
                product.unset('stockInfo');
                var priceDiscountTemplate = Hypr.getTemplate("modules/product/price-stack");
                $('.mz-productdetail-price').html(priceDiscountTemplate.render({
                    model: priceModel
                }));
                $(".mz-productcodes-productcode").text(Hypr.getLabel('item') + " # " + product.get('productCode'));
            } else {
                product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
            }
        });

        initSlider();
        initslider_mobile();
        //Custom Functions related to slider
        function createPager(carousal) {
            var totalSlides = carousal.getSlideCount();
            var newPager = $(".mz-productimages-pager");
            for (var i = 0; i < totalSlides; i++) {
                if (i === 0) {
                    newPager.append("<div data-mz-productimage-thumb=" + (i + 1) + " class=\"activepager\"></div>");
                } else {
                    newPager.append("<div data-mz-productimage-thumb=" + (i + 1) + " class=\"\"></div>");
                }
            }
            newPager.find('div').click(function() {
                var indx = $(".mz-productimages-pager div").index($(this));
                slider_mobile.goToSlide(indx);
                $(".mz-productimages-pager div").removeClass("activepager").eq(indx).addClass("activepager");
            });
        }
        if ($('#productmobile-Carousel').length) {
            createPager(slider_mobile);
        }

        var productView = new ProductView({
            el: $('.product-detail'),
            model: product,
            messagesEl: $('[data-mz-message-bar]')
        });

        var productImagesView = new ProductImageViews.ProductPageImagesView({
            el: $('[data-mz-productimages]'),
            model: product
        });

        window.productView = productView;
        window.familyLength = window.productView.model.attributes.family.models.length;

        productView.render();
        //IF on page laod Variation code is available then Displays UPC messages
        if (window.productView.model.get('variationProductCode')) {
            var sp_price = "";
            if (window.productView.model.get('inventoryInfo').onlineStockAvailable && typeof window.productView.model.get('inventoryInfo').onlineStockAvailable !== "undefined") {
                if (typeof window.productView.model.get('price').get('salePrice') != 'undefined')
                    sp_price = window.productView.model.get('price').get('salePrice');
                else
                    sp_price = window.productView.model.get('price').get('price');
                var price = Hypr.engine.render("{{price|currency}}", { locals: { price: sp_price } });
                $('.stock-info').show().html("In Stock <span class='stock-price'>" + price + "</span>");
            }
        }
        productInitialImages = {
            mainImage: product.attributes.mainImage,
            thumbImages: product.attributes.content.attributes.productImages
        };
        if (product.attributes.hasPriceRange) {
            priceModel = {
                hasPriceRange: product.attributes.hasPriceRange,
                priceRange: {
                    lower: product.attributes.priceRange.attributes.lower.attributes,
                    upper: product.attributes.priceRange.attributes.upper.attributes
                },
                price: product.attributes.price.attributes
            };
        } else {
            priceModel = {
                hasPriceRange: product.attributes.hasPriceRange,
                price: product.attributes.price.attributes
            };
        }
        var skuID;
        if (product.attributes.variationProductCode) {
            skuID = product.attributes.variationProductCode;
        } else {
            skuID = product.attributes.mfgPartNumber;
        }

        var itemQuantity = 1;
        api.get("cart").then(function(resp) {
            var cartItems = resp.data.items;
            for (var i = 0; i < cartItems.length; i++) {
                if (cartItems[i].product.mfgPartNumber === skuID) {
                    itemQuantity += cartItems[i].quantity;
                }
            }
            if (require.mozuData('limit') && require.mozuData('limit').stringValue !== "") {
                var limitperorder = parseInt(JSON.parse(require.mozuData('limit').stringValue)[skuID], 10);
                if (itemQuantity > limitperorder) {
                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("*Max " + limitperorder + " items are allowed.");
                    $("[data-mz-action='addToCart']").addClass("button_disabled");
                } else {
                    $('[data-mz-validationmessage-for="quantity"]').css('visibility', "visible").text("");
                    $("[data-mz-action='addToCart']").removeClass("button_disabled");
                }
            }
        });
        $(".tab_content").hide();
        $(".tab_content:first").show();
        /* if in tab mode */
        $("ul.tabs li").click(function() {
            $(".tab_content").hide();
            var activeTab = $(this).attr("rel");
            $("#" + activeTab).fadeIn();
            $("ul.tabs li").removeClass("active");
            $(this).addClass("active");
            $(".tab_drawer_heading").removeClass("d_active");
            $(".tab_drawer_heading[rel^='" + activeTab + "']").addClass("d_active");
        });
        /* if in mobile mode */
        $(".tab_drawer_heading").click(function() {
            $(".tab_content").hide();
            var d_activeTab = $(this).attr("rel");
            $("#" + d_activeTab).fadeIn();
            $(".tab_drawer_heading").removeClass("d_active");
            $(this).addClass("d_active");
            $("ul.tabs li").removeClass("active");
            $("ul.tabs li[rel^='" + d_activeTab + "']").addClass("active");
        });
        $('body').on('click', '#mz-close-button', function(e) {
            e.preventDefault();
            blockUiLoader.unblockUi();
        });

    }).bind("touchstart", function(e) {
        var container = $(".ipad > div:visible");
        if (!$(e.target).closest(container).length) {
            var isDisplayed = (container.length > 0) ? container.css('visibility', 'hidden') : container.css('visibility', 'visible');
        }
    });
});