define(
    ['modules/jquery-mozu', 'underscore', "modules/api", "modules/backbone-mozu", "modules/models-product"],
    function ($, _, api, Backbone, ProductModels) {
        $(function () {
            $('#recently-added').each(function (index, deal) {
                deal = $(deal);

                var priceCap = deal.data('price'),
                    products, RecentlyAdded;

                products = api.get('search', {
                    filter: 'price lt ' + priceCap,
                    sortBy: 'createDate desc',
                    pageSize : 5
                });

                RecentlyAdded = Backbone.MozuView.extend({
                    templateName: 'modules/product/product-list'
                });
                products.then(function (collection) {
                    var data = collection.data,
                        productCollection, recentlyAdded;
                    data.totalCount = data.items.length;
                    productCollection = new ProductModels.ProductCollection(data);

                    if (productCollection.attributes.totalCount === 0) {
                        throw "My error";
                    } else {
                        recentlyAdded = new RecentlyAdded({
                            model: productCollection,
                            el: deal
                        });
                        recentlyAdded.render();
                    }
                });
            });
        });
    }
);

// http://services-sandbox-mozu-qa.dev.volusion.com/mozu.ProductRuntime.WebApi/commerce/catalog/storefront/productsearch/search/?query={query}&filter={filter}&facetTemplate={facetTemplate}&facetTemplateSubset={facetTemplateSubset}&facet={facet}&facetFieldRangeQuery={facetFieldRangeQuery}&facetHierPrefix={facetHierPrefix}&facetHierValue={facetHierValue}&facetHierDepth={facetHierDepth}&facetStartIndex={facetStartIndex}&facetPageSize={facetPageSize}&facetSettings={facetSettings}&facetValueFilter={facetValueFilter}&sortBy={sortBy}&pageSize={pageSize}&startIndex={startIndex}