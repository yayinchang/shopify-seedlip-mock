// pieces and components

const initItemQuantity = () => {
	on('body', 'click', '[data-quantity-trigger]', e => {
		let target = e.target.dataset.quantityTrigger
			? e.target
			: e.target.closest('[data-quantity-trigger]');
		let itemQuantity = target.closest('.item-quantity');
		let quantityInput = itemQuantity.querySelector('input[name="quantity"]');
		let inputDecrease = itemQuantity.querySelector(
			'[data-quantity-trigger="decrease"]'
		);
		let inputIncrease = itemQuantity.querySelector(
			'[data-quantity-trigger="increase"]'
		);
		let updatedValue =
			parseInt(quantityInput.value) +
			(target.dataset.quantityTrigger == 'increase'
				? parseInt(quantityInput.value) + 1 <= parseInt(quantityInput.max)
					? 1
					: 0
				: parseInt(quantityInput.value) - 1 >= parseInt(quantityInput.min)
				? -1
				: 0);

		updatedValue <= quantityInput.min
			? inputDecrease.classList.add('is-inactive')
			: inputDecrease.classList.remove('is-inactive');

		updatedValue >= quantityInput.max
			? inputIncrease.classList.add('is-inactive')
			: inputIncrease.classList.remove('is-inactive');

		quantityInput.value = target.classList.contains('has-leading-zero')
			? formatLeadingZero(updatedValue)
			: updatedValue;
	});
};

const initFields = () => {
	const fields = document.querySelectorAll('.field');

	fields.forEach(item => {
		let input = item.querySelector(`input[type="text"],
			input[type="email"], 
			input[type="tel"],
			input[type="url"],
			input[type="password"],
			input[type="file"],
			textarea`);
		let determineHasValue = () => {
			input.value
				? item.classList.add('has-value')
				: item.classList.remove('has-value');
		};

		if (input) {
			determineHasValue();
			input.addEventListener('change', determineHasValue);
			input.addEventListener('blur', determineHasValue);
		}
	});
};

// global elements and pages

const initPageTransition = () => {
	document.querySelectorAll('a[href]').forEach(item => {
		// if href points to anchor, or points to anchor that exists on page
		if (
			item.href.startsWith('#') ||
			(item.href.split('#')[1] &&
				item.href.split('#')[0] == window.location.href.split('#')[0])
		) {
			item.setAttribute('data-page-transition', 'scroll');
		} else if (
			(item.href.includes(siteUrl) || item.href.startsWith('/')) &&
			item.target != '_blank' &&
			!item.href.includes('mailto:')
		) {
			item.setAttribute('data-page-transition', 'internal');
		} else {
			item.rel = 'noopener';
			item.target = item.target || '_blank';
		}
	});

	document.querySelectorAll('[data-page-transition]').forEach(item => {
		item.addEventListener('click', e => {
			let target = e.target.hasAttribute('data-page-transition')
				? e.target
				: e.target.closest('[data-page-transition]');

			target.blur();

			if (
				target.dataset.pageTransition == 'internal' &&
				!root.classList.contains('key-is-down')
			) {
				e.preventDefault();
				root.classList.remove(
					'header-is-sticky',
					'menu-is-active',
					'mobile-menu-is-active',
					'minicart-is-active'
				);
				root.classList.add('is_leaving');

				setTimeout(() => {
					location.href = target.href;
				}, 400);
			} else if (target.dataset.pageTransition == 'scroll') {
				e.preventDefault();
				seamless.elementScrollIntoView(
					document.querySelector(`#${target.href.split('#')[1]}`),
					{
						behavior: 'smooth',
					}
				);
			}
		});
	});

	window.addEventListener('keydown', () => {
		root.classList.add('key-is-down');
	});

	window.addEventListener('keyup', () => {
		root.classList.remove('key-is-down');
	});
};

const initPageAnimation = () => {
	document.querySelectorAll('[data-animate]').forEach(item => {
		let observer = new IntersectionObserver(
			el => {
				if (
					el[0].isIntersecting === true &&
					!el[0].target.classList.contains('is-animated')
				) {
					el[0].target.classList.add('is-animated');
				}
			},
			{
				root: null,
				threshold: [0.4], // 0 = page start; 1 = page bottom, items only revealed when in full view
			}
		);

		observer.observe(item);
	});
};

