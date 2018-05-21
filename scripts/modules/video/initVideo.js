define(
    ['modules/jquery-mozu', 'modules/backbone-mozu','hyprlive',"modules/models-product",'underscore'],
    function($, Backbone, Hypr, ProductModels,_) {
$(function(){
/* jshint ignore:start */
var videoContainer = "videoContainer";
function init_video(videothumb) {
	var self=this;
	var pdpObj;
	var isMobile = !!document.location.pathname.match(/\/mobile/);
	var product = ProductModels.Product.fromCurrent();	
	var invodoVideoIdImg = _.findWhere(product.get('properties') , {attributeFQN: "tenant~Video_Id"});
	var invodoVideoId= invodoVideoIdImg.values[0].stringValue;  // product ID matched to video
	var vidCont = {}; 
	var pageContext = require.mozuData('pagecontext');   
	if (!isMobile) {		
		vidCont = $('<div id="'+videoContainer+'" class="modal video-container"> <div id="toprightclose" class="closebutton" data-dismiss="modal" aria-hidden="true" style="z-index: 10003;"></div></div>');
		$('body').append(vidCont);
		//vidCont.simplePopup().makemodal();
		
		vidCont.preunpopcallback = function(){
			vidCont.currTime = vidCont.invodoWidget.getTime();
			vidCont.invodoWidget.pause();
		};
		vidCont.postpopcallback = function(){
		    try {
		        vidCont.invodoWidget.play();
		    }
            catch(err) {}
		};

		/* hookup hover/click event handlers for video thumb */
		$(videothumb).click(function(){

					$("#videoOverlay").removeClass("video-overlay");
                    $("#playButton").removeClass("play-button-main");
					vidCont.modal('show');
					$("#videoContainer").css("display","block");
					if(pageContext.isTablet){
						$('body').addClass('video-scroll-bg');
					}
					vidCont.invodoWidget.play();
					return false;
			});
			$("#toprightclose").click(function(){
				vidCont.currTime = vidCont.invodoWidget.getTime();
				if(pageContext.isTablet){
					$('body').removeClass('video-scroll-bg');
				}
				vidCont.invodoWidget.pause();
			});

	} // end if desktop
	else { // if mobile
		var ovl = $('<div/>', {id:"invodoovl"})
			.css({ width: "100%", height: "100%", position: "fixed", top: 0, background: "url(/images/misc/black50.png)", zIndex: 1000 })
			.hide()
			.appendTo('#container')
			.click(function(e){   
					if ( e.target.id.match(/videoClose|invodoovl/) === null )return;
					vidCont.currTime = vidCont.invodoWidget.getTime(); 
					vidCont.invodoWidget.pause();
					$(this).hide();
					return false;
			});
		ovl.html('<div id="videoClose" style="background:#fff; padding: 1px;"><div id="videoClose2" style="margin: 0 0 0 auto; padding: 5px; border: 1px solid #999999; width: 1em; height: 1em; line-height: 1em; text-align: center; color: #999999; text-transform: uppercase;" style="cursor: pointer;"><span id="videoClose3">x</span></div></div>');

		var pop = $('<div/>', {id:videoContainer}).css({height:"100%", width:"100%"}) 
			.appendTo(ovl);

		$(videothumb).click(function(){
//			jQuery('#InvodoInPlayer_PDPplayer').css({ width: "100%", height: "100%" })
			$(document).scrollTop(0);
			$('#invodoovl').show();
			var wHeight = $(window).height();
			var wWidth = $(window).width();
			var isHoriz = wWidth > wHeight;
			if (isHoriz) $('#videoClose').css({ opacity: 0.7, position: "absolute", zIndex: 50, right: 0 });

            /* Resize video player to window size */
			var playerW = ( isHoriz ) ? wHeight*16/9 : wWidth;
			var playerH = ( isHoriz ) ? wHeight : wWidth*9/16;
			pop.css({ width: playerW, height: playerH });
		    try {
		        vidCont.invodoWidget.play();
		    }
		    catch (err) { }

		});
	}

	vidCont.currTime = 0; 

	 if(typeof Invodo !== "undefined" && invodoVideoId.length>0)
	 {
	  Invodo.init({
	   pageName: $(videothumb).attr("data-pagename"),
	   pageType: "product",
	   affiliate: {
		"chromelessmode" : "false",
		"bgcolor" : "FFFFFF",
		"loadingviewcolor" : "1B9990",
		"showPlayButton" : "false"
	   }, 
	   onload: function()
	   {
	       vidCont.videoType = Invodo.getAffiliateConfig().videoPlayerPreference;  // Should be Flash or HTML5
	       var invAutoplay = (function() {   
	           if(typeof vidCont.videoType !== "undefined") { 
	               return (vidCont.videoType == "Flash");  // Flash player should be allowed to autoplay; HTML5 player should not because it will play in the background.
	           }
                return false;   // default to no autoplay if something goes wrong
	       })();           

	       var $videoWidget = Invodo.Widget.add({
	           mpd: invodoVideoId,  // use this for product codes
	           widgetId: "PDPplayer",
	           mode: "embedded",
	           type: "inplayer",
	           autoplay: invAutoplay,
	           parentDomId: videoContainer,
	           onpodload: function () {
	               Invodo.Widget.add({ widgetId: "videoThumbnail", type: "cta", mpd: invodoVideoId, data: videothumb });  // Track impressions and clicks for reporting
	               $(videothumb).show();  // show the cta icon
	           }
	       })
           .registerEventListener("videoStart", function () {
            if (!vidCont.currTime) return;
            vidCont.invodoWidget.setTime(vidCont.currTime);
            vidCont.currTime = 0;
           });
		   window.invodo = vidCont.invodoWidget = $videoWidget;
	   }
	  });	  
	 }   

} // end Video Init function
/*
	This "activates" the video thumbnail
*/
 var videoThumb = $(".video-image-position")[0];
 if(videoThumb)
 {
   init_video(videoThumb);
 }
 /* jshint ignore:end */
}); // closure to protect name space
/* start /text/inc/initVideo.js */
});