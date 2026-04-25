import { useEffect } from 'react';

const APP_NAME = 'QuizPop';

const ensureMetaTag = (
  selector: string,
  attributes: Record<string, string>
): Element => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      tag!.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  return tag;
};

export interface UsePageMetaOptions {
  title?: string;
  description?: string;
}

export const usePageMeta = ({
  title,
  description,
}: UsePageMetaOptions): void => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const nextTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    document.title = nextTitle;

    if (!description) {
      return;
    }

    ensureMetaTag('meta[name="description"]', {
      name: 'description',
    }).setAttribute('content', description);

    ensureMetaTag('meta[property="og:title"]', {
      property: 'og:title',
    }).setAttribute('content', nextTitle);

    ensureMetaTag('meta[property="og:description"]', {
      property: 'og:description',
    }).setAttribute('content', description);

    ensureMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
    }).setAttribute('content', nextTitle);

    ensureMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
    }).setAttribute('content', description);
  }, [description, title]);
};
