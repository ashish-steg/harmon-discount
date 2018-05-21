define(['modules/jquery-mozu', 'underscore', "modules/api", "modules/backbone-mozu", "modules/models-product", "hyprlivecontext"],
    function ($, _, api, Backbone, ProductModels, HyprLiveContext) {
        var sitecontext = HyprLiveContext.locals.siteContext;
        var cdn = sitecontext.cdnPrefix;
        var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
        var imagefilepath = cdn + '/cms/' + siteID + '/files';
        
        var getRelatedProducts = function(pageType, codes, pageSize) {
            var filter = _.map(codes, function(c) { return "ProductCode eq " + c; }).join(' or ');
            var retval = '';

            switch (pageType) {
                case 'product': retval = api.get("search", { filter: filter });
                    break;
                case 'cart': retval = api.get("search", { filter: filter, pageSize: pageSize });
                    break;
            }

            return retval;
        },

        coerceBoolean = function(x) {
            return !!x;
        };

        

        var pageContext = require.mozuData('pagecontext');

        $(document).ready(function() {
            var productCollection = [];

            switch(pageContext.pageType) {
                case 'product':
                    productCollection.push(require.mozuData('product'));
                    break;
                case 'cart':
                    var cartItems = require.mozuData('cart').items;
                    $.each(cartItems, function(index, value) {
                        productCollection.push(value.product);
                    });
                    break;
            }
            
            $('[data-mz-related-products]').each(function (index, rp) {
                rp = $(rp);
             
                var config = rp.data('mzRelatedProducts');
                var attId = config.attributeId || 'tenant~product-crosssell';
                var template = config.template || 'modules/product/product-list-carousel';
                var title = config.title;
                var numberToDisplay = config.count || 5;
                var productCodes = [];// = _.pluck(currentProduct.properties[0].values, "value");
                var RelatedProductsView = Backbone.MozuView.extend({
                    templateName: template,
                    selectSwatchOption: function(e) {
                        var colorCode = $(e.currentTarget).data('mz-swatch-color').toLowerCase();
                        var productCode = $(e.currentTarget).data('mz-product-code');
                        var width = HyprLiveContext.locals.themeSettings.listProductImageWidth;
                        var height = HyprLiveContext.locals.themeSettings.listProductImageHeight;
                        var imagepath = imagefilepath + '/' + productCode + '_' + colorCode + '.jpg?maxWidth=' + width;
                        $(e.target).parents('.product-code').find('.image').attr('src', imagepath);
                    }
                });
                
                for (var i = 0; i < productCollection.length; i++) {
                    var currentProduct = productCollection[i];
                    if (currentProduct && currentProduct.properties) {
                        for (var x = 0; x < currentProduct.properties.length; x++) {
                            if (currentProduct.properties[x].attributeFQN == attId) {
                                var temp = _.pluck(currentProduct.properties[x].values, "value");
                                productCodes = productCodes.concat($.grep(temp || [], coerceBoolean));
                                
                            }
                        }
                    }
                }

                if (!productCodes || !productCodes.length) {
                    if (pageContext.isEditMode) {
                        rp.html('<b>tbd preview content</b>');
                    }
                    return;
                }

                getRelatedProducts(pageContext.pageType, productCodes, numberToDisplay).then(function (collection) {
                    _.each(collection.data.items,function(product){
                        var availableColors = [];
                        if (product.options) {
                            for (var i = 0; i < product.options.length; i++) {
                                if (product.options[i].attributeFQN == "tenant~COLOR") {
                                    for (var j = 0; j < product.options[i].values.length; j++) {
                                        var color = product.options[i].values[j].stringValue.trim().replace(/ /g, '_').toLowerCase();
                                        var swatchIconSize = HyprLiveContext.locals.themeSettings.listProductSwatchIconSize;
                                        var swatchIconPath = imagefilepath + '/' + product.productCode + '_' + color + '_sw.jpg?maxWidth=' + swatchIconSize;
                                        availableColors.push({
                                            color: color,
                                            swatchIconPath: swatchIconPath,
                                            productCode: product.productCode
                                        });
                                    }
                                    product.options[i].availableColors =  _.uniq(availableColors, 'color');
                                }
                            }
                        }
                    });
                    var relatedProductsCollection = new ProductModels.ProductCollection(collection.data);
                    var relatedProductsView = new RelatedProductsView({
                        model: relatedProductsCollection,
                        el: rp
                    });
                    var availableColors = [];
                    relatedProductsView.render();                   
                    if(relatedProductsView.model.attributes.items.length > 1 && template == "modules/product/product-list-gorsuch"){
                        $('.bxslider').bxSlider({
                            minSlides: 2,
                            maxSlides: 4,
                            slideWidth: 270,
                            slideMargin: 20,
                            nextText:'<i class="fa fa-angle-right" aria-hidden="true"></i>',
                            prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                            responsive: true,
                            speed: 0,
                            infiniteLoop: false,
                            hideControlOnEnd: true
                        });
                    }
                    if(relatedProductsView.model.attributes.items.length > 0){
                        rp.prepend('<h3><span>' + title + '</span></h3>');
                    }
                });
            });
        });
    });