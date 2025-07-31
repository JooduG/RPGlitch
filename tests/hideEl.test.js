// Basic hideEl implementation for testing
function hideEl(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return null;
  el.classList.add('hidden');
  el.style.display = '';
  return el;
}

test('hideEl hides by element or id', () => {
  document.body.innerHTML = '<div id="test-el"></div>';
  const el = document.getElementById('test-el');
  hideEl(el);
  expect(el.classList.contains('hidden')).toBe(true);

  el.classList.remove('hidden');
  hideEl('test-el');
  expect(el.classList.contains('hidden')).toBe(true);
});
