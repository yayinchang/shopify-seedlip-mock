// GLOBAL VARIABLES
(function() {
	let localTestKey = 'test';
	let localStorage = window.sessionStorage;

	try {
		localStorage.setItem(localTestKey, 1);
		localStorage.removeItem(localTestKey);
		return localStorageName in win && win[localStorageName];
	} catch (e) {
		hasLocalStorage =
			e.code === DOMException.QUOTA_EXCEEDED_ERR && localStorage.length === 0
				? false
				: true;
	}
})();

let isTablet = 900 < innerWidth ? false : true;
let isMobile = 600 < innerWidth ? false : true;

window.addEventListener('resize', () => {
	isTablet = 900 < innerWidth ? false : true;
	isMobile = 600 < innerWidth ? false : true;
});

// OUTPUTS
const getRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
};

const getOffset = (el) => {
	let elBounding = el.getBoundingClientRect();

	return {
		top: elBounding.top + scrollY,
		left: elBounding.left + scrollX,
	};
};

// FORMATTING
const formatLeadingZero = (val) => {
	return (val < 10 ? '0' : '') + val;
};

const formatHandleize = (str) => {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/-$/, '')
		.replace(/^-/, '');
};

// ACTIONS
const scrollDisable = () => {
	root.style.overflow = 'hidden';
};

const scrollEnable = () => {
	root.style.overflow = 'scroll';
};

// event delegation
// example; on('body', 'click', '.accordion-toggle, .accordion-toggle *', e => {…});
const on = (selector, eventType, childSelectors, eventHandler) => {
	let _childSelectors = childSelectors.split(',');
	let elements = document.querySelectorAll(selector);

	for (element of elements) {
		element.addEventListener(eventType, (eventOnElement) => {
			_childSelectors.forEach((selector) => {
				if (
					eventOnElement.target.matches(selector) ||
					eventOnElement.target.closest(selector)
				) {
					eventHandler(eventOnElement);
				}
			});
		});
	}
};

const slide = (action, el, duration = 400) => {
	const slideDown = () => {
		let childrenHeight = Object.values(el.children).reduce(
			(total, i) => total + i.offsetHeight,
			0
		);

		// Apply active state
		el.classList.add('is-active');
		el.style.height = 'auto';

		// Set the height of the content as 0px
		// so we can trigger the slide down animation.
		el.style.height = '0px';

		// Do this after the 0px has applied.
		// It's like a delay or something. MAGIC!
		setTimeout(() => {
			el.style.height = `${childrenHeight}px`;
			el.style.transition = `height ${duration}ms`;
		}, 0);
	};

	const slideUp = () => {
		// Set the height as 0px to trigger the slide up animation.
		el.classList.remove('is-active');
		el.style.height = '0px';
		el.style.transition = `height ${duration}ms`;

		// Remove the active state when the animation ends
		el.addEventListener(
			'transitionend',
			() => {
				el.style.transition = `0s`;
			},
			{ once: true }
		);
	};

	switch (action) {
		case 'down':
			slideDown();
			break;

		case 'up':
			slideUp();
			break;

		case 'toggle':
			!el.classList.contains('is-active') ? slideDown() : slideUp();
			break;
	}
};