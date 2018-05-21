define([
	"modules/jquery-mozu", 
	"underscore", 
	"modules/backbone-mozu", 
	"hyprlive", 
	"modules/models-price", 
	"modules/api",
    "hyprlivecontext",
    "modules/models-product-options",
    "modules/models-messages"], 
    function($, _, Backbone, Hypr, PriceModels, api, HyprLiveContext, ProductOption, MessageModels) {
    	var ProductContent = Backbone.MozuModel.extend({}), 
	      	
    	FamilyItem = Backbone.MozuModel.extend({
	        mozuType: 'product',
	        idAttribute: 'productCode',
	        handlesMessages: true,        
	        helpers: ['mainImage', 'notDoneConfiguring', 'hasPriceRange', 'supportsInStorePickup', 'isPurchasable','hasVolumePricing'],
	        defaults: {
	            purchasableState: {},
	            quantity: 0
	        },
	        dataTypes: {
	            quantity: Backbone.MozuModel.DataTypes.Int
	        },
	        initApiModel: function(conf) {
	            var me = this;
	            this.apiModel = api.createSync(this.mozuType, _.extend({}, _.result(this, 'defaults') || {}, conf));
	            if (!this.apiModel || !this.apiModel.on) return;
	            this.apiModel.on('action', function() {
	                me.isLoading(true);
	                me.trigger('request');
	            });
	            this.apiModel.on('sync', function(rawJSON) {
	                me.isLoading(false);
	                if (rawJSON) {
	                    me._isSyncing = true;
	                    var updaterawJSON = (rawJSON.options && rawJSON.options.length) ? me.checkVariationCode(rawJSON) : rawJSON;	                    
	                    me.set(updaterawJSON);
	                    me._isSyncing = false;
	                }
	                me.trigger('sync', rawJSON);
	            });
	            this.apiModel.on('spawn', function(rawJSON) {
	                me.isLoading(false);
	            });
	            this.apiModel.on('error', function(err) {
	            	var my = me;
	                me.isLoading(false);
	                //Get items which are out of stock
	                if(err.message.indexOf("Item not found: "+me.id+" product code "+me.id+" is out of stock") !== -1){
	                	var serviceurl = '/api/commerce/catalog/storefront/products/' + me.get('productCode')+'?&allowInactive=true&supressOutOfStock404=true';
	                	api.request('GET', serviceurl).then(function(newProduct) {
	                		my.set(newProduct);
	                		my.trigger('ready');
	                    	my.set("isReady",true);
							my.trigger('familyReady', my);
	                    	if(my.get('inventoryInfo').outOfStockBehavior !== "AllowBackOrder" && typeof my.get('inventoryInfo').onlineStockAvailable !== 'undefined' && my.get('inventoryInfo').onlineStockAvailable === 0){
		                    	my.set('quantityNull', 0);
		                    }
	                    	my.set('itemCode', Hypr.getLabel('item')+'# '+my.get('productCode'));
	                    	my.messages.reset([Hypr.getLabel('productOutOfStock')]);
	                    	return;
	                	});     
	                	return;
	                }
	                if(err.message.indexOf("Item not found: "+me.id+" product code "+me.id+" not found") !== -1){
	                	--window.familyLength;
	                	if(window.familyLength === window.familyArray.length){
	                		if(!window.checkInventory){
			                    window.outOfStockFamily = true;
			                    $("[data-mz-action='addToCart']").addClass('button_disabled').attr("disabled", "disabled");
			                }
	                	}
	                	return;
	                }
	                me.trigger('error', err);
	            });
	            this.on('change', function() {
	                if (!me._isSyncing) {
	                    var changedAttributes = me.changedAttributes();
	                    _.each(changedAttributes, function(v, k, l) {
	                        if (v && typeof v.toJSON === "function")
	                            l[k] = v.toJSON();
	                    });
	                    me.apiModel.prop(changedAttributes);
	                }
	            });
	        },
            /**
             * A helper method for use in templates. True if there are one or more messages in this model's `messages` cllection.
             * Added to the list of {@link MozuModel#helpers } if {@link MozuModel#handlesMessages } is set to `true`.
             * @returns {boolean} True if there are one or more messages in this model's `messages` collection.
             * @method hasMessages
             * @memberof MozuModel.prototype
             */

            initMessages: function() {
                var me = this;
                me.messages = new MessageModels.MessagesCollection();
                me.hasMessages = function() {
                    return me.messages.length > 0;
                };
                me.helpers.push('hasMessages');
                me.on('error', function(err) {
                    if (err.items && err.items.length) {
                        me.messages.reset(err.items);
                    } else {
                        me.messages.reset([err]);
                    }
                    window.productView.render();
                });
                me.on('sync', function(raw) {
                    if (!raw || !raw.messages || raw.messages.length === 0) me.messages.reset();
                });
                _.each(this.relations, function(v, key) {
                    var relInstance = me.get(key);
                    if (relInstance) me.listenTo(relInstance, 'error', function(err) {
                        me.trigger('error', err);
                    });
                });
            },	        
	        validation: {
	            quantity: {
	                min: 0,
	                msg: Hypr.getLabel('enterProductQuantity')
	            }
	        },
	        relations: {
	            content: ProductContent,
	            price: PriceModels.ProductPrice,
	            priceRange: PriceModels.ProductPriceRange,
	            options: Backbone.Collection.extend({
	                model: ProductOption
	            })
	        },
	        hasPriceRange: function() {
	            return this._hasPriceRange;
	        },
	        hasVolumePricing: function() {
	            return this._hasVolumePricing;
	        },
	        calculateHasPriceRange: function(json) {
	            this._hasPriceRange = json && !!json.priceRange;
	        },
	        initialize: function(conf) {
	            var me = this;
	            setTimeout(function(){ 
	                me.apiGet().then(function(){ 
	                    var slug = me.get('content').get('seoFriendlyUrl');
	                    _.bindAll(me, 'calculateHasPriceRange', 'onOptionChange');
	                    me.listenTo(me.get("options"), "optionchange", me.onOptionChange);
	                    me._hasVolumePricing = false;
	                    me._minQty = 0;
	                    if (me.get('volumePriceBands') && me.get('volumePriceBands').length > 0) {
	                        me._hasVolumePricing = true;
	                        me._minQty = _.first(me.get('volumePriceBands')).minQty;
	                        if (me._minQty > 1) {
	                            if (me.get('quantity') <= 1) {
	                                me.set('quantity', me._minQty);
	                            }
	                            me.validation.quantity.msg = Hypr.getLabel('enterProductQuantity', me._minQty);
	                        }
	                    }
	                    me.updateConfiguration = _.debounce(me.updateConfiguration, 300);
	                    me.set({ url: (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + (slug ? "/" + slug : "") +  "/p/" + me.get("productCode")});
	                    me.lastConfiguration = [];
	                    me.calculateHasPriceRange(conf);
	                    me.on('sync', me.calculateHasPriceRange);
	                    me.set('itemCode', Hypr.getLabel('item')+'# '+me.get('productCode'));
	                    if(me.get('inventoryInfo').outOfStockBehavior !== "AllowBackOrder" && typeof me.get('inventoryInfo').onlineStockAvailable !== 'undefined' && me.get('inventoryInfo').onlineStockAvailable === 0){
	                    	me.set('quantityNull', 0);
	                    }
	                    me.trigger('ready');
	                    me.trigger('familyReady', me);
	                    me.set("isReady",true);
	                });
	            },400);
	        },
	        checkVariationCode: function(rawJSON){
	            var me = this;
	            var variations = rawJSON.variations || me.get("variations");
	            var variationCodes = me.get('variationCodes');
	            var outOfStockBehavior = rawJSON.inventoryInfo.outOfStockBehavior;
	            //remove variations with inventory zero if outOfStockBehavior === "HideProduct"
	            if(outOfStockBehavior === "HideProduct"){
	            	variations.reduce(function (hideProduct, variation) {
					  	if (variation.inventoryInfo.onlineStockAvailable === 0) {
					    	return hideProduct.concat(variation);
					  	} else {
					    	return hideProduct;
					  	}
					}, []);
	            }
	            var variation_pro = [];
	            var options_arr = [];
	            rawJSON.variations = variation_pro;
	            var count = 0;
	            for(var j=0; j < variations.length; j++){
	                for (var k = 0; k < variationCodes.length; k++) {
	                    if (variations[j].productCode === variationCodes[k]) {
	                        variation_pro.push(variations[j]);
	                        if (rawJSON.options) {
	                        	//get options matching to variationCodes with inventory
	                            for (var x=0; x < variations[j].options.length; x++) {
	                            	var checkDuplication = 0;
	                            	for(var o=0; o < options_arr.length; o++){
	                            		if(options_arr[o].option === variations[j].options[x].valueSequence)
	                            			checkDuplication = 1;
	                            	}
	                            	//Don't let items to duplicate
	                            	if(checkDuplication === 0){
		                            	options_arr[count] = {};
		                            	options_arr[count].option = variations[j].options[x].valueSequence;
		                            	options_arr[count].onlineStockAvailable = variations[j].inventoryInfo.onlineStockAvailable;
		                            	++count;
		                                options_arr = _.uniq(options_arr); 
		                            }
	                            }
	                        }
	                    }
	                }
	        	}
	            rawJSON.variations = variation_pro;
	            //remove unwanted options
	            if(options_arr.length){
		            for(var i=0;i<rawJSON.options.length;i++){
		                var opt_pro= [];
		                var option = rawJSON.options[i];
		                var key = option.attributeFQN;
		                for (var b = 0; b < option.values.length; b++) {
		                    for (var c = 0; c < options_arr.length; c++) {
		                        if (option.values[b].attributeValueId === options_arr[c].option) {
		                        	if(outOfStockBehavior === "DisplayMessage" && options_arr[c].onlineStockAvailable === 0){
		                        		option.values[b].isEnabled = false;
		                        	}
		                            opt_pro.push(option.values[b]);     
		                            break;                       
		                        }
		                    }
		                } 
		                if(outOfStockBehavior !== "AllowBackOrder"){
			                var checkEnable = false;
							for(var p = 0; p < opt_pro.length; p++) {
							    if (opt_pro[p].isEnabled === true) {
							        checkEnable = true;
							        break;
							    }
							}
			                if(checkEnable === false)
			                	rawJSON.quantityNull = 0;
			            }
		                rawJSON.options[i].values=opt_pro;
		            }
		        }
	            return rawJSON;
	        },
	        mainImage: function() {
	        	var productImages = this.get('mainImage');
	            //var productImages = this.get('content.productImages');
	            //return productImages && productImages[0];
	            return productImages;
	        },
	        notDoneConfiguring: function() {
	            return this.get('productUsage') === FamilyItem.Constants.ProductUsage.Configurable && !this.get('variationProductCode');
	        },
	        isPurchasable: function() {
	            var purchaseState = this.get('purchasableState');
	            if (purchaseState.isPurchasable){
	                return true;
	            }
	            if (this._hasVolumePricing && purchaseState.messages && purchaseState.messages.length === 1 && purchaseState.messages[0].validationType === 'MinQtyNotMet') {
	                return true;
	            }
	            return false;
	        },
	        supportsInStorePickup: function() {
	            return _.contains(this.get('fulfillmentTypesSupported'), FamilyItem.Constants.FulfillmentTypes.IN_STORE_PICKUP);
	        },
	        getConfiguredOptions: function(options) {
	            return this.get('options').reduce(function(biscuit, opt) {
	                opt.addConfiguration(biscuit, options);
	                return biscuit;
	            }, []);
	        },


	        addToCart: function () {
	            var me = this;
	            me.messages.reset();
	            var dfd = $.Deferred();
	            this.whenReady(function () {
	                if (!me.validate()) {
	                    var fulfillMethod = me.get('fulfillmentMethod');
	                    if (!fulfillMethod) {
	                        fulfillMethod = (me.get('goodsType') === 'Physical') ? FamilyItem.Constants.FulfillmentMethods.SHIP : FamilyItem.Constants.FulfillmentMethods.DIGITAL;
	                    }
	                    if(typeof me.get('inventoryInfo') === 'undefined'){
	                    	dfd.reject(Hypr.getLabel('selectValidOption')); 
	                    	return;
	                    }	                    
	                    //reject products to proceed which are out of stock(under 'DisplayMessage' and 'HideMessage') and allow to proceed which are under 'AllowBackOrder'
	                    if(me.get('quantityNull') === 0){
	                    	dfd.reject(Hypr.getLabel('selectValidOption')); 
	                    	return;
	                    }else if(typeof me.get('inventoryInfo').onlineStockAvailable !== 'undefined'){
	                    	//products without options
	                    	var oneSizeOption = "",
					            id = Hypr.getThemeSetting('oneSizeAttributeName');
					        if(me.get('options') && me.get('options').length)
					            oneSizeOption = me.get('options').get(id);
	                    	if(oneSizeOption && me.get('quantity') === 0){
	                    		//dfd.reject(Hypr.getLabel('productwithoutSku'));
	                    		dfd.reject(Hypr.getLabel('selectValidOption'));
	                    		return;
	                    	}
	                    	//if single options(color, size) present and selected and qty is zero then don't show message of quantity
	                    	var singleOptionCheck = 0;
	                    	for(var i=0; i < me.get('options').models.length; i++){
	                    		if(me.get('options').models[i].get('values').length === 1 && me.get('options').models[i].get('value') !== 'undefined'){	                    			
	                    			singleOptionCheck++;
	                    		}
	                    	}
	                    	if(singleOptionCheck === me.get('options').models.length && me.get('quantity') === 0){
	                    		dfd.reject(Hypr.getLabel('selectValidOption')); 
	                    		return;
	                    	}
	                    	//options selected but qty zero
	                    	if(me.get('quantity') === 0){
	                    		me.trigger('error', { message : Hypr.getLabel('enterProductQuantity')});
	                    		dfd.reject(Hypr.getLabel('enterQuantity', me.get('productCode')));
	                    		return;
	                    	}
		                    me.apiAddToCart({
		                        options: me.getConfiguredOptions(),
		                        fulfillmentMethod: fulfillMethod,
		                        quantity: me.get("quantity")
		                    }).then(function (item) {
		                    	dfd.resolve(me);
		                        me.trigger('addedtocart', item);
		                    },function(err){
		                    	if(err.message.indexOf("The following items have limited quantity or are out of stock:") !== -1){ 
									me.trigger('error', { message : Hypr.getLabel('productOutOfStockError')});
		                        }
		                    	dfd.reject(err);
		                    });
		                }else if(me.lastConfiguration && !me.lastConfiguration.length && me.get('quantity') > 0){
		                	//options not selected but qty > zero
		                	me.trigger('error', { message : Hypr.getLabel('selectValidOption')});
		                	dfd.reject(Hypr.getLabel('selectValidOptionProduct', me.get('productCode')));
		                }else if(me.lastConfiguration && me.lastConfiguration.length && typeof me.get('inventoryInfo').onlineStockAvailable === 'undefined' && me.get('quantity') > 0){
		                	//if all options are not selected and qty > 0
		                	me.trigger('error', { message : Hypr.getLabel('selectValidOption')});
		                	dfd.reject(Hypr.getLabel('selectValidOptionProduct', me.get('productCode')));
		                }else if(me.lastConfiguration && me.lastConfiguration.length && me.get('quantity') === 0){
		                	//options selected but qty 0
		                	me.trigger('error', { message : Hypr.getLabel('enterProductQuantity')});
		                	dfd.reject(Hypr.getLabel('enterQuantity', me.get('productCode')));
		                }else{
		                	dfd.reject(Hypr.getLabel('selectValidOption')); 
		                }
	                } 
	            });
	            return dfd.promise();
	        },
	        addToWishlist: function() {
	            var me = this;
	            this.whenReady(function() {
	                if (!me.validate()) {
	                    me.apiAddToWishlist({
	                        customerAccountId: require.mozuData('user').accountId,
	                        quantity: me.get("quantity"),
	                        options: me.getConfiguredOptions()
	                    }).then(function(item) {
	                        me.trigger('addedtowishlist', item);
	                    });
	                }
	            });
	        },
	        addToCartForPickup: function(locationCode, locationName, quantity) {
	            var me = this;
	            this.whenReady(function() {
	                return me.apiAddToCartForPickup({
	                    fulfillmentLocationCode: locationCode,
	                    fulfillmentMethod: FamilyItem.Constants.FulfillmentMethods.PICKUP,
	                    fulfillmentLocationName: locationName,
	                    quantity: quantity || 1
	                }).then(function(item) {
	                    me.trigger('addedtocart', item);
	                });
	            });
	        },
	        getBundledProductProperties: function(opts) {
	            var self = this,
	                loud = !opts || !opts.silent;
	            if (loud) {
	                this.isLoading(true);
	                this.trigger('request');
	            }

	            var bundledProducts = this.get('bundledProducts'),
	                numReqs = bundledProducts.length,
	                deferred = api.defer();
	            _.each(bundledProducts, function(bp) {
	                var op = api.get('product', bp.productCode);
	                op.ensure(function() {
	                    if (--numReqs === 0) {
	                        _.defer(function() {
	                            self.set('bundledProducts', bundledProducts);
	                            if (loud) {
	                                this.trigger('sync', bundledProducts);
	                                this.isLoading(false);
	                            }
	                            deferred.resolve(bundledProducts);
	                        });
	                    }
	                });
	                op.then(function(p) {
	                    _.each(p.prop('properties'), function(prop) {
	                        if (!prop.values || prop.values.length === 0 || prop.values[0].value === '' || prop.values[0].stringValue === '') {
	                            prop.isEmpty = true;
	                        }
	                    });
	                    _.extend(bp, p.data);
	                });
	            });

	            return deferred.promise;
	        },
	        onOptionChange: function() {
	            this.isLoading(true);
	            this.updateConfiguration();
	        },
	        updateQuantity: function (newQty) {
	            if (this.get('quantity') === newQty) return;
	            this.set('quantity', newQty);
	            if (!this._hasVolumePricing) return;
	            if (newQty < this._minQty) {
	                return this.showBelowQuantityWarning();
	            }
	            this.isLoading(true);
	            this.apiConfigure({ options: this.getConfiguredOptions() }, { useExistingInstances: true });
	        },
	        showBelowQuantityWarning: function () {
	            this.validation.quantity.min = this._minQty;
	            this.validate();
	            this.validation.quantity.min = 1;
	        },
	        handleMixedVolumePricingTransitions: function (data) {
	            if (!data || !data.volumePriceBands || data.volumePriceBands.length === 0) return;
	            if (this._minQty === data.volumePriceBands[0].minQty) return;
	            this._minQty = data.volumePriceBands[0].minQty;
	            this.validation.quantity.msg = Hypr.getLabel('enterProductQuantity', this._minQty);
	            if (this.get('quantity') < this._minQty) {
	                this.updateQuantity(this._minQty);
	            }
	        },
	        updateConfiguration: function() {
	            var me = this,
	              newConfiguration = this.getConfiguredOptions();
	            if (JSON.stringify(this.lastConfiguration) !== JSON.stringify(newConfiguration)) {
	                this.lastConfiguration = newConfiguration;
	                this.apiConfigure({ options: newConfiguration }, { useExistingInstances: true })
	                    .then(function (apiModel) {	   	                    	
	                    	var html = "";
	                    	var price = "";
	                    	if(!me.get('addedtocart')){
	                    		//set item code Item# 412167
	                    		if(me.get('variationProductCode')){
	                    			me.set('itemCode', Hypr.getLabel('sku')+'# '+me.get('variationProductCode'));
	                    		}
	                    		//To show In Stock price
	                    		// If price is not a range
		                    	if(typeof me.get('price').get('priceType') != 'undefined'){
		                    		var sp_price = "";
			                    	if(typeof me.get('price').get('salePrice') != 'undefined')
		                				sp_price = me.get('price').get('salePrice');
		            				else
		                				sp_price = me.get('price').get('price');
		            				price = Hypr.engine.render("{{price|currency}}",{ locals: { price: sp_price }}); 
		            			}else{
		            				//If price is in a range
		            				var lower_sp_price = "";
		            				var upper_sp_price = "";
		            				//get lower salePrice/price
		            				if(typeof me.get('priceRange').get('lower').get('salePrice') != 'undefined')
		            					lower_sp_price = me.get('priceRange').get('lower').get('salePrice');
		            				else 
		            					lower_sp_price = me.get('priceRange').get('lower').get('price');
		            				//get upper salePrice/price
		            				if(typeof me.get('priceRange').get('upper').get('salePrice') != 'undefined')
		            					upper_sp_price = me.get('priceRange').get('upper').get('salePrice');
		            				else 
		            					upper_sp_price = me.get('priceRange').get('upper').get('price');
		            				lower_sp_price = Hypr.engine.render("{{price|currency}}",{ locals: { price: lower_sp_price }});
		            				upper_sp_price = Hypr.engine.render("{{price|currency}}",{ locals: { price: upper_sp_price }});
		            				price = lower_sp_price + ' - '+ upper_sp_price;
		            			}
	            				var stockMsglabel = Hypr.getLabel('upcInStock');  
	            				html += stockMsglabel + ' ' + price;    
	            				me.set('stockInfo', html);      
            				}else{
            					//Replace VariationProductCode code with productCode
            					me.set('itemCode', Hypr.getLabel('item')+'# '+me.get('productCode'));
            				}
            				me.unset('addedtocart');
	                        if (me._hasVolumePricing) {
	                            me.handleMixedVolumePricingTransitions(apiModel.data);
	                        }	                        
	                     });
	            } else {
	                this.isLoading(false);
	            }
	        },
	        parse: function(prodJSON) {
	            if (prodJSON && prodJSON.productCode && !prodJSON.variationProductCode) {
	                this.unset('variationProductCode');
	            }
	            return prodJSON;
	        },
	        toJSON: function(options) {
	            var j = Backbone.MozuModel.prototype.toJSON.apply(this, arguments);
	            if (!options || !options.helpers) {
	                j.options = this.getConfiguredOptions({ unabridged: true });
	            }
	            if (options && options.helpers) {
	                if (typeof j.mfgPartNumber == "string") j.mfgPartNumber = [j.mfgPartNumber];
	                if (typeof j.upc == "string") j.upc = [j.upc];
	                if (j.bundledProducts && j.bundledProducts.length === 0) delete j.bundledProducts;
	            }
	            return j;
	        }
	    }, {
	        Constants: {
	            FulfillmentMethods: {
	                SHIP: "Ship",
	                PICKUP: "Pickup",
	                DIGITAL: "Digital"
	            },
	            // for catalog instead of commerce
	            FulfillmentTypes: {
	                IN_STORE_PICKUP: "InStorePickup"
	            },
	            ProductUsage: {
	                Configurable: 'Configurable'
	            }
	        }   
	    });
		return FamilyItem;
    });