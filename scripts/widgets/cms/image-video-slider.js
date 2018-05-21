/*jshint undef: true */
/*global YT */
require([
    'modules/jquery-mozu',
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'vendor/jquery-bxslider/jquery.bxslider.min',
    'shim!vendor/jquery/jquery.fitvids[jquery=jQuery]',
    '//www.youtube.com/iframe_api',
    'vendor/jquery/owl.carousel.min',
    'vendor/jquery/lazysizes-custom.min'
], function ($, _, api, Backbone) {
    
    var slider = null;
    var config = $('[data-image-video-config]').data('image-video-config');
    var HomeSliderView = Backbone.View.extend({
        el: $('#mz-drop-zone-ImageVideoSlider'),
        events: {
            
        },
        initialize: function() {
            this.render();
        },
        sliderFunction: function() {
            var sliderDuration = $(".slider-duration").text();
            slider = $('.bxslider').bxSlider({
                video: true,
                useCSS: false,
                auto: true,
                nextSelector:".next",
                prevSelector: ".prev",
                nextText: '',
                prevText: '',
                touchEnabled: true,
                pause: sliderDuration,
                pager: false,
             
                onSliderLoad: function(currentSlideHtmlObject) {
                    $(".bxslider .slider-items:not([class='bx-clone'])").eq(currentSlideHtmlObject+1).addClass('active-slide');
                    
                    $(".slider-items").find("iframe").removeClass('video');
                    
                    var frame = $(".slider-items.active-slide:not([class='bx-clone'])").find("iframe");
                    $(frame).addClass('video');
                    
                    if($(frame).length > 0 ) {
                        var videoURL = $(frame).prop('src');
                        var newsrc = videoURL.replace("&autoplay=1", "");
                        newsrc += "&autoplay=1";
                        $(frame)[0].src = newsrc;
                    }
                    else {
                        $('.pausa').click();
                    }
                }, 
                
                onSlideBefore: function(currentSlide, totalSlides, currentSlideHtmlObject) {
                    $('.active-slide').removeClass('active-slide');
                    currentSlide = slider.getCurrentSlide();
                    $(".bxslider .slider-items:not([class='bx-clone'])").eq(currentSlide+1).addClass('active-slide');
                    
                    $(".slider-items").find("iframe").removeClass('video');
                    
                    var frame = $(".slider-items.active-slide:not([class='bx-clone'])").find("iframe");
                    $(frame).addClass('video');
                    
                    if($(frame).length > 0 ) {
                        var videoURL = $(frame).prop('src');
                        var newsrc = videoURL.replace("&autoplay=1", "");
                        newsrc += "&autoplay=1";
                        $(frame)[0].src = newsrc;
                    }
                    else{
                        $('.pausa').click();
                    }
                }
                
            });
        },
        render: function() {
            this.sliderFunction();
        } 
    });
    var player1 = null, player2 = null, player3 = null;
    if ($('.video').get(0)) {
        player1 = new YT.Player($('.video').get(0),{
            events: {
                'onReady': onPlayerReady1
            }
        });
    }
    if ($('.video').get(1)) {
        player2 = new YT.Player($('.video').get(1),{
            events: {
                'onReady': onPlayerReady2
            }
        });
    }
    if ($('.video').get(2)) {
        player3 = new YT.Player($('.video').get(2),{
            events: {
                'onReady': onPlayerReady3
            }
        });
    }
    
    function onPlayerReady1(event){
        player1.mute(); 
        player1.setVolume(0);
        $(".escolta").on('click', function() {
            player1.playVideo();
        });
        $(".pausa").on('click', function() {
            player1.stopVideo();
        });
    }
    function onPlayerReady2(event){
        player2.mute(); 
        player2.setVolume(0);
        $(".escolta").on('click', function() {
            player2.playVideo();
        });
        $(".pausa").on('click', function() {
            player2.stopVideo();
        });
    }
    function onPlayerReady3(event){
        player3.mute(); 
        player3.setVolume(0);
        $(".escolta").on('click', function() {
            player3.playVideo();
        });
        $(".pausa").on('click', function() {
            player3.stopVideo();
        });
    }
    $(document).ready(function () { 
        var homeSliderView = new HomeSliderView();
        $(".image-height").fitVids({ customSelector: "iframe"});
        $('.next').click(function(){
            slider.goToNextSlide();
            return false;
        });
        
        $('.prev').click(function(){
            slider.goToPrevSlide();
            return false;
        });
        
    });
});