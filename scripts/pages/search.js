define(['modules/jquery-mozu', "modules/views-collections"], function($, CollectionViewFactory) {
    $(document).ready(function() {
        //check product has variation
        $(".mz-product-has-variation").each(function(){ 
            var hasItemAvialable = $(this).find("div.mz-product-in-stock").length;
            if(hasItemAvialable>0){
                $(this).find("div.mz-product-in-stock:not(:first)").remove();
                $(this).find("div.mz-product-sold-out").remove();
            }else{
                $(this).find("div.mz-product-sold-out:not(:first)").remove();
            }
         });
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-search]'),
            template: "search-interior"
        });
    });
});