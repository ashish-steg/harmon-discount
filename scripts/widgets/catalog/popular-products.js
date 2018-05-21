require([
    'modules/jquery-mozu',
    'underscore',
    'modules/backbone-mozu',
    'hyprlive',
    'modules/models-product',
    'modules/models-cart',
	'modules/cart-monitor',
    'modules/api',
    'hyprlivecontext',
    'shim!vendor/jquery/owl.carousel.min',
    'bootstrap'
],
    function($, _, Backbone, Hypr, ProductModels, CartModels, CartMonitort, api, HyprLiveContext) {
        'use strict';
        var eFlag = 0;
        var pageContext = require.mozuData('pagecontext');
        var ProductModel = Backbone.MozuModel.extend({
            mozuType: 'products'
        });
        
        var ProductModelColor = Backbone.MozuModel.extend({
            mozuType: 'products'
        });
    
        var categoryID = $('[data-ig-popular-products]').data('ig-popular-products');
        
        var newItemsToShow = HyprLiveContext.locals.themeSettings.newItemsToShow;
        
        var onSaleItemsToShow = HyprLiveContext.locals.themeSettings.onSaleItemsToShow;
    
        var ProductListView = Backbone.MozuView.extend({
            templateName: 'modules/product/related-product-tiles',
            additionalEvents: {
                "click .next": "next",
                "click .previous": "previous",
                "click [data-mz-swatch]" : "colorSwatching",
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
            colorSelected: function() {
                var self = this;
                var productList = $('.ig-popular-products #owl-example .owl-stage-outer .owl-stage .owl-item');
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
            render: function() {
                var self = this;
                var owlItems = 1;
                    if(pageContext.isDesktop) {
                        owlItems = 6;
                    } 
                    else if(pageContext.isTablet) {
                        owlItems = 3;
                    } 
                    else {
                        owlItems = 1;
                    }
                    Backbone.MozuView.prototype.render.apply(this, arguments); 
                    this.colorSwatching();
                    this.priceFunction();
                    var catTitle = '';
                    $('[data-toolstip="toolstip"]').tooltip();
                    /*api.get('categories', {categoryId: categoryID.title, pageSize: 45}).then(function(categoryModel) { 
                        $.each(categoryModel.data.items, function(i, category) {
                            if(category.categoryId === categoryID.title) {
                                self.moveTitle(category.content.name);
                            }
                        });
                    });*/
                
                    var owl =  $(".ig-popular-products #owl-example").owlCarousel({ 
                        loop: false,
                        responsiveClass:true,
                        responsive:{
                            0:{ 
                                items:owlItems,
                                stagePadding: 57,
                                nav:false
                            },
                            600:{
                                items:owlItems,
                                stagePadding: 57,
                                nav:false
                            },
                            768:{
                                items:owlItems,
                                nav:false
                            },
                            1024:{
                                items:owlItems,
                                nav:false
                            }
                        }
                    });
                    owl.on('changed.owl.carousel', function(e) {
                        if( e.item.index >= 1) 
                            $(".ig-popular-products").find('.previous').show();
                        else
                            $(".ig-popular-products").find('.previous').hide();
                        if( e.item.index === e.item.count-owlItems) 
                            $(".ig-popular-products").find('.next').hide();
                        else 
                            $(".ig-popular-products").find('.next').show();
                    });
                    
                    if(owl.find('.owl-item').length <= owlItems)
                        $(".ig-popular-products").find('.next').hide();
                    
                    $(".ig-popular-products #owl-example > .owl-item").addClass("mz-productlist-item");
                    $('.ig-popular-products .next').on('click', function() {
                        owl.trigger('next.owl.carousel');
                    });
                    $('.ig-popular-products .previous').on('click', function() {
                        owl.trigger('prev.owl.carousel');
                    });
                    
                    var owlItemTotal = $(".ig-popular-products #owl-example .owl-item").length;
                    if((pageContext.isDesktop && owlItemTotal >= 6) || (pageContext.isTablet && owlItemTotal >= 3) || pageContext.isMobile && owlItemTotal >= 2 ) {
                      $(".ig-popular-products.carousel-parent").css("border-right", "none");
                    }
                    
                    this.colorSelected();
                    this.manageBlocksHeight();
                },
            
            colorSwatching: function(e) {
                $('[data-mz-swatch]').on("click", function(e){
                    if (eFlag === 0) {
                        eFlag = 1;
                        var $currentEvtSource = $(e.currentTarget);
                        $currentEvtSource.closest('.ig-popular-products').find('input').css({'border': 'none'});
                        $currentEvtSource.css({'border': '2px solid #4a4a4a'});
                        var productCode = $currentEvtSource.closest('.mz-productlisting').data('mz-product');
                        var swatchCol = $currentEvtSource.attr('value').toLowerCase();
                        var swatchColor = $currentEvtSource.attr('value');
                        
                        var mainImage = $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr("data-srcset"); 
                        
                        var url = window.location.origin;
                        /*var loadSrc = url+"/resources/images/loading-3.gif";
                        $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr("srcset", loadSrc+"?max=40");*/
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer').removeClass('active');
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').addClass('active');
                        var CurrentProductModel = new ProductModelColor();
                        CurrentProductModel.set('filter', 'productCode eq '+productCode);
                        CurrentProductModel.fetch().then(function(responseObject) {
                            var prodContent = responseObject.apiModel.data.items;
                            var prodImg = null, prodImgAltText = null, ImgAltText = null;
                            var flag = 0;
                            _.each(prodContent, function(productImages) {
                                prodImg = _.findWhere(productImages.content.productImages, {altText: swatchColor || swatchCol});
                            });
                            if (prodImg) {
                                var prodImage = prodImg.imageUrl;
                                $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": prodImage+"?max=400", "alt": ImgAltText, "style":""});
                                eFlag = 0;
                            } else {
                                $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": mainImage+"?max=400", "style":""});
                                eFlag = 0;
                            }
                        });
                    }
                });
            },
            addToWishlist: function(e) {
                e.preventDefault();
                var qvProductCode = $(e.currentTarget).data("listing-prod-code");
                var currentWishListBtn = e.currentTarget;
                
                if($(currentWishListBtn).hasClass('addedToWishlist')) {
                    
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
                        var product = new ProductModels.Product({ productCode: qvProductCode} );
                        product.addToWishlist({ quantity: 1});
        
                        try {
                            product.on('addedtowishlist', function(wishlistitem) {
                                $(document).trigger('productAddedToWishlist');
                                $(currentWishListBtn).attr('disabled', 'disabled');
                                $(currentWishListBtn).addClass("addedToWishlist");
                            });
                        } catch (err) {
                        }
                    }
                });
            },
            
            addedToWishlist: function() {
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
        
            getMaxHeight: function(selector) { 
                return Math.max.apply(null, $("" + selector).map(function ()
                {
                    return $(this).height();
                }).get());
            },
            manageBlocksHeight: function() {
                try {
                    var self = this;
                } catch (err) {
                    /*ignore*/
                }
            },
            moveTitle: function(catTitle) { 
                $('.popular-product-container .slider-title').text( + ' ' + catTitle);
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
                        if(afterDecimal == '00') {
                            $(this).html('<span class="dollar">'+amountDollar+'</span>'+decimal[0]);
                        } else {
                            $(this).html('<span class="dollar">'+amountDollar+'</span>'+'<span class="interger">'+decimal[0]+'</span>'+'<sup>'+decimal[1]+'</sup>');
                        }
                    });
                }
            
        });
    
        var getPopularProducts = function() {
            var filterStr = "";
            filterStr = "categoryId eq " + categoryID.title + " and tenant~popularity gt 0";
            var retval = api.get("search", { filter: filterStr , startIndex: 0, pageSize: 10, sortBy: 'tenant~popularity desc' });
            return retval;
        };

        var renderSlider = function(productsFound) {
            var prodColl = new ProductModels.ProductCollection();
            prodColl.set('items', productsFound.data.items);
            if(productsFound.data.items.length !== 0) {
                $('.popular-product-container .slider-title').removeClass('hidden');
            }
            var productListView = new ProductListView({
                el: $('[data-ig-popular-products]'),
                model: prodColl
            });
            productListView.render();
        };

        getPopularProducts().then(function (productsFound) {
            renderSlider(productsFound);
        }).promise['catch'](function() {
            var productsFound = {};
            productsFound.data = {};
            productsFound.data.items = [];
            renderSlider(productsFound);
        });
    });