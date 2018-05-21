require.config({
    shim: {
        'widgets/socialcontent/jquery.bxslider.min': {
            deps: ['modules/jquery-mozu']
        },
        'widgets/socialcontent/remodal.min': {
            deps: ['modules/jquery-mozu']
        }
    }
});

define(['modules/jquery-mozu', 'underscore', 'modules/api', 'modules/backbone-mozu', 'hyprlivecontext', 'widgets/SocialContent/socialcontent-feed', 'widgets/SocialContent/socialcontent-helpers', 'widgets/SocialContent/jquery.bxslider.min', 'widgets/SocialContent/remodal.min'],
    function($, _, Api, Backbone, HyprLiveContext, SocialContentFeeds, SocialContentHelpers, bxSlider, remodal) {
        var _currentStartIndex = 0,
            _totalCount = 0,
            _modelWindow = null,
            $socialContentWidget;


        var _widgetProperties,
            _slider;

        var feedStartIndex = function(startIndex) {
            if (typeof startIndex !== 'undefined') {
                _currentStartIndex = startIndex;
            }
            return _currentStartIndex;
        };

        var feedTotalCount = function(totalCount) {
            if (typeof totalCount !== 'undefined') {
                _totalCount = totalCount;
            }
            return _totalCount;
        };

        var getWidgetProperties = function() {
            if (typeof _widgetProperties !== 'object') {
                _widgetProperties = $('#socialcontent-widget').data('mz-socialcontent');
                return _widgetProperties;
            }
            return _widgetProperties;
        };

        var widgetProperties = getWidgetProperties();

        var contentFeed = SocialContentFeeds.getSocialContentFeeds({
            'nameSpace': 'mzint',
            'feedId': widgetProperties.associatedFeed
        });



        var loadFeedItems = function() {
            var startIndex = feedStartIndex();
            contentFeed.getFeedItems(startIndex, 25, widgetProperties.associatedFeed).then(function(data) {
                data = data.data;
                // If Grid send in all item to spilt items by 'slides' aka rows
                
                $.each(data.items, function(index, item) {
                    item.properties.actionLink = determineItemLink(item.properties.link, widgetProperties.associatedFeed);
                    item.properties.actionLinkString = JSON.stringify(item.properties.actionLink);
                    item.config = widgetProperties;
                    item.timeElapsed = SocialContentHelpers.timeElapsed(item.properties.createDate);
                    SocialContentFeed.add(new FeedItem(item));
                });


                feedStartIndex(startIndex + data.items.length);
                feedTotalCount(feedTotalCount() + data.items.length);

                $socialContentWidget.trigger('feedItemLoadComplete');

                $('#loading-block, #loading-block-wrapper').hide();
            }, function(jqxhr, settings, exception) {
                $('#loading-block, #loading-block-wrapper').hide();
            });
        };

        var determineItemLink = function(link, id) {
            var actionLink = {};
            if (typeof link === 'object') {
                $.each(link, function(index, value) {
                    if (value.associatedFeed === id) {
                        actionLink = value;
                        return false;
                    }
                });
            }
            return actionLink;
        };


        var FeedItem = Backbone.MozuModel.extend({
            defaults: {
                data: {},
                maxCharLength: 150
            }
        });

        var SocialContentFeed = new Backbone.Collection();
        var SocialContentFeedItem = new Backbone.Collection();


        var SocialContentGridView = Backbone.MozuView.extend({
            templateName: 'Widgets/social/socialcontent-feed-grid',
            getRenderContext: function() {
                var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);

                return context;
            },
            events: {
                "click img": "clicked"
            },
            clicked: function(e) {
                e.preventDefault();
                var cid = $(e.currentTarget).data("cid");
                var item = this.model.get(cid);
                var itemProp = item.get('properties');
                itemProp.config = widgetProperties;
                itemProp.timeElapsed = SocialContentHelpers.timeElapsed(itemProp.createDate);
                loadModalWindow(itemProp);
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this, arguments);

            }
        });

        var SocialContentCarouselView = Backbone.MozuView.extend({
            templateName: 'Widgets/social/socialcontent-feed-carousel',
            getRenderContext: function() {
                var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);

                return context;
            },
            events: {
                "click img": "clicked"
            },
            clicked: function(e) {
                e.preventDefault();
                var cid = $(e.currentTarget).data("cid");
                var item = this.model.get(cid);
                var itemProp = item.get('properties');
                itemProp.config = widgetProperties;
                itemProp.timeElapsed = SocialContentHelpers.timeElapsed(itemProp.createDate);
                loadModalWindow(itemProp);
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this, arguments);
            }
        });

        var SocialContentMobileView = Backbone.MozuView.extend({
            templateName: 'Widgets/social/socialcontent-feed-mobile',
            getRenderContext: function() {
                var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);

                return context;
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this, arguments);

            }
        });

        var SocialContentWindowView = Backbone.MozuView.extend({
            templateName: 'Widgets/social/socialcontent-model-window',
            getRenderContext: function() {
                var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);

                return context;
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this, arguments);

            }
        });

        var loadModalWindow = function(item) {
            SocialContentFeedItem.reset();
            SocialContentFeedItem.add(new FeedItem(item));
            var socialContentWidowView = new SocialContentWindowView({
                model: SocialContentFeedItem,
                el: $('.remodal')
            });
            socialContentWidowView.render();
            if (_modelWindow) {
                _modelWindow.open();
            } else {
                instRemodel();
            }
        };

        var instRemodel = function() {
            var options = {};
            _modelWindow = $('[data-remodal-id=modal]').remodal(options);
        };


        var loadMobileTemplate = function() {
            var socialContentView = new SocialContentMobileView({
                model: SocialContentFeed,
                el: $socialContentWidget
            });
            socialContentView.on("add", function() {
                SocialContentMobileView.render();
            });
            socialContentView.render();
            return;
        };


        var loadDesktopTemplate = function() {
            var socialContentView;
            if (widgetProperties.carouselFormat) {
                socialContentView = new SocialContentCarouselView({
                    model: SocialContentFeed,
                    el: $socialContentWidget
                });
                socialContentView.on("add", function() {
                    SocialContentCarouselView.render();
                });

                socialContentView.render();

                loadDesktopCarousel();
                return;
            }
            socialContentView = new SocialContentGridView({
                model: SocialContentFeed,
                el: $socialContentWidget
            });
            socialContentView.on("add", function() {
                SocialContentGridView.render();
            });
            socialContentView.render();



            buildResponsiveGrid(1000);
            setTimeout(loadDesktopGrid, 100);
            return;
        };

        var loadDesktopCarousel = function() {
            if (_slider) {
                _slider.reloadSlider();
            }
            _slider = $('.socialcontent-widget-wrapper .feed-item-wrapper .social-feed-items').bxSlider({
                mode: 'horizontal',
                slideWidth: 200,
                minSlides: 2,
                maxSlides: widgetProperties.carouselColumns,
                slideMargin: 0,
                pager: false,
                onSlideNext: function($slideElement, oldIndex, newIndex) {
                    if (newIndex > _slider.getSlideCount()) {
                        loadFeedItems();
                        _slider.goToSlide(newIndex);
                    }
                }
            });
        };

        var loadDesktopGrid = function() {
            if (_slider) {
                _slider.reloadSlider();
            }
            _slider = $('.socialcontent-widget-wrapper .feed-item-wrapper .social-feed-items').bxSlider({
                mode: 'vertical',
                slideWidth: 1000,
                minSlides: 2, //Rows
                maxSlides: widgetProperties.gridRows, //Rows
                slideMargin: 0,
                pager: false,
                onSlideNext: function($slideElement, oldIndex, newIndex) {
                    if (newIndex > _slider.getSlideCount()) {
                        loadFeedItems();
                        _slider.goToSlide(newIndex);
                    }
                }
            });
        };


        var loadView = function() {
            if (widgetProperties.templateType === 'mobile') {
                loadMobileTemplate();
                return;
            }
            loadDesktopTemplate();
            return;
        };


        var buildResponsiveGrid = function(wrapperWidth) {
            var $grid = $('#socialGrid'),
                $gridItems = $grid.find('img'),
                columns,
                $gridItems2 = $gridItems.clone();

            if (wrapperWidth < 1024) {
                columns = 4;
            }

            if (wrapperWidth < 768) {
                columns = 3;
            }

            if (wrapperWidth < 400) {
                columns = 2;
            }

            if (wrapperWidth > 1024) {
                columns = widgetProperties.gridColumns;
            }


            $gridItems.unwrap();
            for (var i = 0; i < $gridItems.length; i += columns) {
                $gridItems.slice(i, i + columns).wrapAll("<div class='slide columns-" + columns + "'></div>");
            }
        };


        $(document).ready(function() {
            $socialContentWidget = $('[data-mz-socialcontent] .feed-item-wrapper');


            $socialContentWidget.on('feedItemLoadComplete', function() {
                loadView();
            });

            $socialContentWidget.on('click', '.call-to-action a', function(e) {
                e.preventDefault();
                var linkData = $(this).parent('.call-to-action').data('action-link'),
                    URL;
                if (typeof linkData === 'object') {
                    if (widgetProperties.templateType === 'mobile') {
                        URL = SocialContentHelpers.mobileURLByLink(linkData.mobileLink);
                        window.location.href = URL;
                        return;
                    }
                    URL = SocialContentHelpers.desktopURLByLink(linkData.desktopLink);
                    window.location.href = URL;
                }
            });

            loadFeedItems();
            instRemodel();


            var timeout = 0,
                setTimeOut = function() {
                    timeout = 500;
                },
                clearTimeout = function() {
                    timeout = 0;
                };

            var getWidgetHeight = function() {
                return $('#socialcontent-widget').height();
            };

            if (widgetProperties.templateType === 'mobile') {
                $('.socialcontent-widget-wrapper').height($(window).height());

                //A workaround for some weird height issue
                if ($(window).height() !== $('body').height()) {
                    $('body').height($(window).height());
                    $('body').css('overflow', 'hidden');
                }


                $('#socialcontent-widget').scroll(function() {
                    if ($('#isocialcontent-widget').scrollTop() + $('#socialcontent-widget').height() > ($('.feed-item-wrapper').outerHeight() + $('.feed-intro-text').outerHeight())) {
                        if (timeout === 0) {
                            setTimeOut();
                            window.setTimeout(function(clearTimeout) {
                                clearTimeout();
                            }(clearTimeout), timeout);
                            loadFeedItems();
                        }
                    }
                });
            }

            if (widgetProperties.templateType === 'desktop' && widgetProperties.gridFormat) {
                $(window).resize(function() {
                    var containerWidth = $('.socialcontent-widget-wrapper').width();
                    if (containerWidth < 1050) {
                        //Some LoadingFunction
                        buildResponsiveGrid(containerWidth);
                        setTimeout(_slider.reloadSlider, 100);
                    }
                });
            }


        });
    }
);
