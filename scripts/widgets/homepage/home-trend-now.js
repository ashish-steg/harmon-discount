require([
    'modules/jquery-mozu',
    'underscore',
    "modules/backbone-mozu",
    "shim!vendor/jquery/owl.carousel.min",
    'vendor/jquery/lazysizes-custom.min'
], function ($, _, Backbone) {
    
    var owlSlider = null;
    var HomeTrendView = Backbone.View.extend({
        initialize: function() {
            this.sliderFunction();
            this.render();
        },
        sliderFunction: function() {
            var self = this,
            owlSlider = $(".sliderTrend #mz-drop-zone-home-trend-now .mz-cms-row"),
            owlSliderTab = $(".sliderTrendTab #mz-drop-zone-home-trend-now .mz-cms-row");
            owlSlider.owlCarousel({
                autoplay:false,
                responsiveClass:true,
                loop: false,
                //Mouse Events
                touchDrag : true,
                margin:10,
                responsive:{
                    0:{
                        items:1,
                        loop: true,
                        stagePadding: 50,
                        nav:false
                    },
                    480:{
                        items:3,
                        loop: true,
                        stagePadding: 50,
                        nav:false
                    },
                    1025:{
                        items:6,
                        nav:false
                    }
                }
            });
            owlSliderTab.owlCarousel({
                autoplay:false,
                responsiveClass:true,
                loop: false,
                //Mouse Events
                touchDrag : true,
                margin:10,
                responsive:{
                    0:{
                        items:1,
                        loop: true,
                        stagePadding: 50,
                        nav:false
                    },
                    480:{
                        items:3,
                        loop: true,
                        stagePadding: 50,
                        nav:false
                    },
                    1025:{
                        items:6,
                        nav:false
                    }
                }
            });
        },
        render: function() {
            this.sliderFunction();
        }
    }); 
        
    $(document).ready(function () { 
        var hometrendview = new HomeTrendView();
    });
});
