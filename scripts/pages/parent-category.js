require([
        'modules/jquery-mozu',
        'hyprlive',
        'underscore',
        'modules/backbone-mozu',
        'modules/models-product',
        'modules/models-cart',
        'modules/cart-monitor',
        'modules/api',
        'hyprlivecontext',
        'shim!vendor/jquery/owl.carousel.min',
        'bootstrap'
    ],
    function($, Hypr, _, Backbone, ProductModels, CartModels, CartMonitort, api, HyprLiveContext) {

        var pageContext = require.mozuData('pagecontext');

        var owl = null;
        var eFlag = 0;

        var categoryID = $('[data-ig-new-arrivals]').data('ig-new-arrivals');

        var ProductModelColor = Backbone.MozuModel.extend({
            mozuType: 'products'
        });

        var NewarrivalSliderView = Backbone.View.extend({
            el: 'body',
            events: {
                "click [data-mz-swatch]": "colorSwatching",
                "click a.wishlist-button": "addToWishlist",
                "touchstart a.wishlist-button": "addToWishlist"
            },
            initialize: function() {
                this.render();
                //this.colorSelected();
            },
            colorSelected: function() {
                var self = this;
                var productList = $('.ig-new-arrivals #owl-example .owl-stage-outer .owl-stage .owl-item');
                $(productList).each(function() {
                    var me = this,
                        mainImageAltTextArray = [],
                        productoptionsColors = [],
                        mainImgaltText;
                    var altText = $(this).find("[data-main-image-src]").attr("alt");
                    if (altText) {
                        mainImgaltText = altText.toString().toLowerCase();
                    }
                    $(this).find('[data-mz-swatch]').each(function() {
                        var colorOption = $(this).val();
                        if (colorOption) {
                            var clr = colorOption.toString().toLowerCase();
                            productoptionsColors.push(clr);
                        }
                    });
                    _.each(productoptionsColors, function(colors) {
                        if (mainImgaltText === colors) {
                            $(me).find('[data-mz-swatch]').each(function() {
                                var border = this;
                                if ($(this).hasClass(mainImgaltText)) {
                                    $(border).css({
                                        'border': '2px solid #4a4a4a'
                                    });
                                }
                            });
                        }
                    });
                });
            },
            addedToWishlist: function() {
                /*wishlist*/
                var productCodesShown = [];
                var productsWishlistBtns = [];
                var productCodesShownIndex = 0;

                $('.owl-item').each(function() {
                    var wishlistBtn = $(this).find("a.wishlist-button");
                    var listingProductCode = $(wishlistBtn).data("listing-prod-code");
                    productCodesShown[productCodesShownIndex] = listingProductCode;
                    productsWishlistBtns[productCodesShownIndex] = wishlistBtn;
                    productCodesShownIndex++;
                });
                var isUserAnonymous = require.mozuData('user').isAnonymous;
                if (isUserAnonymous === false) {
                    var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                        return wishlist.data;
                    }).then(function(wishlistItems) {
                        for (var j = 0; j < productCodesShown.length; j++) {
                            for (var i = 0; i < wishlistItems.items.length; i++) {
                                if (wishlistItems.items[i].product.productCode == productCodesShown[j]) {
                                    $(productsWishlistBtns[j]).prop('disabled', 'disabled');
                                    $(productsWishlistBtns[j]).addClass("addedToWishlist");
                                }
                            }
                        }
                    });
                }
            },

            sliderFunction: function() {
                var self = this;
                var owlItems = 1;
                if (pageContext.isDesktop) {
                    owlItems = 6;
                } else if (pageContext.isTablet) {
                    owlItems = 3;
                } else {
                    owlItems = 1;
                }

                var owl = $(".ig-new-arrivals #owl-example").owlCarousel({
                    loop: false,
                    responsiveClass: true,
                    responsive: {
                        0: {
                            items: owlItems,
                            stagePadding: 57,
                            nav: false
                        },
                        600: {
                            items: owlItems,
                            stagePadding: 57,
                            nav: false
                        },
                        768: {
                            items: owlItems,
                            nav: false
                        },
                        1024: {
                            items: owlItems,
                            nav: false
                        }
                    }
                });
                owl.on('changed.owl.carousel', function(e) {
                    if (e.item.index >= 1)
                        $(".ig-new-arrivals").find('.previous').show();
                    else
                        $(".ig-new-arrivals").find('.previous').hide();
                    if (e.item.index === e.item.count - owlItems)
                        $(".ig-new-arrivals").find('.next').hide();
                    else
                        $(".ig-new-arrivals").find('.next').show();
                });
                if (owl.find('.owl-item').length === owlItems)
                    $(".ig-new-arrivals").find('.next').hide();

                $(".new-arrival-product-container").css('visibility', 'visible');
                $(".ig-new-arrivals #owl-example > .owl-item").addClass("mz-productlist-item");
                $('.ig-new-arrivals .next').on('click', function() {
                    owl.trigger('next.owl.carousel');
                });
                $('.ig-new-arrivals .previous').on('click', function() {
                    owl.trigger('prev.owl.carousel');
                });

                var owlItemTotal = $(".ig-new-arrivals #owl-example .owl-item").length;
                if ((pageContext.isDesktop && owlItemTotal >= 6) || (pageContext.isTablet && owlItemTotal >= 3) || pageContext.isMobile && owlItemTotal >= 2) {
                    $(".ig-new-arrivals.carousel-parent").css("border-right", "none");
                }

            },
            mouseoverFunction: function() {
                $('[data-toolstip="toolstip"]').tooltip();
            },

            colorSwatching: function(e) {
                e.preventDefault();
                if (eFlag === 0) {
                    eFlag = 1;
                    var $currentEvtSource = $(e.currentTarget);
                    $currentEvtSource.closest('.owl-item').find('input').css({ 'border': 'none' });
                    $currentEvtSource.css({ 'border': '2px solid #4a4a4a' });
                    var productCode = $currentEvtSource.closest('.mz-productlisting').data('mz-product');

                    var swatchCol = $currentEvtSource.attr('value').toLowerCase();
                    var swatchColor = $currentEvtSource.attr('value');

                    var mainImage = $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr("data-main-image-src");

                    var url = window.location.origin;
                    $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').removeClass('active');
                    $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').addClass('active');
                    var CurrentProductModel = new ProductModelColor();
                    CurrentProductModel.set('filter', 'productCode eq ' + productCode);

                    CurrentProductModel.fetch().then(function(responseObject) {
                        var prodContent = responseObject.apiModel.data.items;
                        var prodImg = null,
                            prodImgAltText = null,
                            ImgAltText = null;
                        var flag = 0;

                        _.each(prodContent, function(productImages) {
                            prodImg = _.findWhere(productImages.content.productImages, { altText: swatchColor || swatchCol });
                        });
                        if (prodImg) {
                            var prodImage = prodImg.imageUrl;
                            $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({ "srcset": prodImage + "?max=400", "alt": ImgAltText, "style": "" }).addClass('active');
                            $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                            eFlag = 0;
                        } else {
                            $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({ "srcset": mainImage + "?max=400", "style": "" }).addClass('active');
                            $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                            eFlag = 0;
                        }
                    });
                }
            },
            addToWishlist: function(e) {
                e.preventDefault();
                var qvProductCode = $(e.currentTarget).data("listing-prod-code");
                var currentWishListBtn = e.currentTarget;

                if ($(currentWishListBtn).hasClass('addedToWishlist')) {

                } else {
                    $(currentWishListBtn).addClass('clicked');
                }

                var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                    return wishlist.data;
                }).then(function(wishlistItems) {
                    var proceed = true;
                    for (var i = 0; i < wishlistItems.items.length; i++) {
                        if (wishlistItems.items[i].product.productCode == qvProductCode) {
                            proceed = false;
                        }
                    }

                    if (proceed) {
                        var product = new ProductModels.Product({ productCode: qvProductCode });
                        product.addToWishlist({ quantity: 1 });

                        try {
                            product.on('addedtowishlist', function(wishlistitem) {
                                $(currentWishListBtn).attr('disabled', 'disabled');
                                $(currentWishListBtn).addClass("addedToWishlist");
                            });
                        } catch (err) {
                            //console.log("Error Obj:" + err);
                        }
                    }
                });
            },
            priceFunction: function() {
                $('.mz-price').each(function() {
                    var amountText = $(this).data("total-amount");
                    var amountString = amountText.toString();
                    var amountDollar = amountString.charAt(0);
                    var totalp = amountString.split(amountDollar);
                    var decimal = totalp[1].split('.');
                    var afterDecimal = decimal[1];
                    if (afterDecimal == '00') {
                        $(this).html('<span class="dollar">' + amountDollar + '</span>' + decimal[0]);
                    } else {
                        $(this).html('<span class="dollar">' + amountDollar + '</span>' + '<span class="interger">' + decimal[0] + '</span>' + '<sup>' + decimal[1] + '</sup>');
                    }
                });
            },
            render: function() {
                var self = this;
                var isUserAnonymous = require.mozuData('user').isAnonymous;
                if (isUserAnonymous === false) {
                    self.addedToWishlist();
                }
                this.sliderFunction();
                this.mouseoverFunction();
                this.priceFunction();
            }
        });

        $(document).ready(function() {
            var newarrivalSliderView = new NewarrivalSliderView();
            $("#owl-example").css('display', 'block');

            if ($('#mz-drop-zone-category-page-top').is(':has(#owl-example)')) {} else {
                $('#page-content').find('.banner').show();
            }

        });
    });