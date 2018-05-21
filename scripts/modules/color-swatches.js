define([
    'modules/jquery-mozu',
    'hyprlivecontext',
    'modules/block-ui'
], function ($, HyprLiveContext, blockUiLoader) {

    //Select color Swatch
    var sitecontext = HyprLiveContext.locals.siteContext;
    var cdn = sitecontext.cdnPrefix;
    var siteID = cdn.substring(cdn.lastIndexOf('-') + 1);
    var imagefilepath = cdn + '/cms/' + siteID + '/files';
    var imageMaxWidth = HyprLiveContext.locals.themeSettings.productImageDirectoryMaxWidth;
    var _mainImage = '';
    
    //using GET request CheckImage function checks whether an image exist or not
    var checkImage = function(imagepath, callback) {
        $.get(imagepath).done(function() {
            callback(true); //return true if image exist
        }).error(function() {
            callback(false);
        });
    };

    //Change color swatch
    var Swatches = {
        changeColorSwatch: function(_e) {
            //show loading
            blockUiLoader.globalLoader();
            var _self = $(_e.currentTarget);
            if(_self.parent().hasClass("mz-sold-out")){
                _self.siblings().removeClass("active");
                blockUiLoader.unblockUi();
                return;
            }else{
                if (_self.hasClass("active") || _self.parents("#overview-tab").length > 0) {
                    blockUiLoader.unblockUi();
                    return;
                } else {
                    this.setMainImage( _self );
                    _self.siblings().removeClass("active");
                    _self.addClass("active");
                    blockUiLoader.unblockUi();
                }
            }
        },
        onMouseEnter: function(_e) {
            var _self = $(_e.currentTarget),
                _productCode = _self.attr("data-product-code"),
                _selectedColorDom = $(_e.currentTarget).parent().find('li.active');
                _mainImage = $(".mz-productlist-list li[data-mz-product='" + _productCode + "'] .mz-productlisting-image img").attr('src');
            if(_self.parent().hasClass("mz-sold-out")){
                this.setMainImage( _selectedColorDom );
            }else{
                this.setMainImage( _self );
            }
        },
        onMouseLeave: function(_e) {
            var _selectedColorDom = $(_e.currentTarget).parent().find('li.active'),
                colorCode = _selectedColorDom.data('mz-swatch-color'),
                productCode = $(_e.currentTarget).attr("data-product-code");
            if (typeof colorCode != 'undefined') {
                this.setMainImage( _selectedColorDom );
            } else if(typeof _mainImage != 'undefined'){
                var _img = $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .mz-productlisting-image img");
                _img.attr("src", _mainImage);
            }else{
                $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .mz-productlisting-image a").html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
            }
        },
        setMainImage: function( _dom ){
            var colorCode = _dom.data('mz-swatch-color'),
                productCode = _dom.attr("data-product-code"),
                img = $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .mz-productlisting-image img");
             
               var imagepath = imagefilepath + '/' + productCode + '_' + colorCode + '_v1.jpg';
                checkImage(imagepath, function(response) {
                    if (response) {
                        if (!img.length) {
                            var parentDiv = $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .mz-productlisting-image");
                            parentDiv.find(".mz-productlisting-imageplaceholder").parent("a").addClass("image-holder");
                            parentDiv.find(".mz-productlisting-imageplaceholder").remove();
                            parentDiv.find(".image-holder").append("<img>");
                            img = $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .image-holder img");
                            img.addClass("img-responsive");
                        }
                        img.attr("src", imagefilepath + '/' + productCode + '_' + colorCode + '_v1.jpg?maxWidth=' + imageMaxWidth);        
                    }else if(typeof _mainImage === 'undefined'){
                        $(".mz-productlist-list li[data-mz-product='" + productCode + "'] .mz-productlisting-image a").html('<span class="mz-productlisting-imageplaceholder img-responsive"><span class="mz-productlisting-imageplaceholdertext">[no image]</span></span>');
                    }
                });
                            
        }
    };
    return Swatches;
});