import { SITE_BASE } from '../data/siteBase.js';
import React from 'react';

/** Uses the brand artwork supplied for 游历本 rather than a generic icon. */
export function BrandMark({size='md'}) {
  return (
    <span className={`brand-mark brand-mark--${size}`} aria-hidden="true">
      <img src={SITE_BASE + 'images/yuliben-logo.png'} alt="" />
    </span>
  );
}

export function BrandName({compact=false}) {
  return (
    <span className="brand-name">
      <BrandMark size={compact ? 'sm' : 'md'} />
      <span className="brand-name__copy">
        <strong>游历本</strong>
        <small>TRAVEL JOURNAL</small>
      </span>
    </span>
  );
}
