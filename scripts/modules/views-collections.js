/**
 * Unidirectional dispatch-driven collection views, for your pleasure.
 */


define([
    'backbone',
    'modules/jquery-mozu',
    'underscore',
    'hyprlivecontext',
    'modules/url-dispatcher',
    'modules/intent-emitter',
    'modules/get-partial-view',
    'modules/color-swatches',
    'modules/block-ui',
    'modules/category/infinite-scroller',
    'modules/general-functions'
], function(Backbone, $, _, HyprLiveContext, UrlDispatcher, IntentEmitter, getPartialView, colorSwatch, blockUiLoader, InfiniteScroller, generalFunctions) {

    function factory(conf) {

        var _$body = conf.$body;
        var _dispatcher = UrlDispatcher;
        var ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND';
        var _isColorClicked = false;
        var _mainImage = '';
        // on page load get facet href and append facets
        var path = getFacet();
        if (path !== "") {
            updateFacetFilter(path);
        }

        //get facets from the href
        function getFacet() {
            var path = window.location.search;
            return path;
        }

        //create facets and append them in list
        function updateFacetFilter(path) {

            if (path.indexOf("facetValueFilter") > -1) {
                var pathArray = path.substring(1).split("&");
                var facetValue = "";
                for (var i = 0; i < pathArray.length; i++) {
                    var currentElmnt = pathArray[i].split("=");
                    if (currentElmnt[0] === "facetValueFilter") {
                        facetValue = currentElmnt[1];
                        break;
                    }
                }
                if (facetValue !== "") {
                    facetValue = decodeURIComponent(facetValue).split(",");
                    var available_facets = "";
                    for (var j = 0; j < facetValue.length; j++) {
                        var facetKey = facetValue[j].split(":")[0];
                        var facetVal = facetValue[j] !== "" ? facetValue[j].split(":")[1].replace(/\+/g, ' ') : "";
                        if (facetVal === "") {
                            continue;
                        }
                        if (facetVal.indexOf("&#38") != facetVal.indexOf("&#38;")) {
                            facetVal = facetVal.replace(/\&#38/g, '&amp;');
                        }
                        var displayValue = facetVal;
                        if (facetKey === 'price') {
                            if (displayValue.indexOf("* TO")) {
                                displayValue = displayValue.replace("* TO ", "");
                                displayValue += " and under";
                            } else if (displayValue.indexOf("TO *")) {
                                displayValue = displayValue.replace(" TO *", "+");
                            }
                            displayValue = displayValue.replace("[", "$").replace("]", "").replace(/to/gi, "-");
                        }
                        available_facets += '<li><i class="fa fa-times-circle remove-facet" data-mz-facet="' + facetKey + '" data-mz-facet-value="' + facetValue[j].split(":")[1] + '" data-mz-purpose="remove" data-mz-action="clearFacet"></i> <u>' + displayValue + '</u></li>';
                    }
                    if (available_facets !== '') {
                        var filterOptionList = $("#filterOptionList");
                        filterOptionList.append(available_facets);
                    }
                    return true;
                }
            }
        }

        function updateUi(response) {
            var url = response.canonicalUrl;
            if (url && url.substr(url.length - 2) === '&&')
                url = url.substring(0, url.length - 1);
            _$body.html(response.body);
            //check product has variation
            checkProductHasVariation();
            if (url) _dispatcher.replace(url);
            _$body.removeClass('mz-loading');
            if ($(".view-all.selected").length) {
                InfiniteScroller.update();
            }
            //add facet filter to list if any
            var path = getFacet();
            updateFacetFilter(path);
            //check default view
            if ($.cookie("currentView") === "listView") {
                $("#listView").trigger("click");
            } else {
                $("#gridView").trigger("click");
            }
            blockUiLoader.unblockUi();
            $('html,body').animate({
                scrollTop: $('#products-wrapper').offset().top
            }, 400);
        }

        function showError(error) {
            _$body.find('[data-mz-messages]').text(error.message);
        }

        function intentToUrl(e) {
            if ($(".blockOverlay").length > 0) {
                return;
            }
            //show loading
            blockUiLoader.globalLoader();
            var path = getFacet();
            var elm = e.target;
            var url;
            var del_url;
            if (elm.tagName.toLowerCase() === "select") {
                elm = elm.options[elm.selectedIndex];
            }
            url = elm.getAttribute('data-mz-url') || elm.getAttribute('href') || '';
            if (url && url[0] != "/") {
                url = (url.substr(url.length - 3) === '%3a') ? url.substring(0, url.length - 3) : url;
                var parser = document.createElement('a');
                parser.href = url;
                url = window.location.pathname + parser.search;
            }
            return url;
        }

        //remove facets when clicked on cross
        $('#page-content').on('click', '.remove-facet', (function(e) {
            blockUiLoader.globalLoader();
            var mzFacet = $(this).attr('data-mz-facet');
            var mzFacetValue = $(this).attr('data-mz-facet-value');
            var delFacet = mzFacet + ':' + mzFacetValue.replace(/\s/g, '+');
            var delFacet1 = mzFacet + '%3a' + mzFacetValue.replace(/\s/g, '+');
            //remove facet from url
            var path = getFacet();
            path = decodeURIComponent(path);
            var url = path.replace(delFacet + ',', '');
            url = url.replace(delFacet1 + ',', '');
            url = url.indexOf(delFacet) >= 0 ? path.replace(delFacet, '') : url;
            url = url.indexOf(delFacet1) >= 0 ? path.replace(delFacet1, '') : url;
            url = (url === '?facetValueFilter=') ? window.location.pathname : url;
            url = (url.substr(url.length - 1) === ':') ? url.substring(0, url.length - 1) : url;

            var parser = document.createElement('a');
            parser.href = url;
            url = window.location.pathname + parser.search;
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                e.preventDefault();
            }
        }));

        var navigationIntents = IntentEmitter(
            _$body, [
                'click [data-mz-pagingcontrols] a',
                'click [data-mz-pagenumbers] a',
                'click #filterOptions [data-mz-facet-value]',
                'click [data-mz-action="clearFacets"]',
                'change #filterOptions input[data-mz-facet-value]',
                'change [data-mz-value="pageSize"]',
                'change [data-mz-value="sortBy"]'
            ],
            intentToUrl
        );

        navigationIntents.on('data', function(url, e) {
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                e.preventDefault();
            }
        });

        _dispatcher.onChange(function(url) {
            getPartialView(url, conf.template).then(updateUi, showError);
        });

        var toggleView = IntentEmitter(
            _$body, [
                'click [data-btn-view-toggle]'
            ],
            toggleProductView
        );

        //Toggle View GRID/LIST
        function toggleProductView(_e) {
            var _self = $(_e.currentTarget);
            var toggleButtons = $("button[data-btn-view-toggle]");
            var toggleListView = $(".ml-list-view-toggle");
            //check if already active
            if (_self.hasClass("active")) {
                return;
            } else {
                //check which view is enable
                if (_self.attr("id") == "gridView" && !toggleListView.hasClass("grid-view")) {
                    toggleListView.addClass("grid-view").removeClass("list-view");
                    $.cookie("currentView", "gridView");
                } else {
                    toggleListView.addClass("list-view").removeClass("grid-view");
                    $.cookie("currentView", "listView");
                }
            }
            //make selected view icon active
            toggleButtons.removeClass("active");
            _self.addClass("active");
        }

        //Select color Swatch
        var selectSwatch = IntentEmitter(
            _$body, [
                'click #product-list-ul [data-mz-swatch-color]',
                'click #more-product-list [data-mz-swatch-color]'
            ],
            changeColorSwatch
        );

        //Change color swatch
        function changeColorSwatch(_e) {
            _isColorClicked = true;
            colorSwatch.changeColorSwatch(_e);
            _isColorClicked = false;
        }

        IntentEmitter(
            _$body, [
                'mouseenter #product-list-ul [data-mz-swatch-color]'
            ],
            onMouseEnterChangeImage
        );
        IntentEmitter(
            _$body, [
                'mouseleave #product-list-ul [data-mz-swatch-color]'
            ],
            onMouseLeaveResetImage
        );

        function onMouseEnterChangeImage(_e) {
            colorSwatch.onMouseEnter(_e);
        }

        function onMouseLeaveResetImage(_e) {
            if (!_isColorClicked) {
                colorSwatch.onMouseLeave(_e);
            }
        }

        //Show more swatches
        var showMoreSwatch = IntentEmitter(
            _$body, [
                'click .showMoreSwatches'
            ],
            showMoreColors
        );

        //show all colors
        function showMoreColors(_e) {
            var _self = $(_e.currentTarget);
            var currentProduct = _self.parents(".ml-product-swatch");
            _self.parent("li").hide();
            currentProduct.find("li.mz-hide-color").removeClass("mz-hide-color");
        }

        //toggle filters
        var toggleFilters = IntentEmitter(
            _$body, [
                'click [data-mz-filters-collapse]'
            ],
            toggleFiltersView
        );

        //Toggle filters
        function toggleFiltersView(_e) {
            var icon = $('#collapseIcon>i');
            var elmtn = $('#filterOptions');
            $(elmtn).toggle();

            if ($(icon).hasClass("fa-plus")) {
                $(icon).removeClass("fa-plus").addClass("fa-minus");
            } else {
                $(icon).addClass("fa-plus").removeClass("fa-minus");
            }
        }

        //toggle filter
        var toggleFilter = IntentEmitter(
            _$body, [
                'click [data-mz-filter-collapse]'
            ],
            toggleFilterView
        );

        //Toggle filter
        function toggleFilterView(_e) {
            var _self = $(_e.currentTarget);
            var count = _self.attr("data-mz-filter-collapse");
            var icon = $('#filterIcon' + count);
            var elmtn = $('#filterList' + count);

            $(".mz-facetingform-facet").removeClass("active");
            $(elmtn).addClass("active");
            $(".filter-icon").find("i.fa")
                .removeClass("fa-minus")
                .addClass("fa-plus");

            $(icon).find("i.fa")
                .removeClass("fa-plus")
                .addClass("fa-minus");
        }

        //toggle filter
        var backToTop = IntentEmitter(
            _$body, [
                "click .back-to-top"
            ],
            backToTopFn
        );

        function backToTopFn() {
            $("html, body").animate({ scrollTop: 0 }, 500);
        }

        //Switch More
        var switchMore = IntentEmitter(
            _$body, [
                "click .show-more"
            ],
            switchMoreFn
        );

        function switchMoreFn(e) {
            var parentLi = $(e.currentTarget).parent("li.show-more-li");
            if (parentLi.hasClass("show-less")) {
                parentLi.find("a").text("More...");
                parentLi.removeClass("show-less").parent("ul").find("li.mz-hide-text").addClass("hide");
            } else {
                parentLi.find("a").text("Less...");
                parentLi.addClass("show-less").parent("ul").find("li.mz-hide-text").removeClass("hide");
            }
        }

        if ($(".view-all.selected").length) {
            InfiniteScroller.update();
        }

        //Check product has variation
        function checkProductHasVariation() {
            $(".mz-product-has-variation").each(function() {
                var hasItemAvialable = $(this).find("div.mz-product-in-stock").length;
                if (hasItemAvialable > 0) {
                    $(this).find("div.mz-product-in-stock:not(:first)").remove();
                    $(this).find("div.mz-product-sold-out").remove();
                } else {
                    $(this).find("div.mz-product-sold-out:not(:first)").remove();
                }
            });
        }

        //For Breadcrumb
        $.removeCookie('lastCategory');
        IntentEmitter(
            _$body, [
            'click li.mz-productlist-item'
            ],
            checkCookie
        );

        function checkCookie() {
            generalFunctions.checkCookie();
        }
    }

    return {
        createFacetedCollectionViews: factory
    };

});