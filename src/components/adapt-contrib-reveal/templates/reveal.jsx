import React from 'react';
import { templates } from 'core/js/reactHelpers';

export default function Reveal(props) {

  const {
    _revealed,
    clickReveal,
    control,
    first,
    second
  } = props;

  const controlTitle = _revealed ? control?.hideText : control?.showText

  return (
    <div className='component__inner reveal__inner'>

      <templates.header {...props} />

      <div className='component__widget reveal__widget'>

        <div className='reveal__widget-slider'>

          <templates.revealItem
            isHidden={!_revealed}
            item={second}
            itemClass='second'
          />

          <templates.revealItem
            isHidden={_revealed}
            item={first}
            itemClass='first'
          />

          <button
            aria-label={controlTitle}
            className='reveal__widget-control'
            onClick={clickReveal}
            title={controlTitle}
          >
            <div className='reveal__widget-icon icon'></div>
          </button>

        </div>
      </div>
    </div>
  );
}
