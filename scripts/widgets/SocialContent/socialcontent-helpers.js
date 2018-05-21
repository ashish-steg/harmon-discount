define(['modules/jquery-mozu', 'underscore', 'hyprlivecontext'],
    function ($, _, HyprLiveContext) {

        var _appExists;

        var getHostname = function(){
            return HyprLiveContext.locals.pageContext.secureHost;
        };

        var mobileURLByLink = function(link) {
            var URL = "";
            switch (link.linkType) {
                case 'categoryId' :
                    URL = 'bf://mozu.com/categories/' + link.link;
                    break;
                case 'productId' :
                    URL = 'bf://mozu.com/products/' + link.link;
                    break;
                default :
                    URL = link.link;
                    break;
            }
            return URL;
        };

        var desktopURLByLink = function(link) {
            var URL = "";
            switch (link.linkType) {
                case 'categoryId' :
                    URL = getHostname() + '/c/' + link.link;
                    break;
                case 'productId' :
                    URL = getHostname() + '/p/' + link.link;
                    break;
                default :
                    URL = link.link;
                    break;
            }
            return URL;
        };

        var isMobileDevice = function() {
            if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
                return true;
            }
            return false;
        };

        /*var mobileAppExists = function() {
            var appDeepLink = "bf://mozu.com/";
            if (_appExists !== "boolean") {
                $.get(appDeepLink, function (data) {
                }).done(function () {
                        _appExists = true
                        return _appExists;
                    })
                    .fail(function () {
                        _appExists = false
                        return _appExists;
                    });
            }
            return _appExists;
        }*/

        var timeElapsed = function(dateTime){
            var postedTime = new Date(dateTime);
            var thisTime = new Date();
            var elapsedTime = thisTime.getTime() - postedTime.getTime();
            elapsedTime = elapsedTime /1000/60/60/24;

            if(elapsedTime > 1) {
                return Math.ceil(elapsedTime) + ' days ago';
            }
            else if (elapsedTime * 24 > 1) {

                return Math.ceil(elapsedTime * 24) + ' hours ago';
            }
            else if(elapsedTime *24*60 > 1){
                return Math.ceil(elapsedTime *24*60) + ' minutes ago';
            }
            else {
                return Math.ceil(elapsedTime *24*60*60) + ' seconds ago';
            }

        };

        return {
            mobileURLByLink: function (link) {
                return mobileURLByLink(link);
            },
            desktopURLByLink: function (link) {
                return desktopURLByLink(link);
            },
            isMobileDevice: isMobileDevice(),
            timeElapsed: function (dateTime) {
                return timeElapsed(dateTime);
            }
        };
    });