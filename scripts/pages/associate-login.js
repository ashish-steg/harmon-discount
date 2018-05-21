define([
    'modules/backbone-mozu',
    'modules/jquery-mozu',
    'hyprlive'
], function(Backbone, $, Hypr) {
    var aosView = Backbone.MozuView.extend({
        templateName: "modules/aos/aos-detail",
        additionalEvents: {
            "click #mz-aos-detail": "associateSignup"
        },
        render: function() {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
        },
        associateSignup: function() {
            var valid = true;
            var assID = $("#associate-id").val();
            var storeNum = $("#store-no").val();
            var testNumber = /^[0-9]+$/;
            if(!testNumber.test(assID) || assID.length<5){
                $('[data-mz-validationmessage-for="associate-id"]').text(Hypr.getLabel("aosIdMsg"));
                valid = false;
            }else {
                $('[data-mz-validationmessage-for="associate-id"]').text("");
            }
            if (!testNumber.test(storeNum)|| storeNum.length<3 ) {
                $('[data-mz-validationmessage-for="store-no"]').text(Hypr.getLabel("storeNoMsg"));
                valid = false;
            }else {
                $('[data-mz-validationmessage-for="store-no"]').text("");
            }
            if (!valid) {
                return valid;
            }
            var data = { assID: assID, storeNum: storeNum };
            $.cookie("aos", JSON.stringify(data), { path: '/' });
            window.location.href = window.location.origin;
            return false;
        }
    });
    var Model = Backbone.MozuModel.extend();
    var aos = new aosView({
        el: $('#aos'),
        model: new Model({})
    });
    aos.render();
});