require([
        'modules/jquery-mozu',
        'hyprlive',
        "hyprlivecontext",
        'underscore',
        'modules/api',
        'modules/backbone-mozu',
        'modules/models-product',
        'widgets/rti/recommended-products',
        'widgets/rti/gc-recommended-products',
        'bxslider'
    ],
    function($, Hypr, HyprLiveContext, _, api, Backbone, ProductModels, RecommendedProducts, GCRecommendedProducts, bxslider) {

        // rtiOptions will contain variables used by the
        //whole page. They can be set in every widget editor, but only the first
        //one on the page is the one that we'll listen to for these variables.

        var firstDisplay = $('.recommended-product-container').not('#global-cart .recommended-product-container').first();
        var firstConfig;
        var rtiOptions = {};
        if ($('.recommended-product-container').not('#global-cart .recommended-product-container').length) {
            firstConfig = firstDisplay.data('mzRtiRecommendedProducts');
            rtiOptions = {
                customerId: firstConfig.customerId || "",
                customerCode: firstConfig.customerCode || "",
                pageType: firstConfig.pageType || "",
                jsInject: firstConfig.javascriptInjection || "",
                includeSiteId: firstConfig.includeSiteId || false,
                includeTenantId: firstConfig.includeTenantId || false
            };
        }


        var pageContext = require.mozuData('pagecontext');
        var siteContext = require.mozuData('sitecontext');

        /*
        containerList holds data about all of the widgets we're going to make.
        */
        var containerList = [];

        /*
        The following loop acts as cleanup; it populates containerList with the needed data,
        ignoring and delegitimizing any divs on the page with duplicate placeholder names.
        */
        $('.recommended-product-container').not('#global-cart .recommended-product-container').each(function() {
            if (!$(this).hasClass('ignore')) {
                var configData = $(this).data('mzRtiRecommendedProducts');
                //displayOptions are individual to each container.
                var displayOptions = {
                    title: configData.title || "",
                    quantity: configData.numberOfItems || "",
                    format: configData.displayType || "",
                    placeholder: configData.placeholder || ""
                };
                var container = { config: displayOptions };
                var selector = '.recommended-product-container.' + configData.placeholder;

                if ($(selector).not('#global-cart .recommended-product-container').length > 1) {
                    $(selector).not('#global-cart .recommended-product-container').each(function(index, element) {
                        if (index > 0) {
                            /*
                            We don't want to add the data from accidental duplicates to
                            our nice, clean containerList. We also don't want those duplicates to
                            accidentally render. So for all but the first element with this
                            class name, we strip all classes, add 'ignore' so the .each we're in
                            right now ignores the duplicates, hides the div, and adds a message
                            in edit mode so the user knows what happened.
                            */
                            $(element).removeClass();
                            $(element).addClass('ignore');
                            if (pageContext.isEditMode) {
                                $("<p>Error: duplicate placeholder name.</p>").insertBefore($(element));
                            }
                            $(element).hide();
                        }
                    });
                }
                containerList.push(container);
            }
        });

        /*Recommended Product Code Starts*/
        var eFlag = 0;
        var ProductModelColor = Backbone.MozuModel.extend({
            mozuType: 'products'
        });
        //***********************
        //---VIEW DEFINITIONS---//
        //************************

        //***Start Carousel view def:
        var ProductListView = Backbone.MozuView.extend({
            templateName: 'modules/product/rti-product-list'
        });
        //End Carousel view def***

        var getMozuProducts = function(rtiProductList) {

            var deferred = api.defer();
            var numReqs = rtiProductList.length;
            var productList = [];
            var filter = "";
            for(var i=0;i<numReqs;i++) {
                if (rtiProductList[i].ProductCode && !rtiProductList[i].ProductId) {
                    rtiProductList[i].ProductId = rtiProductList[i].ProductCode;
                }
            }
            _.each(rtiProductList, function(attrs) {
                if (filter !== "") filter += " or ";
                filter += "productCode eq " + attrs.ProductId;
            });
            var op = api.get('products', filter);
            op.then(function(data) {
                _.each(data.data.items, function(product) {

                    var rtiProduct = _.findWhere(rtiProductList, { ProductId: product.productCode });
                    product.rtiRank = rtiProduct.rank || '';
                    product.slot = rtiProduct.slot || '';
                    product.widgetId = rtiProduct.widgetId || '';
                    product.href = rtiProduct.url || '';
                    productList.push(product);
                    _.defer(function() {
                        deferred.resolve(productList);
                    });
                });

            }, function(reason) {
                _.defer(function() {
                    deferred.resolve(productList);
                });
            });
            return deferred.promise;
        };

        var renderData = function(data) {

            _.each(containerList, function(container) {
                var placeholder = container.config.placeholder;
                var numberOfItems = container.config.quantity || container.config.numberOfItems;
                var configTitle = container.config.title;
                var format = container.config.format;
                if (pageContext.isEditMode) {
                    $('.recommended-product-container.' + placeholder).text('<b>Here Goes your RTI Recommended items</b>');
                    return;
                }
                /*
                Our data will contain information about lots of different possible widgets.
                First we want to reduce that data to only the placeholderName we're dealing with.
                */
                var currentProducts = $.grep(data, function(e) {
                    return e.placeholderName == placeholder;
                });
                /*
                We should at this point have a list of results with the correct placeholderName,
                and that last should only be 1 item long.
                If that first item doesn't exist, there was a problem.
                */
                if (!currentProducts[0]) {
                    if (pageContext.isEditMode) {
                        /*
                        If we reach this point, it means there wasn't a placeholderName in the
                        data that was returned that matches the one we selected.
                        */
                        $('.recommended-product-container.' + placeholder).text("Placeholder not found.");
                    }
                } else {
                    //We have the data for our widget now. Time to fill it up.
                    var displayName;
                    //if configTitle has a value, the user entered a title to
                    //override the title set in RTI.
                    if (configTitle) {
                        displayName = configTitle;
                    } else {
                        //if configTitle has no value, we get the title from the
                        //product results call
                        displayName = currentProducts[0].displayName;
                    }

                    //We slice the productList we received according to the limit set
                    //in the editor
                    var productList;
                    if (currentProducts[0].productList.length > numberOfItems) {
                        productList = currentProducts[0].productList.slice(0, numberOfItems);
                    } else {
                        productList = currentProducts[0].productList;
                    }
                    //Turns list of product IDs into a product collection
                    getMozuProducts(productList).then(function(products) {
                        if (products.length !== 0) {
                            var productsByRank = _.sortBy(products, 'rtiRank');
                            productList = productsByRank;
                            var prodColl = new ProductModels.ProductCollection();
                            prodColl.set('items', productList);
                            prodColl.set('bnData', data.bnData);

                            //Time to actually render

                            if (currentProducts[0].editModeMessage) {
                                if (pageContext.isEditMode) {
                                    $('.recommended-product-container.' + placeholder).text(currentProducts[0].editModeMessage);
                                }
                            } else {
                                $("." + placeholder + ".slider-title span").text(displayName);
                                if (!format) {
                                    format = "carousel";
                                }
                                if (format == "carousel") {
                                    var productListView = new ProductListView({
                                        el: $("." + placeholder + '.rti-recommended-products'),
                                        model: prodColl
                                    });
                                    productListView.render();
                                    if (productList.length > 1) {
                                        $("." + placeholder + '.rti-recommended-products .bxslider').bxSlider({
                                            minSlides: 2,
                                            maxSlides: 3,
                                            slideWidth: 260,
                                            slideMargin: 60,
                                            nextText: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                                            prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                                            responsive: true,
                                            pager: false,
                                            speed: 0,
                                            infiniteLoop: false,
                                            hideControlOnEnd: true
                                        });
                                    }else if(productList.length===1){
                                        $("[data-mz-product]").find('img').addClass('single-img-width');
                                    }
                                    if (productList.length === 0) {
                                        $("." + placeholder + '.recommended-product-container').hide();
                                    }
                                    return;

                                }
                            }
                        } else {
                            if (pageContext.isEditMode) {
                                $('.recommended-product-container.' + placeholder).text("There was a problem retrieving products from your catalog that match the products received from RTI.");
                            }
                        }
                    });
                }
            });
        };

        var globalRenderData = function(data) {
            $('#global-cart .recommended-product-container').each(function() {
                var container = $(this);
                var placeholder = globalConfig.placeholder;
                var numberOfItems = globalConfig.quantity || globalConfig.numberOfItems;
                var configTitle = globalConfig.title;
                var format = globalConfig.format;
                if (pageContext.isEditMode) {
                    container.text('<b>Here Goes your RTI Recommended items</b>');
                    return;
                }
                /*
                Our data will contain information about lots of different possible widgets.
                First we want to reduce that data to only the placeholderName we're dealing with.
                */
                var currentProducts = $.grep(data, function(e) {
                    return e.placeholderName == placeholder;
                });
                /*
                We should at this point have a list of results with the correct placeholderName,
                and that last should only be 1 item long.
                If that first item doesn't exist, there was a problem.
                */
                if (!currentProducts[0]) {
                    if (pageContext.isEditMode) {
                        /*
                        If we reach this point, it means there wasn't a placeholderName in the
                        data that was returned that matches the one we selected.
                        */
                        container.text("Placeholder not found.");
                    }
                } else {
                    //We have the data for our widget now. Time to fill it up.
                    var displayName;
                    //if configTitle has a value, the user entered a title to
                    //override the title set in RTI.
                    if (configTitle) {
                        displayName = configTitle;
                    } else {
                        //if configTitle has no value, we get the title from the
                        //product results call
                        displayName = currentProducts[0].displayName;
                    }

                    //We slice the productList we received according to the limit set
                    //in the editor
                    var productList;
                    if (currentProducts[0].productList.length > numberOfItems) {
                        productList = currentProducts[0].productList.slice(0, numberOfItems);
                    } else {
                        productList = currentProducts[0].productList;
                    }

                    //Turns list of product IDs into a product collection
                    getMozuProducts(productList).then(function(products) {
                        if (products.length !== 0) {
                            var productsByRank = _.sortBy(products, 'rtiRank');
                            productList = productsByRank;
                            var prodColl = new ProductModels.ProductCollection();
                            prodColl.set('items', productList);
                            prodColl.set('bnData', data.bnData);

                            //Time to actually render

                            if (currentProducts[0].editModeMessage) {
                                if (pageContext.isEditMode) {
                                    container.text(currentProducts[0].editModeMessage);
                                }
                            } else {
                                container.find(".slider-title span").text(displayName);
                                if (!format) {
                                    format = "carousel";
                                }
                                if (format == "carousel") {
                                    var productListView = new ProductListView({
                                        el: container.find('.rti-recommended-products'),
                                        model: prodColl
                                    });
                                    try {
                                        container.find('.rti-recommended-products .bxslider').destroySlider();
                                    } catch (e) {}
                                    productListView.render();
                                    if (productList.length > 1) {
                                        container.find('.rti-recommended-products .bxslider').bxSlider({
                                            minSlides: 3,
                                            maxSlides: 3,
                                            slideWidth: 150,
                                            slideMargin: 5,
                                            nextText: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                                            prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                                            responsive: true,
                                            pager: false,
                                            speed: 0,
                                            infiniteLoop: false,
                                            hideControlOnEnd: true
                                        });
                                    }
                                    if (productList.length === 0) {
                                        container.find('.recommended-product-container').hide();
                                    }
                                    return;

                                }
                            }
                        } else {
                            if (pageContext.isEditMode) {
                                container.text("There was a problem retrieving products from your catalog that match the products received from RTI.");
                            }
                        }
                    });
                }
            });
        };
        try {
            if ($('.recommended-product-container').not('#global-cart .recommended-product-container').length) {
                var productInstance = RecommendedProducts.getInstance(rtiOptions);
                
                productInstance.getProductData(function(data) {
                    renderData(data);
                });
            }
        } catch (err) {
            //console.log(err);
        }
        /*Recommended Product Code Ends*/
        /* Code for Global Cart*/
        var globalDisplay;
        var globalConfig;
        var globalRtiOptions;
        if ($('#global-cart .recommended-product-container').length) {
            globalDisplay = $('#global-cart .recommended-product-container').first();
            globalConfig = globalDisplay.data('mzRtiRecommendedProducts');
            globalRtiOptions = {
                customerId: globalConfig.customerId || "",
                customerCode: globalConfig.customerCode || "",
                pageType: globalConfig.pageType || "",
                jsInject: globalConfig.javascriptInjection || "",
                includeSiteId: globalConfig.includeSiteId || false,
                includeTenantId: globalConfig.includeTenantId || false
            };
        }

        function updateGCRTI() {
            if ($('#global-cart .recommended-product-container').length) {
                try {
                    var GCProductInstance = GCRecommendedProducts.getInstance(globalRtiOptions);
                    GCProductInstance.getProductData(function(data) {
                        globalRenderData(data);
                    });
                } catch (err) {
                    //console.log(err);
                }
            }
        }
        window.updateGCRTI = updateGCRTI;
    });