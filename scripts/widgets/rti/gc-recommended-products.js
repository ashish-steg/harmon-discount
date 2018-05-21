define([
        'modules/jquery-mozu',
        'hyprlive',
        "hyprlivecontext",
        'underscore',
        'modules/api',
        'modules/backbone-mozu',
        'modules/models-product'
    ],
    function($, Hypr, HyprLiveContext, _, api, Backbone, ProductModels) {


        var instance;
        var init = function(options) {

            var _options = options || {};
            var _products = {};

            /*
              Getters and Setters
            */
            var getRTIOptions = function() {
                    return _options;
                },
                getProducts = function() {
                    return _products;
                },
                setRTIOptions = function(options) {
                    _options = options;
                },
                setProducts = function(products) {
                    _products = products;
                },

                /*
                Returns the value of the given cookie name
                Used by buildUrl
                */
                getCookie = function(cname) {
                    var name = cname + "=";
                    var decodedCookie = decodeURIComponent(document.cookie);
                    var ca = decodedCookie.split(';');
                    for (var i = 0; i < ca.length; i++) {
                        var c = ca[i];
                        while (c.charAt(0) == ' ') {
                            c = c.substring(1);
                        }
                        if (c.indexOf(name) === 0) {
                            return c.substring(name.length, c.length);
                        }
                    }
                    return "";
                },

                /*
                  Uses _options to concatenate the proper request
                */
                buildUrl = function() {
                    var firstPart = '//' + getRTIOptions().customerId + '-' + getRTIOptions().customerCode + '.baynote.net/recs/1/' + getRTIOptions().customerId + '_' + getRTIOptions().customerCode + '?',
                        requiredParams = '&attrs=Price&attrs=ProductId&attrs=ThumbUrl&attrs=Title&attrs=url';

                    var userIdQuery = "&userId=" + getCookie('bn_u'),
                        bnExtUserIdQuery = "&User.bnExtUserId=" + require.mozuData('user').userId;


                    var source = window.location.href;
                    if (source.indexOf("http://") === 0) {
                        source = "https://" + source.slice(7);
                    }
                    var sourceQuery = "&source=" + source;


                    var tenantIdQuery = "";
                    var siteIdQuery = "";

                    if (getRTIOptions().includeTenantId) {
                        tenantIdQuery += "&tenantId=" + require.mozuData('sitecontext').tenantId;
                    }
                    if (getRTIOptions().includeSiteId) {
                        siteIdQuery += "&siteId=" + require.mozuData('sitecontext').siteId;
                    }

                    //The queries stored in pageDependentSection vary between page types
                    //Right now the only difference configured is thatif pageType is cart,
                    //We add productIds to the query.

                    var pageDependentSection = "";
                    if (getRTIOptions().pageType == "Home") {

                    } else if (getRTIOptions().pageType == "ProductDetail") {
                        var product = require.mozuData('product');
                        bnProductId = product.productCode; // jshint ignore:line
                        pageDependentSection += "&productId=" + bnProductId; // jshint ignore:line
                    } else if (getRTIOptions().pageType == "Cart") {
                        var cart = require.mozuData('globalcart');
                        if (cart.items.length) {
                            $('#global-cart-rti').show();
                            for (var i = 0; i < cart.items.length; i++) {
                                pageDependentSection += "&productId=" + cart.items[i].productCode;
                            }
                        } else {
                            if (window.location.href.indexOf('site_page') === -1)
                                $('#global-cart-rti').hide();
                        }
                    }

                    //Finally, we're going to let the user inject here
                    //Whatever javascript they need to gather their custom cookies.
                    //We will expect the user to append whatever they need into
                    //the variable "inject".

                    var inject = "";

                    //if the user has entered anything in the js injection box...
                    if (getRTIOptions().jsInject) {
                        //We'll attempt to run it
                        try {
                            eval(getRTIOptions().jsInject); // jshint ignore:line
                        } catch (e) {
                            //console.log("There was a problem with your javascript injection.");
                            //console.log(e);
                        }
                    } else {
                        inject = "&query=&Override=&Product.Override=";
                    }

                    var url = firstPart +
                        requiredParams +
                        userIdQuery +
                        bnExtUserIdQuery +
                        sourceQuery + //Current page URL
                        pageDependentSection +
                        tenantIdQuery + //From checkbox
                        siteIdQuery + //From checkbox
                        inject + //From javascript field in config editor
                        "&format=json";
                    return url;
                },

                /*
                  Makes the call and returns the data to the passed function
                */
                fetchData = function(callback) {
                    return $.get(buildUrl(), callback);
                },

                /*
                  Returns concise object from URL call
                */
                parseProducts = function(data) {
                    var dataList = [];
                    _.each(data.widgetResults, function(results) {
                        var displayName = results.displayName;
                        var placeholderName = results.placeholderName;
                        var productList = [];
                        var editModeMessage = "";
                        var productSlots = results.slotResults.filter(function(product) {
                            return product.url; //Prunes slotResults for incomplete entries
                        });

                        var productIdList = [];
                        _.each(productSlots, function(prod, key) {
                            var attrs = [];
                            _.each(prod.attrs, function(attr, key, list) {
                                attrs[attr.name] = attr.values[0];
                            });
                            attrs.rank = prod.rank;
                            attrs.slot = prod.slot || '';
                            attrs.widgetId = results.id || '';
                            productIdList.push(attrs);
                        });

                        if (productIdList.length === 0) {
                            editModeMessage = "There were no products configured for that placeholder name.";
                        }
                        dataList.push({
                            displayName: displayName,
                            placeholderName: placeholderName,
                            productList: productIdList,
                            editModeMessage: editModeMessage
                        });
                    });
                    var bnData = data.trackingData;
                    dataList.bnData = bnData;
                    return dataList;
                };


            return {
                getProductData: function(callback) {
                    /*if (getProducts().length > 0) {
                        callback(getProducts());
                    } else {
                        fetchData(function(data) {
                            setProducts(parseProducts(data));
                            callback(getProducts());
                        });
                    }*/
                    fetchData(function(data) {
                            setProducts(parseProducts(data));
                            callback(getProducts());
                        });
                }
            };
        };

        return {
            getInstance: function(options) {
                if (!instance) {
                    instance = init(options);
                }
                return instance;
            }
        };

    });