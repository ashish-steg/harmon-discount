define([
    'modules/jquery-mozu'
], function ($) {
    var _o = {};
    _o.filterProductOptions = function (_a) {
        var _ro = {};
        for (var i = 0; i < _a.length; i++) {
            var _o = _a[i].attributes;
            _ro[_o.attributeFQN] = $.extend(true, {}, _a[i].attributes);
            var _l = _o.values.length;
            _ro[_o.attributeFQN].values = {};
            for (var _j = 0; _j < _l; _j++) {
                _ro[_o.attributeFQN].values[_o.values[_j].value] = $.extend(true, {}, _o.values[_j]);
            }
        }
        return _ro;
    };

    _o.filterOptions = function (_a) {
        var _ro = {};
        for (var i = 0; i < _a.length; i++) {
            var _o = _a[i];
            _ro[_o.attributeFQN] = {};
            var _l = _o.values.length;
            _ro[_o.attributeFQN].values = {};
            for (var _j = 0; _j < _l; _j++) {
                _ro[_o.attributeFQN].values[_o.values[_j].value] = $.extend(true, {}, _o.values[_j]);
            }
        }
        return _ro;
    }; 

    _o.checkIsEnabled = function (_b) {
        var _p = false;
        for (var i = 0; i < _b.length; i++) {
            if(_b[i].isEnabled && _b[i].isSelected){
                _p = true;
            }
        }
        return _p;
    };

    return _o;
});