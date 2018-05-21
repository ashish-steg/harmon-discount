define([
    'modules/jquery-mozu',
    'blockui'
], function($, blockui) {
    var blockUiLoader = {
        globalLoader: function() {
            $.blockUI({
                baseZ: 1100,
                message: '<i class="fa fa-spinner fa-spin"></i>',
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: 'transparent',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: 1,
                    color: '#fff',
                    fontSize: '60px'
                }
            });
        },
        productValidationMessage: function() {
            $.blockUI({
                baseZ: 1050,
                message: $('#SelectValidOption'),
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: '#fff',
                    opacity: 1,
                    color: '#000',
                    width: 'auto',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '14px'
                }
            });
            $('.zoomContainer').remove();
            $('#zoom').removeData('elevateZoom');
        },
        deliverySurchargeMessage: function() {
            $.blockUI({
                baseZ: 1050,
                message: $('.del-surcharge-popup'),
                css: {
                    border: 'none',
                    padding: '15px',
                    backgroundColor: '#fff',
                    opacity: 1,
                    color: '#000',
                    width: 'auto',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '14px'
                }
            });
            $('.zoomContainer').remove();
            $('#zoom').removeData('elevateZoom');
        },
        unblockUi: function() {
            $.unblockUI();
        }
    };
    return blockUiLoader;
});