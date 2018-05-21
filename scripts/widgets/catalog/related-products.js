require([
    'modules/jquery-mozu',
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-product',
    'shim!vendor/jquery/owl.carousel.min'
], function($, _, api, Backbone, ProductModels) {

    var coerceBoolean = function(x) {
        return !!x;
    };
    var eFlag = 0;
    var getRelatedProducts = function(codes) {
        var filter = _.map(codes, function(c) { return "ProductCode eq " + c; }).join(' or ');
        var retval = api.get("search", { filter: filter, sortBy: 'tenant~rating desc' });
        return retval;
    };
    var ProductModelColor = Backbone.MozuModel.extend({
        mozuType: 'products'
    });
    var pageContext = require.mozuData('pagecontext');
    var renderRelatedProductsView = function(productCodes, rp) {
        getRelatedProducts(productCodes).then(function(collection) {
            var relatedProductsCollection = null;
            if (productCodes.length > 0) {
                relatedProductsCollection = new ProductModels.ProductCollection(collection.data);
            } else {
                relatedProductsCollection = new ProductModels.ProductCollection();
            }

            var relatedProductsView = new RelatedProductsView({
                model: relatedProductsCollection,
                el: rp
            });

            relatedProductsView.render();
        });
    };

    var GenericProductSliderView = Backbone.MozuView.extend({
        additionalEvents: {
            'click .next': 'next',
            'click .previous': 'previous',
            "click [data-mz-swatch]": "colorSwatching",
            "click a.wishlist-button": "addToWishlist",
            "touchstart a.wishlist-button": "addToWishlist"
        },
        initialize: function() {
            this.owl = null;
            var self = this;
            var isUserAnonymous = require.mozuData('user').isAnonymous;
            if (isUserAnonymous === false) {
                self.addedToWishlist();
            }
        },

        getMaxHeight: function(element) {
            return Math.max.apply(null, $(element).map(function() {
                return $(this).height();
            }).get());
        },
        manageBlocksHeight: function() {
            try {
                var self = this;
                var $listing = $(self.el).find('.mz-productlisting');
                var $listingInfo = $(self.el).find('.mz-productlisting-info');
                var $imgDiv = $(self.el).find('.mz-subcategory-image-div');
                var $priceDiv = $(self.el).find('.mz-category-price');

            } catch (err) {
                //ignore
            }
        },
        moveTitle: function() {
            var self = this;
            $(self.el).find('.title').html($(self.el).parent().find('.slider-title').html());
        },
        colorSwatching: function(e) {
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
        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            var $images = $(self.el).find('.mz-subcategory-image-div img');
            var imgCount = $images.length;
            var loadCount = 0;
            $images.load(function() {
                loadCount++;

                if (loadCount == imgCount) {
                    self.manageBlocksHeight();
                }
            });

            $('.ig-related-products').find('.related-prod-owl-carousel').closest('.test').find('.related-container').removeClass('hidden');

            var owlItems = 1;
            if (pageContext.isDesktop) {
                owlItems = 6;
            } else if (pageContext.isTablet) {
                owlItems = 3;
            } else if (pageContext.isMobile) {
                owlItems = 2;
            }

            function sliderType(first, second) {
                var owl = $(first).owlCarousel({
                    loop: false,
                    responsiveClass: true,
                    width: '100%',
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
                        $(second).find('.previous').show();
                    else
                        $(second).find('.previous').hide();
                    if (e.item.index === e.item.count - owlItems)
                        $(second).find('.next').hide();
                    else
                        $(second).find('.next').show();
                });

                if (owl.find('.owl-item').length <= owlItems)
                    $(second).find('.next').hide();

                $(".ig-related-products").css('visibility', 'visible');
                $(".related-prod-owl-carousel #owl-example > .owl-item").addClass("mz-productlist-item");



                $(second + ' .next').on('click', function() {
                    owl.trigger('next.owl.carousel');
                });
                $(second + ' .previous').on('click', function() {
                    owl.trigger('prev.owl.carousel');
                });

                $(second + ' .next').on('click', function() {
                    owl.trigger('next.owl.carousel');
                });
                $(second + ' .previous').on('click', function() {
                    owl.trigger('prev.owl.carousel');
                });

                var owlItemTotal = $("#cross-sale-container .owl-item").length;
                if ((pageContext.isDesktop && owlItemTotal >= 6) || (pageContext.isTablet && owlItemTotal >= 3) || pageContext.isMobile && owlItemTotal >= 2) {
                    $("#cross-sale-container .ig-related-products").css("border-right", "none");
                }
                var owlItemTotal2 = $("#up-sale-container .owl-item").length;
                if ((pageContext.isDesktop && owlItemTotal2 >= 6) || (pageContext.isTablet && owlItemTotal2 >= 3) || pageContext.isMobile && owlItemTotal2 >= 2) {
                    $("#up-sale-container .ig-related-products").css("border-right", "none");
                }
            }

            sliderType("#cross-sale-container .ig-related-products #owl-example", "#cross-sale-container .ig-related-products");
            sliderType("#up-sale-container .ig-related-products #owl-example", "#up-sale-container .ig-related-products");
            //$('.cross-sell-title').removeClass('hidden');
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
            self.moveTitle();
            self.manageBlocksHeight();
            var isUserAnonymous = require.mozuData('user').isAnonymous;
            if (isUserAnonymous === false) {
                self.addedToWishlist();
            }
        }


    });

    // This slider will work with complete product details
    var RelatedProductsView = GenericProductSliderView.extend({
        templateName: 'modules/product/related-product-tiles'
    });


    $(document).ready(function() {
        var productCodesCollection = [];

        switch (pageContext.pageType) {
            case 'product':
                productCodesCollection.push(require.mozuData('product').productCode);
                break;
            case 'cart':
                var cartItems = require.mozuData('cart').items;
                $.each(cartItems, function(index, value) {
                    productCodesCollection.push(value.product.productCode);
                });

                $(document).on('cartChanged', function() {
                    renderRelatedProducts();
                });
                break;
            default:
                var genericProductCodes = $('[data-ig-related-product-codes]').data("ig-related-product-codes");
                productCodesCollection = genericProductCodes.split(",");
                break;
        }

        function renderRelatedProducts() {
            $('[data-ig-related-products]').each(function(index, rp) {
                rp = $(rp);

                var config = rp.data('igRelatedProducts');
                var attId = config.attributeId || 'tenant~product-crosssell';
                var title = config.title;
                var productCodes = []; // = _.pluck(currentProduct.properties[0].values, "value");

                var prodGetPromises = [];

                _.each(productCodesCollection, function(productCode) {
                    if (typeof productCode == 'string') {
                        productCode = productCode.trim();
                    }

                    prodGetPromises.push(
                        api.get('product', productCode).then(function(product) {
                            _.each(product.data.properties, function(productProperty) {
                                if (productProperty.attributeFQN == attId) {
                                    var temp = _.pluck(productProperty.values, "value");
                                    productCodes = productCodes.concat($.grep(temp || [], coerceBoolean));
                                }
                            });
                        })
                    );
                });

                api.steps(prodGetPromises).then(function() {
                    // All product's details are fetched successfully.
                }, function() {
                    // Error in fetching product details.
                }).ensure(function() {
                    renderRelatedProductsView(productCodes, rp);
                });
            });

        }

        renderRelatedProducts();
    }); // END of document ready event

});