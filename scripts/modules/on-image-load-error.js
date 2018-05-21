define([
    'modules/jquery-mozu',
    'hyprlive'
], function($,Hypr) {
    var onImageLoadError = {
        checkImage: function(el) {
            var me = this;
            var self = $(el);
            var imagepath = self.attr("src");
            //using GET request function checks whether an image exist on server or not
            $.get(imagepath).error(function () {
                me.replaceImage(el);
            });
        },
        replaceImage: function(el) {
            var self = $(el);
            var noImageTemp = Hypr.getTemplate('modules/product/product-no-image');
            self.parent().html(noImageTemp.render());
            self.remove();
        }
    };
    window.replaceImage = function(item) {
        window.setTimeout(function(){
            onImageLoadError.replaceImage(item);
        }, 300);
    };
    return onImageLoadError;
});