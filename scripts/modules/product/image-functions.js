define([
    'modules/jquery-mozu',
    'hyprlivecontext',
    'modules/block-ui'
], function($, HyprLiveContext, blockUiLoader) {
    var sitecontext = HyprLiveContext.locals.siteContext;
    var cdn = sitecontext.cdnPrefix;
    var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
    var imagefilepath = cdn + '/cms/' + siteID + '/files';
    var checkImage = function(imagepath, callback) {
            $.get(imagepath).done(function() {
                callback(true); //return true if image exist
            }).error(function() {
                callback(false);
            });
        },
        onMouseEnterChangeImage = function(_e, mainImageParent) {
            this.mainImage = mainImageParent.find('img').attr('src');
            var colorCode = $(_e.currentTarget).data('mz-swatch-color');
            this.changeImages(colorCode, 'N');
        },
        onMouseLeaveResetImage = function(_e, mainImageParent) {
            if (!this.isColorClicked) {
                var colorCode = $("ul.product-color-swatches").find('li.active').data('mz-swatch-color');
                if (typeof colorCode != 'undefined') {
                    this.changeImages(colorCode, 'N');
                } else {
                    $('.mz-productimages-mainimage').attr('src', this.mainImage);
                }
            }
        };
});