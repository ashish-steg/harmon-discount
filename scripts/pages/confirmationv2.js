define(['modules/api',
        'modules/backbone-mozu',
        'underscore',
        'modules/jquery-mozu',
        'hyprlivecontext',
        'hyprlive',
        'modules/preserve-element-through-render'
    ],
    function(api, Backbone, _, $, HyprLiveContext, Hypr, preserveElement) {
        var orderDetails = require.mozuData('checkout');
        var orderID = orderDetails.id;
        var categorydetailsurl = '/api/commerce/orders/' + orderID;
        $.cookie('paypal', null);
        $.cookie('GSIPaypal', null);
        $.cookie('PaypalAmnt', null);
        $.cookie('token', null);
        $.cookie('PayerID', null);
        var ConfirmationView = Backbone.MozuView.extend({
            templateName: 'modules/confirmationv2/confirmation-detail',
            additionalEvents: {
                "click #mz-print-content-confirmation": "printWindow"
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            },
            printWindow: function() {
                window.print();
            }
        });

        var ConfirmationModel = Backbone.MozuModel.extend({
            mozuType: 'checkout'
        });

        function renderConfirmation(resp) {
            var confModel = ConfirmationModel.fromCurrent();
            var confirmationView = new ConfirmationView({
                el: $('#confirmation-container'),
                model: resp || confModel
            });
            confirmationView.render();
        }

        /*api.request('GET', categorydetailsurl).then(function(resp) {
            renderConfirmation(resp);
        }, function(er) {
            renderConfirmation();
        });*/
    });