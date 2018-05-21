require([
    'modules/jquery-mozu',
    "hyprlive", 
    'underscore', 
    "modules/api", 
    "modules/backbone-mozu",
    'shim!vendor/jquery/owl.carousel.min[jQuery=jquery]'
    ],
    function ($, Hypr, _, api, Backbone) {
        
        var CategoryModel = Backbone.MozuModel.extend({
            mozuType: 'categories'
        });
        
        var owlSlider = null;
        
        var CategoryImageModel = Backbone.MozuModel.extend({});
        
        var imageHeightOnLoad = [];
        var CategoryView = Backbone.MozuView.extend({
            templateName: 'widgets/homepage/home-category-tiled-view',
            initialize: function() {
                //initialize view
                this.onloadImageHeight();
            },
            onloadImageHeight: function() {
                var self = this;
                this.$el.find('img.mz-home-cat-image').one('load', function(){
                    var imgHt = $(this).height();
                    imageHeightOnLoad.push(imgHt);
                });
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this, arguments);
                this.onloadImageHeight();
            }
        });
        
        var HomeSubCatView = Backbone.View.extend({
            el: $('.mz-home-sub-cat-container'),
            initialize: function() {
                this.render = _.wrap(this.render, function(render) {
                    this.beforeRender();
                    render();						
                    this.afterRender();
                });						
                this.render();
            },
            categoryDetails: function() {
                var self = this;
                var catIdArray = [];
                this.$el.find("[data-mz-category-id]").each(function(){
                    var catID = $(this).data('mz-category-id');
                    catIdArray.push(catID);
                });
                var CatModel = new CategoryModel();
               
               var filterString = [];
                _.each(catIdArray, function(catID, index){
                    var categoryFilter = 'categoryId eq ';
                    categoryFilter += catID+ ' or ';
                    filterString.push(categoryFilter);
                });
                
                var string = filterString.toString().replace(/,/g, '');
                var string1 = string.replace(/"/g, '');
                var finalFilter = string1.substring(0, string1.length - 4);
                
                CatModel.set('filter', finalFilter);
                
                CatModel.fetch().then(function(responseObject){
                    
                    _.each(catIdArray, function(catID, index) {
                        
                        var catCode = _.where(responseObject.apiModel.data.items, {categoryId: catID});
                        if (catCode.length === 1) {
                            catCode = catCode[0];
                        }
                        var model = new CategoryImageModel(catCode);
                        
                        var selector = $('.category-image-'+catID);
                        
                        var catTileView = new CategoryView({
                            el: selector,
                            model: model
                        });
                        catTileView.render();
                    });
                    //self.catHeight();
                });
                
                var pageContext = require.mozuData('pagecontext');
                if (pageContext.isDesktop) {
                    var catLength = $(".mz-home-sub-cat-container").find(".cat-section").length;
                    $(".mz-home-sub-cat-container").find(".cat-section").css("width", 100/catLength+"%");
                }
            },
            sliderFunction: function() {
                var self = this;
                owlSlider = $("#owl-slider");
                owlSlider.owlCarousel({
                    loop:true,
                    autoplay:false,
                    autoplayTimeout:1500,
                    navigation:true,
                    items:4,
                    //Mouse Events
                    touchDrag : true
                });
            },
            render: function() {
                return this;
            },
            beforeRender: function () {
                this.categoryDetails();
            },
            afterRender: function() { 
                this.sliderFunction();
                var self = this;
                this.trigger('catHeight');
                $(window).trigger('resize');
            } 
        }); 
        
    $(document).ready(function () { 
        var homeSubCatView = new HomeSubCatView();
    });
});