const initContentLayout = () => {
	// iframe fit vids
	reframe(
		'.content-layout iframe[src*="vimeo.com"], .content-layout iframe[src*="youtube.com"]',
		'video-reframe'
	);

	// unwrap image from paragraph tag
	let contentLayout = document.querySelector('.content-layout');
	if (contentLayout) {
		[].forEach.call(contentLayout.getElementsByTagName('img'), function(img) {
			let p = img.closest('p');

			if (p && p.parentElement) {
				p.parentElement.insertBefore(img, p);
				p.parentElement.removeChild(p);
			}
		});
	}
};

const initCart = () => {
	// cart visibility
	const minicartClose = () => {
		root.classList.remove('minicart-is-active');
		history.pushState(null, null, ' ');
		scrollEnable();
	};

	const minicartOpen = () => {
		root.classList.add('minicart-is-active');
		history.pushState(null, null, '#cart');
		scrollDisable();
	};

	on('body', 'click', '.minicart-open', e => {
		root.classList.contains('minicart-is-active')
			? minicartClose()
			: minicartOpen();
	});

	on('body', 'click', '.minicart-close', e => {
		minicartClose();
	});

	document.addEventListener('keydown', e => {
		if (e.key == 'Escape') {
			minicartClose();
		}
	});

	// trigger cart if url contains the hash
	if (location.hash == '#cart') {
		minicartOpen();
	}

	// updates both cart price and item count
	this.reloadCartData = () => {
		fetch('/cart.js')
			.then(response => {
				return response.json();
			})
			.then(data => {
				document.querySelectorAll('.cart-total-price').forEach(item => {
					item.innerText = `$${parseFloat(data.total_price / 100).toFixed(2)}`;
				});

				document.querySelectorAll('.cart-total-items').forEach(item => {
					item.innerText = data.item_count;
				});

				data.item_count > 0
					? root.classList.add('cart-has-items')
					: root.classList.remove('cart-has-items');
			})
			.catch(error => {
				console.error('Error:', error);
			});
	};

	// updates .cart-items HTML
	this.reloadCartItems = () => {
		reloadCartData();

		fetch('/cart')
			.then(response => {
				return response.text();
			})
			.then(data => {
				var parser = new DOMParser();
				var dataHtml = parser.parseFromString(data, 'text/html');

				// insert the new cart items
				document.querySelectorAll('.cart-items-wrapper').forEach(item => {
					item.innerHTML = dataHtml.querySelector(
						'.cart-items-wrapper'
					).innerHTML;
				});
			})
			.catch(error => {
				console.error('Error:', error);
			});
	};

	// use this function to add items
	this.addItem = (
		variantId,
		quantity,
		updateCartTotal = true,
		updateCartItems = true,
		minicartOpenDelay = 400
	) => {
		fetch('/cart/add.js', {
			method: 'POST',
			body: JSON.stringify({
				id: variantId,
				quantity: quantity,
			}),
			headers: {
				'Content-Type': 'application/json',
				'X-Requested-With': 'xmlhttprequest',
			},
			credentials: 'same-origin',
		})
			.then(response => {
				response.json();
			})
			.then(data => {
				updateCartTotal ? reloadCartData() : '';
				updateCartItems ? reloadCartItems() : '';
				minicartOpenDelay
					? setTimeout(() => {
							minicartOpen();
					  }, minicartOpenDelay)
					: '';
			})
			.catch(error => {
				console.error('Error:', error);
			});
	};

	// use this function to change item quantity
	this.changeItemQuantity = (
		line,
		quantity,
		updateCartTotal = true,
		updateCartItems = false,
		minicartOpenDelay = 400
	) => {
		fetch('/cart/change.js', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				line: line,
				quantity: quantity,
			}),
		})
			.then(response => {
				response.json();
			})
			.then(() => {
				updateCartTotal ? reloadCartData() : '';
				updateCartItems ? reloadCartItems() : '';
				minicartOpenDelay
					? setTimeout(() => {
							minicartOpen();
					  }, minicartOpenDelay)
					: '';
			})
			.catch(error => {
				console.error('Error:', error);
			});
	};

	on('body', 'click', '[data-quantity-trigger]', e => {
		let target = e.target.closest('[data-quantity-trigger]');
		let item = e.target.closest('.cart-item');

		if (item) {
			item.querySelectorAll('[name="quantity"]').forEach(item => {
				item.value = target
					.closest('.item-quantity')
					.querySelector('[name="quantity"]').value;
			});

			changeItemQuantity(
				item.dataset.itemLine,
				item.querySelector('[name="quantity"]').value,
				true,
				false,
				false
			);
		}
	});

	on('body', 'click', '.item-remove-trigger', e => {
		let item = e.target.closest('.cart-item');

		if (item) {
			item.remove();
			changeItemQuantity(item.dataset.itemLine, 0, true, true, false);
		}
	});

	on('body', 'click', '[data-cart-add-id]', e => {
		let target = e.target.closest('[data-cart-add-id]');

		addItem(
			target.dataset.cartAddId,
			target.dataset.cartAddQuantity ? target.dataset.cartAddQuantity : 1
		);
	});

	on('body', 'submit', 'form[action="/cart/add"]', e => {
		e.preventDefault();
		let form = e.target;
		addItem(
			form.querySelector('[name="id"]').value,
			form.querySelector('[name="quantity"]').value
		);
	});
};

