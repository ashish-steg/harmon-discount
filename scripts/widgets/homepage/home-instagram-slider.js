require([
    'modules/jquery-mozu',
    'underscore',
    "modules/api",
    "modules/backbone-mozu",
    'hyprlive',
    "shim!vendor/jquery/instafeed",
    "shim!vendor/jquery/owl.carousel.min"
], function ($, _, api, Backbone,Hypr) {
    
    var owl = null;
    var feed = null;
    var jsondata = $('[data-widget-data]').data('widget-data');
    
    var InstaGramModel = Backbone.MozuModel.extend({});
    
    var InstaGramView = Backbone.MozuView.extend({
        templateName: 'widgets/homepage/home-instagram-tiled-view'
    });
    
    var InstagramSliderView = Backbone.View.extend({
        el: '.carousels',
        initialize: function() {
            this.InstagramfeedFunction();
        },
        InstagramfeedFunction: function() {
            var self = this;
            var root = typeof window.exports !== "undefined" && window.exports !== null ? window.exports : window;
            feed = new root.Instafeed({
                get: 'user',
                userId: parseInt(jsondata.config.UserId,0),
                accessToken: ''+jsondata.config.accessToken,
                limit: 30,
                resolution: 'standard_resolution', 
                sortBy: 'most-recent',
                mock: true,
                success: function(model) {
                    var instaGramViewModel = new InstaGramModel(model);
                    var instaGramView = new InstaGramView({
                        el: $("#instafeed-tile"),
                        model: instaGramViewModel
                    });
                    instaGramView.render();
                    self.slider();
                }
            });
            feed.run();
        },
        slider: function() {
            owl = $('.instafeed');
            owl.owlCarousel({
                loop: true,
                margin: 0,
                responsiveClass:true,
                lazyLoad: true,
                responsive: {
                   320:{
                        items:3,
                        nav:false
                    },
                    480:{
                        items:5,
                        nav:false
                    },
                    640:{
                        items:6,
                        nav:false
                    },
                    768:{
                        items:7,
                        nav:false
                    },
                    1023:{
                        items:9,
                        nav:false
                    },
                    1280:{
                        items:10,
                        nav:false
                    },
                    1920:{
                        items:17,
                        nav:false
                    },
                    2560:{
                        items:22,
                        nav:false
                    },
                    5500:{
                        items:30,
                        nav:false
                    }
                }
            });
            $('.next').on('click', function() {
                owl.trigger('next.owl');
            });
            $('.previous').on('click', function() {
                owl.trigger('prev.owl');
            }); 
        }
    });
    $(document).ready(function() {
        var instagramSliderView; 
        setTimeout(function(){
           instagramSliderView  =  new InstagramSliderView();
        }, 3000);
    });
});



