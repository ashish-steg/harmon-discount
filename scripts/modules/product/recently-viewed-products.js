define([
    'modules/jquery-mozu',
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'hyprlivecontext',
    'slick',
    'sdk'
], function($, _, api, Backbone, HyprLiveContext, slickSlider, sdk) {
    var sitecontext = HyprLiveContext.locals.siteContext,
        cdn = sitecontext.cdnPrefix,
        siteID = cdn.substring(cdn.lastIndexOf('-') + 1),
        imagefilepath = cdn + '/cms/' + siteID + '/files',
        pageContext = require.mozuData('pagecontext'),
        rviEnable = HyprLiveContext.locals.themeSettings.rviEnable,
        rviNumberCookie = parseInt(HyprLiveContext.locals.themeSettings.rviNumberCookie, 10),
        rviExpirationDuration = parseInt(HyprLiveContext.locals.themeSettings.rviExpirationDuration, 10)||1,
        rviDuration = parseInt(rviExpirationDuration, 10)*24*60*60*1000,
        cookieName = 'recentProducts',
        cookieValue = [];

        //Product List Item View
        var ProductListItemView = Backbone.MozuView.extend({
            tagName: 'div',
            className: 'mz-recentproductlist-item',
            templateName: 'modules/product/recent/recent-products',
            initialize: function() {
                var self = this;
                self.listenTo(self.model, 'change', self.render);
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
                return this;
            }
        });

        var Model = Backbone.MozuModel.extend();

        function getProductCodeFromUrl() {
            return require.mozuData('pagecontext').productCode||null;
        }

        function validateAndAddProduct(productCode) {
            var thisTime = new Date();
            for(var i=0;i<cookieValue.length;i++) {
                var currentVal = cookieValue[i];
                if (currentVal.pCode == productCode) {
                    deleteProduct(productCode);
                    break;
                }
            }
            cookieValue.unshift({"pCode": productCode, "last": thisTime.getTime()});
            if(cookieValue.length > rviNumberCookie ) {
                cookieValue = cookieValue.slice(0, rviNumberCookie + 1);
            }
            $.cookie(cookieName, JSON.stringify(cookieValue), {expires: rviExpirationDuration, path: '/'});
        }

        function getCurrentProducts() {
            var products = [];
            for(var i=0;i<cookieValue.length;i++) {
                if(cookieValue[i].last + rviDuration > (new Date()).getTime() && cookieValue[i].pCode != require.mozuData('pagecontext').productCode) {
                    products.push(cookieValue[i].pCode);
                }
            }
            return products;
        }

        function addProduct() {
            var productCode = getProductCodeFromUrl();
            if(productCode) {
                validateAndAddProduct(productCode);
            }
        }

        function showLoader() {
            $(".rvi-loading").show();
        }

        function hideLoader() {
            $(".rvi-loading").hide();
        }

        function renderRVI(container) {
            if (!container) {
                container = '#rvi-auto';
            }
            if($.cookie(cookieName)) {
                try{
                    cookieValue = JSON.parse($.cookie(cookieName));
                }
                catch(e) {
                    cookieValue = [];
                }
            }
            addProduct();
            if ($(container).length > 0) {
                var filter = getCurrentProducts().join(" or productCode+eq+");
                if (filter !== "" && filter !== " or ") {
                    showLoader();
                    var serviceurl = sdk.getServiceUrls().searchService + 'search/?startIndex=0&pageSize='+rviNumberCookie+'&filter=productCode+eq+'+filter;
                    api.request('GET', serviceurl).then(function(productslist){
                        var orderedProductList = [];
                        for(var i = 0;i<cookieValue.length;i++) {
                            var productAvailable = _.findWhere(productslist.items, {productCode: cookieValue[i].pCode});
                            if (productAvailable) {
                                orderedProductList.push(productAvailable);
                                continue;
                            }
                        }
                        if(orderedProductList.length > 0) {
                            $(container).removeClass('hide').append('<div class="row"><div class="col-xs-12"><div class="recently-viewed-list"></div></div></div><div class="clearfix"></div>');
                            for(var p=0;p<orderedProductList.length;p++) {
                                var view = new ProductListItemView({ model: new Model(orderedProductList[p]) });
                                var renderedView = view.render().el;
                                $(container + ' .recently-viewed-list').append(renderedView);
                            }
                            if(orderedProductList.length > 1){
                                $(container + ' .recently-viewed-list').slick({
                                    infinite: false,
                                    slidesToShow: 7,
                                    prevArrow: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                                    nextArrow: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                                    responsive: [{
                                            breakpoint: 992,
                                            settings: {
                                                arrows: true,
                                                slidesToShow: 5
                                            }
                                        },
                                        {
                                            breakpoint: 768,
                                            settings: {
                                                arrows: true,
                                                slidesToShow: 2
                                            }
                                        }
                                    ]
                                });
                            }
                        }
                        hideLoader();
                    }, function(){
                        hideLoader();
                    });    
                }
            }
        }

        function deleteProduct(product) {
            var isExist = false;
            for(var i=0;i<cookieValue.length;i++) {
                if(cookieValue[i].pCode == product) {
                    cookieValue.splice(i, 1);
                    isExist = true;
                    break;
                }
            }
            if(isExist) {
                deleteProduct(product);
            }
            else {
                $.cookie(cookieName, JSON.stringify(cookieValue), {expires: rviExpirationDuration, path: '/'});
            }
        }

        function getSize() {
            var size = 0;
            for(var i=0;i<cookieValue.length;i++) {
                if(cookieValue[i].last + rviDuration > (new Date()).getTime()) {
                    size++;
                }
            }
            return size;
        }

    return {
        addProduct: addProduct,
        deleteProduct: deleteProduct,
        renderRVI: renderRVI,
        getSize: getSize
    };
});