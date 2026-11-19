import React from 'react';
import { classes, compile } from 'core/js/reactHelpers';
import notify from 'core/js/notify';

export default function Reveal(props) {

  const {
    isHidden,
    item,
    itemClass
  } = props;

  const openPopup = (event) => {
    event.preventDefault();

    const popupObject = {
      title: '',
      body: item.body
    };

    notify.popup(popupObject);
  }

  return (
    <div
      aria-hidden={isHidden}
      className={classes([
        'reveal__widget-item',
        `${itemClass}-item`
      ])}
    >
      { item.src &&
        <img
          alt={item.alt}
          className='reveal__image'
          src={item.src}
          title={item.title}
        >
        </img>
      }

      { item.body &&
        <div
          className={classes([
            'reveal__widget-item-text',
            itemClass
          ])}
        >
          <div
            className={classes([
              'reveal__widget-item-text-body',
              'dot-ellipsis',
              'dot-resize-update',
              `reveal__${itemClass}-long`
            ])}
            tabIndex={isHidden ? -1 : 0}
          >
            <div
              className='text-container'
              dangerouslySetInnerHTML={{ __html: compile(item.body) }}
            />
            <button
              aria-hidden={isHidden}
              className={classes([
                'reveal__popup-open',
                isHidden ? 'u-display-none' : ''
              ])}
              dangerouslySetInnerHTML={{ __html: compile(item.moreText) }}
              onClick={openPopup}
            />
          </div>
        </div>
      }
    </div>
  );
}
