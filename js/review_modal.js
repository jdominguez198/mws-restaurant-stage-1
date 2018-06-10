/**
 * JS Class to manage Review adding through Modal
 * @constructor
 */
const ReviewModal = function(restaurantID) {

    const _settings = {
        modalHolder: 'review-add-modal',
        modalReviewId: 'review-add-input-id',
        modalReviewName: 'review-add-input-reviewer-name',
        modalReviewRating: 'review-add-input-rating',
        modalReviewComments: 'review-add-input-comment-text',
        modalOpenBtn: 'reviews-add',
        modalSaveBtn: 'reviews-save',
        modalCancelBtn: 'reviews-cancel'
    };

    const _instances = {
        modalHolder: null,
        modalReviewId: null,
        modalReviewName: null,
        modalReviewRating: null,
        modalReviewComments: null,
        modalOpenBtn: null,
        modalSaveBtn: null,
        modalCancelBtn: null
    };

    const _loadInstances = function() {

        _instances.modalHolder = document.getElementById(_settings.modalHolder);
        _instances.modalReviewId = document.getElementById(_settings.modalReviewId);
        _instances.modalReviewName = document.getElementById(_settings.modalReviewName);
        _instances.modalReviewRating = document.getElementById(_settings.modalReviewRating);
        _instances.modalReviewComments = document.getElementById(_settings.modalReviewComments);
        _instances.modalOpenBtn = document.getElementById(_settings.modalOpenBtn);
        _instances.modalSaveBtn = document.getElementById(_settings.modalSaveBtn);
        _instances.modalCancelBtn = document.getElementById(_settings.modalCancelBtn);

    };

    const _bindEvents = function() {

        if (_instances.modalOpenBtn !== null) {
            _instances.modalOpenBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _showModal();
            });

        }

        if (_instances.modalSaveBtn !== null) {
            _instances.modalSaveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (_instances.modalSaveBtn.getAttribute('disabled') === null) {
                    _saveReview();
                }
            });

        }

        if (_instances.modalCancelBtn !== null) {
            _instances.modalCancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _dismissModal();
            });

        }

        if (
            _instances.modalReviewName !== null &&
            _instances.modalReviewRating !== null &&
            _instances.modalReviewComments !== null
        ) {
            _instances.modalReviewName.addEventListener('keyup', _checkSaveButtonAccessibility);
            _instances.modalReviewRating.addEventListener('change', _checkSaveButtonAccessibility);
            _instances.modalReviewComments.addEventListener('keyup', _checkSaveButtonAccessibility);
        }

    };

    const __addClass = function(el, className) {

        if (!el.className.match(/(?:^|\s) + className + (?!\S)/)) {
            el.className += ' ' + className;
        }

    };

    const __removeClass = function(el, className) {

        const _classList = el.className.split(' ');
        const _index = _classList.indexOf(className);
        if (_index !== -1) {
            _classList.splice(_index, 1);
            el.className = _classList.join(' ');
        }

    };

    const _saveReview = function() {

        if (
            _instances.modalReviewId === null ||
            _instances.modalReviewName === null ||
            _instances.modalReviewRating === null ||
            _instances.modalReviewComments === null
        ) { return;}

        const _data = {
            'restaurant_id': _instances.modalReviewId.value,
            'name': _instances.modalReviewName.value,
            'rating': _instances.modalReviewRating.value,
            'comments': _instances.modalReviewComments.value,
        };

        DBHelper.saveRestaurantReview(_data, function(error, success) {

            if (success) {
                const ul = document.getElementById('reviews-list');
                _data.createdAt = new Date();
                _data.updatedAt = _data.createdAt;
                ul.appendChild(createReviewHTML(_data));
            }
            _clearModal();
            _dismissModal();

        });

    };

    const _showModal = function() {

        __addClass(_instances.modalHolder, 'open');

    };

    const _dismissModal = function() {

        __removeClass(_instances.modalHolder, 'open');

    };

    const _clearModal = function() {

        _instances.modalReviewName.value = '';
        _instances.modalReviewRating.value = '';
        _instances.modalReviewComments.value = '';
        _checkSaveButtonAccessibility();

    };

    const _checkSaveButtonAccessibility = function(e) {

        if (_instances.modalReviewName.value !== '' && _instances.modalReviewComments. value !== '' &&
            _instances.modalReviewRating.value !== '') {

            _instances.modalSaveBtn.removeAttribute('disabled');

        } else {

            _instances.modalSaveBtn.setAttribute('disabled', true);

        }

    };

    const _setRestaurantId = function(id) {

        // set restaurant id
        _instances.modalReviewId.value = id;

    };

    const _constructor = function() {

        _loadInstances();
        _setRestaurantId(restaurantID);
        _bindEvents();

    }(restaurantID);

};