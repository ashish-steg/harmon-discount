define([
    'modules/backbone-mozu',
    'modules/jquery-mozu',
    'underscore',
    "hyprlivecontext",
    "modules/api",
    "modules/get-partial-view",
    "bxslider"
], function(Backbone, $, _, HyprLiveContext, api, getPartialView, bxslider) {
    var items = [];
    var isLoadMore = true;
    var startIndex = 0;
    var pageSize = HyprLiveContext.locals.themeSettings.productCarouselSize;
    var totalSize;
    var currentSlide = 0;
    var slider = $('#product-carousel-list').bxSlider({
        minSlides: pageSize,
        maxSlides: pageSize,
        moveSlides: 1,
        slideWidth: 84,
        pager: false,
        nextText: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
        prevText: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
        slideMargin: 20,
        infiniteLoop: false,
        hideControlOnEnd: true,
        onSlideNext: function($slideElement, oldIndex, newIndex) {
            currentSlide = newIndex;
            CarouselListView.loadMoreProducts();
        }
    });

    var CarouselListItemView = Backbone.MozuView.extend({
        tagName: 'div',
        className: 'mz-productlist-item',
        templateName: 'modules/product/carousel-scroll',
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

    var CarouselListView = {
        addProduct: function(prod) {
            var view = new CarouselListItemView({ model: new Model(prod) });
            var renderedView = view.render().el;
            $('#product-carousel-list').append(renderedView);
        },
        findActiveProduct: function() {
            var productCode = "/p/" + $("#carousel-container").data("product-id");
            for (var i = 0; i < $("#carousel-container #product-carousel-list div a").length; i++) {
                var currentElmnt = $("#carousel-container #product-carousel-list div a:eq(" + i + ")");
                if (currentElmnt.attr("href") === productCode) {
                    currentElmnt.parent("div").addClass("active");
                    break;
                }
            }
        },
        loadMoreProducts: function() {
            var me = this;
            if (isLoadMore) {
                isLoadMore = false;
                $("#product-loading").show();
                var url = $("#carousel-container").data("category-url");
                getPartialView(url + '?pageSize=' + 5 * pageSize + '&startIndex=' + startIndex, 'category-interior-json').then(function(response) {
                    var products = JSON.parse(response.body);
                    totalSize = products.totalCount;
                    if (totalSize > pageSize) {
                        $("#carousel-container").data("list-count", totalSize).removeClass("disable-icons");
                    } else {
                        $("#carousel-container").data("list-count", totalSize).addClass("disable-icons");
                    }
                    items = items.concat(products.items);
                    if (items.length >= totalSize) {
                        isLoadMore = false;
                    } else {
                        isLoadMore = true;
                        startIndex += 5 * pageSize;
                    }
                    try {
                        slider.destroySlider();
                    } catch (e) {}
                    _.each(products.items, me.addProduct.bind(me));
                    me.findActiveProduct();
                    $("#product-loading").hide();
                    slider.reloadSlider();
                    slider.goToSlide(currentSlide);
                }, function(error) {
                    $("#product-loading").hide();
                    isLoadMore = true;
                });
            }
        }
    };
    if ($("#carousel-container:visible").length) {
        CarouselListView.loadMoreProducts();
    }
});