define([
        'modules/jquery-mozu',
        'underscore',
        'modules/backbone-mozu',
        'hyprlive',
        'modules/models-product',
        'modules/api',
        'hyprlivecontext',
        'shim!vendor/jquery/owl.carousel.min',
        'bootstrap'
    ],
    function($, _, Backbone, Hypr, ProductModels, api, HyprLiveContext) {
        var eFlag = 0;
        var pageContext = require.mozuData('pagecontext');
        var ProductModel = Backbone.MozuModel.extend({
            mozuType: 'products'
        });

        var ProductModelColor = Backbone.MozuModel.extend({
            mozuType: 'products'
        });
        var categoryID = $('[data-ig-recent-history]').data('ig-recent-history');

        var RecentProductListView = Backbone.MozuView.extend({
            templateName: 'modules/product/related-product-tiles',
            additionalEvents: {
                "click .next": "next",
                "click .previous": "previous",
                "click [data-mz-swatch]": "colorRecentSwatching",
                "click a.wishlist-button": "addToWishlist",
                "touchstart a.wishlist-button": "addToWishlist"
            },
            initialize: function() {
                var self = this;
                var isUserAnonymous = require.mozuData('user').isAnonymous;
                this.owlSLider();
                if (isUserAnonymous === false) {
                    self.addedToWishlist();
                }
            },
            owlSLider: function() {
                var owlItems = 1;
                if (pageContext.isDesktop) {
                    owlItems = 6;
                } else if (pageContext.isTablet) {
                    owlItems = 3;
                } else {
                    owlItems = 1;
                }
                var owl = $(".ig-recent-history .related-prod-owl-carousel").owlCarousel({
                    loop: false,
                    responsiveClass: true,
                    responsive: {
                        0: {
                            items: 2,
                            nav: false
                        },
                        480: {
                            items: 3,
                            nav: false
                        },
                        1025: {
                            items: 6,
                            nav: false
                        }
                    }
                });
                owl.on('changed.owl.carousel', function(e) {
                    if (e.item.index >= 1)
                        $(".ig-recent-history").find('.previous').show();
                    else
                        $(".ig-recent-history").find('.previous').hide();
                    if (e.item.index === e.item.count - owlItems)
                        $(".ig-recent-history").find('.next').hide();
                    else
                        $(".ig-recent-history").find('.next').show();
                });

                if (owl.find('.owl-item').length <= owlItems)
                    $(".ig-recent-history").find('.next').hide();

                $(".ig-recent-history #owl-example > .owl-item").addClass("mz-productlist-item");

                $('.ig-recent-history .next').on('click', function() {
                    owl.trigger('next.owl.carousel');
                });
                $('.ig-recent-history .previous').on('click', function() {
                    owl.trigger('prev.owl.carousel');
                });

                $('.cross-sell-title').removeClass('hidden');

                var owlItemTotal3 = $("#recent-history-main-content .owl-item").length;
                if (pageContext.isDesktop && owlItemTotal3 >= 6) {
                    $("#recent-history-main-content .ig-recent-history").css("border-right", "none");
                }
                if (pageContext.isTablet && owlItemTotal3 >= 3) {
                    $("#recent-history-main-content .ig-recent-history").css("border-right", "none");
                }
                if (pageContext.isMobile && owlItemTotal3 >= 2) {
                    $("#recent-history-main-content .ig-recent-history").css("border-right", "none");
                }
            },
            render: function() {
                var self = this;
                Backbone.MozuView.prototype.render.apply(this, arguments);
                this.priceFunction();
                var catTitle = '';
                $('.ig-recent-history').find('.related-prod-owl-carousel').closest('.test').find('.recent-history-container').removeClass('hidden');
                $('[data-toolstip="toolstip"]').tooltip();
                this.owlSLider();
                var isUserAnonymous = require.mozuData('user').isAnonymous;
                if (isUserAnonymous === false) {
                    self.addedToWishlist();
                }
            },

            colorRecentSwatching: function(e) {
                e.preventDefault();
                if (eFlag === 0) {
                    eFlag = 1;
                    var $currentEvtSource = $(e.currentTarget);
                    //$currentEvtSource.closest('.ig-related-products').find('input').css({'border': 'none'});
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
                                $(document).trigger('productAddedToWishlist');
                                $(currentWishListBtn).attr('disabled', 'disabled');
                                $(currentWishListBtn).addClass("addedToWishlist");
                            });
                        } catch (err) {
                            //console.log("Error Obj:" + err);
                        }
                    }
                });
            },
            addedToWishlist: function() {
                var productCodesShown = [];
                var productsWishlistBtns = [];
                var productCodesShownIndex = 0;

                $('.mz-productlisting').each(function() {
                    var wishlistBtn = $(this).find("a.wishlist-button");
                    var listingProductCode = $(this).data("mz-product");
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
            moveTitle: function(catTitle) {
                $('.popular-product-container .slider-title').text(Hypr.getLabel('topSelling') + ' ' + catTitle);
                $('.popular-product-container .slider-title').removeClass('hidden');
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
            }
        });
        return {
            recentHistroryView: RecentProductListView
        };
    });