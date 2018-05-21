define(["modules/jquery-mozu", "underscore", "modules/backbone-mozu", "hyprlive", "modules/models-price", "modules/api", "hyprlivecontext", 'modules/models-family', 'modules/models-product-options', "modules/models-messages"], function($, _, Backbone, Hypr, PriceModels, api, HyprLiveContext, FamilyItem, ProductOption, MessageModels) {
    
    var ProductContent = Backbone.MozuModel.extend({}),

    Product = Backbone.MozuModel.extend({
        mozuType: 'product',
        idAttribute: 'productCode',
        handlesMessages: true,
        helpers: ['mainImage', 'notDoneConfiguring', 'hasPriceRange', 'supportsInStorePickup', 'isPurchasable','hasVolumePricing'],
        defaults: {
            purchasableState: {},
            quantity: 1
        },
        dataTypes: {
            quantity: Backbone.MozuModel.DataTypes.Int
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
            }),
            family:Backbone.Collection.extend({
                model: FamilyItem
            })
        },
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
            });
            me.on('sync', function(raw) {
                if (!raw || !raw.messages || raw.messages.length === 0) me.messages.reset();
            });
            _.each(this.relations, function(v, key) {
                var relInstance = me.get(key);
                if (relInstance && key!=='family') me.listenTo(relInstance, 'error', function(err) {
                    me.trigger('error', err);
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
            window.familyArray = [];            
            window.checkInventory = false;
            var slug = this.get('content').get('seoFriendlyUrl');
            _.bindAll(this, 'calculateHasPriceRange', 'onOptionChange', 'getFamilyMembers');
            this.listenTo(this.get("options"), "optionchange", this.onOptionChange);
            
            this.get("family").bind( 'familyReady', this.getFamilyMembers);
            this._hasVolumePricing = false;
            this._minQty = 0;
            if (this.get('volumePriceBands') && this.get('volumePriceBands').length > 0) {
                this._hasVolumePricing = true;
                this._minQty = _.first(this.get('volumePriceBands')).minQty;
                if (this._minQty > 1) {
                    if (this.get('quantity') <= 1) {
                        this.set('quantity', this._minQty);
                    }
                    this.validation.quantity.msg = Hypr.getLabel('enterProductQuantity', this._minQty);
                }
            }
            this.updateConfiguration = _.debounce(this.updateConfiguration, 300);
            this.set({ url: slug ? "/" + slug + "/p/" + this.get("productCode") : "/p/" + this.get("productCode") });
            this.lastConfiguration = [];
            this.calculateHasPriceRange(conf);
            this.on('sync', this.calculateHasPriceRange);
            if(this.attributes.variations && this.attributes.variations.length>0){
                for(var i=0;i<this.attributes.variations.length;i++){
                    if(this.attributes.variations[i].inventoryInfo.onlineStockAvailable!==0){
                        this.set({soldOut: false});
                    }
                }
            } else {
                if(this.attributes.inventoryInfo && this.attributes.inventoryInfo.onlineStockAvailable===0){
                    this.set({soldOut: true});
                }else{
                     this.set({soldOut: false});
                }
            }
        },
        getFamilyMembers: function(e){
            //console.log(e);
            var checkInArray = false;            
            if(window.familyArray.length){
                if($.inArray(e.get('productCode'), window.familyArray) === -1){
                    window.familyArray.push(e.get('productCode'));
                    //check if out of stock
                    if(typeof e.get('inventoryInfo').onlineStockAvailable !== 'undefined' && e.get('inventoryInfo').onlineStockAvailable !== 0)
                        window.checkInventory = true;
                    else if(typeof e.get('inventoryInfo').onlineStockAvailable === 'undefined'){
                        if(this.checkVariationInventory(e))
                            window.checkInventory = true;
                    }
                }
            }else{
                window.familyArray.push(e.get('productCode'));
                //check if out of stock
                if(typeof e.get('inventoryInfo').onlineStockAvailable !== 'undefined' && e.get('inventoryInfo').onlineStockAvailable !== 0)
                    window.checkInventory = true;
                else if(typeof e.get('inventoryInfo').onlineStockAvailable === 'undefined'){
                    if(this.checkVariationInventory(e))
                        window.checkInventory = true;
                }
            }
            //if all elements added in familyArray, check for inventory status
            if(window.familyLength === window.familyArray.length){
                if(!window.checkInventory){
                    window.outOfStockFamily = true;
                }
            }
            return;
        },
        checkVariationInventory: function(e){
            var checkVariationInventory = false;
            for(var i=0; i< e.get('variations').length; i++){
                if(e.get('variations')[i].inventoryInfo.onlineStockAvailable !== 0){
                    checkVariationInventory = true;
                }
            }
            return checkVariationInventory;
        },
        mainImage: function() {
            var productImages = this.get('content.productImages');
            return productImages && productImages[0];
        },
        notDoneConfiguring: function() {
            return this.get('productUsage') === Product.Constants.ProductUsage.Configurable && !this.get('variationProductCode');
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
            return _.contains(this.get('fulfillmentTypesSupported'), Product.Constants.FulfillmentTypes.IN_STORE_PICKUP);
        },
        getConfiguredOptions: function(options) {
            return this.get('options').reduce(function(biscuit, opt) {
                opt.addConfiguration(biscuit, options);
                return biscuit;
            }, []);
        },


        addToCart: function () {
            var me = this;
            if(this.get('family').length){
                FamilyItem.addToCart();
            }
            this.whenReady(function () {
                if (!me.validate()) {
                    var fulfillMethod = me.get('fulfillmentMethod');
                    if (!fulfillMethod) {
                        fulfillMethod = (me.get('goodsType') === 'Physical') ? Product.Constants.FulfillmentMethods.SHIP : Product.Constants.FulfillmentMethods.DIGITAL;
                    }
                    me.apiAddToCart({
                        options: me.getConfiguredOptions(),
                        fulfillmentMethod: fulfillMethod,
                        quantity: me.get("quantity")
                    }).then(function (item) {
                        me.trigger('addedtocart', item);
                    }, function(err) {
                        if(err.message.indexOf("Validation Error: The following items have limited quantity or are out of stock:") !== -1){ 
                            me.messages.reset({ message: Hypr.getLabel('productOutOfStockError') });
                        }                        
                    });
                }
            });
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
                    fulfillmentMethod: Product.Constants.FulfillmentMethods.PICKUP,
                    fulfillmentLocationName: locationName,
                    quantity: quantity || 1
                }).then(function(item) {
                    me.trigger('addedtocart', item);
                });
            });
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
                        me.unset('stockInfo');
                        if(typeof me.get('inventoryInfo').onlineStockAvailable !== 'undefined' && me.get('inventoryInfo').onlineStockAvailable !== 0){
                            //To show In Stock price
                            // If price is not a range
                            var price = "";
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
                            me.set('stockInfo', price);
                        }  
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
        },
        fromCurrent: function () {
            var data = require.mozuData(this.prototype.mozuType);
            var families = _.find(data.properties, function(e) {
                return e.attributeFQN === Hypr.getThemeSetting('familyProductAttribute') && e.values;
            });
            if(families)
                data.family = JSON.parse(families.values[0].stringValue);
            return new this(data, { silent: true, parse: true });
        } 
    }),

    ProductCollection = Backbone.MozuModel.extend({
        relations: {
            items: Backbone.Collection.extend({
                model: Product
            })
        }
    });

    return {
        Product: Product,
        Option: ProductOption,
        ProductCollection: ProductCollection
    };

});
