Ext.widget({
  xtype: 'mz-form-widget',
  itemId: 'rti-display-editor',
  initComponent: function(){

    var me = this;
    var jsInjectPlaceholder = "//Use this space for any custom scripting (such as collecting custom cookies).";
    jsInjectPlaceholder += "\n//Append additional parameters to the 'inject' variable. For example:";
    jsInjectPlaceholder += "\n// inject += '&visitstrail=...'";

    Ext.Ajax.request({
      url: "/admin/app/entities/read?list=rtiSettings%40mzint&entityType=mzdb",
      method: 'get',
      success: function (res) {
        var response = JSON.parse(res.responseText);
        var customerCode = response.items[0].item.customerCode;
        var customerId = response.items[0].item.customerId;
        var widgetNameReqUrl = '//' + customerId + '-' + customerCode + '.baynote.net/merch/1/' + customerId + '_' + customerCode + '/production/pageTypes';
        me.getComboboxOptions(widgetNameReqUrl, 'page-type');
        var customerCodeInput = me.down('#customerCode');
        var customerIdInput = me.down('#customerId');
        customerCodeInput.setValue(customerCode);
        customerIdInput.setValue(customerId);

      }
    });
        this.items = [

          {
            xtype: 'panel',
            title: 'Widget Display Options',
            collapsible: true,
            width: 500,
            margin: '20px 0 0 0',
            layout: 'vbox',
            items: [
              {
                 xtype: 'panel',
                 layout: 'hbox',
                 items: [
                   {
                     xtype: 'mz-input-text',
                     name: 'title',
                     itemId: 'title',
                     fieldLabel: 'Title',
                     emptyText: 'Leave blank to default to RTI setting',
                     margin: '30px 10px 30px 0'
                   },

                   {
                     xtype: 'numberfield',
                     cls: 'dropdown',
                     name: 'numberOfItems',
                     fieldLabel: 'Quantity of Items to Display',
                     minValue: 1,
                     value: 5,
                     margin: '30px 0 30px 0'
                   }

                 ]
               },

              {
                xtype: 'mz-input-dropdown',
                name: 'displayType',
                itemId: 'display-type',
                fieldLabel: 'Display Format',
                store: {
                  fields: ['name', 'value'],
                  data: [
                    {'name':'Carousel', 'value':'carousel'}
                  ]
                },
                displayField: 'name',
                valueField: 'value',
                value: 'carousel',
                editable: false,
                forceSelection: true,
                margin: '0 0 30px 0'

              },

              {
                 xtype: 'panel',
                 layout: 'hbox',
                 items: [
                   {
                    xtype: 'mz-input-dropdown',
                    name: 'pageType',
                    fieldLabel: 'Page Type',
                    itemId: 'page-type',
                    store: {
                       fields: ['name', 'placeholders'],
                       data: []
                     },
                    allowBlank: false,
                    displayField: 'name',
                    valueField: 'name',
                    queryMode: 'local',
                    editable: true,
                    forceSelection: true,
                    margin: '0 0 30px 0',
                    listeners: {
                      select: function(element, pageType){
                        var listOfPlaceholderNames = pageType[0].data.placeholders.map(function(p){
                          return p.name;
                        });

                        var select = me.down('#placeholder');
                        var currentValue = select.getValue();
                        var store = select.getStore();


                        store.removeAll();
                        store.insert(0, pageType[0].data.placeholders);

                        if(Ext.Array.contains(listOfPlaceholderNames, currentValue)){
                          select.setValue(currentValue);
                        } else {
                          select.setValue('');
                        }
                      }
                    }
                 },

                 {
                   xtype: 'mz-input-dropdown',
                   name: 'placeholder',
                   itemId: 'placeholder',
                   fieldLabel: 'Placeholder Name',
                   store: {
                     fields: ['name'],
                     data: []
                   },
                   allowBlank: false,
                   displayField: 'name',
                   valueField: 'name',
                   queryMode: 'local',
                   margin: '0 0 30px 0'
                 }

                 ]
              }
            ]
          },
        {
          xtype: 'panel',
          title: 'Product Request Options',
          width: 500,
          collapsible: true,
          collapsed: true,
          name: 'callSettings',
          itemId: 'callSettings',
          items: [
            {
              xtype: 'box',
              margin: '30px 0 0 0',
              html: 'Only the request options set in the <b>first widget on the page</b> will be applied.'
            },
            {
              xtype: 'panel',
              layout: 'vbox',
              itemId: 'params-box',
              margin: '30px 0 0 0',

              items: [

             {
               xtype: 'panel',
               items:[
                 {
                   xtype: 'box',
                   html: 'Include in Query'
                 },

                 {
                     xtype: 'mz-input-checkbox',
                     name: 'includeTenantId',
                     fieldLabel: 'Tenant ID',
                 },
                 {
                      xtype: 'mz-input-checkbox',
                      name: 'includeSiteId',
                      fieldLabel: 'Site ID',
                      margin: '-5px 0 0 0'
                 }
               ]
             },
             ]
            },

            {
              xtype: 'mz-input-code',
              name: 'javascriptInjection',
              itemId: 'javascript-injection',
              fieldLabel: 'Custom parameters',
              mode: 'javascript',
              value: jsInjectPlaceholder
            }

          ]

        },

          {
            xtype: 'hidden',
            name: 'customerId',
            itemId: 'customerId',
            value: ''
          },

          {
            xtype: 'hidden',
            name: 'customerCode',
            itemId: 'customerCode',
            value: ''
          },

      ];

          this.superclass.initComponent.apply(this, arguments);

      },
    getComboboxOptions: function(reqUrl, boxId){
      var me = this;

      //boxId can be given with or without the # at the front.
      if (boxId.charAt(0)!=='#'){
        boxId = '#'+boxId;
      }

      var request = new XMLHttpRequest();
      request.open('GET', reqUrl, true);
      request.addEventListener('load', function(res) {
              var items = JSON.parse(res.currentTarget.responseText);
              var select = me.down(boxId);
              var store = select.getStore();
              store.insert(0, items);
          }
      );
      request.send(null);
    }
    });


