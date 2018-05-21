define(['modules/jquery-mozu', 'underscore', "modules/backbone-mozu", 'hyprlive', "hyprlivecontext"], function($, _, Backbone, Hypr, HyprLiveContext) {

    var width_thumb = HyprLiveContext.locals.themeSettings.maxProductImageThumbnailSize;
    var width_pdp = HyprLiveContext.locals.themeSettings.productImagePdpMaxWidth;
    var width_zoom = HyprLiveContext.locals.themeSettings.productZoomImageMaxWidth;

    //using GET request CheckImage function checks whether an image exist or not
    var checkImage = function(imagepath, callback) {
        $.get(imagepath).done(function() {
            callback(true); //return true if image exist
        }).error(function() {
            callback(false);
        });
    };

    var ProductPageImagesView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-images',
        events: {
            'mouseenter [data-mz-productimage-thumb]': 'onMouseEnterChangeThumbImage',
            'mouseleave [data-mz-productimage-thumb]': 'onMouseLeaveResetThumbImage',
            'click [data-mz-productimage-thumb]': 'switchImage'
        },
        initialize: function() {
            // preload images
            var imageCache = this.imageCache = {},
                cacheKey = Hypr.engine.options.locals.siteContext.generalSettings.cdnCacheBustKey;
            _.each(this.model.get('content').get('productImages'), function(img) {
                var i = new Image();
                i.src = img.imageUrl + '?maxWidth=' + Hypr.getThemeSetting('productImagePdpMaxWidth') + '&_mzCb=' + cacheKey;
                i.zoomsrc = img.imageUrl + '?maxWidth=' + Hypr.getThemeSetting('productZoomImageMaxWidth') + '&_mzCb=' + cacheKey;
                if (img.altText) {
                    i.alt = img.altText;
                }
                imageCache[img.sequence.toString()] = i;
            });
        },
        onMouseEnterChangeThumbImage: function(_e){
            var img_url = $(_e.currentTarget).find('img').attr('src');
            img_url = img_url.replace('maxWidth='+width_thumb, 'maxWidth='+width_pdp);
            this.mainImage = $('.mz-productimages-mainimage').attr('src');
            var videoId = require.mozuData('Video_Id');
            if(videoId){
                if($(_e.currentTarget).attr('data-label')===videoId.stringValue+'.jpg'){
                    $("#videoOverlay").addClass("video-overlay");
                    $("#playButton").addClass("play-button-main");
                }
            }
            checkImage(img_url, function(response) {
                if (response) {
                    $('.mz-productimages-mainimage').attr('src', img_url);
                }
            });
        },
        onMouseLeaveResetThumbImage: function(_e){
            var img_url = $('.mz-productimages-mainimage').data('zoom-image').replace('maxWidth='+width_zoom, 'maxWidth='+width_pdp);
            var videoId = require.mozuData('Video_Id');
            if(videoId){
                if($(_e.currentTarget).attr('data-label')===videoId.stringValue+'.jpg'){
                    $("#videoOverlay").removeClass("video-overlay");
                    $("#playButton").removeClass("play-button-main");
                }
            }
            checkImage(img_url, function(response) {
                if (response) {
                    $('.mz-productimages-mainimage').attr('src', img_url);
                }
            });
        },
        switchImage: function(e) {
            $(e.currentTarget).parents("ul").find("li").removeClass("active");
            $(e.currentTarget).addClass("active");
            var $thumb = $(e.currentTarget).find('img');
            this.selectedMainImageSrc = $thumb.attr('src');
            this.selectedMainImageAltText = $thumb.attr('alt');
            this.updateMainImage();
            return false;
        },
        updateMainImage: function() {
            var self = this;
            if (!$('#zoom').length) {
                $('.mz-productimages-main').html('<img class="mz-productimages-mainimage" data-mz-productimage-main="" id="zoom" itemprop="image">');
            }
            checkImage(this.selectedMainImageSrc.replace('maxWidth='+width_thumb, 'maxWidth=' + Hypr.getThemeSetting('productImagePdpMaxWidth')), function(response) {
                if (response) {
                    self.$('#zoom')
                        .prop('src', self.selectedMainImageSrc.replace('maxWidth='+width_thumb, 'maxWidth=' + Hypr.getThemeSetting('productImagePdpMaxWidth')))
                        .prop('alt', self.selectedMainImageAltText);
                    $('.zoomContainer').remove();
                    $('#zoom').removeData('elevateZoom').data('zoom-image', self.selectedMainImageSrc.replace('maxWidth='+width_thumb, 'maxWidth=' + Hypr.getThemeSetting('productZoomImageMaxWidth'))).elevateZoom({ zoomType: "inner", cursor: "crosshair", responsive: true });
                 }
            });
        },
        render: function() {
            //Backbone.MozuView.prototype.render.apply(this, arguments);
            //this.updateMainImage();
        }
    });


    return {
        ProductPageImagesView: ProductPageImagesView
    };

});