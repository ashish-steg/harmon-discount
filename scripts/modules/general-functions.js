define([
    'modules/jquery-mozu',
    'hyprlivecontext',
    'elevatezoom',
    'modules/block-ui',
    'underscore'
], function($, HyprLiveContext, elevatezoom, blockUiLoader, _) {
    var widthZoom = HyprLiveContext.locals.themeSettings.productZoomImageMaxWidth;
    return {
        siteContext: HyprLiveContext.locals.siteContext,
        cdnPrefix: HyprLiveContext.locals.siteContext.cdnPrefix,
        imagePath: HyprLiveContext.locals.siteContext.cdnPrefix + '/cms/files/',
        themeSettings: HyprLiveContext.locals.themeSettings,
        checkImage: function(imagepath, callback) {
            $.get(imagepath).done(function() {
                callback(true);
            }).error(function() {
                callback(false);
            });
        },
        addZoom: function(img, newImgPath) {
            $('body div.zoomContainer').remove();
            var currentImage = $(img);
            if (newImgPath) {
                currentImage.attr('src', newImgPath);
            }
            var currentImageSrc = currentImage.attr('src').substring(0, currentImage.attr('src').indexOf('?'));
            var zoomImageSrc = currentImageSrc + '?maxWidth=' + widthZoom;
            currentImage.data('zoom-image', currentImageSrc + '?maxWidth=' + widthZoom).elevateZoom({ zoomType: "inner", cursor: "crosshair" });
        },
        removeZoom: function() {
            $('body div.zoomContainer').remove();
            $("img").removeData('elevateZoom');
        },
        blockUiLoader: blockUiLoader,
		removeDuplicateAddress: function(me) {
            var address1 = me.get('address.address1'),
                address2 = me.get('address.address2');
            if (address1 && address2) {
                if ((address1.trim()).toLowerCase() === (address2.trim()).toLowerCase()) {
                    me.set('address.address2', '');
                }
            }
        },
        checkPromo: function(product){
            var promo = _.find(product.get('properties'), function(e) {
                return e.attributeFQN === "tenant~Promo" && e.values;
            });
            if(promo){
                var current_date = new Date(HyprLiveContext.locals.now);
                var promo_end_date_values = "", promo_end_date = "";
                promo_end_date_values = _.find(product.get('properties'), function(e) {
                    return e.attributeFQN === "tenant~Promo_End_Date" && e.values;
                });
                if(promo_end_date_values)
                    promo_end_date = new Date(promo_end_date_values.values[0].value);
                
                var promo_start_date_values = "", promo_start_date = "";
                promo_start_date_values = _.find(product.get('properties'), function(e) {
                    return e.attributeFQN === "tenant~Promo_Start_Date" && e.values;
                });
                if(promo_start_date_values)
                    promo_start_date = new Date(promo_start_date_values.values[0].value);
                if(promo_end_date && promo_start_date && promo_start_date <= current_date && current_date < promo_end_date){
                    return true;
                }else
                    return false;
            }
        },
        checkCookie: function() {
            var pagecontext = require.mozuData('pagecontext');
            var breadcrumb = require.mozuData('breadcrumb');
            if (breadcrumb && pagecontext && pagecontext.cmsContext && pagecontext.cmsContext.template && pagecontext.cmsContext.template.path && pagecontext.cmsContext.template.path === 'category') {
                $.cookie('lastCategory', JSON.stringify(breadcrumb), {path: '/'});
            }
            else {
                $.removeCookie('lastCategory');
            }
        }
    };
});