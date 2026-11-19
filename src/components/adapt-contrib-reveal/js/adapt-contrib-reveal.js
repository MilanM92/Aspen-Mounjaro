import components from 'core/js/components';
import RevealView from './revealView';
import RevealModel from './revealModel';

export default components.register('reveal', {
  model: RevealModel,
  view: RevealView
});
