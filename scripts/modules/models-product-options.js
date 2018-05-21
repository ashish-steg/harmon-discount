define([
	"modules/jquery-mozu", 
	"underscore", 
	"modules/backbone-mozu", 
	"hyprlive",  
	"modules/api",
    "hyprlivecontext"], 
    function($, _, Backbone, Hypr, api, HyprLiveContext) {
    	function zeroPad(str, len) {
	        str = str.toString();
	        while (str.length < 2) str = '0' + str;
	        return str;
	    }
	    function formatDate(d) {
	        var date = new Date(Date.parse(d) + (new Date()).getTimezoneOffset() * 60000);
	        return [zeroPad(date.getFullYear(), 4), zeroPad(date.getMonth() + 1, 2), zeroPad(date.getDate(), 2)].join('-');
	    }
    	var ProductOption = Backbone.MozuModel.extend({
	        idAttribute: "attributeFQN",
	        helpers: ['isChecked'],
	        initialize: function() {
	            var me = this;
	            _.defer(function() {
	                me.listenTo(me.collection, 'invalidoptionselected', me.handleInvalid, me);
	            });

	            var equalsThisValue = function(fvalue, newVal) {
	                return fvalue.value.toString() === newVal.toString();
	            },
	            containsThisValue = function(existingOptionValueListing, newVal) {
	                return _.some(newVal, function(val) {
	                    return equalsThisValue(existingOptionValueListing, val);
	                });
	            },
	            attributeDetail = me.get('attributeDetail');
	            if (attributeDetail) {
	                if (attributeDetail.valueType === ProductOption.Constants.ValueTypes.Predefined) {
	                    this.legalValues = _.chain(this.get('values')).pluck('value').map(function(v) { return !_.isUndefined(v) && !_.isNull(v) ? v.toString() : v; }).value();
	                }
	                if (attributeDetail.inputType === ProductOption.Constants.InputTypes.YesNo) {
	                    me.on('change:value', function(model, newVal) {
	                        var values;
	                        if (me.previous('value') !== newVal) {
	                            values = me.get('values');
	                            _.first(values).isSelected = newVal;
	                            me.set({
	                                value: newVal,
	                                shopperEnteredValue: newVal,
	                                values: values
	                            }, {
	                                silent: true
	                            });
	                            me.trigger('optionchange', newVal, me);
	                        }
	                    });
	                } else {
	                    me.on("change:value", function(model, newVal) {
	                        var newValObj, values = me.get("values"),
	                            comparator = this.get('isMultiValue') ? containsThisValue : equalsThisValue;
	                        if (typeof newVal === "string") newVal = $.trim(newVal);
	                        if (newVal || newVal === false || newVal === 0 || newVal === '') {
	                            _.each(values, function(fvalue) {
	                                if (comparator(fvalue, newVal)) {
	                                    newValObj = fvalue;
	                                    fvalue.isSelected = true;
	                                    me.set("value", newVal, { silent: true });
	                                } else {
	                                    fvalue.isSelected = false;
	                                }
	                            });
	                            me.set("values", values);
	                            if (me.get("attributeDetail").valueType === ProductOption.Constants.ValueTypes.ShopperEntered) {
	                                me.set("shopperEnteredValue", newVal, { silent: true });
	                            }
	                        } else {
	                            me.unset('value');
	                            me.unset("shopperEnteredValue");
	                        }
	                        if (newValObj && !newValObj.isEnabled) me.collection.trigger('invalidoptionselected', newValObj, me);
	                        me.trigger('optionchange', newVal, me);
	                    });
	                }
	            }
	        },
	        handleInvalid: function(newValObj, opt) {
	            if (this !== opt) {
	                this.unset("value");
	                _.each(this.get("values"), function(value) {
	                    value.isSelected = false;
	                });
	            }
	        },
	        parse: function(raw) {
	            var selectedValue, vals, storedShopperValue;
	            if (raw.isMultiValue) {
	                vals = _.pluck(_.where(raw.values, { isSelected: true }), 'value');
	                if (vals && vals.length > 0) raw.value = vals;
	            } else {
	                selectedValue = _.findWhere(raw.values, { isSelected: true });
	                if (selectedValue) raw.value = selectedValue.value;
	            }
	            if (raw.attributeDetail) {
	                if (raw.attributeDetail.valueType !== ProductOption.Constants.ValueTypes.Predefined) {
	                    storedShopperValue = raw.values[0] && raw.values[0].shopperEnteredValue;
	                    if (storedShopperValue || storedShopperValue === 0) {
	                        raw.shopperEnteredValue = storedShopperValue;
	                        raw.value = storedShopperValue;
	                    }
	                }
	                if (raw.attributeDetail.inputType === ProductOption.Constants.InputTypes.Date && raw.attributeDetail.validation) {
	                    raw.minDate = formatDate(raw.attributeDetail.validation.minDateValue);
	                    raw.maxDate = formatDate(raw.attributeDetail.validation.maxDateValue);
	                }
	            }
	            return raw;
	        },
	        isChecked: function() {
	            var attributeDetail = this.get('attributeDetail'),
	                values = this.get('values');

	            return !!(attributeDetail && attributeDetail.inputType === ProductOption.Constants.InputTypes.YesNo && values && this.get('shopperEnteredValue'));
	        },
	        isValidValue: function() {
	            var value = this.getValueOrShopperEnteredValue();
	            return value !== undefined && value !== '' && (this.get('attributeDetail').valueType !== ProductOption.Constants.ValueTypes.Predefined || (this.get('isMultiValue') ? !_.difference(_.map(value, function(v) { return v.toString(); }), this.legalValues).length : _.contains(this.legalValues, value.toString())));
	        },
	        getValueOrShopperEnteredValue: function() {
	            return this.get('value') || (this.get('value') === 0) ? this.get('value') : this.get('shopperEnteredValue');
	        },
	        isConfigured: function() {
	            var attributeDetail = this.get('attributeDetail');
	            if (!attributeDetail) return true; // if attributeDetail is missing, this is a preconfigured product
	            return attributeDetail.inputType === ProductOption.Constants.InputTypes.YesNo ? this.isChecked() : this.isValidValue();
	        },
	        toJSON: function(options) {
	            var j = Backbone.MozuModel.prototype.toJSON.apply(this, arguments);
	            if (j && j.attributeDetail && j.attributeDetail.valueType !== ProductOption.Constants.ValueTypes.Predefined && this.isConfigured()) {
	                var val = j.value || j.shopperEnteredValue;
	                if (j.attributeDetail.dataType === "Number") val = parseFloat(val);
	                j.shopperEnteredValue = j.value = val;
	            }

	            return j;
	        },
	        addConfiguration: function(biscuit, options) {
	            var fqn, value, attributeDetail, valueKey, pushConfigObject, optionName;
	            if (this.isConfigured()) {
	                if (options && options.unabridged) {
	                    biscuit.push(this.toJSON());
	                } else {
	                    fqn = this.get('attributeFQN');
	                    value = this.getValueOrShopperEnteredValue();
	                    attributeDetail = this.get('attributeDetail');
	                    optionName = attributeDetail.name;
	                    valueKey = attributeDetail.valueType === ProductOption.Constants.ValueTypes.ShopperEntered ? "shopperEnteredValue" : "value";
	                    if (attributeDetail.dataType === "Number") value = parseFloat(value);
	                    pushConfigObject = function(val) {
	                        var o = {
	                            attributeFQN: fqn,
	                            name: optionName
	                        };
	                        o[valueKey] = val;
	                        biscuit.push(o);
	                    };
	                    if (_.isArray(value)) {
	                        _.each(value, pushConfigObject);
	                    } else {
	                        pushConfigObject(value);
	                    }
	                }
	            }
	        }
	    }, {
	        Constants: {
	            ValueTypes: {
	                Predefined: "Predefined",
	                ShopperEntered: "ShopperEntered",
	                AdminEntered: "AdminEntered"
	            },
	            InputTypes: {
	                List: "List",
	                YesNo: "YesNo",
	                Date: "Date"
	            }
	        }
	    });
	return ProductOption;
    });