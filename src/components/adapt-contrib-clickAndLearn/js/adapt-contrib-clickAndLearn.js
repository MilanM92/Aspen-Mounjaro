/*
 * adapt-contrib-clickAndLearn
 * License - https://github.com/ExultCorp/adapt-contrib-clickAndLearn/blob/master/LICENSE
 * Maintainers - Himanshu Rajotia <himanshu.rajotia@exultcorp.com>
 */
define([
    'coreViews/componentView',
    'coreJS/adapt'
], function(ComponentView, Adapt) {

    var ClickAndLearn = ComponentView.extend({

        events: {
            'click .clickAndLearn-indicator': 'onClickDisplayItem',
            'click .clickAndLearn-popup-close': 'onClickCloseItem'
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);
            this.listenTo(Adapt, 'notify:closed', this.closeNotify, this);
            if(Adapt.device.screenSize !== "large"){
                var mobileInstruction = this.model.get("mobileInstruction");
                this.model.set("instruction",mobileInstruction);
            }
        },

        // This function called on triggering of device resize event of Adapt.
        resizeControl: function() {
            this.setDeviceSize();
            var tabViewContainer = this.$('.clickAndLearn-tabViewContainer');
            if (!this.model.get('_isDesktop')) {
                tabViewContainer.hide();
            } else if (this.getVisitedItems().length > 0) {
                tabViewContainer.show();
            }
        },

        // set component variable according to size of screen.
        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.$el.addClass('desktop').removeClass('mobile');
                this.model.set('_isDesktop', true);
            } else {
                this.$el.addClass('mobile').removeClass('desktop');
                this.model.set('_isDesktop', false);
            }
        },

        // this is use to set ready status for current component on postRender.
        postRender: function() {
            this.setDeviceSize();
            var flag = this.model.get('_flag');
            if (flag == "horizontal") {
                this.$('.clickAndLearn-container').addClass('clickAndLearn-horizontal');
                this.setHorizontalWidth();
            } else if (flag == "vertical") {
                this.$('.clickAndLearn-container').addClass('clickAndLearn-vertical');
                this.setVerticalWidth();
            }
            this.$('.clickAndLearn-tabViewContainer').show();

            this.$('.clickAndLearn-widget').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));
            this.setupButtonPopUp();
        },
        setHorizontalWidth: function() {
            //this.$('li').css('width', this.model.get('_itemWidth')+'%');
            this.$('.clickAndLearn-content').css('width', this.model.get('_itemWidth')+'%');
        },
        setVerticalWidth: function() {
            //this.$('li').css('width', this.model.get('_itemWidth')+'%');
            this.$('.clickAndLearn-navContainer').css('width', this.model.get('_itemWidth')+'%');
        },

        setupButtonPopUp: function() {
            this.$('.popUpBtn').on('click', _.bind(this.openButtonPopup, this));
        },

        openButtonPopup: function(event) {
            var currentItem = this.getCurrentItem(0);
            var popupObject = {
                title: currentItem.title,
                body: currentItem.popText
            };

            Adapt.trigger('notify:popup', popupObject);
        },

        // Used to check if the flipcard should reset on revisit
        checkIfResetOnRevisit: function() {
            var isResetOnRevisit = this.model.get('_isResetOnRevisit');

            // If reset is enabled set defaults
            if (isResetOnRevisit) {
                this.model.reset(isResetOnRevisit);
            }

            _.each(this.model.get('_items'), function(item) {
                item._isVisited = false;
            });
        },

        // handler function for click event on indicator element.
        onClickDisplayItem: function(event) {

            if (event && event.preventDefault) event.preventDefault();
            var $selectedElement = $(event.currentTarget);
            var indicatorIndex = this.$('.clickAndLearn-indicator').index($selectedElement);
            this.setDeviceSize();
            var $tabViewContainer = this.$('.clickAndLearn-tabViewContainer');
            /*var isPreviouslySelected = $selectedElement.hasClass('clickAndLearn-indicatorActive');
            if(isPreviouslySelected){
                $selectedElement.removeClass('clickAndLearn-indicatorActive');
                //$tabViewContainer.hide();
                this.$('.clickAndLearn-tabViewContainer .clickAndLearn-tabItem:eq(' + indicatorIndex + ')').hide();
            }else{
                $selectedElement.addClass('clickAndLearn-indicatorActive');
                //$tabViewContainer.show();
                this.$('.clickAndLearn-tabViewContainer .clickAndLearn-tabItem:eq(' + indicatorIndex + ')').show();
            }*/

            if (!this.model.get('_isDesktop')) {
                $tabViewContainer.hide();
            } else if (this.getVisitedItems().length > 0) {
                $tabViewContainer.show();
            }
            /*if ($selectedElement.hasClass('clickAndLearn-indicatorActive')){
                $tabViewContainer.hide();
            }*/
            else
                $tabViewContainer.show();
            $selectedElement.find('.clickAndLearn-indicator-img').attr('src', this.getCurrentItem(indicatorIndex)._graphic.srcVisited);

            this.$('.clickAndLearn-navContainer .clickAndLearn-indicator').removeClass('clickAndLearn-indicatorActive');
            if ($selectedElement.hasClass('clickAndLearn-indicator-img')) {
                $selectedElement.closest('.clickAndLearn-indicator').addClass('clickAndLearn-indicatorActive');
            } else {
                $selectedElement.addClass('clickAndLearn-indicatorActive');
            }
            this.$('.clickAndLearn-tabViewContainer .clickAndLearn-tabItem').hide();
            this.$('.clickAndLearn-tabViewContainer .clickAndLearn-tabItem:eq(' + indicatorIndex + ')').show();

            if (!this.model.get('_isDesktop')) {
                /*var $popup = this.$('.clickAndLearn-popup');
                $popup.removeClass('display-none');

                $popup.find('.clickAndLearn-popup-toolbar-title').hide();
                $popup.find('.clickAndLearn-popup-body').hide();

                $popup.find('.clickAndLearn-popup-toolbar-title:eq(' + indicatorIndex + ')').show();
                $popup.find('.clickAndLearn-popup-body:eq(' + indicatorIndex + ')').show();*/
                this.openPopup(indicatorIndex);
            }
            
            this.$('.clickAndLearn-indicator').eq(indicatorIndex).addClass('visited');
            this.setVisited(indicatorIndex);
        },

        openPopup: function(indicatorIndex) {
            var currentItem = this.getCurrentItem(indicatorIndex);
            var popupObject = {
                title: currentItem.title,
                body: currentItem.body
            };

            // Set the visited attribute for small and medium screen devices
            currentItem._isVisited = true;

            Adapt.trigger('notify:popup', popupObject);
        },

        closeNotify: function() {
            this.checkCompletionStatus();
        },

        // Click or Touch event handler for pop-close.
        onClickCloseItem: function(event) {
            if (event && event.preventDefault) event.preventDefault();
            this.$('.clickAndLearn-popup-close').blur();
            this.$('.clickAndLearn-popup').addClass('display-none');
        },

        // This function will set the visited status for particular flipCard item.
        setVisited: function(index) {
            var item = this.model.get('_items')[index];
            item._isVisited = true;
            this.checkCompletionStatus();
        },

        getCurrentItem: function(index) {
            return this.model.get('_items')[index];
        },

        // This function will be used to get visited states of all flipCard items.
        getVisitedItems: function() {
            return _.filter(this.model.get('_items'), function(item) {
                return item._isVisited;
            });
        },

        // This function will check or set the completion status of current component.
        checkCompletionStatus: function() {
            if (this.getVisitedItems().length === this.model.get('_items').length) {
                this.setCompletionStatus();
            }
        }

    });

    Adapt.register('clickAndLearn', ClickAndLearn);

    return ClickAndLearn;

});
