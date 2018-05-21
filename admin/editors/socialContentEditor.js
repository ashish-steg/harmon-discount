/**
 * @class Taco.view.website.widgetEditors.v2.Image
 * @author Taco the Taco
 *
 * An image widget.
 */
if (!window.myEditors) {
    Ext.define('myEditors.socialContent', {
        extend: 'Ext.form.Panel',
        alias: 'widget.taco-image-widgeteditor',
        requires: [
            'Taco.core.ux.form.FileInputButton',
            'Taco.core.ux.form.field.SingleImageField',
            'Taco.store.NavigationTreeNodes',
            'Taco.view.fileManager.Associator'
        ],

        autoShow: false,
        width: 750,
        height: 600,

        layout: {
            type: 'fit'
        },

        initComponent: function() {
            var me = this;

            this.feedStore = new Ext.data.JsonStore({
                fields: [{
                    type: 'string',
                    name: 'id'
                }, {
                    type: 'string',
                    name: 'name'
                }]
            });



            this.cards = Ext.create('Ext.Panel', {
                layout: {
                    type: 'card'
                },
                items: [{
                    xtype: 'formform',
                    title: 'Content',
                    header: false,
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    items: [{
                            xtype: 'container',
                            flex: 1,
                            layout: {
                                type: 'hbox',
                                pack: 'start'
                            },
                            items: [{
                                xtype: 'combobox',
                                name: 'templateType',
                                value: 'desktop',
                                flex: 1,
                                editable: false,
                                forceSelection: true,
                                fieldLabel: 'App Type',
                                store: [
                                    ['desktop', 'Desktop'],
                                    ['mobile', 'Mobile']
                                ],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {
                                            this.toggleDisplayTemplate(field, newValue, oldValue);
                                        }
                                    }
                                }
                            }, {
                                xtype: 'combobox',
                                name: 'associatedFeed',
                                flex: 1,
                                editable: false,
                                forceSelection: true,
                                fieldLabel: 'Associated Feed',
                                displayField: 'name',
                                valueField: 'id',
                                store: this.feedStore,
                                queryMode: 'local',
                                stateful: true,
                                listeners: {
                                    beforerender: {
                                        scope: this,
                                        fn: function(that, eOpts) {
                                            console.log(that);
                                            console.log(eOpts);
                                        }
                                    },
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {
                                            console.log('Feed Value');
                                            console.log(newValue);
                                        }
                                    }
                                }
                            }]
                        },

                        {

                            itemId: 'gridFormat',
                            flex: 1,
                            title: 'Display Format',
                            header: true,
                            layout: {
                                type: 'hbox',
                                pack: 'start'
                            },

                            items: [{
                                xtype: 'checkbox',
                                defaultType: 'checkboxfield',
                                margin: '20px 0 0 0px',
                                name: 'gridFormat',
                                id: 'gridFormat',
                                boxLabel: 'Grid Format',
                                flex: 1,
                                items: [{



                                }],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {
                                            if (newValue !== oldValue) {
                                                this.toggleDispalyFormatOptions(field, newValue);
                                            }
                                        }
                                    }
                                },
                            }, {
                                xtype: 'combobox',
                                name: 'gridColumns',
                                flex: 2,
                                margin: '0 15px 0 15px',
                                fieldLabel: 'Grid Columns',
                                editable: false,
                                forceSelection: true,
                                store: [
                                    ['1', '1'],
                                    ['2', '2'],
                                    ['3', '3'],
                                    ['4', '4'],
                                    ['5', '5'],
                                    ['6', '6']
                                ],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {

                                        }
                                    }
                                }
                            }, {
                                xtype: 'combobox',
                                name: 'gridRows',
                                flex: 2,
                                fieldLabel: 'Grid Rows',
                                margin: '0 15px 0 0px',
                                editable: false,
                                forceSelection: true,
                                store: [
                                    ['1', '1'],
                                    ['2', '2'],
                                    ['3', '3'],
                                    ['4', '4']
                                ],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {

                                        }
                                    }
                                }
                            }, {
                                xtype: 'fieldcontainer',
                                defaultType: 'checkboxfield',
                                margin: '20px 0 0 0px',
                                flex: 1,
                                items: [{
                                    boxLabel: 'Continuous Loading',
                                    name: 'gridContinuousLoading',
                                    id: 'gridContinuousLoading'
                                }],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {

                                            this.toggleDispalyFormatOptions(field, newValue);

                                        }
                                    }
                                }
                            }]
                        }, {
                            itemId: 'carouselFormat',
                            flex: 1,
                            layout: {
                                type: 'hbox',
                                pack: 'start'
                            },
                            items: [{
                                xtype: 'checkbox',
                                defaultType: 'checkboxfield',
                                margin: '20px 0 0 0px',
                                name: 'carouselFormat',
                                id: 'carouselFormat',
                                boxLabel: 'Carousel Format',
                                flex: 1,
                                margin: '20px 0 0 0',
                                items: [{
                                    boxLabel: 'Carousel Format',
                                    name: 'carouselFormat',
                                    id: 'carouselFormat'
                                }],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {
                                            if (newValue !== oldValue) {
                                                this.toggleDispalyFormatOptions(field, newValue);
                                            }
                                        }
                                    }
                                },
                            }, {
                                xtype: 'combobox',
                                name: 'carouselColumns',
                                flex: 2,
                                fieldLabel: 'Carousel Format',
                                margin: '0 15px 0 15px',
                                editable: false,
                                forceSelection: true,
                                store: [
                                    ['1', '1'],
                                    ['2', '2'],
                                    ['3', '3'],
                                    ['4', '4'],
                                    ['5', '5'],
                                    ['6', '6']
                                ],
                                listeners: {
                                    change: {
                                        scope: this,
                                        fn: function(field, newValue, oldValue) {

                                        }
                                    }
                                }
                            }, {
                                xtype: 'fieldcontainer',
                                defaultType: 'checkboxfield',
                                flex: 1,
                                margin: '20px 0 0 0px',
                                items: [{
                                    boxLabel: 'Continuous Loading',
                                    name: 'carouselContinuousLoading',
                                    id: 'carouselContinuousLoading'
                                }]
                            }]
                        }, {

                            itemId: 'popupOptions',
                            title: 'Popup Options',
                            header: true,
                            flex: 1,
                            layout: {
                                type: 'hbox',
                                pack: 'start'
                            },
                            items: [{
                                xtype: 'container',
                                flex: 1,
                                layout: {
                                    type: 'vbox',
                                    pack: 'start'
                                },
                                items: [{
                                    xtype: 'fieldcontainer',
                                    defaultType: 'checkboxfield',
                                    flex: 1,
                                    items: [{
                                        boxLabel: 'Username',
                                        name: 'showUsername',
                                        id: 'showUsername'
                                    }]
                                }, {
                                    xtype: 'fieldcontainer',
                                    defaultType: 'checkboxfield',
                                    flex: 1,
                                    items: [{
                                        boxLabel: 'Action Link',
                                        name: 'showActionLink',
                                        id: 'showActionLink'
                                    }]
                                }]
                            }, {
                                xtype: 'container',
                                flex: 2,
                                layout: {
                                    type: 'vbox',
                                    pack: 'start'
                                },
                                items: [{
                                    xtype: 'fieldcontainer',
                                    defaultType: 'checkboxfield',
                                    flex: 1,
                                    items: [{
                                        boxLabel: 'Description',
                                        name: 'showDescription',
                                        id: 'showDescription'
                                    }]
                                }, {
                                    xtype: 'fieldcontainer',
                                    defaultType: 'checkboxfield',
                                    flex: 1,
                                    items: [{
                                        boxLabel: 'Posted Day',
                                        name: 'showPostedTime',
                                        id: 'showPostedTime'
                                    }]
                                }]
                            }]
                        }


                    ]
                }]



            });

            this.items = [this.cards];
            this.templateTypeIsMobile = false;

            this.callParent(arguments);

            this.queryFeeds();

        },
        hostname: function() {
            return window.location.origin;
        },
        queryFeeds: function() {
            var feedStore = this.feedStore,
                requestUrl = this.hostname() + '/admin/app/entities/read?list=socialcontentfeeds%40mzint&entityType=mzdb&view=&page=1&start=0&limit=50';
            try {

                Ext.Ajax.request({
                    url: requestUrl,
                    method: "GET",
                    success: function(data) {
                        var feedData = Ext.JSON.decode(data.responseText);
                        Ext.Array.each(feedData.items, function(feed, index) {
                            feedStore.add({
                                id: feed.item.id,
                                name: feed.item.name
                            });
                        })
                    },
                    failure: function(err) {
                        console.log(err);
                    }
                });

            } catch (e) {
                console.log(e);
            }
        },
        toggleDisplayTemplate: function(field, newValue, oldValue) {
            if (newValue == 'mobile') {
                this.templateTypeIsMobile = true;
                this.down('[name=gridFormat]').setValue(false);
                this.down('[name=carouselFormat]').setValue(false);
                this.toggleGridFormatOptions(true);
                this.toggleCarouselFormatOptions(true);
            } else {
                this.templateTypeIsMobile = false;
                this.toggleGridFormatOptions(false);
                this.toggleCarouselFormatOptions(false);
            }
        },

        toggleDispalyFormatOptions: function(field, newValue) {
            if (field.id != 'gridFormat') {
                if (newValue == true) {
                    this.down('[name=gridFormat]').setValue(false);
                    this.toggleGridFormatOptions(true);
                    this.toggleCarouselFormatOptions(false);
                } else {
                    this.toggleGridFormatOptions(false);
                    this.toggleCarouselFormatOptions(false);
                }
            } else {
                if (newValue == true) {
                    this.down('[name=carouselFormat]').setValue(false);
                    this.toggleGridFormatOptions(false);
                    this.toggleCarouselFormatOptions(true);
                } else {
                    this.toggleGridFormatOptions(false);
                    this.toggleCarouselFormatOptions(false);
                }
            }
        },

        isSelected: function() {

        },

        toggleGridFormatOptions: function(enabled) {
            if (this.templateTypeIsMobile) {
                enabled = true;
            }
            this.down('[name=gridFormat]').setDisabled(enabled);
            this.down('[name=gridColumns]').setDisabled(enabled);
            this.down('[name=gridRows]').setDisabled(enabled);
            this.down('[name=gridContinuousLoading]').setDisabled(enabled);

        },

        toggleCarouselFormatOptions: function(enabled) {
            if (this.templateTypeIsMobile) {
                enabled = true;
            }
            this.down('[name=carouselFormat]').setDisabled(enabled);
            this.down('[name=carouselColumns]').setDisabled(enabled);
            this.down('[name=carouselContinuousLoading]').setDisabled(enabled);
        }

    });
}

Ext.create('myEditors.socialContent')