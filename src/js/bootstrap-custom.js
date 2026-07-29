/**
 * Bootstrap 5 Custom Build
 * Distilled version containing only necessary components.
 *
 * NOTE: Some components depend on Popper.js (Dropdown, Popover, Tooltip).
 * esbuild handles these dependencies automatically via npm.
 */

// --- Individual Components (uncomment what you need) ---

// import Alert from 'bootstrap/js/dist/alert'
// import Button from 'bootstrap/js/dist/button'
// import Carousel from 'bootstrap/js/dist/carousel'
// import Collapse from 'bootstrap/js/dist/collapse'
import Dropdown from 'bootstrap/js/dist/dropdown'
import Modal from 'bootstrap/js/dist/modal'
// import Offcanvas from 'bootstrap/js/dist/offcanvas'
import Popover from 'bootstrap/js/dist/popover'
// import ScrollSpy from 'bootstrap/js/dist/scrollspy'
// import Tab from 'bootstrap/js/dist/tab'
// import Toast from 'bootstrap/js/dist/toast'
import Tooltip from 'bootstrap/js/dist/tooltip'

// --- Global Initialization (optional) ---
document.addEventListener('DOMContentLoaded', () => {
  // Example: Auto-init Tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  )
  ;[...tooltipTriggerList].map((el) => new Tooltip(el))

  // Example: Auto-init Popovers
  const popoverTriggerList = document.querySelectorAll(
    '[data-bs-toggle="popover"]'
  )
  ;[...popoverTriggerList].map((el) => new Popover(el))
})

export { Dropdown, Modal, Popover, Tooltip }
