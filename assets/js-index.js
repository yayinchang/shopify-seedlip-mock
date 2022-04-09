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
		sellingPlan,
		updateCartTotal = true,
		updateCartItems = true,
		minicartOpenDelay = 400
	) => {
		let parameters = {
			id: variantId,
			quantity: quantity,
			...sellingPlan,
		};

		fetch('/cart/add.js', {
			method: 'POST',
			body: JSON.stringify(parameters),
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
		let productId;

		const isSubscription = form.dataset.activeType.includes('subscription');
		const subscriptionForm = form.querySelector('.form-purchase-types.is-active');
		const propertiesSubscription = subscriptionForm.querySelector(
			'input[name="properties[subscription]"]'
		);

		let sellingPlan = '';

		if (propertiesSubscription) {
			const subscriptionPlan = propertiesSubscription.dataset.plan;
			const subscriptionId = propertiesSubscription.value;

			sellingPlan = {
				...(isSubscription && { selling_plan: subscriptionId }),
				properties: {
					...(isSubscription && { Subscription: subscriptionPlan }),
				},
			};
		}

		if (form.querySelector('[name="id"]').type == "radio") {
			productId = form.querySelector('[name="id"]:checked').value;
		} else {
			productId = form.querySelector('[name="id"]').value;
		}

		addItem(
			productId,
			form.querySelector('[name="quantity"]').value,
			sellingPlan
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

const initHeader = () => {
	const mobileActionsMenuTrigger = document.querySelector('.header-trigger');
	const header = document.querySelector(".global-header");

	mobileActionsMenuTrigger.addEventListener('click', e => {
		header.classList.contains("mobile_menu_active")
			? header.classList.remove("mobile_menu_active")
			: header.classList.add("mobile_menu_active");
	});

};

const initPageScroll = () => {
  let scrollpos = window.scrollY;
	const header = document.querySelector(".global-header");
  const headerHeight = header.offsetHeight;

  const addClassOnScroll = () => header.classList.add("scrolled")
  const removeClassOnScroll = () => header.classList.remove("scrolled")

  window.addEventListener('scroll', function() {
    scrollpos = window.scrollY;

    if (scrollpos >= headerHeight) { addClassOnScroll() }
    else { removeClassOnScroll() }
  })
}

const initFlickitySlider = () => {
	const flickitySlider = document.querySelectorAll('[data-flickity-slider]');

	const flickitySliderTrigger = () => {
		flickitySlider.forEach((el) => {
			let flickity = new Flickity(
				el,
				JSON.parse(el.dataset.flickitySlider.replace(/'/g, '"').trim())
			);
			let childrenWidth = Object.values(
				el.querySelector('.flickity-slider').childNodes
			).reduce(
				(total, i) =>
					i.offsetWidth
						? total +
						  i.offsetWidth +
						  parseInt(window.getComputedStyle(i).marginLeft) +
						  parseInt(window.getComputedStyle(i).marginRight)
						: total,
				0
			);

			if (
				// if total children width is lesser than slider width
				el.getBoundingClientRect().width >= childrenWidth ||
				// if flickity slider has breakpoint set, and window is greater than breakpoint
				(el.dataset.flickityBreakpoint &&
					window.innerWidth > parseInt(el.dataset.flickityBreakpoint))
			) {
				// destroy flickity
				flickity.destroy();

				setTimeout(() => {
					el.querySelectorAll('[style*="left:"]').forEach((item) => {
						item.style.setProperty('left', 'unset');
					});
				}, 100);
			} else {
				// avoid click on drag: https://github.com/metafizzy/flickity/issues/838
				flickity.on('dragStart', () =>
					flickity.slider.childNodes.forEach(
						(slide) => (slide.style.pointerEvents = 'none')
					)
				);

				flickity.on('dragEnd', () =>
					flickity.slider.childNodes.forEach(
						(slide) => (slide.style.pointerEvents = 'all')
					)
				);
			}
		});
	};

	flickitySliderTrigger();
	window.addEventListener('resize', flickitySliderTrigger);

	// swipe fix for IOS
	var touchingCarousel = false;
	var touchStartCoords;

	document.body.addEventListener('touchstart', function(e) {
		if (e.target.closest('.flickity-slider')) {
			touchingCarousel = true;
		} else {
			touchingCarousel = false;
			return;
		}

		touchStartCoords = {
			x: e.touches[0].pageX,
			y: e.touches[0].pageY,
		};
	});

	document.body.addEventListener(
		'touchmove',
		function(e) {
			if (!(touchingCarousel && e.cancelable)) {
				return;
			}

			var moveVector = {
				x: e.touches[0].pageX - touchStartCoords.x,
				y: e.touches[0].pageY - touchStartCoords.y,
			};

			if (Math.abs(moveVector.x) > 7) {
				e.preventDefault();
			}
		},
		{
			passive: false,
		}
	);
};

const initProductSlider = () => {
	const $slider = $('.product-slider').flickity({
		prevNextButtons: false,
		pageDots: false
	});
	const flkty = $slider.data('flickity');
	const $optionGroup = $('.product-variants');
	const $optionInputs = $optionGroup.find('.product-variant-selector');
	const $optionInfos = $optionGroup.find('.product-variant-info');
	const $subscriptionGroup = $('.product-subscriptions');
	const $subscriptionInputs = $subscriptionGroup.find('.product-subscription');
	const $subscriptionPurchaseForms = $subscriptionGroup.find('.form-purchase-types');

	$slider.on( 'select.flickity', function() {

		$optionInputs.filter(':checked')
			.prop("checked", false);
		$optionInputs.eq( flkty.selectedIndex )
			.prop("checked", true);

		$optionInfos.filter('.is-selected')
			.removeClass('is-selected');
		$optionInfos.eq( flkty.selectedIndex )
			.addClass('is-selected');

		$subscriptionInputs.filter('.is-selected')
			.removeClass('is-selected');
		$subscriptionInputs.eq( flkty.selectedIndex )
			.addClass('is-selected');

		if ($subscriptionPurchaseForms) {

			$subscriptionPurchaseForms.removeClass('is-active')

			$subscriptionPurchaseForms.find('input').filter(':checked')
				.prop("checked", false);

			$subscriptionPurchaseForms.eq( flkty.selectedIndex ).addClass('is-active');
			$subscriptionPurchaseForms.eq( flkty.selectedIndex ).find('.purchase-type.one-time input').prop("checked", true);

		}
	});

	$optionInputs.on( 'click', function() {
		const index = $(this).index();
		$slider.flickity( 'select', index );
	});
}

const initProductSubscription = () => {
	const purchaseForms = document.querySelectorAll('.form-purchase-types');
	const purchaseTypes = document.querySelectorAll('.purchase-type');
	const purchaseFrequency = document.querySelector('.purchase-frequency');

	// activate first subscription form & input on pageload
	purchaseForms[0].classList.add('is-active');
	purchaseTypes[0].querySelector('input').checked = true;

	on('body', 'click', '.purchase-type, .purchase-type *', (e) => {
		const form = e.target.closest('form[action="/cart/add"]');
		let target = e.target.closest('.purchase-type');

		purchaseTypes.forEach((purchaseType) => {
			purchaseType.querySelector('input[type="radio"]').checked = false;
		});

		purchaseFrequency.classList.remove('is-active');

		if (target.classList.contains('subscription')) {
			target.querySelector('input[type="radio"]').checked = true;
			purchaseFrequency.classList.add('is-active');
			form.dataset.activeType = 'subscription';
		} else {
			target.querySelector('input[type="radio"]').checked = true;
			form.dataset.activeType = 'one-time-purchase';
		}
	});

	const dropdownWrapper = document.querySelectorAll('.select-wrapper');

	dropdownWrapper.forEach((dropdown) => {
		const dropdownTrigger = dropdown.querySelector('.select-trigger');
		const dropdownSelect = dropdown.querySelector('.select');
		const dropdownOptions = dropdown.querySelectorAll(
			'.custom-options .custom-option'
		);
		const propertiesSubscription = dropdown.querySelector(
			'input[name="properties[subscription]"]'
		);

		dropdownOptions.forEach((option) => {
			const updateDropdownVal = (selectedOption) => {
				//update subscription id
				if (propertiesSubscription) {
					propertiesSubscription.value = selectedOption.dataset.valueId;
					propertiesSubscription.dataset.plan = selectedOption.dataset.value;
				}
				dropdownTrigger.firstChild.data = selectedOption.innerHTML;
			};
			//onload value
			if (option.classList.contains('selected')) {
				updateDropdownVal(option);
			}

			//onclick
			option.addEventListener('click', (e) => {
				if (e.target.classList.contains('selected')) {
					dropdownSelect.classList.remove('active');
				} else {
					dropdownOptions.forEach((item) => {
						item.classList.remove('selected');
					});
					e.target.classList.add('selected');
					updateDropdownVal(e.target);
					dropdownSelect.classList.remove('active');
				}
			});
		});

		//toggle dropdown
		if (dropdownTrigger) {
			dropdownTrigger.addEventListener('click', () => {
				dropdownSelect.classList.toggle('active');
			});

			document.addEventListener('click', (e) => {
				if (
					dropdownSelect.classList.contains('active') &&
					e.target &&
					!e.target.classList.contains('select-trigger') &&
					!e.target.closest('.select-trigger') &&
					!e.target.classList.contains('custom-options') &&
					!e.target.closest('.custom-options')
				) {
					dropdownSelect.classList.remove('active');
				}
			});
		}
	});
}

// execute pieces and components functions
initItemQuantity();
initFields();
initCart();

// execute global and component functions
initPageTransition();
initPageAnimation();
initPageScroll();
initHeader();
initContentLayout();
initFlickitySlider();

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

	case 'template-product-single':
		initProductSlider();
		initProductSubscription();
		break;
}

// make visible .avoid-style-flash elements
setTimeout(() => {
	document.querySelectorAll('.avoid-style-flash').forEach(el => {
		el.style.visibility = 'visible';
	});
}, 400);
