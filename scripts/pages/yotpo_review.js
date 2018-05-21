define(["modules/jquery-mozu", "underscore", "hyprlive", "modules/backbone-mozu", "modules/cart-monitor", "modules/views-productimages",  "hyprlivecontext","modules/views-collections","modules/models-product", "modules/models-price", "modules/api"], 
function ($, _, Hypr, Backbone, CartMonitor, ProductImageViews, HyprLiveContext, CollectionViewFactory, ProductModel, ProductPrice, api) {

	$(document).ready(function(){ 
	    var singleImgContainer = $(".yotpo-single-image-container");
	    var size_li = $(singleImgContainer).size();
	    var galleryThumbnails = 8;
	    $(".yotpo-single-image-container").addClass("hidden-thumbnails");
	    $('.yotpo-single-image-container:lt('+galleryThumbnails+')').removeClass("hidden-thumbnails"); 
	    $('.yotpo-load-more-button').click(function () {
	        $(".yotpo-single-image-container").removeClass("hidden-thumbnails");
	         
	    });
	});

	var getProductCode = $("#customProductCode").val();
	var reviewUrl="https://api.yotpo.com/v1/widget/4X91rXasdFWFBX4Rnh5WEr4NnvMwpFpjxzNFLubD/products/"+getProductCode+"/reviews";
	$.get(reviewUrl, function(data, status){
		var ProductReviewView = Backbone.MozuView.extend({  
			templateName: 'modules/product/yotpo-review'
		});

		var product = new ProductModel.Product(data.response);
		var productReviewView = new ProductReviewView({
			model:product,
			el:$('.custom-yotpo-review')
		});		
		productReviewView.render();	
	});
});