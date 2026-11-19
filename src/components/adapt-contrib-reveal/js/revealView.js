import Adapt from 'core/js/adapt';
import ComponentView from 'core/js/views/componentView';
import _ from 'underscore';
import a11y from 'core/js/a11y';

class RevealView extends ComponentView {

  initialize() {
    this.orientationStates = {
      Vertical: 'vertical',
      Horizontal: 'horizontal'
    };

    this.opposites = {
      left: 'right',
      right: 'left',
      up: 'down',
      down: 'up'
    };

    this.boundingClientRectHeightLimit = 300;

    this.listenTo(Adapt, 'device:resize', this.truncateLongText);

    super.initialize();
  }

  preRender() {
    this.clickReveal = this.clickReveal.bind(this);

    let orientation;
    this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

    switch (this.model.get('_direction')) {
      case 'left':
      case 'right':
        orientation = this.orientationStates.Horizontal;
        break;
      case 'top':
      case 'bottom':
      default:
        orientation = this.orientationStates.Vertical;
    }

    this.model.set('_orientation', orientation);

    let defaultTextDirection = Adapt.config.get('_defaultDirection');
    defaultTextDirection = (defaultTextDirection === 'rtl') ? 'right' : 'left';
    this.model.set('_defaultTextDirection', defaultTextDirection);

    this.checkIfResetOnRevisit();
  }

  checkIfResetOnRevisit() {
    const isResetOnRevisit = this.model.get('_isResetOnRevisit');

    // If reset is enabled set defaults
    if (isResetOnRevisit) {
      this.model.reset(isResetOnRevisit);
    }
  }

  setupReveal() {
    const direction = !this.model.get('_direction') ? 'left' : this.model.get('_direction');
    const iconDirection = this.getIconDirection(direction);

    // Initialise the directional arrows
    this.$('.reveal__widget-item').addClass(`reveal__${this.model.get('_direction')}`);
    this.$('.reveal__widget-control').addClass(`reveal__${direction}`);
    this.$('.reveal__image').addClass(`reveal__${direction}`);
    this.$('div.reveal__widget-item-text').addClass(`reveal__${direction}`);

    this.$('div.reveal__widget-item-text-body').addClass(`reveal__${direction}`);
    this.$('.reveal__widget-icon').addClass(`icon-controls-${this.getOppositeDirection(iconDirection)}`);

    this.model.set('_direction', direction);
    this.model.set('_revealed', false);

    // Reverse reveal item order for the reveal bottom component.
    if (direction === 'bottom') {
      this.$('.first-item').insertBefore(this.$('.second-item'));
    }

    this.truncateLongText();

    if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
      this.calculateWidths();
    } else {
      this.calculateHeights();
    }

    // Control 'is-truncated' with additional line clamping for smaller images
    const boundingClientRect = this.$('img.reveal__image')[1]?.getBoundingClientRect();

    if (!boundingClientRect) return;

