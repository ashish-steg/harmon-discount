define(['modules/api',
        'modules/backbone-mozu',
        'underscore',
        'modules/jquery-mozu',
        'hyprlivecontext',
        'hyprlive',
        "modules/block-ui",
        'modules/editable-view'
    ],
    function(api, Backbone, _, $, HyprLiveContext, Hypr, blockUiLoader, EditableView) {

        var ContactUsView = EditableView.extend({
            templateName: 'modules/contact-us/contact-us',
            autoUpdate: [
                'firstname',
                'lastname',
                'email',
                'message',
                'selectedTopic'
            ],
            setError: function(msg) {
                this.model.set('isLoading', false);
                this.trigger('error', { message: msg || 'Something went wrong!! Please try after sometime!' });
            },
            contactUsSubmit: function() {
                var self = this;
                var firstName = self.model.get('firstname');
                var lastName = self.model.get('lastname');
                var email = self.model.get('email');
                var selectedTopic = self.model.get('selectedTopic');
                var message = self.model.get('message');
                if (!self.model.validate()) {
                    var brontoUrl = HyprLiveContext.locals.themeSettings.brontoUrl;
                    if (brontoUrl !== '') {
                        //Call APIs
                        $.ajax({
                                "method": 'POST',
                                "url": '/email/send',
                                "data": {
                                    "firstName": firstName,
                                    "lastName": lastName,
                                    "usageType": "1",
                                    "email": email,
                                    "topic": selectedTopic,
                                    "message": message
                                }
                            })
                            .success(function(response) {
                                self.model.set('isLoading', false);
                                self.trigger('success', { message: 'We have received your request! We will get back with you shortly!' });
                                window.console.log(response);
                                window.setTimeout(function() {
                                    self.render();
                                }, 5000);
                            })
                            .error(function(response) {
                                self.setError();
                            });
                    } else {
                        self.setError();
                    }
                } else {
                    self.setError("Invalid form submission");
                }
                self.model.set('isLoading', true);
            },
            render: function() {
                Backbone.MozuView.prototype.render.apply(this);
            }
        });

        var validationfields = {
            'email': {
                required: true,
                pattern: 'email',
                msg: Hypr.getLabel('emailMissing')
            },
            'selectedTopic': {
                required: true,
                msg: Hypr.getLabel('selectedMissing')
            },
            'message': {
                required: true,
                msg: Hypr.getLabel('contactUsMessageMissing')
            }
        };
        if (HyprLiveContext.locals.themeSettings.enableCaptcha) {
            _.extend(validationfields, {
                'recaptcha_widget_div': {
                    required: function(val, attr, computed) {
                        return window.recaptchaResponse === undefined;
                    },
                    msg: Hypr.getLabel('captchaStatusMessage')
                }
            });
        }
        var Model = Backbone.MozuModel.extend({
            validation: validationfields
        });
        var $contactUsEl = $('#contactus-container');
        var contactUsView = window.view = new ContactUsView({
            el: $contactUsEl,
            model: new Model({
                "selectTopic": require.mozuData('selectTopic')
            })
        });
        contactUsView.render();
    });