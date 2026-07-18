/** Run a stringified async probe in the page. */
export async function runProbe(page, source, arg) {
  return page.evaluate(
    async ({ src, a }) => {
      // eslint-disable-next-line no-eval
      const fn = eval('(' + src + ')');
      return await fn(a);
    },
    { src: source, a: arg },
  );
}
