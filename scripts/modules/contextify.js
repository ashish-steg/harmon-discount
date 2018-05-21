define(['modules/jquery-mozu', "doubletaptogoipad"], function($, doubletaptogoipad) {
    function calculatingSubPosition() {
        $(".mz-sitenav-sub-container").addClass("calculating").each(function() {
            var currentElemnt = $(this);
            currentElemnt.removeAttr("style");
            var currentDropWidth = currentElemnt.outerWidth(),
                rightReference = $(".logo").offset().left + $(".ml-header-content").outerWidth(),
                currentParentOffset = currentElemnt.parents(".mz-sitenav-item").offset().left,
                arrowPosition = currentElemnt.parents(".mz-sitenav-item").width() / 2 - 10,
                leftOrigin = $(".mz-sitenav-list").offset().left;
            if (currentParentOffset + currentDropWidth >= rightReference) {
                currentElemnt.addClass("menu-right").find(".sub-nav-arrow").css({ "left": "auto", right: arrowPosition });
            } else {
                currentElemnt.removeClass("menu-right").find(".sub-nav-arrow").css({ "right": "auto", left: arrowPosition });
            }
            if (currentElemnt.offset().left < leftOrigin) {
                var diff = leftOrigin - currentElemnt.offset().left;
                currentElemnt.removeClass("menu-right").css("left", -diff);
                var newArrowPos = currentElemnt.offset().left - currentParentOffset;
                currentElemnt.find(".sub-nav-arrow").css({ "left": arrowPosition - newArrowPos, "right": "auto" });
            } else {
                currentElemnt.removeAttr("style");
            }
            var currentTop = currentElemnt.parents(".mz-sitenav-item-inner").offset().top - $(".mz-sitenav-list").offset().top + currentElemnt.parents(".mz-sitenav-item-inner").height();
            currentElemnt.css("top", currentTop);
        }).removeClass("calculating");
    }
    $(document).ready(function() {
        try {
            $('.mz-sitenav-list>li:has(.mz-sitenav-sub-container)').doubletaptogoipad();
        } catch (e0) {
        }
        $('[data-mz-contextify]').each(function() {
            var $this = $(this),
                config = $this.data();

            $this.find(config.mzContextify).each(function() {
                var $item = $(this);
                if (config.mzContextifyAttr === "class") {
                    $item.addClass(config.mzContextifyVal);
                } else {
                    $item.prop(config.mzContextifyAttr, config.mzContextifyVal);
                }
            });
        });
    });
    $(window).resize(function() {
        calculatingSubPosition();
    });
    calculatingSubPosition();
});