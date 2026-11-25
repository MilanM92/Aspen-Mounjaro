import Adapt from 'core/js/adapt';
import ThemePageView from './themePageView';
import ThemeArticleView from './themeArticleView';
import ThemeBlockView from './themeBlockView';
import ThemeComponentView from './themeComponentView';
import ThemeView from './themeView';

class Theme extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, {
      'app:dataReady': this.onDataReady,
      'pageView:postRender articleView:postRender blockView:postRender componentView:postRender': this.onPostRender
    });
    this.setUpZoom();
    this.setUpTables();
  }

  // MOUNJARO: tables written into text component bodies (see _work/mounjaro/build_course.js).
  // - .mj-coltoggle checkboxes show/hide the table column with the same data-col (collapsible columns)
  // - .mj-rtable__btn reveals the value in its row (complication prevalence table)
  setUpTables() {
    $(document)
      .on('change', '.mj-coltoggle input[data-col]', e => {
        const input = e.currentTarget;
        const $table = $(input).closest('.component__body, .component__inner').find('table.mj-ctable').first();
        $table.find(`[data-col="${input.getAttribute('data-col')}"]`).toggleClass('is-col-hidden', !input.checked);
      })
      .on('click', '.mj-rtable__btn', e => {
        const $row = $(e.currentTarget).closest('tr');
        $row.addClass('is-revealed');
        e.currentTarget.setAttribute('aria-expanded', 'true');
      });
  }

  // EMLA (RT 1279982): images in a component with the class "rt-zoomable" open full size in a layer
  // over the page; clicking the layer (or pressing Esc) closes it again.
  setUpZoom() {
    const selector = '.rt-zoomable .graphic__image-container img';
    const close = () => {
      const $layer = $('.rt-zoom-layer');
      if (!$layer.length) return;
      const opener = $layer.data('opener');
      $layer.remove();
      $('html').removeClass('rt-zoom-open');
      if (opener) opener.focus();
    };
    const open = img => {
      close();
      const $layer = $(`<div class="rt-zoom-layer" role="dialog" aria-modal="true" aria-label="${img.alt || 'Image'}" tabindex="-1">
        <img class="rt-zoom-layer__img" alt="${img.alt || ''}">
        <span class="rt-zoom-layer__hint" aria-hidden="true">Click to close</span>
      </div>`);
      $layer.find('img').attr('src', img.currentSrc || img.src);
      $layer.data('opener', img);
      $('body').append($layer);
      $('html').addClass('rt-zoom-open');
      $layer.trigger('focus');
    };
    $(document)
      .on('click', selector, e => open(e.currentTarget))
      .on('keydown', selector, e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open(e.currentTarget);
      })
      .on('click', '.rt-zoom-layer', close)
      .on('keydown', e => { if (e.key === 'Escape') close(); });
    // keyboard access: the image is (re)rendered by React after postRender and revealed later by trickle,
    // so tag it whenever it appears in the page
    const tag = () => $(selector).not('[role=button]').attr({ tabindex: 0, role: 'button', 'aria-label': 'Enlarge image' });
    new MutationObserver(tag).observe(document.body, { childList: true, subtree: true });
    this.listenTo(Adapt, 'router:location', close);
  }

  onDataReady() {
    $('html').addClass(Adapt.course.get('_courseStyle'));
  }

  onPostRender(view) {
    const viewModel = view.model;
    const theme = viewModel.get('_vanilla');
    if (!theme) return;
    const model = new Backbone.Model(theme);
    const el = view.$el;
    switch (viewModel.get('_type')) {
      case 'page':
        new ThemePageView({ model, el });
        break;
      case 'article':
        new ThemeArticleView({ model, el });
        break;
      case 'block':
        new ThemeBlockView({ model, el });
        break;
      case 'component':
        new ThemeComponentView({ model, el });
        break;
      default:
        new ThemeView({ model, el });
    }
  }

}

export default new Theme();
