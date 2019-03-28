import { Spring } from 'wobble';
import { clamp, cubicBezier, interpolate, reversed } from '@popmotion/popcorn';

import {
  interpolateObject,
  applyOverlayStyle,
  diffRect,
  getTransformString,
  cloneElement,
  lerp,
  // constPowerEase
} from './utils';

const resetTranslate = {
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
};

const ease = cubicBezier(0.9, 0.9, 0.37, 0.98);
const easeRev = reversed(ease);
const easeInOut = cubicBezier(0.5, 0.5, 0, 1);

const delaysRatio = 0.1;
const halfClampEnd = clamp(1 - delaysRatio, 1);
const halfClampStart = clamp(0, delaysRatio);
const easeFast = x =>
  easeInOut(interpolate([1 - delaysRatio, 1], [0, 1])(halfClampEnd(x)));
const easeSlow = x =>
  easeInOut(interpolate([0, delaysRatio], [0, 1])(halfClampStart(x)));

export default function({
  from,
  to,
  rectFrom,
  rectTo,
  fromValue = 0,
  initialVelocity,
  onUpdate = () => {},
  onStart = () => {},
  onStop = () => {},
  willBack,
  options,
}) {
  const springOptions = {
    fromValue,
    initialVelocity,
    toValue: 1,
    ...options.spring,
  };
	console.log('options.Spring: ', options.Spring);
	const spring = options.Spring || new Spring(springOptions);

  options.Spring.updateConfig(springOptions);

  const fromDiffStyle = diffRect(rectFrom, rectTo);
  const toDiffStyle = diffRect(rectTo, rectFrom);

  const fromContainer = cloneElement(from, options);
  const toContainer = cloneElement(to, options);

  // hideInnerMorph(toContainer);
  // hideInnerMorph(fromContainer);

  to.style.visibility = 'hidden';
  to.style.pointerEvents = 'none';
  from.style.visibility = 'hidden';
  from.style.pointerEvents = 'none';

  applyOverlayStyle(toContainer, rectTo);
  applyOverlayStyle(fromContainer, rectFrom);

  const toFLIP = interpolateObject(fromDiffStyle, resetTranslate);
  const fromFLIP = interpolateObject(resetTranslate, toDiffStyle);

  const toFade = lerp(0, 1, true);
  const fromFade = lerp(1, 0, true);

  let isDeleted = false;

  spring
    .onStart(onStart)
    .onUpdate(s => {
      const p = s.currentValue;

      switch (options.type) {
        case 'fade':
          // toContainer.style.color = "red";
          // fromContainer.style.color = "green";
          toContainer.style.opacity = toFade(easeFast(p));
          fromContainer.style.opacity = fromFade(easeSlow(p));
          toContainer.style.transform = getTransformString(toFLIP(p));
          fromContainer.style.transform = getTransformString(fromFLIP(p));

          break;
        case 'morph':
        default:
          toContainer.style.opacity = toFade(ease(p));
          fromContainer.style.opacity = fromFade(easeRev(p));
          toContainer.style.transform = getTransformString(toFLIP(p));
          fromContainer.style.transform = getTransformString(fromFLIP(p));
      }
      onUpdate(s);
    })
    .onStop(s => {
      onStop(s);
      cleanup();
    })
    .start();

  const cleanup = () => {
    if (isDeleted) return;
    options.portalElement.removeChild(toContainer);
    options.portalElement.removeChild(fromContainer);
    to.style.visibility = ''; // show original to
    to.style.pointerEvents = ''; // show original to

    if (!willBack) {
      // show original from
      from.style.pointerEvents = '';
      from.style.visibility = '';
    }
    isDeleted = true;
  };

  return cleanup;
}
