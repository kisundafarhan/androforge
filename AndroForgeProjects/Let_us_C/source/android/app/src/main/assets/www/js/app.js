function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }
function runDemo() {
  var el = document.getElementById('output');
  var val = factorial(6);
  localStorage.setItem('last_run_result', String(val));
  el.textContent = 'Output > Factorial(6) = ' + val + ' (Saved to offline localStorage)';
}