const initBlogIndex = () => {
	if (document.querySelector('blog-pagination-next')) {
		let infiniteScroll = new InfiniteScroll('.blog-load-more', {
			path: '.blog-pagination-next',
			append: '.blog-post',
			button: '.blog-load-more-trigger',
			scrollThreshold: false,
			history: false,
		});

		infiniteScroll.on('last', (body, path) => {
			let loadMoreTrigger = document.querySelector('.blog-load-more-trigger');

			loadMoreTrigger.style.display = 'block';
			loadMoreTrigger.disabled = true;
			loadMoreTrigger.innerHTML = 'You’ve reached the end';
		});
	}
};

const initAccount = () => {
	// account gate
	const gateWrapper = document.querySelector('.account-gate-wrapper');
	const gateContent = document.querySelector('.account-gate');
	const resetPasswordTrigger = document.querySelector(
		'.reset-password-trigger'
	);
	const resetPasswordCancel = document.querySelector('.reset-password-cancel');

	if (gateWrapper) {
		resetPasswordTrigger.addEventListener('click', event => {
			event.preventDefault();

			// update URL with hash
			history.pushState(null, null, '#recover');

			// assign active state
			root.classList.add('reset-password-active');

			// update wrapper height to fit account reset form
			gateWrapper.style.height = document.querySelector(
				'.account-reset'
			).offsetHeight;

			// focus on email field
			document.querySelector('#account-recover-email').focus();
		});

		if (resetPasswordCancel) {
			resetPasswordCancel.addEventListener('click', event => {
				event.preventDefault();

				// remove has from URL
				history.pushState(null, null, ' ');

				// remove active state from root
				root.classList.remove('reset-password-active');

				// update wrapper height to fit account reset form
				gateWrapper.style.height = gateContent.offsetHeight;
			});
		}

		// trigger password recovery form if url contains the hash
		if (location.hash == '#recover') {
			resetPasswordTrigger.click();
		}

		// set initial height
		gateWrapper.style.height = gateContent.offsetHeight;
	}
};

// execute pieces and components functions
initItemQuantity();
initFields();

// execute global and component functions
initPageTransition();
initPageAnimation();
initContentLayout();

// execute page specific functions
switch (root.id) {
	case 'template-frontpage':
		// initFrontpage();
		break;

	case 'template-blog-index':
		initBlogIndex();
		break;

	case 'template-account':
		initAccount();
		break;
}

// make visible .avoid-style-flash elements
setTimeout(() => {
	document.querySelectorAll('.avoid-style-flash').forEach(el => {
		el.style.visibility = 'visible';
	});
}, 400);