    if (boundingClientRect.height <= this.boundingClientRectHeightLimit) {
      this.$('.text-container').addClass('small-clamp');
    }
  }

  truncateLongText() {
    this.$('.dot-ellipsis').each((index, element) => {
      _.defer(() => {
        const isTooBig = this.isOverflown(element);
        $(element).toggleClass('is-truncated', isTooBig);
      });
    });
  }

  isOverflown(element) {
    const textBodyElem = $(element)[0];
    const textContainerElem = $(element).find('.text-container')[0];


    const isTallerScrollBody = textBodyElem?.scrollHeight > element.clientHeight;
    const isTallerScrollText = textContainerElem?.scrollHeight > element.clientHeight;

    if (isTallerScrollBody || isTallerScrollText) {
      return true;
    }

    const isWiderScrollBody = textBodyElem?.scrollWidth > element.clientWidth;
    const isWiderScrollText = textContainerElem?.scrollWidth > element.clientWidth;

    if (isWiderScrollBody || isWiderScrollText) {
      return true;
    }

    const hasLargerBoundariesBody = textBodyElem?.getBoundingClientRect()?.bottom > this.$('img.reveal__image')[1]?.getBoundingClientRect()?.bottom;
    const hasLargerBoundariesText = textContainerElem?.getBoundingClientRect()?.bottom > this.$('img.reveal__image')[1]?.getBoundingClientRect()?.bottom;

    return (hasLargerBoundariesBody || hasLargerBoundariesText);
  }

  calculateWidths() {
    const direction = this.model.get('_direction');
    const $widget = this.$('.reveal__widget');
    const $slider = this.$('.reveal__widget-slider');
    const $control = this.$('.reveal__widget-control');

    const imageWidth = $widget.width();
    const controlWidth = $control.width();
    const margin = -imageWidth;

    $slider.css('width', imageWidth * 2);

    if (this.model.get('_revealed')) {
      $control.css(this.model.get('_direction'), imageWidth - controlWidth);
    }

    $slider.css(`margin-${direction}`, margin);

    // Ensure the text doesn't overflow the image
    this.$('div.reveal__widget-item-text').css('width', ($('img.reveal__image').width()));

    this.model.set('_scrollSize', imageWidth);
    this.model.set('_controlWidth', controlWidth);
  }

  calculateHeights() {
    const direction = this.model.get('_direction');

    // Cache the JQuery objects
    const $widget = this.$('.reveal__widget');
    const $image = this.$('.reveal__widget img');
    const $slider = this.$('.reveal__widget-slider');
    const $control = this.$('.reveal__widget-control');

    const imageHeight = $image.height();

    const controlHeight = $control.height();
    const margin = direction === 'top' ? -imageHeight : imageHeight;

    $widget.css('height', imageHeight);
    $slider.css('height', imageHeight);

    if (this.model.get('_revealed')) {
      $control.css(this.model.get('_direction'), imageHeight - controlHeight);
    }

    if (direction === 'bottom') {
      $slider.css('margin-top', 0);
    } else {
      $slider.css(`margin-${direction}`, margin);
    }

    // Ensure the text doesn't overflow the image
    this.$('div.reveal__widget-item-text').css('height', imageHeight);

    this.model.set('_scrollSize', imageHeight);
    this.model.set('_controlWidth', controlHeight);
  }

  getMarginType() {
    return this.model.get('_orientation') === this.orientationStates.Horizontal ? 'left' : 'top';
  }

  resizeControl() {
    const direction = this.model.get('_direction');
    const marginType = this.getMarginType();
    const $widget = this.$('.reveal__widget');
    const $slider = this.$('.reveal__widget-slider');
    const $widgetText = this.$('.reveal__widget-item-text');
    let imageSize;
    let controlSize;

    if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
      const innerSize = this.$('.reveal__inner').width();

      imageSize = innerSize !== $widget.width() ? innerSize : $widget.width();
      controlSize = this.$('.reveal__widget-control').width();
      $widget.css('width', imageSize);
      $widgetText.css('width', imageSize);
      $slider.css('width', imageSize * 2);
    } else {
      imageSize = this.$('.reveal__widget img').height();
      controlSize = this.$('.reveal__widget-control').height();
      $widget.css('height', imageSize);
      $widgetText.css('height', imageSize);
      $slider.css('height', imageSize);
    }

    if (direction === 'bottom') {
      $slider.css('margin-top', -imageSize);
    } else {
      $slider.css(`margin-${direction}`, -imageSize);
    }

    const sliderAnimation = {};

    if (this.model.get('_revealed')) {
      $slider.css(`margin-${marginType}`, (direction === marginType) ? -imageSize : 0);
      sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? 0 : -imageSize;
      $slider.animate(sliderAnimation);
    } else {
      $slider.css(`margin-${marginType}`, (direction === marginType) ? -imageSize : 0);
    }

    this.model.set('_scrollSize', imageSize);
    this.model.set('_controlWidth', controlSize);
  }

  removeDefaultTabIndex() {
    this.$('.reveal__widget-item-text-body').each((index, textBody) => {
      $(textBody).removeAttr('tabindex');
    });
  }

  postRender() {
    this.$('.reveal__widget').imageready(() => {
      this.setupReveal();
      this.setReadyStatus();
    });
  }

  getOppositeDirection(direction) {
    return this.opposites[direction];
  }

  getIconDirection(direction) {
    if (this.model.get('_orientation') === this.orientationStates.Vertical) {
      return (direction === 'top') ? 'up' : 'down';
    }

    return direction;
  }

  clickReveal(event) {
    event.preventDefault();
    this.removeDefaultTabIndex();

    const direction = this.model.get('_direction');
    let marginType = this.getMarginType();
    const scrollSize = this.model.get('_scrollSize');
    const controlWidth = this.model.get('_controlWidth');
    const controlMovement = (!this.model.get('_revealed')) ? scrollSize - controlWidth : scrollSize;
    const operator = !this.model.get('_revealed') ? '+=' : '-=';
    const iconDirection = this.getIconDirection(direction);
    const defaultTextDirection = this.model.get('_defaultTextDirection');
    const sliderAnimation = {};

    if (defaultTextDirection === 'right' && (direction === 'left' || direction === 'right')) {
      marginType = this.getOppositeDirection(marginType);
    }

    const isItemRevealed = this.model.get('_revealed');
    let revealBodyTarget = '.first-item .reveal__widget-item-text-body';

    // Was not revealed previous to current click action
    if (!isItemRevealed) {
      sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? 0 : -scrollSize;
      revealBodyTarget = '.second-item .reveal__widget-item-text-body';
      this.setCompletionStatus();
    } else {
      sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? operator + controlMovement : 0;
    }

    // Change the UI to handle the new state
    const classIconHide = `icon-controls-${this.getOppositeDirection(iconDirection)}`;
    const classIconReveal = `icon-controls-${iconDirection}`;

    const revealedBodyEl = this.$(revealBodyTarget);

    this.$('.reveal__widget-slider').animate(sliderAnimation, {
      complete: () => {
        a11y.focusNext(revealedBodyEl, { defer : true });
      }
    });

    this.$('.reveal__widget-icon').toggleClass(classIconHide, isItemRevealed);
    this.$('.reveal__widget-icon').toggleClass(classIconReveal, !isItemRevealed);

    this.model.set('_revealed', !isItemRevealed);
  }
}

RevealView.template = 'reveal.jsx';

export default RevealView;
