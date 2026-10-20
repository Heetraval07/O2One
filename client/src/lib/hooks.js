import { useEffect, useRef, useState } from 'react';

const cache = new Map();

/**
 * Load data from the API. `key` identifies the request (null skips it);
 * `loader(signal)` returns a promise. Results are cached for the session.
 */
export function useApi(key, loader) {
  const cached = key != null ? cache.get(key) : undefined;
  const [state, setState] = useState({ data: cached, error: null, loading: key != null && cached === undefined });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (key == null) return undefined;
    if (cache.has(key)) {
      setState({ data: cache.get(key), error: null, loading: false });
      return undefined;
    }
    const ctrl = new AbortController();
    setState((s) => ({ data: s.data, error: null, loading: true }));
    loaderRef.current(ctrl.signal)
      .then((data) => {
        cache.set(key, data);
        setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: undefined, error, loading: false });
      });
    return () => ctrl.abort();
  }, [key]);

  return state;
}

export function clearApiCache(prefix = '') {
  for (const k of cache.keys()) if (String(k).startsWith(prefix)) cache.delete(k);
}

/** Page <title> and meta description. */
export function useMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title}` : 'O2One Consultants';
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Becomes true the first time the element scrolls into view. */
export function useInView(options = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);
  return [ref, inView];
}

/** Count from 0 to `to` once `start` turns true. */
export function useCountUp(to, start, duration = 1200) {
  const reduced = usePrefersReducedMotion();
  // With reduced motion the final number shows straight away, no animation.
  const [value, setValue] = useState(() => (reduced ? to : 0));
  useEffect(() => {
    if (!start) return undefined;
    if (reduced) {
      setValue(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, start, duration, reduced]);
  return value;
}

/** Lock page scroll while `locked` is true (menus, drawers). */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/**
 * Parallax: while the element is on screen, writes its distance from the viewport centre
 * (-1 above, 0 centred, 1 below) to the `--p` custom property. CSS does the moving.
 * Does nothing with reduced motion.
 */
export function useParallax(ref) {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !('IntersectionObserver' in window)) return undefined;
    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty('--p', Math.max(-1, Math.min(1, p)).toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, reduced]);
}

/** Writes page scroll progress (0 to 1) to `--sp` on the referenced element. */
export function useScrollProgress(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty('--sp', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
