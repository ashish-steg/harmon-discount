define([
        'modules/jquery-mozu',
        "modules/api",
        "modules/backbone-mozu",
        "modules/models-product",
        "modules/general-functions",
        "modules/api",
        "slick"
    ],
    function($, api, Backbone, ProductModels, generalFunctions, Api, slickSlider) {

        var Model = Backbone.MozuModel.extend();

        var ccListView = Backbone.MozuView.extend({
            templateName: 'Widgets/misc/category-carousel-listing',
            initialize: function() {
                var self = this;
                self.listenTo(self.model, 'change', self.render);
            },
            render: function(parentEl) {
                Backbone.MozuView.prototype.render.apply(this);
                parentEl.find('.cc-loading').hide();
                enableSlider(parentEl.find('.slick-cont'));
            }
        });

        $('.category-container').each(function() {
            var self = $(this);
            var pageSize = 10;
            if (self.data('category') && self.data('category') !== '') {
                self.find('.cc-loading').show();
                var currentCategoryId = self.data('category');
                if (self.data('totalcount') && self.data('totalcount') !== '' && self.data('totalcount') !== '0') {
                    pageSize = self.data('totalcount');
                }
                var filter = 'CategoryId ';
                filter += (self.data('child') && self.data('child') !== '') ? 'req ' : 'eq ';
                filter += currentCategoryId;
                (function(parentEl) {
                    Api.get("search", {
                        'filter': filter,
                        'pageSize': pageSize,
                        'includeFacets': false,
                        'pageWithUrl': false,
                        'sortWithUrl': false,
                        'startIndex': 0,
                        'query': ''
                    }).then(function(response) {
                        if (response.data.items.length) {
                            var ccView = new ccListView({
                                el: parentEl.find('.slick-cont'),
                                model: new Model({ items: response.data.items })
                            });
                            ccView.render(parentEl);
                        } else {
                            parentEl.hide();
                        }
                    });
                })(self);
            }
        });

        function enableSlider(parentEl) {
            parentEl.slick({
                infinite: false,
                slidesToShow: 4,
                prevArrow: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
                nextArrow: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
                responsive: [{
                        breakpoint: 992,
                        settings: {
                            arrows: true,
                            slidesToShow: 3
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            arrows: true,
                            slidesToShow: 1
                        }
                    }
                ]
            });
        }
    });